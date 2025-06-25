import os
import asyncio
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from web3 import AsyncWeb3, WebSocketProvider
from web3.utils.subscriptions import LogsSubscription
from payments.models import Cart, OrderItem, Transaction
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Escucha eventos de PaymentReceived del contrato'

    def handle(self, *args, **options):
        logger.info("Iniciando listener de eventos...")
        asyncio.run(self.async_handler())

    async def async_handler(self):
        max_retries = 10
        retry_count = 0

        ws_provider_url = os.environ.get('WEB3_WS_PROVIDER')
        if not ws_provider_url:
            logger.error("WEB3_WS_PROVIDER no está definido en las variables de entorno.")
            return

        while True:
            try:
                async with AsyncWeb3(WebSocketProvider(ws_provider_url)) as w3:
                    logger.info("Conectado a la blockchain. Configurando contrato...")

                    contract = w3.eth.contract(
                        address=settings.PAYMENT_CONTRACT_ADDRESS,
                        abi=settings.PAYMENT_CONTRACT_ABI
                    )

                    subscription = LogsSubscription(
                        address=contract.address,
                        topics=[contract.events.PaymentReceived().topic],
                        handler=lambda ctx: self.handle_payment_event(ctx, contract)
                    )

                    await w3.subscription_manager.subscribe([subscription])
                    logger.info("Escuchando eventos...")

                    # Resetear contador si conectó con éxito
                    retry_count = 0
                    await w3.subscription_manager.handle_subscriptions()

            except Exception as e:
                wait_time = min(60, 2 ** retry_count)
                logger.warning(f"Error: {e}. Reintentando conexión en {wait_time}s...")
                await asyncio.sleep(wait_time)
                retry_count = min(retry_count + 1, max_retries)
      

    async def handle_payment_event(self, context, contract):
        log = context.result
        try:
            event = contract.events.PaymentReceived().process_log(log)
            id = event['args']['transactionId']
            sender_address = event['args']['sender'].lower()
            tx_hash = "0x" + log['transactionHash'].hex()

            logger.info(f"Evento recibido: TX Hash {tx_hash}, Transaction ID {id}, Sender {sender_address}")

            max_retries = 5
            base_delay = 5  # segundos

            tx = None
            await asyncio.sleep(base_delay)

            for attempt in range(max_retries):
                try:
                    tx = await sync_to_async(
                        Transaction.objects.select_related('cart').get
                    )(
                        id=id,
                        wallet_address__iexact=sender_address
                    )
                    break
                except Transaction.DoesNotExist:
                    if attempt == max_retries - 1:
                        tx_failed = await sync_to_async(
                            Transaction.objects.filter(
                                id=id,
                                wallet_address__iexact=sender_address
                            ).first
                        )()
                        if tx_failed:
                            tx_failed.status = 'failed'
                            await sync_to_async(tx_failed.save)()
                            logger.error(f"Transacción {id} marcada como FAILED")
                        else:
                            logger.error(f"Transacción {id} no existe")
                        return

                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Transacción no encontrada (intento {attempt + 1}/{max_retries}). Reintentando en {delay}s...")
                    await asyncio.sleep(delay)

            if tx.status == 'confirmed':
                logger.info(f"Transacción {tx.id} ya confirmada.")
                return

            # Marcar como confirmada
            tx.status = 'confirmed'
            tx.transaction_hash = tx_hash
            await sync_to_async(tx.save)()
            logger.info(f"Transacción {tx.id} confirmada y procesada.")

            cart = await sync_to_async(
                lambda: Cart.objects.filter(transaction=tx.id).first()
            )()

            # Procesar carrito si existe
            if cart:
                logger.info(f"Carrito encontrado.")
                # 1. Crear OrderItems para historial
                cart_items = await sync_to_async(
                    lambda: list(cart.cart_items.all().select_related('product'))
                )()

                for item in cart_items:
                    await sync_to_async(OrderItem.objects.create)(
                        transaction=tx,
                        product=item.product,
                        quantity=item.quantity,
                        price_at_sale=item.product.amount_usd
                    )

                    # 2. Actualizar stock
                    item.product.quantity = max(item.product.quantity - item.quantity, 0)
                    await sync_to_async(item.product.save)()

                # 3. Marcar carrito como inactivo y limpiar items
                cart.is_active = False
                logger.info(f"Carrito desactivado.")

                await sync_to_async(cart.clear_items)()
                await sync_to_async(cart.save)()
            else:
                logger.info(f"Carrito NO encontrado.")

        except Exception as e:
            logger.error(f"Error procesando evento: {e}", exc_info=True)
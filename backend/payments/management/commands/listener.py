import os
import asyncio
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from web3 import AsyncWeb3, WebSocketProvider
from web3.utils.subscriptions import LogsSubscription
from payments.models import Transaction
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
            tx_hash = "0x" + log['transactionHash'].hex()
            logger.info(f"Evento recibido: {tx_hash}")

            max_retries = 5
            base_delay = 5  # segundos

            tx = None
            await asyncio.sleep(base_delay)
            for attempt in range(max_retries):
                try:
                    tx = await sync_to_async(Transaction.objects.get)(transaction_hash=tx_hash)
                    break
                except Transaction.DoesNotExist:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Transacción no encontrada (intento {attempt + 1}/{max_retries}). Reintentando en {delay}s...")
                    await asyncio.sleep(delay)

            if tx is None:
                logger.error(f"Transacción {tx_hash} no existe después de {max_retries} intentos.")
                return

            if tx.status == 'confirmed':
                logger.info(f"Transacción {tx_hash} ya confirmada.")
            else:
                tx.status = 'confirmed'
                await sync_to_async(tx.save)()
                logger.info(f"Transacción {tx_hash} confirmada.")

        except Exception as e:
            logger.error(f"Error procesando evento para transacción {tx_hash}: {e}")

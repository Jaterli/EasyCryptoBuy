import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from web3 import AsyncWeb3, WebSocketProvider
from django.conf import settings
from payments.models import Transaction, OrderItem, Cart
import asyncio
import json
from asgiref.sync import sync_to_async
import os

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Verifica transacciones pendientes y marca como fallidas las expiradas'

    def handle(self, *args, **options):
        transaction_hash = options.get('transaction_hash')
        result = asyncio.run(self.async_handler(transaction_hash=transaction_hash))
        return result  # Devuelve el resultado para que la vista lo capture
    
    async def async_handler(self, transaction_hash=None):
        logger.info("Iniciando verificación de transacciones pendientes...")
        
        # Configurar conexión Web3 (usando WebSocket como el listener)
        # ws_provider_url = settings.WEB3_WS_PROVIDER
        ws_provider_url = os.environ.get('WEB3_WS_PROVIDER')

        if not ws_provider_url:
            logger.error("WEB3_WS_PROVIDER no está configurado")
            return {
                'success': False,
                'processed': 0,
                'message': "WEB3_WS_PROVIDER no está configurado"
            }

        max_retries = 3
        retry_delay = 5  # segundos

        for attempt in range(max_retries):
            try:
                async with AsyncWeb3(WebSocketProvider(ws_provider_url)) as w3:
                    if not await w3.is_connected():
                        raise ConnectionError("No se pudo conectar via WebSocket")

                    logger.info("Conexión WebSocket establecida correctamente")
                    
                    contract = w3.eth.contract(
                        address=settings.PAYMENT_CONTRACT_ADDRESS,
                        abi=settings.PAYMENT_CONTRACT_ABI
                    )

                    # Obtener transacciones pendientes con más de 1 hora
                    expiration_time = timezone.now() - timedelta(minutes=1)

                    filters = {
                        'status': 'pending',
                        'created_at__lte': expiration_time,
                    }
                    if transaction_hash:
                        filters['transaction_hash'] = transaction_hash

                    # Aplicar filtros al queryset
                    pending_transactions = await sync_to_async(list)(
                        Transaction.objects.filter(**filters).select_related('cart')
                    )

                    logger.info(f"Encontradas {len(pending_transactions)} transacciones pendientes expiradas")

                    # Procesar cada transacción
                    for tx in pending_transactions:
                        try:
                            await self.process_transaction(w3, contract, tx)
                        except Exception as e:
                            logger.error(f"Error procesando transacción {tx.id}: {str(e)}")

                    return {
                        'success': True,
                        'processed': len(pending_transactions),
                        'confirmed': sum(1 for tx in pending_transactions if tx.status == 'confirmed'),
                        'failed': sum(1 for tx in pending_transactions if tx.status == 'failed')                        
                    }

            except Exception as e:
                logger.warning(f"Intento {attempt + 1}/{max_retries} - Error de conexión: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay * (attempt + 1))
                else:
                    logger.error("No se pudo establecer conexión después de varios intentos")
                    return {
                        'success': False,
                        'error': str(e),
                        'message': "No se pudo establecer conexión después de varios intentos"
                    }                    

    async def process_transaction(self, w3, contract, transaction):
        """Procesa una transacción individual"""
        try:
            # Obtención del bloque a partir del hash          
            receipt = await w3.eth.get_transaction_receipt(transaction.transaction_hash)
            block_number = receipt['blockNumber']

            # Filtrar eventos por transactionId (indexado)
            events = await contract.events.PaymentReceived.get_logs(
                argument_filters={'transactionId': transaction.id},
                from_block=block_number,
                to_block=block_number
            )

            logger.debug(f"Eventos encontrados para transacción {transaction.id}:")
            for event in events:
                logger.debug(json.dumps(dict(event), indent=2, default=str))

            if not events:
                transaction.status = 'failed'
                await sync_to_async(transaction.save)()
                logger.info(f"Transacción {transaction.id} marcada como fallida (no se recibió evento)")
            else:
                # Tomamos el primer evento válido
                event = events[0]
                transaction.status = 'confirmed'
                # transaction.transaction_hash = event['transactionHash'].hex()
                await sync_to_async(transaction.save)()
                logger.info(f"Transacción {transaction.id} confirmada (evento encontrado en {event['blockNumber']})")

                if hasattr(transaction, 'cart') and transaction.cart:
                    await self.process_cart(transaction)

        except Exception as e:
            logger.error(f"Error al procesar transacción {transaction.id}: {str(e)}")

    async def process_cart(self, transaction):
        """Procesa el carrito asociado a una transacción confirmada"""
        cart = transaction.cart
        
        # 1. Crear OrderItems para historial
        cart_items = await sync_to_async(list)(cart.cart_items.all().select_related('product'))
        
        for item in cart_items:
            await sync_to_async(OrderItem.objects.create)(
                transaction=transaction,
                product=item.product,
                quantity=item.quantity,
                price_at_sale=item.product.amount_usd
            )

            # 2. Actualizar stock
            item.product.quantity = max(item.product.quantity - item.quantity, 0)
            await sync_to_async(item.product.save)()

        # 3. Marcar carrito como inactivo y limpiar items
        cart.is_active = False
        await sync_to_async(cart.clear_items)()
        await sync_to_async(cart.save)()
        logger.info(f"Carrito {cart.id} con {len(cart_items)} items procesado para transacción {transaction.id}")
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from web3 import AsyncWeb3, WebSocketProvider
from django.conf import settings
from payments.models import Transaction, OrderItem
import asyncio
import json
from asgiref.sync import sync_to_async
from django.db import transaction as db_transaction
import os

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Verifica transacciones pendientes y marca como fallidas las expiradas'

    def handle(self, *args, **options):
        transaction_hash = options.get('transaction_hash')
        result = asyncio.run(self.async_handler(transaction_hash=transaction_hash))
        return result
    
    async def async_handler(self, transaction_hash=None):
        logger.info("Iniciando verificación de transacciones pendientes...")
        
        # Configurar conexión Web3
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

                    # Obtener transacciones pendientes con más de X tiempo
                    expiration_time = timezone.now() - timedelta(minutes=1)

                    filters = {
                        'status': 'pending',
                        'created_at__lte': expiration_time,
                    }
                    if transaction_hash:
                        filters['transaction_hash'] = transaction_hash

                    # Aplicar filtros al queryset
                    pending_transactions = await sync_to_async(list)(
                        Transaction.objects.filter(**filters)
                    )

                    logger.info(f"Encontradas {len(pending_transactions)} transacciones pendientes expiradas")

                    # Procesar cada transacción
                    confirmed_count = 0
                    failed_count = 0
                    
                    for tx in pending_transactions:
                        try:
                            # Verificar si el hash es válido (no es la dirección de wallet)
                            if not tx.transaction_hash or len(tx.transaction_hash) < 42 or tx.transaction_hash.startswith('0x') and len(tx.transaction_hash) <= 42:
                                logger.warning(f"Transacción {tx.id} tiene un hash inválido (es una dirección de wallet): {tx.transaction_hash}")
                                await self.handle_failed_transaction(tx)
                                failed_count += 1
                                continue
                            
                            result = await self.process_transaction(w3, contract, tx)
                            if result == 'confirmed':
                                confirmed_count += 1
                            elif result == 'failed':
                                failed_count += 1
                        except Exception as e:
                            logger.error(f"Error procesando transacción {tx.id}: {str(e)}")
                            # En caso de error, marcar como failed y reponer stock
                            await self.handle_failed_transaction(tx)
                            failed_count += 1

                    return {
                        'success': True,
                        'processed': len(pending_transactions),
                        'confirmed': confirmed_count,
                        'failed': failed_count                        
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

    async def handle_failed_transaction(self, transaction):
        """Maneja una transacción fallida: repone stock y marca OrderItems como cancelled"""
        try:
            # Usar una función sincrónica envuelta con sync_to_async
            @sync_to_async
            def process_failed_transaction():
                with db_transaction.atomic():
                    # Obtener los OrderItems asociados
                    order_items = OrderItem.objects.filter(transaction=transaction).select_related('product')
                    
                    # Reponer el stock de cada producto
                    items_restored = 0
                    for order_item in order_items:
                        product = order_item.product
                        # Restaurar la cantidad que se había descontado
                        product.stock_quantity += order_item.quantity
                        product.save()
                        
                        # Marcar OrderItem como cancelled
                        order_item.status = 'cancelled'
                        order_item.save()
                        items_restored += 1
                    
                    # Marcar la transacción como failed
                    transaction.status = 'failed'
                    # Cambiar el transaction_hash para evitar reintentos
                    transaction.transaction_hash = f"failed_{transaction.id}_{timezone.now().timestamp()}"
                    transaction.save()
                    
                    logger.info(f"Transacción {transaction.id} marcada como fallida. Se repusieron {items_restored} items al inventario.")
                    return items_restored
            
            await process_failed_transaction()
            
        except Exception as e:
            logger.error(f"Error al manejar transacción fallida {transaction.id}: {str(e)}")
            # Si falla incluso el manejo de error, al menos marcar la transacción como failed
            try:
                @sync_to_async
                def force_fail():
                    transaction.status = 'failed'
                    transaction.transaction_hash = f"failed_{transaction.id}_{timezone.now().timestamp()}"
                    transaction.save()
                await force_fail()
            except:
                pass

    async def process_transaction(self, w3, contract, transaction):
        """Procesa una transacción individual"""
        try:
            # Verificar nuevamente que el hash sea válido antes de consultar
            if not transaction.transaction_hash or len(transaction.transaction_hash) < 42:
                logger.warning(f"Transacción {transaction.id} hash inválido: {transaction.transaction_hash}")
                await self.handle_failed_transaction(transaction)
                return 'failed'
            
            # Intentar obtener el recibo de la transacción
            try:
                receipt = await w3.eth.get_transaction_receipt(transaction.transaction_hash)
            except Exception as e:
                logger.warning(f"No se pudo obtener recibo para transacción {transaction.id}: {str(e)}")
                await self.handle_failed_transaction(transaction)
                return 'failed'
            
            if receipt is None:
                logger.warning(f"Recibo no encontrado para transacción {transaction.id}")
                await self.handle_failed_transaction(transaction)
                return 'failed'
                
            block_number = receipt['blockNumber']

            # Filtrar eventos por transactionId
            events = await contract.events.PaymentReceived.get_logs(
                argument_filters={'transactionId': transaction.id},
                from_block=block_number,
                to_block=block_number
            )

            logger.debug(f"Eventos encontrados para transacción {transaction.id}:")
            for event in events:
                logger.debug(json.dumps(dict(event), indent=2, default=str))

            if not events:
                # Transacción fallida - reponer stock
                await self.handle_failed_transaction(transaction)
                return 'failed'
            else:
                # Transacción confirmada
                event = events[0]
                @sync_to_async
                def confirm_transaction():
                    transaction.status = 'confirmed'
                    transaction.save()
                await confirm_transaction()
                logger.info(f"Transacción {transaction.id} confirmada (evento encontrado en {event['blockNumber']})")
                return 'confirmed'

        except Exception as e:
            logger.error(f"Error al procesar transacción {transaction.id}: {str(e)}")
            # En caso de error, marcar como failed y reponer stock
            await self.handle_failed_transaction(transaction)
            return 'failed'
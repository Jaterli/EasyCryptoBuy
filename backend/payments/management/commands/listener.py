# listener.py - Con verificación de transacciones perdidas al iniciar
import os
import asyncio
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from web3 import AsyncWeb3, WebSocketProvider
from web3.utils.subscriptions import LogsSubscription
from payments.models import Transaction
from asgiref.sync import sync_to_async
from django.utils import timezone
from datetime import timedelta

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
                    
                    # Verificar transacciones pendientes que puedan haber sido confirmadas
                    await self.check_pending_transactions(w3)
                    
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
                    retry_count = 0
                    await w3.subscription_manager.handle_subscriptions()

            except Exception as e:
                wait_time = min(60, 2 ** retry_count)
                logger.warning(f"Error: {e}. Reintentando conexión en {wait_time}s...")
                await asyncio.sleep(wait_time)
                retry_count = min(retry_count + 1, max_retries)

    async def check_pending_transactions(self, w3):
        """Verifica transacciones pendientes que podrían haberse confirmado mientras el listener estaba offline"""
        try:
            # Buscar transacciones pendientes con hash que parezca real (no placeholder)
            pending_transactions = await sync_to_async(list)(
                Transaction.objects.filter(
                    status='pending'
                ).exclude(
                    transaction_hash__regex=r'^0x[a-fA-F0-9]{40}$'  # Excluir placeholders que son direcciones de wallet
                )
            )
            
            if not pending_transactions:
                return
                
            logger.info(f"Verificando {len(pending_transactions)} transacciones pendientes...")
            
            for tx in pending_transactions:
                try:
                    # Verificar si la transacción ya está confirmada en blockchain
                    receipt = await w3.eth.get_transaction_receipt(tx.transaction_hash)
                    
                    if receipt and receipt.status == 1:
                        logger.info(f"Transacción pendiente {tx.id} encontrada como confirmada en blockchain")
                        tx.status = 'confirmed'
                        # El hash ya es correcto, solo actualizar estado
                        await sync_to_async(tx.save)()
                        logger.info(f"Transacción {tx.id} marcada como confirmed")
                        
                except Exception as e:
                    logger.debug(f"Error verificando transacción {tx.id}: {e}")
                    
        except Exception as e:
            logger.error(f"Error en check_pending_transactions: {e}")

    async def handle_payment_event(self, context, contract):
        log = context.result
        try:
            event = contract.events.PaymentReceived().process_log(log)
            transaction_id = event['args']['transactionId']
            sender_address = event['args']['sender'].lower()
            tx_hash = log['transactionHash'].hex()

            logger.info(f"Evento recibido: TX Hash {tx_hash}, Transaction ID {transaction_id}, Sender {sender_address}")

            max_retries = 5
            base_delay = 5

            tx = None
            await asyncio.sleep(base_delay)

            for attempt in range(max_retries):
                try:
                    tx = await sync_to_async(
                        Transaction.objects.get
                    )(id=transaction_id, wallet_address__iexact=sender_address)
                    break
                except Transaction.DoesNotExist:
                    if attempt == max_retries - 1:
                        tx = await sync_to_async(
                            Transaction.objects.filter(id=transaction_id).first
                        )()
                        if not tx:
                            logger.error(f"Transacción {transaction_id} no existe")
                            return
                    else:
                        delay = base_delay * (2 ** attempt)
                        logger.warning(f"Transacción no encontrada (intento {attempt + 1}/{max_retries}). Reintentando en {delay}s...")
                        await asyncio.sleep(delay)

            if tx.status == 'confirmed':
                logger.info(f"Transacción {tx.id} ya confirmada.")
                return

            # Actualizar la transacción con el hash real y marcarla como confirmada
            tx.transaction_hash = tx_hash
            tx.status = 'confirmed'
            await sync_to_async(tx.save)()
            
            logger.info(f"Transacción {tx.id} confirmada - Hash actualizado a {tx_hash}")

        except Exception as e:
            logger.error(f"Error procesando evento: {e}", exc_info=True)
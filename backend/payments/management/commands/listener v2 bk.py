import os
import asyncio
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from web3 import AsyncWeb3, WebSocketProvider
from web3.utils.subscriptions import LogsSubscription
from payments.models import Transaction
from asgiref.sync import sync_to_async
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Escucha eventos de PaymentReceived y verifica transacciones pendientes'

    def handle(self, *args, **options):
        logger.info("Iniciando listener de eventos...")
        asyncio.run(self.async_handler())

    async def async_handler(self):
        # Ejecutar ambas tareas en paralelo
        await asyncio.gather(
            self.listen_events(),
            self.check_pending_transactions()
        )

    async def listen_events(self):
        """Listener original para eventos en tiempo real"""
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
                    logger.info("Escuchando eventos en tiempo real...")

                    retry_count = 0
                    await w3.subscription_manager.handle_subscriptions()

            except Exception as e:
                wait_time = min(60, 2 ** retry_count)
                logger.warning(f"Error en listener: {e}. Reintentando en {wait_time}s...")
                await asyncio.sleep(wait_time)
                retry_count = min(retry_count + 1, max_retries)

    async def check_pending_transactions(self):
        """Nueva función para verificar transacciones pendientes periódicamente"""
        check_interval = 300  # 5 minutos entre verificaciones
        max_retries = 3
        retry_count = 0

        ws_provider_url = os.environ.get('WEB3_WS_PROVIDER')
        if not ws_provider_url:
            logger.error("WEB3_WS_PROVIDER no está definido en las variables de entorno.")
            return

        while True:
            try:
                async with AsyncWeb3(WebSocketProvider(ws_provider_url)) as w3:
                    contract = w3.eth.contract(
                        address=settings.PAYMENT_CONTRACT_ADDRESS,
                        abi=settings.PAYMENT_CONTRACT_ABI
                    )

                    # Obtener transacciones pendientes sin hash
                    logger.info(f"Comprobando si hay transacciones pendientes...")

                    pending_txs = await sync_to_async(list)(
                        Transaction.objects.filter(
                            status='pending',
                        ).select_related('cart')
                    )

                    if pending_txs:
                        logger.info(f"Verificando {len(pending_txs)} transacciones pendientes...")
                        await self.process_pending_transactions(w3, contract, pending_txs)
                    else:
                        logger.info(f"No se han encontrado transacciones pendientes...")

                    retry_count = 0
                    await asyncio.sleep(check_interval)

            except Exception as e:
                wait_time = min(60, 2 ** retry_count)
                logger.warning(f"Error en verificador: {e}. Reintentando en {wait_time}s...")
                await asyncio.sleep(wait_time)
                retry_count = min(retry_count + 1, max_retries)

    async def process_pending_transactions(self, w3, contract, pending_txs):
        """Procesa las transacciones pendientes buscando eventos coincidentes"""
        # Obtener eventos de PaymentReceived en las últimas 24 horas
        # from_block = await w3.eth.block_number - 5760  # ~24 horas (asumiendo 15s/block)
        # to_block = 'latest'

        events = await contract.events.PaymentReceived.get_logs(
            from_block = 0, #await w3.eth.block_number - 5760,
            to_block = 'latest'
        )

        for tx in pending_txs:
            logger.info(f"Buscando evento que coincida con walllet {tx.wallet_address} transactionId: {tx.id})")

            try:
                # Buscar evento que coincida con wallet_address y transactionId
                matching_event = next(
                    (e for e in events if 
                     e.args.sender.lower() == tx.wallet_address.lower() and
                     str(e.args.transactionId) == str(tx.id)),
                    None
                )

                if matching_event:
                    tx_hash = matching_event['transactionHash'].hex()
                    tx.transaction_hash = tx_hash
                    tx.status = 'confirmed'
                    await sync_to_async(tx.save)()
                    logger.info(f"Transacción pendiente {tx.id} confirmada por evento (TxHash: {tx_hash})")

            except Exception as e:
                logger.error(f"Error procesando transacción pendiente {tx.id}: {e}")

    async def handle_payment_event(self, context, contract):
        """Manejador original de eventos (sin cambios)"""
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
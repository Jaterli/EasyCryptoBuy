import os
import asyncio
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from web3 import AsyncWeb3, WebSocketProvider
from web3.utils.subscriptions import LogsSubscription
from payments.models import Transaction
from asgiref.sync import sync_to_async
from decimal import Decimal

logger = logging.getLogger(__name__)

# Mapeo inverso para buscar símbolos por dirección
def get_token_symbol(address):
    address_lower = address.lower()
    for symbol, token_address in settings.TOKEN_ADDRESSES.items():
        if token_address and token_address.lower() == address_lower:
            return symbol
    return 'UNKNOWN'

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
            event_data = contract.events.PaymentReceived().process_log(log)
            
            tx_hash = "0x" + log['transactionHash'].hex()
            transaction_id = event_data['args']['transactionId']
            sender = event_data['args']['sender']
            amount = event_data['args']['amount']
            token_address = event_data['args']['token']
            currency = event_data['args']['currency']
            
            # Obtener símbolo del token usando tu configuración
            token_symbol = get_token_symbol(token_address)
            
            logger.info(
                f"Evento recibido - ID: {transaction_id}, "
                f"Token: {token_symbol} ({token_address}), "
                f"Monto: {amount}, "
                f"De: {sender}"
            )

            # Configuración de decimales por tipo de token
            DECIMALS = {
                'USDT': 6,
                'USDC': 6,
                'LINK': 18,
                'ETH': 18
            }
            
            decimals = DECIMALS.get(token_symbol, 18)
            amount_decimal = Decimal(amount) / (10 ** decimals)

            max_retries = 5
            base_delay = 5

            tx = None
            await asyncio.sleep(base_delay)
            
            for attempt in range(max_retries):
                try:
                    tx = await sync_to_async(Transaction.objects.get)(id=transaction_id)
                    
                    # Validaciones adicionales
                    if tx.wallet_address.lower() != sender.lower():
                        logger.error(f"Dirección no coincide para TX {transaction_id}")
                        return
                        
                    if tx.token != token_symbol:
                        logger.error(f"Token no coincide para TX {transaction_id}")
                        return
                        
                    break
                        
                except Transaction.DoesNotExist:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(f"Transacción no encontrada (intento {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)

            if tx is None:
                logger.error(f"Transacción {transaction_id} no existe después de {max_retries} intentos")
                return

            if tx.status == 'confirmed':
                logger.info(f"Transacción {transaction_id} ya confirmada")
            else:
                tx.transaction_hash = tx_hash
                tx.status = 'confirmed'
                tx.amount = amount_decimal
                await sync_to_async(tx.save)()
                logger.info(f"Transacción {transaction_id} confirmada - Hash: {tx_hash}")

        except Exception as e:
            logger.error(f"Error procesando evento: {str(e)}", exc_info=True)
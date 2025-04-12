import os
import asyncio
from django.core.management.base import BaseCommand
from django.conf import settings
from web3 import AsyncWeb3, WebSocketProvider
from web3.utils.subscriptions import LogsSubscription
from payments.models import Transaction
from asgiref.sync import sync_to_async

class Command(BaseCommand):
    help = 'Escucha eventos de PaymentReceived del contrato'

    def handle(self, *args, **options):
        self.stdout.write("Iniciando listener de eventos...")
        asyncio.run(self.async_handler())

    async def async_handler(self):
        while True:
            try:
                async with AsyncWeb3(WebSocketProvider(os.environ.get('WEB3_WS_PROVIDER'))) as w3:
                    self.stdout.write("Conectado a la blockchain. Configurando contrato...")
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
                    self.stdout.write("Escuchando eventos...")
                    await w3.subscription_manager.handle_subscriptions()
            except Exception as e:
                self.stdout.write(f"Error: {e}. Reconectando en 5s...")
                await asyncio.sleep(5)

    async def handle_payment_event(self, context, contract):
        log = context.result
        try:
            tx_hash = "0x" + log['transactionHash'].hex()
            self.stdout.write(f"Evento recibido: {tx_hash}")

            max_retries = 5  # Número máximo de reintentos
            delay_seconds = 5  # Segundos entre reintentos
            # Reintentos a causa del posible delay entre la escucha de los eventos y el guardado en la BD
            
            await asyncio.sleep(delay_seconds)
            for attempt in range(max_retries):
                try:
                    tx = await sync_to_async(Transaction.objects.get)(transaction_hash=tx_hash)
                    break  # Si la encuentra, salimos del bucle
                except Transaction.DoesNotExist:
                    if attempt < max_retries - 1:
                        self.stdout.write(f"Reintentando ({attempt + 1}/{max_retries})...")
                        await asyncio.sleep(delay_seconds)
                    else:
                        raise  # Lanza excepción si supera los reintentos

            if tx.status == 'confirmed':
                self.stdout.write(f"Transacción {tx_hash} ya confirmada.")
            else:
                tx.status = 'confirmed'
                await sync_to_async(tx.save)()
                self.stdout.write(f"Transacción {tx_hash} confirmada.")

        except Transaction.DoesNotExist:
            self.stdout.write(f"Error: Transacción {tx_hash} no existe después de {max_retries} intentos.")
        except Exception as e:
            self.stdout.write(f"Error procesando evento: {e}")
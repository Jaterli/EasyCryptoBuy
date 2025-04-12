# python manage.py check_transactions  
# Lanza este script para chequear en la blockchain si las transacciones que quedaron como pending en la BD se pueden marcar como confirmed
import time
from django.core.management.base import BaseCommand
from django.conf import settings
from web3 import Web3
from payments.models import Transaction

class Command(BaseCommand):
    help = 'Verifica si las transacciones pendientes han sido confirmadas en la blockchain'

    def handle(self, *args, **options):
        w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER))

        # Buscamos transacciones que no estén confirmadas
        pending_txs = Transaction.objects.filter(status='pending')

        for tx in pending_txs:
            try:
                receipt = w3.eth.get_transaction_receipt(tx.transaction_hash)
                if receipt and receipt.status == 1:
                    tx.status = 'confirmed'
                    tx.save()
                    self.stdout.write(self.style.SUCCESS(f"Transacción {tx.transaction_hash} confirmada."))
                elif receipt and receipt.status == 0:
                    self.stdout.write(self.style.ERROR(f"Transacción {tx.transaction_hash} fallida."))
                else:
                    self.stdout.write(f"Transacción {tx.transaction_hash} aún no está confirmada.")
            except Exception as e:
                self.stdout.write(f"No se encontró recibo para {tx.transaction_hash}: {e}")

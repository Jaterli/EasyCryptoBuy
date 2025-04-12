# Este archivo contiene la lógica para consultar la blockchain.
from web3 import Web3
import os

# URL del nodo (puedes usar Infura, Alchemy o un nodo propio)
WEB3_PROVIDER = os.getenv("WEB3_PROVIDER")

w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER))

def get_transaction(tx_hash):
    """
    Obtiene una transacción de la blockchain por su hash.
    """
    try:
        transaction = w3.eth.get_transaction(tx_hash)
        return transaction
    except Exception as e:
        print(f"Error al obtener la transacción: {e}")
        return None


def get_erc20_transaction(tx_hash):
    """
    Obtiene los detalles de una transacción ERC-20 usando los logs de eventos.
    """
    try:
        receipt = w3.eth.get_transaction_receipt(tx_hash)
        if not receipt:
            return None

        logs = receipt.get("logs", [])
        for log in logs:
            # Filtrar eventos Transfer de ERC-20 (Topic 0 del evento Transfer)
            if len(log["topics"]) == 3 and log["topics"][0].hex() == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef":
                sender = "0x" + log["topics"][1].hex()[26:]  # Extraer la dirección del remitente
                receiver = "0x" + log["topics"][2].hex()[26:]  # Extraer la dirección del destinatario
                amount = int(log["data"], 16)  # Convertir el valor de hexadecimal a entero

                return {
                    "from": sender,
                    "to": receiver,
                    "value": amount,
                    "contract_address": log["address"],  # Dirección del contrato ERC-20
                }

        return None  # Si no se encontró un evento Transfer válido
    except Exception as e:
        print(f"Error al obtener la transacción ERC-20: {e}")
        return None

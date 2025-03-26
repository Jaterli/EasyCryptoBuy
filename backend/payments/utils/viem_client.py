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

import requests

COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price"

def get_eth_price_in_fiat(currency="usd"):
    """ Obtiene el precio actual de 1 ETH en la moneda fiat especificada. """
    params = {
        "ids": "ethereum",
        "vs_currencies": currency
    }
    
    try:
        response = requests.get(COINGECKO_API_URL, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get("ethereum", {}).get(currency, None)
    except requests.exceptions.RequestException as e:
        print(f"Error al obtener precio ETH: {e}")
        return None

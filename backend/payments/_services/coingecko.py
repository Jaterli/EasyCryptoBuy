import requests
from django.core.cache import cache
from django.conf import settings
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price"
CACHE_KEY_PREFIX = "eth_price_"
CACHE_TIMEOUT = timedelta(minutes=5).seconds  # 5 minutos

class CoinGeckoServiceError(Exception):
    """Excepción personalizada para errores del servicio"""
    pass

def get_eth_price_in_fiat(currency="usd", force_refresh=False):
    """
    Obtiene el precio de ETH con caché y manejo de errores profesional.
    
    Args:
        currency (str): Código de moneda (ej: 'usd', 'eur')
        force_refresh (bool): Ignorar caché y forzar consulta a API
    
    Returns:
        float|None: Precio actual o None si falla
        
    Raises:
        CoinGeckoServiceError: Para errores controlados
    """
    cache_key = f"{CACHE_KEY_PREFIX}{currency.lower()}"
    
    # 1. Verificar caché si no se fuerza refresco
    if not force_refresh:
        cached_price = cache.get(cache_key)
        if cached_price is not None:
            logger.debug(f"Retornando precio desde caché: {cached_price} {currency}")
            return cached_price

    # 2. Configurar parámetros de la API
    params = {
        "ids": "ethereum",
        "vs_currencies": currency,
        "precision": 4  # 4 decimales para valores fiat
    }

    try:
        # 3. Intentar consulta a la API
        response = requests.get(
            COINGECKO_API_URL,
            params=params,
            timeout=5,  # Timeout en segundos
            headers={"User-Agent": settings.APP_NAME} if hasattr(settings, 'APP_NAME') else None
        )
        
        response.raise_for_status()
        data = response.json()

        # 4. Extraer y validar precio
        if not data.get("ethereum"):
            raise CoinGeckoServiceError("Estructura de respuesta inválida")

        price = data["ethereum"].get(currency.lower())
        
        if price is None:
            raise CoinGeckoServiceError(f"Moneda {currency} no soportada")

        # 5. Actualizar caché
        cache.set(cache_key, price, timeout=CACHE_TIMEOUT)
        logger.info(f"Precio actualizado: {price} {currency}")
        
        return price

    except requests.exceptions.RequestException as e:
        logger.error(f"Error en API CoinGecko: {str(e)}")
        
        # 6. Fallback a caché si existe
        fallback_price = cache.get(cache_key)
        if fallback_price:
            logger.warning(f"Usando precio en caché por fallo en API: {fallback_price}")
            return fallback_price
            
        raise CoinGeckoServiceError("Error al obtener precio y no hay datos en caché")

    except Exception as e:
        logger.critical(f"Error inesperado: {str(e)}", exc_info=True)
        raise CoinGeckoServiceError("Error interno procesando precio")
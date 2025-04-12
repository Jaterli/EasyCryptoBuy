from decimal import Decimal, getcontext

def format_scientific_to_decimal(num, precision=20):
    """
    Convierte un número (en notación científica o no) en una cadena en notación decimal.
    
    Parámetros:
      num (str, float o Decimal): El número a convertir.
      precision (int): Cantidad de decimales a utilizar para la representación inicial.
      
    Retorna:
      str: Representación en notación decimal sin notación científica.
    """
    # Convertir el número a un objeto Decimal
    d = Decimal(str(num))
    
    # Establecer la precisión del contexto (opcional, para asegurar suficiente precisión)
    getcontext().prec = precision
    
    # Formatear el número con la cantidad de decimales indicada
    formatted = f"{d:.{precision}f}"
    
    # Remover ceros finales y, si es el caso, el punto decimal sobrante
    if '.' in formatted:
        formatted = formatted.rstrip('0').rstrip('.')
    
    return formatted
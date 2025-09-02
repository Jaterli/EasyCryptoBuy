# EasyCryptoBuy - Plataforma de E-commerce con Pagos Blockchain

## 📋 Visión General

EasyCryptoBuy es una plataforma de comercio electrónico innovadora que integra pagos blockchain, desarrollada como proyecto del Máster en Desarrollo Full Stack y Blockchain. La plataforma demuestra cómo la tecnología blockchain puede integrarse eficientemente en entornos de e-commerce tradicional, ofreciendo ventajas significativas como transparencia, seguridad mejorada y reducción de intermediarios.

## ✨ Características Principales

### 🛍️ Para Clientes
- **Catálogo de productos** con imágenes y descripciones detalladas
- **Carrito de compras** persistente entre sesiones
- **Pagos con criptomonedas** (ETH, USDT, USDC, tokens ERC-20)
- **Dashboard personalizado** con historial de transacciones
- **Autenticación segura** mediante firma criptográfica

### 🏢 Para Empresas
- **Dashboard analítico** con métricas en tiempo real
- **Gestión completa de productos** (CRUD)
- **Seguimiento de ventas y pedidos**
- **Gestión de clientes** y historial de compras
- **Generación de facturas** en PDF

### 🔒 Seguridad
- **Autenticación JWT** con tokens de refresh
- **Firma criptográfica** para verificación de identidad
- **Rate limiting** contra ataques de fuerza bruta
- **Validación de transacciones** on-chain
- **Protección contra XSS** y políticas CORS estrictas

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** con TypeScript
- **Chakra UI** para componentes y diseño
- **Wagmi** + **Viem** para integración blockchain
- **Axios** para comunicación con API

### Backend
- **Django REST Framework**
- **PostgreSQL** como base de datos
- **Web3.py** para interacción blockchain
- **JWT** para autenticación

### Blockchain
- **Smart Contracts** en Solidity (Ethereum)
- **Redes soportadas**: Ethereum Mainnet y Sepolia Testnet
- **Tokens soportados**: ETH, USDT, USDC y otros ERC-20

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Python 3.9+
- PostgreSQL
- MetaMask u otra wallet compatible

### Backend Setup

```bash
# Clonar repositorio
git clone <repository-url>
cd easycryptobuy/backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar migraciones
python manage.py migrate

# Iniciar servidor
python manage.py runserver
```

### Frontend Setup

```bash
cd easycryptobuy/frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar aplicación
npm run dev
```

### Configuración Blockchain

1. **Configurar red Sepolia** en MetaMask
2. **Obtener Sepolia ETH** de un faucet
3. **Configurar variables de entorno** para RPC endpoints

## 📊 Funcionalidades Técnicas

### Autenticación por Wallet
```typescript
// Ejemplo de flujo de autenticación
const { authenticate } = useWallet();
const handleConnect = async () => {
  await authenticate(); // Firma de mensaje + verificación
};
```

### Proceso de Pago
```solidity
// Smart Contract - PaymentProcessor.sol
contract PaymentProcessor {
    event PaymentReceived(address indexed buyer, uint256 amount, uint256 transactionId);
    
    function processPayment(uint256 transactionId, uint256 nonce) external payable {
        require(!usedNonces[nonce], "Nonce already used");
        usedNonces[nonce] = true;
        emit PaymentReceived(msg.sender, msg.value, transactionId);
    }
}
```

### Dashboard Empresarial
```python
# Vista de dashboard empresarial
@api_view(["GET"])
def company_dashboard(request):
    total_revenue = Transaction.objects.filter(
        status='confirmed'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    active_users = UserProfile.objects.filter(
        carts__transaction__status='confirmed',
        carts__transaction__created_at__gte=timezone.now() - timedelta(days=30)
    ).distinct().count()
    
    return Response({
        'total_revenue': float(total_revenue),
        'active_users': active_users,
        # ... más métricas
    })
```

## 🎯 Estructura del Proyecto

```
easycryptobuy/
├── backend/                 # Django REST API
│   ├── users/              # App de usuarios y autenticación
│   ├── company/            # App de gestión empresarial
│   ├── payments/           # App de pagos y transacciones
│   └── config/             # Configuración Django
├── frontend/               # React TypeScript App
│   ├── src/
│   │   ├── features/       # Funcionalidades por módulo
│   │   ├── shared/         # Componentes y utilidades compartidas
│   │   └── types/          # Definiciones TypeScript
│   └── public/
└── contracts/              # Smart Contracts Solidity
```

## 🔧 API Endpoints Principales

### Autenticación
- `POST /api/users/wallet-auth` - Autenticación con wallet
- `GET /api/users/get-wallet-nonce/{wallet}` - Obtener nonce
- `GET /api/users/verify-token` - Verificar token JWT

### Productos
- `GET /api/company/products` - Listar productos
- `POST /api/company/products` - Crear producto (admin)
- `PUT /api/company/products/{id}` - Actualizar producto (admin)

### Pagos
- `POST /api/payments/register-transaction` - Registrar transacción
- `PUT /api/payments/update-transaction/{id}` - Actualizar transacción
- `GET /api/payments/transaction-details/{hash}` - Detalles de transacción

### Dashboard
- `GET /api/company/dashboard` - Métricas empresariales
- `GET /api/company/top-products` - Productos más vendidos
- `GET /api/company/recent-transactions` - Transacciones recientes

## 🌐 Redes Blockchain Soportadas

### Mainnet
- **Ethereum Mainnet** - Transacciones reales con tokens reales

### Testnets
- **Sepolia Testnet** - Entorno de desarrollo y pruebas
- **Goerli Testnet** - Alternativa para testing

## 🛡️ Consideraciones de Seguridad

### Implementadas
- ✅ Validación de firmas criptográficas
- ✅ Nonces de un solo uso
- ✅ Rate limiting en endpoints críticos
- ✅ Sanitización de inputs
- ✅ Verificación de saldos y gas fees

### Mejores Prácticas
- **Private keys** nunca se almacenan en servidores
- **Transacciones** se firman solo del lado del cliente
- **Event listeners** para confirmaciones on-chain
- **Backups automáticos** de datos críticos

## 📈 Métricas y Analytics

La plataforma proporciona métricas en tiempo real:

- **Ingresos totales** en USD y cripto
- **Usuarios activos** (últimos 30 días)
- **Transacciones totales** históricas
- **Valor de inventario** actual
- **Productos más vendidos** por volumen
- **Tendencias** de transacciones por período

## 🚦 Estado del Proyecto

### ✅ Completado
- [x] Autenticación con wallet
- [x] Catálogo de productos
- [x] Sistema de carrito
- [x] Procesamiento de pagos
- [x] Dashboard empresarial
- [x] Gestión de productos
- [x] Generación de facturas

### 🚧 En Desarrollo
- [ ] Sistema de categorías de productos
- [ ] Búsqueda y filtrado avanzado
- [ ] Notificaciones por email
- [ ] Sistema de reseñas y valoraciones
- [ ] API pública para desarrolladores

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Desarrollo

Desarrollado como parte del **Máster en Desarrollo Full Stack y Blockchain**, demostrando competencias en:

- Integración de tecnologías blockchain en aplicaciones reales
- Diseño de interfaces de usuario intuitivas y responsivas
- Implementación de medidas de seguridad robustas
- Desarrollo de sistemas backend eficientes y escalables

## 📞 Contacto

Para preguntas sobre el proyecto o oportunidades de colaboración:

- **Email**: admin@jaterli.com
- **LinkedIn**: [Linkedin](https://www.linkedin.com/in/jaterli/)
- **Portfolio**: [jaterli.com](https://jaterli.com)

---

**EasyCryptoBuy** - Revolucionando el e-commerce con tecnología blockchain 🌐💳
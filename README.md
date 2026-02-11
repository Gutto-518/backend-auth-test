# Backend Auth Test - NestJS

Backend con autenticación JWT implementado en NestJS con testing completo.

## 🚀 Características

- ✅ Autenticación con JWT
- ✅ Signup y Login
- ✅ Rutas protegidas con Guards
- ✅ Unit Tests (100% coverage)
- ✅ E2E Tests
- ✅ Validación de DTOs con class-validator
- ✅ Almacenamiento en memoria (sin base de datos)

## 📦 Tecnologías

- **Framework**: NestJS
- **Testing**: Jest
- **Autenticación**: JWT (Passport)
- **Validación**: class-validator
- **Package Manager**: pnpm

## 🛠️ Instalación
```bash
# Instalar dependencias
pnpm install
```

## 🏃 Ejecutar la Aplicación
```bash
# Modo desarrollo
pnpm start:dev

# Modo producción
pnpm build
pnpm start:prod
```

La aplicación estará disponible en `http://localhost:3000`

## 🧪 Testing
```bash
# Unit tests
pnpm api:tests:ut

# E2E tests
pnpm api:tests:e2e

# Todos los tests
pnpm test

# Tests en watch mode
pnpm test:watch

# Coverage
pnpm test:cov
```

## 📡 Endpoints

### Autenticación

#### POST /auth/signup
Registrar nuevo usuario

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "name": "Nombre Usuario"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/login
Iniciar sesión

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Rutas Protegidas

#### GET /hello
Endpoint protegido que requiere autenticación

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Hello World, usuario@ejemplo.com!"
}
```

## 📁 Estructura del Proyecto
```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   │   ├── signup.dto.ts
│   │   └── login.dto.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interfaces/
│   │   └── user.interface.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── hello/
│   ├── hello.controller.ts
│   ├── hello.service.ts
│   └── hello.module.ts
├── app.module.ts
└── main.ts
```

## 🔒 Seguridad

⚠️ **Nota**: Este proyecto usa una clave secreta hardcodeada para JWT (`your-secret-key`). En producción, **siempre** usa variables de entorno:
```typescript
// Configuración para producción
secretOrKey: process.env.JWT_SECRET
```

## 📝 Notas de Desarrollo

- Los usuarios se almacenan en memoria (se pierden al reiniciar)
- Las contraseñas se encriptan con bcrypt
- Los tokens JWT expiran en 1 hora
- La validación de DTOs está habilitada globalmente

## 👨‍💻 Autor

Tu Nombre

## 📄 Licencia

UNLICENSED
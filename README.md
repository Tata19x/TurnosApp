# TurnosApp - Sistema de Gestión de Turnos Laborales

Proyecto académico para pruebas de usabilidad. Sistema de gestión de turnos con roles de Administrador y Empleado.

## Stack Tecnológico

- **Backend**: Node.js con Express y SQLite (ORM: Sequelize)
- **Frontend**: React (Vite) con Tailwind CSS
- **Autenticación**: JWT (JSON Web Tokens)
- **Haseo de Passwords**: bcryptjs

## Estructura del Proyecto

```
TurnosApp/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Turno.js
│   │   └── index.js
│   ├── routes/
│   │   └── auth.js
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── database.sqlite
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── DashboardAdmin.jsx
    │   │   └── DashboardEmployee.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── PrivateRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   └── App.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
├── start-dev.bat
├── start-dev.ps1
├── UI_DOCUMENTATION.md
└── README.md
```

## Inicio Rápido

### Opción 1: Script Automático (Windows)

**Con Command Prompt:**
```bash
start-dev.bat
```

**Con PowerShell:**
```powershell
.\start-dev.ps1
```

Esto abrirá dos ventanas automáticamente:
- Backend en `http://localhost:3000`
- Frontend en `http://localhost:5173`

### Opción 2: Manual

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

## Credenciales de Prueba

**Admin Inicial:**
- Email: `admin@turnosapp.com`
- Contraseña: `admin123`

Este usuario se crea automáticamente en la primera ejecución del servidor.

## Características Implementadas

### Backend

✅ Modelos de datos:
- **User**: name, email, password (hasheado), role (admin/employee)
- **Turno**: employeeId, date, startTime, endTime, description

✅ Autenticación:
- Login con JWT
- Registro de empleados (solo admin)
- Middleware de autenticación
- Protección de roles

✅ Base de datos:
- SQLite con Sequelize ORM
- Asociaciones: User → Turno (1:N)
- Índices únicos para evitar duplicados

### Frontend

✅ Autenticación:
- Página de Login con validación
- Context API para gestión de estado
- Token JWT almacenado en localStorage
- Rutas protegidas por rol

✅ Dashboards:
- **Dashboard Admin**: Registrar empleados, gestionar turnos (placeholder)
- **Dashboard Empleado**: Ver turnos asignados, estadísticas

✅ Componentes:
- Navbar con información del usuario
- PrivateRoute para protección de rutas
- Mensajes de éxito/error
- Interfaz responsive con Tailwind CSS

## Endpoints de API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register-employee` - Registrar empleado (requiere admin)

### Turnos (Próximos)
- `GET /api/turnos` - Obtener todos los turnos
- `GET /api/turnos/:id` - Obtener turno por ID
- `POST /api/turnos` - Crear turno
- `PUT /api/turnos/:id` - Editar turno
- `DELETE /api/turnos/:id` - Eliminar turno

## Flujo de Autenticación

1. Usuario abre la aplicación → redirigido a Login
2. Ingresa email y contraseña
3. Backend valida credenciales y retorna JWT token
4. Frontend guarda token y datos del usuario
5. Contexto de autenticación actualiza estado
6. Usuario redirigido al dashboard según rol

## Validaciones Implementadas

✅ **Login:**
- Email y contraseña requeridos
- Validación de credenciales en BD

✅ **Registro de Empleados:**
- Campos obligatorios (nombre, email, password)
- Email único en la BD
- Contraseña hasheada con bcryptjs

## Próximos Pasos

- [ ] Implementar CRUD completo de turnos (US-04)
- [ ] Validar fechas pasadas y horarios
- [ ] Evitar turnos duplicados
- [ ] Vista de calendario (US-10)
- [ ] Exportar reportes
- [ ] Invitaciones a empleados por email
- [ ] Tests unitarios
- [ ] Deploy a producción

## Documentación Adicional

Para más detalles sobre la UI:
→ Ver [UI_DOCUMENTATION.md](UI_DOCUMENTATION.md)

## Notas Importantes

- El proyecto es académico para pruebas de usabilidad
- Las contraseñas en producción deben cumplir requisitos de seguridad más estrictos
- Se recomienda usar HTTPS en producción
- El JWT expira en 1 hora (configurable en backend)
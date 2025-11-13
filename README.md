# SIGECA - Sistema de Gestión de Cámaras Gesell

Sistema web para la gestión y programación de entrevistas en Cámaras Gesell del Instituto de Medicina Legal y Ciencias Forenses (IMLCF).

## Descripción

SIGECA es una aplicación web completa que permite gestionar el flujo de programación de entrevistas en cámaras Gesell, reemplazando el proceso manual basado en Excel. El sistema permite:

- Solicitud de citas por parte de las Fiscalías
- Programación y asignación de recursos (salas y peritos)
- Seguimiento del estado de las diligencias
- Registro de dictámenes y documentos finales
- Generación de reportes

## Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno y rápido
- **SQLModel** - ORM para interacción con base de datos
- **PostgreSQL/SQLite** - Base de datos (SQLite para desarrollo, PostgreSQL para producción)
- **JWT** - Autenticación basada en tokens

### Frontend
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Zustand** - Gestión de estado
- **Axios** - Cliente HTTP
- **React Router** - Navegación

## Roles de Usuario

El sistema implementa 4 roles con diferentes permisos:

1. **Admin** - Acceso total al sistema y gestión de mantenimientos
2. **Asistente Administrativo** - Gestión de solicitudes y programación de citas
3. **Perito (Psicólogo)** - Visualización de agenda personal y registro de documentos
4. **Fiscal** - Creación y seguimiento de solicitudes

## Estructura del Proyecto

```
camaragesell/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/    # Routers de la API
│   │   │   └── deps/         # Dependencies (auth, etc.)
│   │   ├── core/             # Configuración y utilidades
│   │   ├── models/           # Modelos de base de datos
│   │   ├── schemas/          # Schemas Pydantic
│   │   └── crud/             # Operaciones CRUD
│   ├── main.py               # Aplicación principal
│   ├── init_db.py            # Script de inicialización
│   └── requirements.txt      # Dependencias Python
│
└── frontend/
    ├── src/
    │   ├── components/       # Componentes React
    │   │   ├── auth/
    │   │   └── layout/
    │   ├── pages/            # Páginas/Vistas
    │   ├── services/         # Servicios API
    │   ├── contexts/         # Context/Store (Zustand)
    │   ├── types/            # Tipos TypeScript
    │   └── utils/            # Utilidades
    ├── package.json
    └── vite.config.ts
```

## Instalación y Configuración

### Requisitos Previos

- Python 3.10+
- Node.js 18+
- npm o yarn

### Backend

1. Navegar al directorio backend:
   ```bash
   cd backend
   ```

2. Crear y activar entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar .env con tu configuración
   ```

5. Inicializar base de datos con datos de prueba:
   ```bash
   python init_db.py
   ```

6. Ejecutar el servidor:
   ```bash
   python main.py
   ```

El backend estará disponible en: `http://localhost:8000`
Documentación API (Swagger): `http://localhost:8000/docs`

### Frontend

1. Navegar al directorio frontend:
   ```bash
   cd frontend
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar .env si es necesario
   ```

4. Ejecutar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

El frontend estará disponible en: `http://localhost:5173`

## Credenciales de Prueba

Después de ejecutar `init_db.py`, puedes acceder con estas credenciales:

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Administrador | `admin` | `admin123` |
| Asistente Admin | `asistente` | `asistente123` |
| Perito | `perito1` | `perito123` |
| Fiscal | `fiscal1` | `fiscal123` |

## Modelos de Base de Datos

- **User** - Usuarios del sistema con roles
- **Sede** - Sedes del IML
- **Sala** - Salas/Cámaras Gesell
- **Perito** - Psicólogos forenses
- **DespachoFiscal** - Fiscalías solicitantes
- **Solicitud** - Solicitudes de cita
- **Programacion** - Citas programadas
- **Documento** - Dictámenes y documentos finales

## Endpoints Principales de la API

### Autenticación
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Información del usuario actual

### Solicitudes
- `GET /api/v1/solicitudes/` - Listar solicitudes
- `POST /api/v1/solicitudes/` - Crear solicitud
- `GET /api/v1/solicitudes/pendientes` - Solicitudes pendientes

### Programaciones
- `GET /api/v1/programaciones/` - Listar programaciones
- `POST /api/v1/programaciones/` - Crear programación
- `GET /api/v1/programaciones/mis-citas` - Citas del perito

### Mantenimientos
- `/api/v1/sedes/` - CRUD de sedes
- `/api/v1/salas/` - CRUD de salas (próximamente)
- `/api/v1/peritos/` - CRUD de peritos (próximamente)
- `/api/v1/despachos/` - CRUD de despachos fiscales (próximamente)

## Desarrollo

### Scripts Disponibles

**Backend:**
```bash
python main.py          # Ejecutar servidor
python init_db.py       # Inicializar DB
```

**Frontend:**
```bash
npm run dev            # Servidor de desarrollo
npm run build          # Build para producción
npm run preview        # Preview del build
npm run lint           # Linter
```

## Próximos Pasos

Los siguientes módulos están pendientes de implementación:

- [ ] Módulo de solicitudes completo (frontend)
- [ ] Módulo de programación con calendario (FullCalendar)
- [ ] Módulo de agenda para peritos
- [ ] CRUDs de mantenimientos (Salas, Peritos, Despachos)
- [ ] Módulo de reportes con exportación a Excel
- [ ] Sistema de notificaciones
- [ ] Carga de archivos/documentos
- [ ] Tests unitarios e integración

## Licencia

Este proyecto es propiedad del Instituto de Medicina Legal y Ciencias Forenses del Perú.

## Contacto

Para más información sobre el proyecto SIGECA, contactar al equipo de desarrollo del IMLCF.

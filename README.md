# Tutorías FRT 🎓

Plataforma web para que estudiantes (y docentes) de la **UTN – Facultad Regional Tucumán** den clases particulares de materias que ya aprobaron a quienes las están cursando.

- Los estudiantes avanzados generan ingresos.
- Los ingresantes consiguen ayuda de alguien que ya pasó por la misma materia y cátedra.
- **Puntuación bidireccional**: el alumno puntúa a quien le dio la clase y viceversa.

## Funcionalidades

| Módulo | Qué hace |
|---|---|
| Registro / ingreso | Solo correos institucionales, verificación por email, recuperación de contraseña |
| Buscar clases | Filtros por carrera, plan de estudios, materia, modalidad, texto; orden por puntuación o precio |
| Planes de estudio | ISI Plan 2023 (vigente) y Plan 2008 cargados con niveles, carga horaria, electivas y correlativas |
| Dar clases | Publicar una materia aprobada con nota, fecha y comprobante (analítico / SYSACAD) |
| Validación | La administración revisa el comprobante y aprueba o rechaza con motivo |
| Reservas | Solicitar → aceptar/rechazar → dictar → finalizar. Control de superposición de horarios |
| Puntuaciones | 1 a 5 estrellas + comentario, solo sobre clases finalizadas, una por persona y clase |
| Privacidad | Email y teléfono se revelan recién con la clase confirmada |
| Administración | Métricas, revisión de publicaciones, suspensión de cuentas, cambio de rol, moderación de reseñas |

## Arquitectura

```
frontend/  React 19 + Vite + TypeScript + Tailwind CSS 4 + React Query (responsive, mobile-first)
backend/   NestJS 11 + Prisma 6 + PostgreSQL 16
docker-compose.yml  db + backend + frontend (nginx sirve el front y hace proxy de /api)
```

**Modelo de datos principal:** `User` · `Career` · `StudyPlan` (Plan 2008 / Plan 2023) · `Subject` · `SubjectPrerequisite` (correlativas) · `Offering` (tutor + materia) · `Booking` (clase) · `Review` (bidireccional) · `RefreshToken` · `EmailToken` · `AuditLog`.

Flujo de una clase:

```
PENDING ──aceptar──▶ CONFIRMED ──dictada──▶ COMPLETED ──▶ ambos pueden puntuar (30 días)
   │                     │
   └─rechazar─▶ REJECTED └─cancelar (antes de empezar)─▶ CANCELLED
```

## Cómo probarla paso a paso

### 1. Instalar lo necesario (una sola vez)

| Herramienta | Para qué | Descarga |
|---|---|---|
| **Git** | Bajar el código | https://git-scm.com/downloads |
| **Docker Desktop** | Levantar base de datos, backend y frontend con un solo comando | https://www.docker.com/products/docker-desktop |

En Windows, Docker Desktop pide activar WSL 2: aceptá y reiniciá. Después abrí Docker Desktop y esperá a que diga *Engine running*.

### 2. Bajar el proyecto

```bash
git clone https://github.com/MatiasVel/tutorias-frt.git
cd tutorias-frt
```

### 3. Crear el archivo de configuración

```bash
cp .env.example .env        # en Windows (PowerShell): copy .env.example .env
```

Abrí `.env` (`notepad .env`) y completá:

- `POSTGRES_PASSWORD` → una clave cualquiera.
- Los tres secretos. Generalos en PowerShell y pegá cada resultado (el backend **no arranca** sin ellos):

  ```powershell
  # JWT_ACCESS_SECRET
  $b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | % { $_.ToString('x2') })
  # PASSWORD_PEPPER
  $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | % { $_.ToString('x2') })
  # DATA_ENCRYPTION_KEY
  $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
  ```

- Correo: si cargás `BREVO_API_KEY` (ver [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md), paso 4) los correos de verificación
  llegan de verdad. Si lo dejás vacío, el enlace se muestra en `docker compose logs backend` (buscá `[DEV]`).

Solo se aceptan correos **@alu.frt.utn.edu.ar** (alumnos) y **@doc.frt.edu.ar** (docentes; quedan con rol Docente).
Para probar con correos inventados podés vaciar temporalmente `ALLOWED_EMAIL_DOMAINS=`.

### 4. Levantar la plataforma

```bash
docker compose up --build -d
```

La primera vez tarda unos minutos (descarga imágenes e instala dependencias). Verificá que esté todo arriba:

```bash
docker compose ps                    # los 3 servicios deben figurar "running"
docker compose logs -f backend       # debe aparecer "API escuchando en ..." (Ctrl+C para salir)
```

### 5. Cargar datos iniciales

```bash
docker compose exec backend npm run seed
```

Crea las carreras, las materias y el usuario administrador definido en `.env`
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

### 6. Abrir la app

👉 **http://localhost:8080** (usá `localhost`, no `127.0.0.1`, para que la sesión funcione).

Para probarla en el **celular**: conectalo al mismo wifi y entrá a `http://IP-DE-TU-PC:8080`
(sin HTTPS la sesión no se conserva al recargar la página; en producción, con HTTPS, sí).
Para ver la vista móvil en la PC: `F12` → ícono de celular (*Toggle device toolbar*).

### 7. Recorrido de prueba completo

Usá dos navegadores distintos (o una ventana normal y otra de incógnito) para tener dos usuarios a la vez.

| # | Quién | Qué hacer | Resultado esperado |
|---|---|---|---|
| 1 | Tutor | **Crear cuenta** con `tutor@prueba.com` | Mensaje "revisá tu correo" |
| 2 | — | Correr `docker compose logs backend \| grep DEV` y abrir el enlace `/verificar-email?token=...` | "Correo confirmado" (sin SMTP los correos se muestran en el log) |
| 3 | Tutor | Ingresar → **Dar clases** → *Publicar materia*: elegir materia, nota, fecha, precio y adjuntar un PDF o imagen | Publicación "En revisión" |
| 4 | Admin | En el otro navegador, ingresar con el admin → **Administración** → *Ver comprobante* → **Aprobar** | Pasa a "Publicada" |
| 5 | Alumno | Cerrar sesión del admin, crear y verificar `alumno@prueba.com` (pasos 1–2) | — |
| 6 | Alumno | **Buscar clases** → abrir la del tutor → elegir día/hora → **Solicitar clase** | Aparece en *Mis clases* como "Pendiente" |
| 7 | Tutor | **Mis clases** → *Clases que doy* → **Aceptar** | "Confirmada" y ambos ven el email/teléfono del otro |
| 8 | Tutor | Cuando pase el horario de la clase → **Marcar como dictada** | "Finalizada" |
| 9 | Ambos | **⭐ Puntuar** (1 a 5 estrellas + comentario) | La puntuación se ve en los perfiles y en el buscador |

> Truco para no esperar en el paso 8: reservá una clase para dentro de 1 hora y 5 minutos y, una vez confirmada,
> adelantá la fecha directamente en la base:
> `docker compose exec db psql -U tutorias -d tutorias_frt -c "UPDATE \"Booking\" SET \"scheduledAt\" = now() - interval '1 hour' WHERE status = 'CONFIRMED';"`

**Pruebas de seguridad rápidas:**

- Ingresar 5 veces con una contraseña incorrecta → la cuenta se bloquea 15 minutos.
- Registrarse con una contraseña débil (`123456`) → se rechaza.
- Intentar puntuar una clase que no está finalizada → no aparece el botón y la API lo rechaza.
- Entrar a `/admin` con un usuario común → redirige al inicio.
- Subir un `.txt` renombrado a `.pdf` como comprobante → se rechaza.

### 8. Ver la base de datos con pgAdmin

La base queda publicada **solo en tu PC** en el puerto **5433** (para no chocar con un PostgreSQL local en 5432).
En pgAdmin: *Register → Server* con host `localhost`, puerto `5433`, base `tutorias_frt`, usuario `tutorias`
y la clave de `POSTGRES_PASSWORD`.

👉 Guía completa, diagrama entidad-relación y consultas SQL listas para usar: **[docs/BASE_DE_DATOS.md](docs/BASE_DE_DATOS.md)**

Para ver que un usuario quedó registrado:

```sql
SELECT "email", "firstName", "role", "emailVerifiedAt", "createdAt" FROM "User" ORDER BY "createdAt" DESC;
```

### 9. Apagar / reiniciar

```bash
docker compose down        # apaga (los datos se conservan)
docker compose down -v     # apaga y BORRA la base y los archivos subidos (empezar de cero)
```

### Problemas comunes

| Síntoma | Solución |
|---|---|
| `port is already allocated` | Otro programa usa el puerto 8080: cambiá `"8080:80"` por `"8081:80"` en `docker-compose.yml` y actualizá `FRONTEND_URL` en `.env` |
| Al recargar la página se cierra la sesión | Entrá por `http://localhost:8080`, no por la IP |
| El backend se reinicia en bucle | `docker compose logs backend`: casi siempre falta una variable en `.env` |
| Cambié el código y no se ve | `docker compose up --build -d` |
| Después de actualizar el repo el backend no arranca y el log menciona *data loss* | Cambió la estructura de la base: `docker compose down -v` y luego los pasos 4 y 5 (se borran los datos de prueba) |
| pgAdmin no conecta en el puerto 5433 | Verificá que `docker compose ps` muestre `127.0.0.1:5433->5432` en el servicio `db` |

### Desarrollo sin Docker (opcional)

Requisitos: Node 22+ y PostgreSQL 16 instalados.

```bash
# Backend
cd backend
cp .env.example .env                       # ajustar DATABASE_URL y secretos
npm install
npx prisma migrate dev --name init         # crea las tablas y la carpeta prisma/migrations (subirla al repo)
npm run seed
npm run start:dev                          # http://localhost:3000/api

# Frontend (otra terminal)
cd frontend
npm install
npm run dev                                # http://localhost:5173
```

## Publicar en internet (gratis)

Guía paso a paso con Vercel (o Netlify) + Neon + Brevo: **[docs/DESPLIEGUE.md](docs/DESPLIEGUE.md)**.

## Seguridad

Ver [SECURITY.md](SECURITY.md) para el detalle. Resumen:

- Contraseñas con **Argon2id + pepper**, política de complejidad y bloqueo tras 5 intentos fallidos.
- **Correo, teléfono, legajo y comprobantes cifrados con AES-256-GCM** en la base (búsqueda por índices ciegos HMAC).
- Registro e ingreso solo con correos institucionales `@alu.frt.utn.edu.ar` / `@doc.frt.edu.ar`.
- **JWT de acceso de 15 min en memoria** + **refresh token rotativo en cookie httpOnly / Secure / SameSite=Strict** con detección de reutilización.
- Validación estricta de entradas (`whitelist` + `forbidNonWhitelisted`), Prisma (consultas parametrizadas → sin SQL injection).
- Rate limiting global y por ruta sensible, Helmet, CSP, CORS restringido.
- Subida de archivos con límite de tamaño, lista blanca de tipos y verificación de *magic bytes*; se guardan cifrados y solo los ve la administración.
- Autorización por rol y por propiedad del recurso en cada operación; auditoría de acciones sensibles.
- CI con `npm audit` y Dependabot.

## Próximos pasos sugeridos

- Pagos con **Mercado Pago** (checkout + comisión opcional para la facultad).
- Notificaciones por correo / push al recibir o confirmar una solicitud.
- Calendario de disponibilidad del tutor y videollamada integrada para clases virtuales.
- Login con la cuenta institucional (SSO / Google Workspace de la facultad) si la FRT lo habilita.
- Tests unitarios y e2e (Jest + Supertest, Playwright).

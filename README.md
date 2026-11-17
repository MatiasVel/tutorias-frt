# Tutorías FRT 🎓

Plataforma web para que estudiantes (y docentes) de la **UTN – Facultad Regional Tucumán** den clases particulares de materias que ya aprobaron a quienes las están cursando.

- Los estudiantes avanzados generan ingresos.
- Los ingresantes consiguen ayuda de alguien que ya pasó por la misma materia y cátedra.
- **Puntuación bidireccional**: el alumno puntúa a quien le dio la clase y viceversa.

## Funcionalidades

| Módulo | Qué hace |
|---|---|
| Registro / ingreso | Solo correos institucionales, verificación por email, recuperación de contraseña |
| Buscar clases | Filtros por carrera, materia, modalidad, texto; orden por puntuación o precio |
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

**Modelo de datos principal:** `User` · `Career` · `Subject` (N:M con carreras) · `Offering` (tutor + materia) · `Booking` (clase) · `Review` (bidireccional) · `RefreshToken` · `EmailToken` · `AuditLog`.

Flujo de una clase:

```
PENDING ──aceptar──▶ CONFIRMED ──dictada──▶ COMPLETED ──▶ ambos pueden puntuar (30 días)
   │                     │
   └─rechazar─▶ REJECTED └─cancelar (antes de empezar)─▶ CANCELLED
```

## Puesta en marcha

### Opción A — Docker (recomendada)

```bash
cp .env.example .env          # completar claves (JWT_ACCESS_SECRET, POSTGRES_PASSWORD, etc.)
docker compose up --build -d
docker compose exec backend npm run seed   # carreras, materias y usuario admin
```

Abrir http://localhost:8080

### Opción B — Desarrollo local

Requisitos: Node 22+, PostgreSQL 16.

```bash
# Backend
cd backend
cp .env.example .env                       # ajustar DATABASE_URL y secretos
npm install
npx prisma migrate dev --name init         # crea tablas y la carpeta prisma/migrations (commitearla)
npm run seed
npm run start:dev                          # http://localhost:3000/api

# Frontend (otra terminal)
cd frontend
npm install
npm run dev                                # http://localhost:5173
```

Sin SMTP configurado, los enlaces de verificación de correo se imprimen en la consola del backend.

## Seguridad

Ver [SECURITY.md](SECURITY.md) para el detalle. Resumen:

- Contraseñas con **Argon2id**, política de complejidad y bloqueo tras 5 intentos fallidos.
- **JWT de acceso de 15 min en memoria** + **refresh token rotativo en cookie httpOnly / Secure / SameSite=Strict** con detección de reutilización.
- Validación estricta de entradas (`whitelist` + `forbidNonWhitelisted`), Prisma (consultas parametrizadas → sin SQL injection).
- Rate limiting global y por ruta sensible, Helmet, CSP, CORS restringido.
- Subida de archivos con límite de tamaño, lista blanca de tipos y verificación de *magic bytes*; los archivos no son públicos.
- Autorización por rol y por propiedad del recurso en cada operación; auditoría de acciones sensibles.
- CI con `npm audit` y Dependabot.

## Próximos pasos sugeridos

- Pagos con **Mercado Pago** (checkout + comisión opcional para la facultad).
- Notificaciones por correo / push al recibir o confirmar una solicitud.
- Calendario de disponibilidad del tutor y videollamada integrada para clases virtuales.
- Login con la cuenta institucional (SSO / Google Workspace de la facultad) si la FRT lo habilita.
- Tests unitarios y e2e (Jest + Supertest, Playwright).

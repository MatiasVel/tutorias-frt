# Publicar Tutorías FRT gratis (Vercel + Neon + Brevo)

```
 Usuario ──HTTPS──▶ Frontend (Vercel o Netlify) ──/api (proxy)──▶ Backend NestJS (Vercel) ──TLS──▶ PostgreSQL (Neon)
                                                                        │
                                                                        └──▶ Brevo (correos de verificación)
```

| Servicio | Para qué | Plan gratuito |
|---|---|---|
| **Vercel** | Frontend React y backend NestJS (como función serverless) | Hobby (uso personal / no comercial) |
| **Neon** | Base de datos PostgreSQL | 1 GB por proyecto, se apaga sola cuando no hay uso |
| **Brevo** | Envío de correos | 300 correos por día |
| Netlify (opcional) | Alternativa a Vercel para el frontend | Free |

> El navegador solo habla con el dominio del frontend: las llamadas a `/api` se reenvían al backend.
> Así las cookies de sesión (httpOnly, Secure, SameSite=Strict) funcionan sin abrir CORS.

---

## Paso 1 — Generar los secretos (una sola vez)

En **PowerShell**, ejecutá cada línea y guardá el resultado en un gestor de contraseñas (Bitwarden, KeePass, etc.):

```powershell
# JWT_ACCESS_SECRET (128 caracteres hex)
$b = New-Object byte[] 64; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | % { $_.ToString('x2') })

# PASSWORD_PEPPER (64 caracteres hex)
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | % { $_.ToString('x2') })

# DATA_ENCRYPTION_KEY (32 bytes en base64)
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

> ⚠️ **`DATA_ENCRYPTION_KEY` y `PASSWORD_PEPPER` no se pueden cambiar ni perder** una vez que haya usuarios:
> sin ellas no se pueden descifrar los datos ni validar las contraseñas. Usá **los mismos valores** en tu PC (paso 3) y en Vercel (paso 5).

## Paso 2 — Base de datos en Neon

1. Entrá a <https://neon.com> → **Sign up** (podés usar tu cuenta de GitHub).
2. **Create project** → nombre `tutorias-frt`, Postgres 16 o superior, región más cercana (São Paulo si está disponible).
3. En el panel del proyecto → **Connect**. Copiá dos cadenas de conexión:
   - **Pooled connection** (el host contiene `-pooler`) → será `DATABASE_URL`
   - **Direct connection** (desactivá *Connection pooling*) → será `DIRECT_URL`

   Ambas terminan en `?sslmode=require` (la conexión va cifrada).

## Paso 3 — Crear las tablas y cargar los planes de estudio (desde tu PC)

1. En la carpeta `backend`, creá el archivo `.env` (copiando `.env.example`) y completá:
   `DATABASE_URL`, `DIRECT_URL` (de Neon), `JWT_ACCESS_SECRET`, `PASSWORD_PEPPER`, `DATA_ENCRYPTION_KEY` (del paso 1),
   `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` (tu cuenta de administración).
2. Con Docker Desktop abierto, desde PowerShell en la carpeta `backend`:

   ```powershell
   docker run --rm -v "${PWD}:/app" -w /app node:22-alpine sh -c "npm install && npx prisma db push && npm run seed"
   ```

   Debe terminar con `Seed completado`. (Si tenés Node 22 instalado: `npm install`, `npx prisma db push`, `npm run seed`.)
3. Podés ver las tablas desde el panel de Neon (**Tables**) o conectando pgAdmin con la *Direct connection*.

## Paso 4 — Correo con Brevo

1. Creá una cuenta en <https://www.brevo.com> (plan Free). Brevo puede tardar unas horas en habilitar los envíos de una cuenta nueva.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**: cargá el correo que va a figurar como remitente
   (por ejemplo una cuenta de Gmail creada para el proyecto) y confirmalo desde ese buzón.
3. **SMTP & API → API Keys → Generate a new API key**. Copiala: será `BREVO_API_KEY`.

> Recomendaciones de entrega: lo ideal es un remitente con dominio propio verificado en Brevo (registros SPF/DKIM).
> Con un correo de Gmail funciona, pero algunos mensajes pueden caer en **spam**: avisá a los usuarios que revisen esa carpeta.
> Si a alguien no le llega, la cuenta de administración puede **verificar el correo manualmente** desde *Administración → Usuarios*.
>
> Alternativa sin Brevo: Gmail con verificación en dos pasos + "contraseña de aplicación"
> (`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=tu cuenta`, `SMTP_PASS=contraseña de aplicación`; límite aprox. 500 correos/día).

## Paso 5 — Backend en Vercel

1. Entrá a <https://vercel.com> con tu cuenta de GitHub → **Add New… → Project** → importá `tutorias-frt`.
2. **Root Directory**: `backend`. Vercel detecta **NestJS** automáticamente (no hace falta comando de build).
3. **Environment Variables** — cargá:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | Pooled connection de Neon |
   | `DIRECT_URL` | Direct connection de Neon |
   | `JWT_ACCESS_SECRET` | del paso 1 |
   | `PASSWORD_PEPPER` | del paso 1 (**el mismo** del paso 3) |
   | `DATA_ENCRYPTION_KEY` | del paso 1 (**la misma** del paso 3) |
   | `ALLOWED_EMAIL_DOMAINS` | `alu.frt.utn.edu.ar,doc.frt.edu.ar` |
   | `PROFESSOR_EMAIL_DOMAINS` | `doc.frt.edu.ar` |
   | `BREVO_API_KEY` | del paso 4 |
   | `MAIL_FROM_NAME` | `Tutorías FRT` |
   | `MAIL_FROM_EMAIL` | el remitente verificado en Brevo |
   | `FRONTEND_URL` | por ahora `https://localhost` (se corrige en el paso 7) |
   | `MAX_UPLOAD_MB` | `3` |

4. **Deploy**. Al terminar, abrí `https://TU-BACKEND.vercel.app/api/health`: debe responder `{"status":"ok"}`.

## Paso 6 — Conectar el frontend con el backend

Editá **`frontend/vercel.json`** (o `frontend/netlify.toml` si usás Netlify) y reemplazá
`REEMPLAZAR-CON-TU-BACKEND.vercel.app` por el dominio real del backend. Guardá, hacé commit y push:

```powershell
git add frontend/vercel.json frontend/netlify.toml
git commit -m "Configurar URL del backend"
git push
```

## Paso 7 — Frontend en Vercel (o Netlify)

**Vercel:** **Add New… → Project** → importá otra vez `tutorias-frt` → **Root Directory**: `frontend` → **Deploy**.

**Netlify (alternativa):** **Add new site → Import from Git** → `tutorias-frt` → **Base directory**: `frontend`
(el resto lo toma de `netlify.toml`) → **Deploy**.

Copiá la URL pública del frontend (por ejemplo `https://tutorias-frt.vercel.app`) y en el proyecto del **backend** →
**Settings → Environment Variables** cambiá `FRONTEND_URL` por esa URL → **Deployments → Redeploy**.
(Se usa para armar los enlaces de los correos.)

## Paso 8 — Probar en producción

1. Abrí la URL del frontend → **Crear cuenta** con un correo `@alu.frt.utn.edu.ar`.
2. Llega el correo "Confirmá tu cuenta" (revisá spam) → clic en **Confirmar mi correo**.
3. **Ingresar**. Si el correo no llegó, en la pantalla de ingreso aparece **Reenviar correo de verificación**.
4. Ingresá con la cuenta de administración del paso 3 para aprobar publicaciones.

---

## Límites y advertencias de los planes gratuitos

- **Vercel Hobby es para uso personal y no comercial.** Para una prueba piloto está bien; si la facultad lo adopta
  oficialmente o se cobran comisiones, conviene pasar a Vercel Pro o a un servidor institucional (el proyecto también corre con `docker compose`).
- **Neon** apaga la base tras 5 minutos sin uso: la primera petición después de eso tarda un poco más.
- **Rate limit:** en serverless el contador de intentos vive en memoria de cada instancia. El bloqueo de cuenta por
  5 contraseñas incorrectas sí es global (se guarda en la base). Para más tráfico: usar Redis (Upstash, plan gratuito).
- **Comprobantes:** máximo 3 MB por archivo (Vercel limita el tamaño de las peticiones a 4,5 MB). Se guardan cifrados en Neon.
- **No aceptes** el pull request de Dependabot que sube **Prisma a la versión 7**: cambia la configuración y rompe el build
  (falló en CI). Las actualizaciones menores sí se pueden aceptar si el CI pasa.

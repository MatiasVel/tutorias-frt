# Seguridad — Tutorías FRT

## Cómo se guardan los datos

| Dato | Cómo se guarda | Qué ve alguien que roba una copia de la base |
|---|---|---|
| **Contraseña** | Hash **Argon2id** (19 MB de memoria, sal aleatoria por usuario) + **pepper** secreto fuera de la base | Un hash irreversible. Sin el pepper no puede ni intentar adivinarla |
| **Correo** | Cifrado **AES-256-GCM** + índice ciego **HMAC-SHA256** para el login | Texto ilegible. El índice no permite recuperar el correo |
| **Teléfono** | Cifrado AES-256-GCM | Texto ilegible |
| **Legajo** | Cifrado AES-256-GCM + índice ciego (para que sea único) | Texto ilegible |
| **Comprobante académico** (analítico) | Archivo cifrado AES-256-GCM dentro de la base. Solo un ADMIN lo descarga y queda registrado en la auditoría | Bytes ilegibles |
| Tokens de sesión, verificación y reseteo | Solo el **SHA-256** del token | Hashes inútiles para entrar |
| Nombre, apellido, carrera, bio, puntuaciones | En claro: son datos que se muestran en el perfil público dentro de la plataforma | Datos que ya son visibles para la comunidad |

**Claves** (`DATA_ENCRYPTION_KEY`, `PASSWORD_PEPPER`, `JWT_ACCESS_SECRET`): viven solo en las variables de entorno del
servidor (Vercel), nunca en la base ni en GitHub. De la clave maestra se derivan con **HKDF** una clave de cifrado y otra
para los índices ciegos. AES-GCM además **detecta cualquier alteración** del dato cifrado.

**En tránsito:** HTTPS con HSTS entre el navegador y Vercel; TLS (`sslmode=require`) entre el backend y Neon.
**En reposo:** además del cifrado por campo, Neon cifra sus discos.

> Ningún sistema es "invulnerable". El objetivo es la **defensa en profundidad**: que una sola falla
> (por ejemplo, una copia filtrada de la base) no alcance para exponer contraseñas ni datos personales.
> El punto más sensible pasa a ser el acceso a las cuentas de Vercel/Neon/GitHub: activá la **verificación en dos pasos** en todas.

## Controles implementados (OWASP Top 10 – 2021)

| Riesgo OWASP | Control en la plataforma |
|---|---|
| A01 Control de acceso roto | Todas las rutas son privadas por defecto (`JwtAuthGuard` global, `@Public()` explícito). `RolesGuard` para administración. Cada servicio verifica propiedad del recurso. Comprobantes solo para ADMIN, con auditoría de cada descarga. |
| A02 Fallas criptográficas | Argon2id + pepper, AES-256-GCM por campo, HMAC para búsquedas, tokens aleatorios de 384 bits guardados como SHA-256, HSTS, cookies `Secure`. |
| A03 Inyección | Prisma (consultas parametrizadas). `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`. React escapa todo el contenido (sin `dangerouslySetInnerHTML`). |
| A04 Diseño inseguro | Reglas de negocio en el servidor: reseñas solo sobre clases finalizadas, una por persona, ventana de 30 días; límite de solicitudes pendientes; control de superposición en transacción serializable. |
| A05 Configuración insegura | Helmet + CSP estricta en API y frontend, `X-Frame-Options: DENY`, el servidor no arranca si faltan secretos o son cortos, base sin puerto público en producción. |
| A06 Componentes vulnerables | `npm audit` en CI y Dependabot semanal. |
| A07 Fallas de autenticación | Solo correos `@alu.frt.utn.edu.ar` / `@doc.frt.edu.ar` (registro **e** ingreso), verificación de email obligatoria, bloqueo de 15 min tras 5 intentos, rate limit por IP y por correo, respuestas genéricas (no revelan si una cuenta existe), tiempo constante en login, refresh token rotativo con revocación de toda la familia si se reutiliza, reseteo de contraseña cierra todas las sesiones. |
| A08 Integridad de datos | Subida de archivos: tipos permitidos, máximo 3 MB, verificación de la firma real del archivo, cifrado autenticado. |
| A09 Registro y monitoreo | `AuditLog`: logins, fallos, reutilización de tokens, cambios de contraseña, verificación manual, vistas de comprobantes y acciones de administración. |
| A10 SSRF | El backend no hace peticiones a URLs provistas por usuarios. |

## Datos personales (Ley 25.326)

- Se recolecta lo mínimo: nombre, correo institucional, legajo y teléfono opcionales.
- El correo y teléfono solo se comparten con la contraparte de una clase **confirmada**.
- Los comprobantes académicos son privados, cifrados y solo accesibles por la administración.

## Checklist antes de producción

- [ ] Secretos generados al azar (ver `docs/DESPLIEGUE.md`, paso 1) y guardados en un gestor de contraseñas.
- [ ] Verificación en dos pasos en GitHub, Vercel, Neon y Brevo.
- [ ] Confirmar con la FRT los dominios de correo (`ALLOWED_EMAIL_DOMAINS`).
- [ ] Cambiar la contraseña del admin creado por el seed.
- [ ] Backups: Neon guarda historial (restauración puntual) según el plan; exportar periódicamente con `pg_dump`.
- [ ] GitHub: *branch protection* en `main`, *secret scanning* y *Dependabot alerts* activados.

## Reportar una vulnerabilidad

Escribir a la administración del proyecto (no abrir un issue público).

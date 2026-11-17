# Seguridad — Tutorías FRT

Controles implementados, mapeados al **OWASP Top 10 (2021)**.

| Riesgo OWASP | Control en la plataforma |
|---|---|
| A01 Control de acceso roto | Todas las rutas son privadas por defecto (`JwtAuthGuard` global, `@Public()` explícito). `RolesGuard` para administración. Cada servicio verifica propiedad (solo el tutor confirma/finaliza, solo participantes cancelan o puntúan). Los comprobantes solo los descarga un ADMIN. |
| A02 Fallas criptográficas | Argon2id para contraseñas. Tokens aleatorios de 384 bits; en la base solo se guarda su SHA-256. HSTS y cookies `Secure` en producción. |
| A03 Inyección | Prisma (consultas parametrizadas). `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`. React escapa todo el contenido renderizado (sin `dangerouslySetInnerHTML`). |
| A04 Diseño inseguro | Reglas de negocio en el servidor: reseñas solo sobre clases finalizadas, una por persona, ventana de 30 días; límite de solicitudes pendientes; control de superposición en transacción serializable. |
| A05 Configuración insegura | Helmet + CSP estricta en API y nginx, `X-Frame-Options: DENY`, sin `x-powered-by`, base de datos sin puerto expuesto, contenedor del backend con usuario sin privilegios. |
| A06 Componentes vulnerables | `npm audit` en CI y Dependabot semanal. |
| A07 Fallas de autenticación | Solo correos institucionales, verificación de email obligatoria, bloqueo temporal tras 5 intentos, respuestas genéricas (no revelan si una cuenta existe), tiempo constante en login, rate limit (5 intentos/min). Refresh token rotativo con revocación de toda la familia si se reutiliza. Reset de contraseña cierra todas las sesiones. |
| A08 Integridad de datos | Subida de archivos: tipos permitidos, tamaño máximo, verificación de firma real del archivo, nombre aleatorio generado por el servidor, protección contra path traversal. |
| A09 Registro y monitoreo | `AuditLog` de logins, fallos, reutilización de tokens, cambios de contraseña y acciones de administración. |
| A10 SSRF | El backend no realiza peticiones a URLs provistas por usuarios. |

## Datos personales (Ley 25.326)

- Se recolecta lo mínimo: nombre, correo institucional, legajo y teléfono opcionales.
- El correo y teléfono solo se comparten con la contraparte de una clase **confirmada**.
- Los comprobantes académicos son privados y solo accesibles por la administración.

## Checklist antes de producción

- [ ] Generar `JWT_ACCESS_SECRET` aleatorio (64 bytes) y claves de base fuertes.
- [ ] Servir todo por **HTTPS** (certificado Let's Encrypt o el de la facultad) y `NODE_ENV=production`.
- [ ] Confirmar con la FRT los dominios de correo institucional (`ALLOWED_EMAIL_DOMAINS`).
- [ ] Configurar SMTP real y SPF/DKIM del dominio emisor.
- [ ] Cambiar la contraseña del admin creado por el seed.
- [ ] Backups automáticos de PostgreSQL y del volumen `uploads`.
- [ ] Activar en GitHub: *branch protection* en `main`, *secret scanning* y *Dependabot alerts*.

## Reportar una vulnerabilidad

Escribir a la administración del proyecto (no abrir un issue público).

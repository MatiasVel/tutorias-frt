# Base de datos — Tutorías FRT

PostgreSQL 16, gestionada con Prisma (`backend/prisma/schema.prisma` es la fuente de verdad).

## Diagrama entidad-relación

```mermaid
erDiagram
    Career ||--o{ StudyPlan : "tiene"
    StudyPlan ||--o{ Subject : "incluye"
    Subject ||--o{ SubjectPrerequisite : "requiere"
    Subject ||--o{ SubjectPrerequisite : "es requisito de"
    Career |o--o{ User : "cursa"
    StudyPlan |o--o{ User : "cursa con"
    User ||--o{ Offering : "ofrece (tutor)"
    Subject ||--o{ Offering : "se ofrece en"
    Offering ||--o{ Booking : "recibe"
    User ||--o{ Booking : "reserva (alumno)"
    Booking ||--o{ Review : "se puntúa en"
    User ||--o{ Review : "escribe"
    User ||--o{ Review : "recibe"
    User ||--o{ RefreshToken : "sesiones"
    User ||--o{ EmailToken : "verificación / reset"
    User |o--o{ AuditLog : "acciones"

    Career {
        int id PK
        string code UK "ISI"
        string name
    }
    StudyPlan {
        int id PK
        int careerId FK
        int year "2008 / 2023"
        bool isCurrent
    }
    Subject {
        int id PK
        string code UK "ISI-2023-19"
        int planCode "nro en el plan"
        string name
        int year "nivel"
        bool isElective
        enum term "ANUAL / 1C / 2C"
        int weeklyHours
        int planId FK
    }
    SubjectPrerequisite {
        int subjectId PK, FK
        int requiredId PK, FK
        enum type PK "REGULAR_PARA_CURSAR / APROBADA_PARA_CURSAR / APROBADA_PARA_RENDIR"
    }
    User {
        uuid id PK
        string email UK
        string passwordHash "argon2id"
        enum role "STUDENT / PROFESSOR / ADMIN"
        timestamp emailVerifiedAt "null = sin verificar"
        float tutorRatingAvg
        float studentRatingAvg
    }
    Offering {
        uuid id PK
        uuid tutorId FK
        int subjectId FK
        decimal pricePerHour
        enum status "PENDING_REVIEW / APPROVED / REJECTED / PAUSED"
    }
    Booking {
        uuid id PK
        uuid offeringId FK
        uuid studentId FK
        timestamp scheduledAt
        enum status "PENDING / CONFIRMED / COMPLETED / ..."
    }
    Review {
        uuid id PK
        uuid bookingId FK
        uuid authorId FK
        uuid targetId FK
        enum direction "STUDENT_TO_TUTOR / TUTOR_TO_STUDENT"
        int rating "1 a 5"
    }
```

Los planes de estudio cargados por el seed (`backend/prisma/data/planes-isi.js`) son:

| Plan | Materias | Obligatorias | Electivas | Correlativas |
|---|---|---|---|---|
| ISI Plan 2023 (vigente) | 56 | 36 + Seminario Integrador (Analista) | 19 | 119 |
| ISI Plan 2008 (Res. 775/2008, act. 2017) | 59 | 35 | 24 | 419 |

## Conectarse con pgAdmin (o DBeaver)

La base corre dentro de Docker y está publicada **solo en tu PC** en el puerto **5433**
(el 5432 lo usa el PostgreSQL que tengas instalado localmente).

1. Abrí **pgAdmin** → clic derecho en *Servers* → **Register → Server…**
2. Pestaña **General** → Name: `Tutorías FRT (Docker)`
3. Pestaña **Connection**:

   | Campo | Valor |
   |---|---|
   | Host name/address | `localhost` |
   | Port | `5433` |
   | Maintenance database | `tutorias_frt` |
   | Username | `tutorias` (valor de `POSTGRES_USER` en `.env`) |
   | Password | el valor de `POSTGRES_PASSWORD` en `.env` |

4. **Save**. Navegá a *Tutorías FRT (Docker) → Databases → tutorias_frt → Schemas → public → Tables*.
5. Para consultar: clic derecho en `tutorias_frt` → **Query Tool** y pegá las consultas de abajo (F5 ejecuta).

> ⚠️ Prisma crea las tablas con mayúsculas (`User`, `Booking`…). En SQL hay que escribirlas **entre comillas dobles**:
> `SELECT * FROM "User";` — sin comillas PostgreSQL busca `user` y falla.

Desde la terminal también podés entrar sin pgAdmin:

```powershell
docker compose exec db psql -U tutorias -d tutorias_frt
```

## Consultas útiles

### Usuarios registrados y si confirmaron el correo

```sql
SELECT u."email",
       u."firstName" || ' ' || u."lastName"        AS nombre,
       u."role",
       c."code"                                     AS carrera,
       sp."year"                                    AS plan,
       CASE WHEN u."emailVerifiedAt" IS NULL THEN 'NO' ELSE 'SÍ' END AS verificado,
       u."isActive"                                 AS activo,
       u."createdAt"                                AS registrado
FROM "User" u
LEFT JOIN "Career"    c  ON c."id"  = u."careerId"
LEFT JOIN "StudyPlan" sp ON sp."id" = u."studyPlanId"
ORDER BY u."createdAt" DESC;
```

La contraseña **no** se ve: solo el hash Argon2id en `passwordHash` (así debe ser).

### Actividad de login (auditoría)

```sql
SELECT a."createdAt", u."email", a."action", a."ip"
FROM "AuditLog" a
LEFT JOIN "User" u ON u."id" = a."userId"
ORDER BY a."createdAt" DESC
LIMIT 50;
```

### Materias de un plan por nivel

```sql
SELECT s."year" AS nivel, s."planCode" AS nro, s."name", s."term", s."weeklyHours" AS hs, s."isElective" AS electiva
FROM "Subject" s
JOIN "StudyPlan" sp ON sp."id" = s."planId"
WHERE sp."year" = 2023
ORDER BY s."year", s."isElective", s."planCode", s."name";
```

### Correlativas de una materia

```sql
SELECT req."planCode" AS nro, req."name" AS necesita, p."type" AS condicion
FROM "SubjectPrerequisite" p
JOIN "Subject" s   ON s."id"   = p."subjectId"
JOIN "Subject" req ON req."id" = p."requiredId"
WHERE s."code" = 'ISI-2023-19'          -- Bases de Datos, Plan 2023
ORDER BY p."type", req."planCode";
```

### ¿Para qué materias es requisito "Algoritmos y Estructuras de Datos" (Plan 2023)?

```sql
SELECT s."planCode" AS nro, s."name" AS habilita, p."type"
FROM "SubjectPrerequisite" p
JOIN "Subject" s ON s."id" = p."subjectId"
WHERE p."requiredId" = (SELECT "id" FROM "Subject" WHERE "code" = 'ISI-2023-06')
ORDER BY s."planCode";
```

### Ofertas publicadas, reservas y puntuaciones

```sql
-- Ofertas por estado
SELECT o."status", count(*) FROM "Offering" o GROUP BY o."status";

-- Ranking de tutores
SELECT u."firstName" || ' ' || u."lastName" AS tutor, u."tutorRatingAvg", u."tutorRatingCount"
FROM "User" u
WHERE u."tutorRatingCount" > 0
ORDER BY u."tutorRatingAvg" DESC, u."tutorRatingCount" DESC;

-- Materias con más clases dictadas (demanda)
SELECT s."name", sp."year" AS plan, count(*) AS clases
FROM "Booking" b
JOIN "Offering"  o  ON o."id"  = b."offeringId"
JOIN "Subject"   s  ON s."id"  = o."subjectId"
JOIN "StudyPlan" sp ON sp."id" = s."planId"
WHERE b."status" = 'COMPLETED'
GROUP BY s."name", sp."year"
ORDER BY clases DESC;
```

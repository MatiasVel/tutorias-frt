import { Prisma } from '@prisma/client';

/**
 * Campos de un usuario que se pueden mostrar a otros usuarios.
 * Nunca incluir passwordHash, email, teléfono ni datos de seguridad.
 */
export const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  bio: true,
  role: true,
  tutorRatingAvg: true,
  tutorRatingCount: true,
  studentRatingAvg: true,
  studentRatingCount: true,
  career: { select: { id: true, name: true } },
  studyPlan: { select: { id: true, year: true } },
} satisfies Prisma.UserSelect;

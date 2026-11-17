import * as argon2 from 'argon2';

/**
 * Contraseñas: Argon2id (recomendación OWASP) + "pepper".
 * - Argon2id es lento y usa memoria a propósito: probar millones de contraseñas es carísimo.
 * - Cada hash lleva su propia sal aleatoria: dos usuarios con la misma clave tienen hashes distintos.
 * - El pepper (PASSWORD_PEPPER) es un secreto que está en el servidor y NO en la base:
 *   con solo una copia de la base no se puede ni empezar a adivinar contraseñas.
 *
 * IMPORTANTE: prisma/seed.js usa los mismos parámetros; si se cambian aquí, cambiarlos allá.
 */
const OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

function pepper(): Buffer | undefined {
  const p = process.env.PASSWORD_PEPPER;
  return p ? Buffer.from(p, 'utf8') : undefined;
}

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { ...OPTIONS, secret: pepper() });
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password, { secret: pepper() }).catch(() => false);
}

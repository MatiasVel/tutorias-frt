import { createHash, randomBytes } from 'crypto';

/** Token aleatorio criptográficamente seguro (se envía al cliente). */
export function generateToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

/** En la base solo se guarda el SHA-256 del token: si se filtra la DB, los tokens no sirven. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Cifrado de datos personales a nivel de campo (AES-256-GCM).
 *
 * - Correo, teléfono, legajo y comprobantes académicos se guardan CIFRADOS en la base.
 *   Si alguien obtiene una copia de la base, ve solo texto ilegible.
 * - La clave maestra (DATA_ENCRYPTION_KEY) vive en las variables de entorno del servidor,
 *   nunca en la base ni en el repositorio.
 * - De la clave maestra se derivan (HKDF) dos claves independientes:
 *     · una para cifrar (AES-256-GCM: confidencialidad + detección de alteraciones)
 *     · otra para "índices ciegos" (HMAC-SHA256), que permiten buscar por igualdad
 *       (login por correo, legajo único) sin guardar el dato en claro.
 *
 * IMPORTANTE: prisma/seed.js replica estas funciones; si se cambian aquí, cambiarlas allá.
 */
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'crypto';

const VERSION = 'v1';
let keys: { enc: Buffer; mac: Buffer } | null = null;

function getKeys() {
  if (keys) return keys;
  const raw = process.env.DATA_ENCRYPTION_KEY ?? '';
  const master = Buffer.from(raw, 'base64');
  if (master.length !== 32) {
    throw new Error(
      'DATA_ENCRYPTION_KEY debe ser una clave de 32 bytes en base64. Generala con: ' +
        `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  const derive = (info: string) =>
    Buffer.from(hkdfSync('sha256', master, Buffer.alloc(0), `tutorias-frt:${info}`, 32));
  keys = { enc: derive('enc'), mac: derive('mac') };
  return keys;
}

/** Valida la clave al arrancar el servidor (falla rápido si falta). */
export function assertEncryptionKey() {
  getKeys();
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKeys().enc, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ct.toString('base64url')].join('.');
}

export function encryptOptional(plain?: string | null): string | null {
  return plain ? encrypt(plain) : null;
}

export function decrypt(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const [version, iv, tag, ct] = payload.split('.');
  if (version !== VERSION || !iv || !tag || ct === undefined) throw new Error('Formato de dato cifrado inválido');
  const decipher = createDecipheriv('aes-256-gcm', getKeys().enc, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]).toString('utf8');
}

/** Archivos: [iv(12) | tag(16) | contenido cifrado] */
export function encryptBuffer(data: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKeys().enc, iv);
  const ct = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]);
}

export function decryptBuffer(data: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-gcm', getKeys().enc, data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]);
}

/** Índice ciego: mismo valor -> mismo hash, pero irreversible sin la clave. */
export function blindIndex(value: string): string {
  return createHmac('sha256', getKeys().mac).update(value.trim().toLowerCase()).digest('hex');
}

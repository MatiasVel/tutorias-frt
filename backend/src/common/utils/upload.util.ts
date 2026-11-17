import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync, promises as fs } from 'fs';
import { diskStorage } from 'multer';
import { join, resolve } from 'path';

export const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR ?? './uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
};

/** Configuración de multer: nombre aleatorio (nunca el del usuario), tamaño y tipo limitados. */
export const proofUploadOptions = {
  storage: diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${ALLOWED[file.mimetype] ?? '.bin'}`),
  }),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB ?? 5) * 1024 * 1024, files: 1 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, accept: boolean) => void,
  ) => {
    if (!ALLOWED[file.mimetype]) {
      return cb(new BadRequestException('Solo se aceptan archivos PDF, PNG o JPG'), false);
    }
    cb(null, true);
  },
};

/**
 * El mimetype lo declara el cliente y se puede falsificar:
 * se verifica la "firma" real del archivo (magic bytes).
 */
export async function assertRealFileType(file: Express.Multer.File) {
  const handle = await fs.open(file.path, 'r');
  const buf = Buffer.alloc(8);
  await handle.read(buf, 0, 8, 0);
  await handle.close();

  const isPdf = buf.subarray(0, 4).toString('latin1') === '%PDF';
  const isPng = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;

  const ok =
    (file.mimetype === 'application/pdf' && isPdf) ||
    (file.mimetype === 'image/png' && isPng) ||
    (file.mimetype === 'image/jpeg' && isJpg);

  if (!ok) {
    await fs.unlink(file.path).catch(() => undefined);
    throw new BadRequestException('El contenido del archivo no coincide con su tipo');
  }
}

export function proofPath(fileName: string) {
  // Evita path traversal: solo se usa el nombre generado por el servidor
  if (!/^[0-9a-f-]{36}\.(pdf|png|jpg)$/.test(fileName)) {
    throw new BadRequestException('Archivo inválido');
  }
  return join(UPLOAD_DIR, fileName);
}

export async function removeFile(path?: string) {
  if (path) await fs.unlink(path).catch(() => undefined);
}

import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const ALLOWED = new Set(['application/pdf', 'image/png', 'image/jpeg']);

/** Tamaño máximo (Vercel limita el cuerpo de las peticiones a 4,5 MB). */
export const MAX_UPLOAD_MB = Math.min(Number(process.env.MAX_UPLOAD_MB ?? 3), 4);

/**
 * El archivo queda en memoria (no se escribe en disco): se valida, se cifra y se guarda en la base.
 * Así funciona igual en un servidor propio que en entornos serverless (Vercel).
 */
export const proofUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, accept: boolean) => void,
  ) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(new BadRequestException('Solo se aceptan archivos PDF, PNG o JPG'), false);
    }
    cb(null, true);
  },
};

/**
 * El tipo (mimetype) lo declara el navegador y se puede falsificar:
 * se verifica la "firma" real del archivo (magic bytes).
 */
export function assertRealFileType(file: Express.Multer.File) {
  const buf = file.buffer;
  const isPdf = buf.subarray(0, 4).toString('latin1') === '%PDF';
  const isPng = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;

  const ok =
    (file.mimetype === 'application/pdf' && isPdf) ||
    (file.mimetype === 'image/png' && isPng) ||
    (file.mimetype === 'image/jpeg' && isJpg);

  if (!ok) throw new BadRequestException('El contenido del archivo no coincide con su tipo');
}

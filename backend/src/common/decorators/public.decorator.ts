import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Marca una ruta como accesible sin sesión. Todo lo demás requiere JWT. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

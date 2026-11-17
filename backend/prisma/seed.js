// Seed en JavaScript plano: corre en producción sin TypeScript.
const { PrismaClient, Role } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

// NOTA: carreras y materias de ejemplo. Ajustar al plan de estudios vigente de UTN FRT.
const careers = [
  { code: 'ISI', name: 'Ingeniería en Sistemas de Información' },
  { code: 'IC', name: 'Ingeniería Civil' },
  { code: 'IE', name: 'Ingeniería Eléctrica' },
  { code: 'IEL', name: 'Ingeniería Electrónica' },
  { code: 'IM', name: 'Ingeniería Mecánica' },
  { code: 'II', name: 'Ingeniería Industrial' },
];

// Materias del ciclo básico, compartidas por todas las ingenierías
const common = [
  { code: 'AM1', name: 'Análisis Matemático I', year: 1 },
  { code: 'AGA', name: 'Álgebra y Geometría Analítica', year: 1 },
  { code: 'FIS1', name: 'Física I', year: 1 },
  { code: 'QG', name: 'Química General', year: 1 },
  { code: 'IYS', name: 'Ingeniería y Sociedad', year: 1 },
  { code: 'AM2', name: 'Análisis Matemático II', year: 2 },
  { code: 'FIS2', name: 'Física II', year: 2 },
  { code: 'PYE', name: 'Probabilidad y Estadística', year: 2 },
];

const byCareer = {
  ISI: [
    { code: 'AED', name: 'Algoritmos y Estructuras de Datos', year: 1 },
    { code: 'MAD', name: 'Matemática Discreta', year: 1 },
    { code: 'ARQ', name: 'Arquitectura de Computadoras', year: 1 },
    { code: 'SYO', name: 'Sistemas y Organizaciones', year: 1 },
    { code: 'PDP', name: 'Paradigmas de Programación', year: 2 },
    { code: 'SSL', name: 'Sintaxis y Semántica de los Lenguajes', year: 2 },
    { code: 'ASI', name: 'Análisis de Sistemas', year: 2 },
    { code: 'SOP', name: 'Sistemas Operativos', year: 3 },
    { code: 'GDD', name: 'Gestión de Datos', year: 3 },
    { code: 'DSI', name: 'Diseño de Sistemas', year: 3 },
  ],
  IC: [
    { code: 'SRE', name: 'Sistemas de Representación', year: 1 },
    { code: 'EST', name: 'Estabilidad', year: 2 },
  ],
  IE: [{ code: 'ELT', name: 'Electrotecnia', year: 2 }],
  IEL: [{ code: 'TCI', name: 'Teoría de Circuitos I', year: 2 }],
  IM: [{ code: 'TER', name: 'Termodinámica', year: 3 }],
  II: [{ code: 'ECO', name: 'Economía', year: 3 }],
};

async function main() {
  for (const c of careers) {
    await prisma.career.upsert({ where: { code: c.code }, update: { name: c.name }, create: c });
  }
  const allCareers = await prisma.career.findMany();

  for (const s of common) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: { ...s, careers: { connect: allCareers.map((c) => ({ id: c.id })) } },
    });
  }
  for (const [careerCode, subjects] of Object.entries(byCareer)) {
    const career = allCareers.find((c) => c.code === careerCode);
    for (const s of subjects) {
      await prisma.subject.upsert({
        where: { code: s.code },
        update: {},
        create: { ...s, careers: { connect: [{ id: career.id }] } },
      });
    }
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: {
        email: email.toLowerCase(),
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
        firstName: 'Admin',
        lastName: 'FRT',
        role: Role.ADMIN,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Admin listo: ${email} (cambiá la contraseña después del primer ingreso)`);
  }
  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

// Seed en JavaScript plano: corre en producción sin TypeScript.
// Es idempotente: se puede ejecutar varias veces sin duplicar datos.
const { PrismaClient, Role } = require('@prisma/client');
const argon2 = require('argon2');
const isi = require('./data/planes-isi');

const prisma = new PrismaClient();

const TERM = {
  A: 'ANUAL',
  '1C': 'PRIMER_CUATRIMESTRE',
  '2C': 'SEGUNDO_CUATRIMESTRE',
  AC: 'AMBOS_CUATRIMESTRES',
};
const pad = (n) => String(n).padStart(2, '0');

async function seedPlan(careerId, careerCode, plan) {
  const studyPlan = await prisma.studyPlan.upsert({
    where: { careerId_year: { careerId, year: plan.year } },
    update: { name: plan.name, resolution: plan.resolution, isCurrent: plan.isCurrent },
    create: {
      careerId,
      year: plan.year,
      name: plan.name,
      resolution: plan.resolution,
      isCurrent: plan.isCurrent,
    },
  });

  // 1) Materias
  const byNumber = new Map(); // número en el plan -> id
  const created = []; // [definición, id]
  const electiveCounter = {};
  for (const s of plan.subjects) {
    let code = s.code;
    if (!code && s.n) code = `${careerCode}-${plan.year}-${pad(s.n)}`;
    if (!code) {
      electiveCounter[s.lvl] = (electiveCounter[s.lvl] ?? 0) + 1;
      code = `${careerCode}-${plan.year}-E${s.lvl}-${pad(electiveCounter[s.lvl])}`;
    }
    const data = {
      name: s.name,
      planCode: s.n ?? null,
      year: s.lvl,
      isElective: !!s.el,
      isIntegrating: !!s.int,
      weeklyHours: s.hs ?? null,
      term: s.term ? TERM[s.term] : null,
      planId: studyPlan.id,
    };
    const subject = await prisma.subject.upsert({
      where: { code },
      update: data,
      create: { ...data, code },
    });
    if (s.n) byNumber.set(s.n, subject.id);
    created.push([s, subject.id]);
  }

  // 2) Correlativas (se regeneran completas en cada ejecución)
  await prisma.subjectPrerequisite.deleteMany({ where: { subject: { planId: studyPlan.id } } });
  const rows = [];
  const add = (subjectId, numbers, type, def) => {
    if (!numbers) return;
    let list = numbers;
    if (numbers === 'ALL') {
      // "Todas": todas las materias obligatorias hasta su nivel
      list = plan.subjects.filter((x) => x.n && x.lvl <= def.lvl && x !== def).map((x) => x.n);
    }
    for (const n of list) {
      const requiredId = byNumber.get(n);
      if (!requiredId) throw new Error(`Plan ${plan.year}: "${def.name}" referencia la materia ${n}, que no existe`);
      rows.push({ subjectId, requiredId, type });
    }
  };
  for (const [def, id] of created) {
    add(id, def.reg, 'REGULAR_PARA_CURSAR', def);
    add(id, def.apr, 'APROBADA_PARA_CURSAR', def);
    add(id, def.rend, 'APROBADA_PARA_RENDIR', def);
  }
  await prisma.subjectPrerequisite.createMany({ data: rows, skipDuplicates: true });

  console.log(`  ${plan.name}: ${created.length} materias, ${rows.length} correlativas`);
}

async function main() {
  const career = await prisma.career.upsert({
    where: { code: isi.career.code },
    update: { name: isi.career.name },
    create: isi.career,
  });
  console.log(`Carrera: ${career.name}`);
  for (const plan of isi.plans) await seedPlan(career.id, isi.career.code, plan);

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

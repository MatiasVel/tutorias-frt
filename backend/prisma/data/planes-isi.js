// Planes de estudio de Ingeniería en Sistemas de Información - UTN FRT
// Fuente: documentos oficiales del Departamento de Sistemas
//   - "INGENIERIA EN SISTEMAS DE INFORMACION – PLAN 2023"
//   - "Plan de Correlativas - Anexo de modificación Res. 775/2008 - Plan 2008 (actualizado al año 2017)"
//
// Formato de cada materia:
//   n     número de la materia en el plan (null en electivas)
//   name  nombre
//   lvl   nivel (año)
//   term  A = anual | 1C / 2C = cuatrimestral | AC = se dicta en ambos cuatrimestres
//   hs    horas semanales
//   reg   correlativas REGULARES (cursadas) para cursar   -> números del plan
//   apr   correlativas APROBADAS para cursar
//   rend  correlativas APROBADAS para rendir ('ALL' = todas las materias obligatorias)
//   int   true si es materia integradora
//   el    true si es electiva

const plan2023 = {
  year: 2023,
  name: 'Ingeniería en Sistemas de Información - Plan 2023',
  resolution: null,
  isCurrent: true,
  // En el Plan 2023 las columnas son "para cursar y rendir": Cursadas / Aprobadas
  subjects: [
    // PRIMER NIVEL
    { n: 1, name: 'Análisis Matemático I', lvl: 1, term: 'A', hs: 5 },
    { n: 2, name: 'Álgebra y Geometría Analítica', lvl: 1, term: 'A', hs: 5 },
    { n: 3, name: 'Física I', lvl: 1, term: 'A', hs: 5 },
    { n: 4, name: 'Ingeniería y Sociedad', lvl: 1, term: 'A', hs: 2 },
    { n: 5, name: 'Lógica y Estructuras Discretas', lvl: 1, term: 'A', hs: 3 },
    { n: 6, name: 'Algoritmos y Estructuras de Datos', lvl: 1, term: 'A', hs: 5 },
    { n: 7, name: 'Arquitectura de Computadoras', lvl: 1, term: 'A', hs: 4 },
    { n: 8, name: 'Sistemas y Procesos de Negocios', lvl: 1, term: 'A', hs: 3, int: true },
    // SEGUNDO NIVEL
    { n: 9, name: 'Análisis Matemático II', lvl: 2, term: 'A', hs: 5, reg: [1, 2] },
    { n: 10, name: 'Física II', lvl: 2, term: 'A', hs: 5, reg: [1, 3] },
    { n: 11, name: 'Inglés I', lvl: 2, term: 'A', hs: 2 },
    { n: 12, name: 'Sintaxis y Semántica de los Lenguajes', lvl: 2, term: 'A', hs: 4, reg: [5, 6] },
    { n: 13, name: 'Paradigmas de Programación', lvl: 2, term: 'A', hs: 4, reg: [5, 6] },
    { n: 14, name: 'Sistemas Operativos', lvl: 2, term: 'A', hs: 4, reg: [7] },
    { n: 15, name: 'Análisis de Sistemas de Información', lvl: 2, term: 'A', hs: 6, reg: [6, 8], int: true },
    // TERCER NIVEL
    { n: 16, name: 'Inglés II', lvl: 3, term: 'A', hs: 2, reg: [11] },
    { n: 17, name: 'Probabilidad y Estadística', lvl: 3, term: '1C', hs: 6, reg: [1, 2] },
    { n: 18, name: 'Economía', lvl: 3, term: '1C', hs: 6, apr: [1, 2] },
    { n: 19, name: 'Bases de Datos', lvl: 3, term: '1C', hs: 8, reg: [12, 15], apr: [5, 6] },
    { n: 20, name: 'Desarrollo de Software', lvl: 3, term: 'A', hs: 4, reg: [13, 15], apr: [5, 6] },
    { n: 21, name: 'Comunicación de Datos', lvl: 3, term: 'A', hs: 4, apr: [3, 7] },
    { n: 22, name: 'Análisis Numérico', lvl: 3, term: '2C', hs: 6, reg: [9], apr: [1, 2] },
    { n: 23, name: 'Diseño de Sistemas de Información', lvl: 3, term: 'A', hs: 6, reg: [13, 15], apr: [11, 6, 8], int: true },
    // Seminario Integrador: materia del título intermedio "Analista Universitario de Sistemas"
    { n: null, code: 'ISI-2023-A24', name: 'Seminario Integrador (Analista Universitario de Sistemas)', lvl: 3, term: '1C', hs: 8, reg: [15], apr: [6, 8, 12, 13], rend: 'ALL' },
    // Electivas 3er nivel (4 hs cuatrimestrales)
    { el: true, name: 'Diseño UX para Productos Digitales', lvl: 3, term: '2C', hs: 4, reg: [8, 15] },
    { el: true, name: 'Fundamentos del Diseño UX/UI', lvl: 3, term: '2C', hs: 4, reg: [15] },
    { el: true, name: 'Seguridad Informática', lvl: 3, term: 'AC', hs: 4, reg: [15, 14], apr: [1, 2, 4, 5, 6, 7, 8] },
    { el: true, name: 'Gestión de Procesos de Negocio', lvl: 3, term: '1C', hs: 4, reg: [15, 13, 12], apr: [6, 8] },
    // CUARTO NIVEL
    { n: 24, name: 'Legislación', lvl: 4, term: '1C', hs: 4, reg: [4] },
    { n: 25, name: 'Ingeniería y Calidad de Software', lvl: 4, term: '2C', hs: 6, reg: [19, 20, 23], apr: [12, 13] },
    { n: 26, name: 'Redes de Datos', lvl: 4, term: '2C', hs: 8, reg: [14, 21] },
    { n: 27, name: 'Investigación Operativa', lvl: 4, term: '1C', hs: 8, reg: [17, 22] },
    { n: 28, name: 'Simulación', lvl: 4, term: '1C', hs: 6, reg: [17], apr: [9] },
    { n: 29, name: 'Tecnologías para la Automatización', lvl: 4, term: '2C', hs: 6, reg: [10, 22], apr: [9] },
    { n: 30, name: 'Administración de Sistemas de Información', lvl: 4, term: 'A', hs: 6, reg: [18, 23], apr: [15], int: true },
    // Electivas 4to nivel (6 hs cuatrimestrales)
    { el: true, name: 'Heurísticas y Auto Machine Learning', lvl: 4, term: '2C', hs: 4 },
    { el: true, name: 'Fundamentos de Ingeniería de Datos', lvl: 4, term: '2C', hs: 4 },
    { el: true, name: 'Auditoría en Sistemas de Información', lvl: 4, term: '1C', hs: 4 },
    { el: true, name: 'Computación en la Nube', lvl: 4, term: '2C', hs: 4 },
    { el: true, name: 'Programación de Aplicaciones Distribuidas', lvl: 4, term: '2C', hs: 4 },
    { el: true, name: 'Seguridad en Redes e Infraestructura', lvl: 4, term: '2C', hs: 4 },
    { el: true, name: 'Sistemas de Gestión de la Calidad', lvl: 4, term: '2C', hs: 4 },
    { el: true, name: 'Sistemas de Información Geográficos', lvl: 4, term: 'AC', hs: 4 },
    // QUINTO NIVEL
    { n: 31, name: 'Inteligencia Artificial', lvl: 5, term: '1C', hs: 6, reg: [28], apr: [17, 22] },
    { n: 32, name: 'Ciencia de Datos', lvl: 5, term: '2C', hs: 6, reg: [28], apr: [17, 19] },
    { n: 33, name: 'Sistemas de Gestión', lvl: 5, term: 'A', hs: 4, reg: [18, 27], apr: [23] },
    { n: 34, name: 'Gestión Gerencial', lvl: 5, term: '1C', hs: 6, reg: [24, 30], apr: [18] },
    { n: 35, name: 'Seguridad en los Sistemas de Información', lvl: 5, term: '2C', hs: 6, reg: [26, 30], apr: [20, 21] },
    { n: 36, name: 'Proyecto Final', lvl: 5, term: 'A', hs: 6, reg: [25, 26, 30], apr: [12, 20, 23], int: true },
    // Electivas 5to nivel (10 hs cuatrimestrales)
    { el: true, name: 'Agilidad y Gestión de Productos Digitales', lvl: 5, term: '1C', hs: 4 },
    { el: true, name: 'Diseño de Redes LAN Modernas', lvl: 5, term: '2C', hs: 4 },
    { el: true, name: 'Innovación y Gestión de la Tecnología', lvl: 5, term: '1C', hs: 4 },
    { el: true, name: 'Nuevas Tecnologías de Redes WAN', lvl: 5, term: '2C', hs: 4 },
    { el: true, name: 'Testing Automatizado de Software', lvl: 5, term: '1C', hs: 4 },
    { el: true, name: 'Virtualización, Consolidación de Servidores', lvl: 5, term: '1C', hs: 4 },
    { el: true, name: 'Capital Humano y Gestión del Conocimiento', lvl: 5, term: '1C', hs: 4 },
  ],
};

// Correlativas de electivas del Plan 2008 que se repiten
const E5 = [9, 18, 19, 20, 21, 22, 23, 24];

const plan2008 = {
  year: 2008,
  name: 'Ingeniería en Sistemas de Información - Plan 2008',
  resolution: 'Res. 775/2008 (actualizado al año 2017)',
  isCurrent: false,
  subjects: [
    // NIVEL I
    { n: 1, name: 'Análisis Matemático I', lvl: 1, term: 'A', hs: 5 },
    { n: 2, name: 'Álgebra y Geometría Analítica', lvl: 1, term: 'A', hs: 5 },
    { n: 3, name: 'Matemática Discreta', lvl: 1, term: 'A', hs: 3 },
    { n: 4, name: 'Sistemas y Organizaciones', lvl: 1, term: 'A', hs: 3, int: true },
    { n: 5, name: 'Algoritmos y Estructuras de Datos', lvl: 1, term: 'A', hs: 5 },
    { n: 6, name: 'Arquitectura de Computadoras', lvl: 1, term: 'A', hs: 4 },
    { n: 7, name: 'Física I', lvl: 1, term: 'A', hs: 5 },
    { n: 8, name: 'Sistemas de Representación', lvl: 1, term: 'A', hs: 3 },
    { n: 9, name: 'Ingeniería y Sociedad', lvl: 1, term: 'A', hs: 2 },
    // NIVEL II
    { n: 10, name: 'Química', lvl: 2, term: 'A', hs: 3 },
    { n: 11, name: 'Análisis Matemático II', lvl: 2, term: 'A', hs: 5, reg: [1, 2], rend: [1, 2] },
    { n: 12, name: 'Física II', lvl: 2, term: 'A', hs: 5, reg: [1, 7], rend: [1, 7] },
    { n: 13, name: 'Análisis de Sistemas', lvl: 2, term: 'A', hs: 6, reg: [4, 5], rend: [4, 5], int: true },
    { n: 14, name: 'Sintaxis y Semántica de los Lenguajes', lvl: 2, term: 'A', hs: 4, reg: [3, 5], rend: [3, 5] },
    { n: 15, name: 'Paradigmas de Programación', lvl: 2, term: 'A', hs: 4, reg: [3, 5], rend: [3, 5] },
    { n: 16, name: 'Sistemas Operativos', lvl: 2, term: 'A', hs: 4, reg: [3, 5, 6], rend: [3, 5, 6] },
    { n: 17, name: 'Inglés I', lvl: 2, term: 'A', hs: 2 },
    // NIVEL III
    { n: 18, name: 'Probabilidades y Estadística', lvl: 3, term: '1C', hs: 6, reg: [1, 2], rend: [1, 2] },
    { n: 19, name: 'Diseño de Sistemas', lvl: 3, term: 'A', hs: 6, reg: [13, 15], apr: [3, 4, 5], rend: [13, 15], int: true },
    { n: 20, name: 'Comunicaciones', lvl: 3, term: 'A', hs: 4, reg: [6, 11, 12], apr: [1, 2, 7], rend: [6, 11, 12] },
    { n: 21, name: 'Matemática Superior', lvl: 3, term: '2C', hs: 8, reg: [11], apr: [1, 2], rend: [11] },
    { n: 22, name: 'Gestión de Datos', lvl: 3, term: '1C', hs: 8, reg: [13, 14, 15], apr: [3, 4, 5], rend: [13, 14, 15] },
    { n: 23, name: 'Economía', lvl: 3, term: '2C', hs: 6, reg: [13], apr: [4, 5], rend: [13] },
    { n: 24, name: 'Inglés II', lvl: 3, term: 'A', hs: 2, apr: [17] },
    // Electivas 3er nivel (8 hs cuatrimestrales)
    { el: true, name: 'Seguridad Informática', lvl: 3, term: 'AC', hs: 4, reg: [13, 16], apr: [1, 2, 3, 4, 5, 6, 17], rend: [13, 16] },
    { el: true, name: 'Programación Web', lvl: 3, term: '2C', hs: 4, reg: [13, 14, 15, 22], apr: [1, 2, 3, 4, 5, 6, 8, 9], rend: [13, 14, 15, 22] },
    { el: true, name: 'Aplicaciones Ágiles Centradas en Datos', lvl: 3, term: '2C', hs: 4, reg: [14, 15, 16, 22], apr: [1, 2, 3, 4, 5, 6, 8, 9], rend: [14, 15, 16, 22] },
    { el: true, name: 'Programación de Aplicaciones Visuales', lvl: 3, term: '1C', hs: 4, reg: [13, 14, 15], apr: [1, 2, 3, 4, 5, 6, 8, 9], rend: [13, 14, 15] },
    // NIVEL IV
    { n: 25, name: 'Redes de Información', lvl: 4, term: '2C', hs: 8, reg: [16, 20], apr: [3, 5, 6, 11, 12], rend: [16, 20] },
    { n: 26, name: 'Administración de Recursos', lvl: 4, term: 'A', hs: 6, reg: [16, 19, 23], apr: [6, 13, 15, 17], rend: [16, 19, 23], int: true },
    { n: 27, name: 'Investigación Operativa', lvl: 4, term: '1C', hs: 10, reg: [18, 21], apr: [11], rend: [18, 21] },
    { n: 28, name: 'Simulación', lvl: 4, term: '1C', hs: 8, reg: [18, 21], apr: [11], rend: [18, 21] },
    { n: 29, name: 'Ingeniería de Software', lvl: 4, term: '2C', hs: 6, reg: [18, 19, 22], apr: [13, 14, 15], rend: [18, 19, 22] },
    { n: 30, name: 'Teoría de Control', lvl: 4, term: '2C', hs: 6, reg: [10, 21], apr: [11, 12], rend: [10, 21] },
    { n: 31, name: 'Legislación', lvl: 4, term: '1C', hs: 4, reg: [9, 13], apr: [4, 5], rend: [9, 13] },
    // Electivas 4to nivel (8 hs cuatrimestrales)
    { el: true, name: 'Ingeniería de Requerimiento', lvl: 4, term: '2C', hs: 4, reg: [19], apr: [13], rend: [11, 13, 14, 15, 16, 17, 12, 10] },
    { el: true, name: 'Sistemas de Información Geográficos', lvl: 4, term: 'AC', hs: 4, reg: [19, 22], apr: [8, 11, 13, 14, 15, 16], rend: [19, 22] },
    { el: true, name: 'Implementación de Bases de Datos', lvl: 4, term: '1C', hs: 4, reg: [22], apr: [8, 11, 13, 14, 15, 16], rend: [22] },
    { el: true, name: 'Algoritmos Genéticos y Optimización Heurística', lvl: 4, term: '2C', hs: 4, reg: [21], apr: [14, 15, 18], rend: [21] },
    { el: true, name: 'Sistemas Informáticos Industriales', lvl: 4, term: '1C', hs: 4, reg: [19, 22], apr: [8, 11, 13, 14, 15, 16], rend: [19, 22] },
    { el: true, name: 'Programación de Aplicaciones Distribuidas', lvl: 4, term: '2C', hs: 4, reg: [19, 22], apr: [11, 13, 14, 15, 16, 17], rend: [19, 22] },
    { el: true, name: 'Introducción al Proceso Unificado de Desarrollo', lvl: 4, term: '2C', hs: 4, reg: [19, 22], apr: [11, 13, 14, 15, 16, 17], rend: [19, 22] },
    // NIVEL V
    { n: 32, name: 'Proyecto Final', lvl: 5, term: 'A', hs: 6, reg: [25, 26, 29, 31], apr: [8, 9, 16, 18, 19, 20, 22, 23, 24], rend: 'ALL', int: true },
    { n: 33, name: 'Inteligencia Artificial', lvl: 5, term: '1C', hs: 6, reg: [27, 28], apr: [18, 19, 21], rend: [27, 28] },
    { n: 34, name: 'Administración Gerencial', lvl: 5, term: '1C', hs: 6, reg: [26, 27], apr: [16, 18, 19, 21, 23], rend: [26, 27] },
    { n: 35, name: 'Sistemas de Gestión', lvl: 5, term: 'A', hs: 4, reg: [26, 27, 28], apr: [16, 18, 19, 21, 23], rend: [26, 27, 28] },
    // Electivas 5to nivel (28 hs cuatrimestrales)
    { el: true, name: 'Auditoría en Sistemas de Información', lvl: 5, term: '1C', hs: 4, reg: [26], apr: E5, rend: [26] },
    { el: true, name: 'Sistemas de Bases de Datos Avanzados', lvl: 5, term: 'AC', hs: 6, reg: [26, 29], apr: E5, rend: [26, 29] },
    { el: true, name: 'Metodología de Diseño de Sistemas', lvl: 5, term: '2C', hs: 6, reg: [26, 27, 28, 29], apr: E5, rend: [26, 27, 28, 29] },
    { el: true, name: 'Sistemas Informáticos para la Gestión de Calidad', lvl: 5, term: '2C', hs: 6, reg: [19], rend: E5 },
    { el: true, name: 'Virtualización-Consolidación de Servidores', lvl: 5, term: '2C', hs: 4, reg: [25], apr: [11, 13, 14, 15, 16, 17], rend: [25] },
    { el: true, name: 'Gestión de Capital Humano', lvl: 5, term: '2C', hs: 6, reg: [26], apr: E5, rend: [26] },
    { el: true, name: 'Redes Avanzadas', lvl: 5, term: '1C', hs: 4, reg: [25], apr: [20], rend: [25] },
    { el: true, name: 'Gestión de Herramientas de Diseño y Desarrollo de Software', lvl: 5, term: 'AC', hs: 6, reg: [26], apr: E5, rend: [26] },
    { el: true, name: 'Inteligencia Artificial Distribuida', lvl: 5, term: '2C', hs: 6, reg: [29, 33], rend: [29, 33] },
    { el: true, name: 'Nuevas Tecnologías de Redes WAN', lvl: 5, term: '1C', hs: 4, reg: [25], apr: [20], rend: [25] },
    { el: true, name: 'Testing y Calidad de Software', lvl: 5, term: '2C', hs: 4, reg: [25, 26, 29], apr: [18, 19, 20, 22, 24], rend: [25, 26, 29] },
    { el: true, name: 'Innovación Tecnológica, Gestión del Cambio y Reingeniería de Procesos', lvl: 5, term: '2C', hs: 6, reg: [26], apr: E5, rend: [26] },
    { el: true, name: 'Metodologías Ágiles para el Desarrollo de Software', lvl: 5, term: '1C', hs: 4, reg: [26], apr: [19, 22, 24], rend: [26] },
  ],
};

module.exports = {
  career: { code: 'ISI', name: 'Ingeniería en Sistemas de Información' },
  plans: [plan2023, plan2008],
};

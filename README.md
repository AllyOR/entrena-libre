# EntrenaLibre

Entrenador personal gratuito en el navegador: plan mensual a tu medida, técnica ilustrada de cada
ejercicio, IMC, calorías, menús y seguimiento mes a mes. Sin cuenta, sin servidor y sin pagos.

_A free personal trainer in the browser: a monthly plan made for you, illustrated technique for every
exercise, BMI, calories, menus and month-by-month tracking. No account, no server, no payments.
[English notes below](#english)._

## Qué incluye

| Sección | Contenido |
|---|---|
| **Gimnasio** | 22 ejercicios con barra, mancuernas, máquinas y poleas. |
| **Funcional** | 22 ejercicios de peso corporal, pesa rusa, saltos y circuitos. |
| **En casa** | 24 ejercicios con mochila, botellas, silla, pared y toalla. |
| **Adaptado** | 15 condiciones (rodilla, lumbar, hombro, hipertensión, diabetes, embarazo…): qué hacer, qué evitar y 19 ejercicios suaves recomendados. |
| **Cuerpo y nutrición** | IMC, peso saludable, metabolismo basal, gasto diario, objetivo de calorías, macros, agua, grasa corporal y un menú diario con platos y porciones. |
| **Plan mensual** | Cuatro semanas (base, volumen, intensidad, descarga) con ejercicios que cambian a mitad de mes y de un mes a otro. |
| **Sesión guiada** | Series, repeticiones, cronómetro de descanso y técnica a la vista. |
| **Progreso** | Sesiones y minutos por mes, racha semanal y evolución del peso. |

Cada ejercicio trae una figura animada, la técnica paso a paso, los errores comunes, la respiración
y consejos **para ti**: según tu salud, nivel, edad, estatura y peso (qué modificar, qué hacer en su
lugar y con qué carga empezar).

La interfaz está en español e inglés, con modo claro y oscuro, y se adapta a móvil y escritorio.
Se puede instalar como aplicación (PWA) y funciona sin conexión.

## Tus datos

Todo se guarda en el `localStorage` de tu navegador: no hay cuenta, servidor ni coste, y nadie más
ve tus datos. En **Perfil → Tus datos** puedes descargar una copia (JSON) y restaurarla en otro
dispositivo.

> Esta app ofrece orientación general y no sustituye a un profesional de la salud.

## Desarrollo

Requiere Node 24 (ver `.nvmrc`).

```bash
npm install
npm run dev        # servidor local
npm run check      # lint + tipos + tests + build de producción
```

| Ruta | Qué hay |
|---|---|
| `src/types.ts` | Tipos del dominio. |
| `src/data/` | Catálogo de ejercicios, condiciones de salud y platos (contenido bilingüe). |
| `src/lib/` | Lógica pura y con tests: nutrición, generador del plan, personalización, guardado, estadísticas. |
| `src/figure/` | Figuras: poses por ángulos articulares, resueltas a coordenadas y animadas con SVG. |
| `src/i18n/` | Textos de la interfaz (`es.ts` es la referencia; `en.ts` no compila si falta una clave). |
| `src/pages/`, `src/components/` | Pantallas y componentes (React). |

Añadir un ejercicio: una entrada en `src/data/exercises/*.ts` con una de las poses de
`src/types.ts`. Los tests de `src/data/data.test.ts` comprueban que esté completo en ambos idiomas.

## Publicación

`.github/workflows/deploy.yml` ejecuta lint, tipos, tests y build en cada push y pull request, y
publica la rama principal en GitHub Pages. El build usa rutas relativas y navegación por `#`, así que el
contenido de `dist/` funciona igual en Vercel, Netlify o cualquier hosting estático.

## Fórmulas

- IMC y categorías: OMS.
- Metabolismo basal: Mifflin-St Jeor (1990). Gasto diario: factores de actividad estándar (1,2–1,9).
- Objetivo: −20 % para perder grasa, +10 % para ganar músculo, con un mínimo de 1200 kcal (mujer) y
  1500 kcal (hombre); sin déficit durante el embarazo.
- Grasa corporal: método de circunferencias de la US Navy (Hodgdon y Beckett, 1984).

## English

- **Sections:** gym, functional, at-home (household items) and adapted (by health condition)
  exercise libraries; body metrics and nutrition; a generated four-week monthly plan; a guided
  workout player; progress tracking.
- **Data:** stored only in the browser's `localStorage`. Back it up or move it from
  **Profile → Your data**.
- **Stack:** React 19, TypeScript, Vite, Vitest, oxlint; installable PWA; deployed to GitHub Pages
  by the workflow in `.github/workflows/`.
- **Develop:** `npm install`, `npm run dev`, `npm run check`.

# Training Seasonny

Entrenador personal en el navegador y en el teléfono: plan mensual a tu medida, técnica ilustrada de
cada ejercicio, IMC, calorías, menús y seguimiento mes a mes. Sin cuenta y sin servidor.

_A personal trainer for the browser and the phone: a monthly plan made for you, illustrated technique
for every exercise, BMI, calories, menus and month-by-month tracking. No account, no server.
[English notes below](#english)._

Web: https://allyor.github.io/entrena-libre/

## Qué incluye

| Sección | Contenido |
|---|---|
| **Gimnasio** | 34 ejercicios con barra, mancuernas, pesa rusa, máquinas y poleas. |
| **Funcional** | 31 ejercicios de peso corporal, pesa rusa, saltos y circuitos. |
| **En casa** | 34 ejercicios con mochila, botellas, silla, pared y toalla. |
| **Pilates** | 16 ejercicios de colchoneta: el cien, roll-up, puente de hombros, natación, teaser… |
| **Artes marciales** | 20 técnicas en solitario de kickboxing, jiu-jitsu, taekwondo y karate. |
| **Estiramientos** | 17 estiramientos, uno o dos por grupo muscular, para después de entrenar. |
| **Adaptado** | 15 condiciones (rodilla, lumbar, hombro, hipertensión, diabetes, embarazo…): qué hacer, qué evitar y 19 ejercicios suaves recomendados. |
| **Cuerpo y nutrición** | IMC, peso saludable, metabolismo basal, gasto diario, objetivo de calorías, macros, agua, grasa corporal y un menú diario con platos y porciones. |
| **Plan mensual** | Cuatro semanas (base, volumen, intensidad, descarga) para gimnasio, funcional, casa, Pilates o artes marciales, con ejercicios que cambian a mitad de mes y de un mes a otro. |
| **Sesión guiada** | Series, repeticiones, cronómetro de descanso y técnica a la vista. |
| **Progreso** | Sesiones y minutos por mes, racha semanal y evolución del peso. |

Dentro de cada sección los ejercicios se filtran por grupo muscular: piernas, isquiotibiales,
glúteos, pantorrillas, pecho, espalda, hombros, bíceps, tríceps, antebrazos y core.

El peso, la altura y las medidas se pueden escribir en unidades métricas (kg, cm) o imperiales
(lb, ft, in); internamente todo se guarda en métrico (`src/lib/units.ts`).

Cada ejercicio trae una figura animada, la técnica paso a paso, los errores comunes, la respiración
y consejos **para ti**: según tu salud, nivel, edad, estatura y peso (qué modificar, qué hacer en su
lugar y con qué carga empezar).

La interfaz está en español e inglés, con modo claro y oscuro, y se adapta a móvil y escritorio. La
web se puede instalar (PWA) y funciona sin conexión. Cuando se publica una versión nueva, la app
abierta o instalada se recarga sola para usarla; durante una sesión de entrenamiento espera a que
salgas de ella (`src/pwa.ts`).

## Tus datos

Todo se guarda en el dispositivo (`localStorage`): no hay cuenta, servidor ni analítica, y nadie más
ve tus datos. En **Perfil → Tus datos** puedes descargar una copia (JSON) y restaurarla en otro
dispositivo. La [política de privacidad](https://allyor.github.io/entrena-libre/#/privacy) está
dentro de la app, en `src/pages/Privacy.tsx`: si cambia lo que hace el código, cámbiala también.

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
| `src/lib/` | Lógica pura y con tests: nutrición, generador del plan, personalización, guardado, recordatorios, estadísticas. `native.ts` es el único módulo que habla con Capacitor. |
| `src/figure/` | Figuras: poses por ángulos articulares, resueltas a coordenadas y animadas con SVG. |
| `src/i18n/` | Textos de la interfaz (`es.ts` es la referencia; `en.ts` no compila si falta una clave). |
| `src/pages/`, `src/components/` | Pantallas y componentes (React). |
| `android/`, `ios/` | Proyectos nativos generados por Capacitor. |
| `assets/` | Logotipo del que salen los iconos y pantallas de inicio nativos. |

Añadir un ejercicio: una entrada en `src/data/exercises/*.ts` con una de las poses de
`src/types.ts`. Los tests de `src/data/data.test.ts` comprueban que esté completo en ambos idiomas.

## Publicación web

`.github/workflows/deploy.yml` ejecuta lint, tipos, tests y build en cada push y pull request, y
publica la rama principal en GitHub Pages. El build usa rutas relativas y navegación por `#`, así
que el contenido de `dist/` funciona igual en Vercel, Netlify o cualquier hosting estático.

## Apps para Android e iOS

La misma app web va dentro de una envoltura nativa de [Capacitor](https://capacitorjs.com). En el
teléfono añade recordatorios programados por el sistema (llegan aunque la app esté cerrada),
vibración al terminar un cronómetro y el color de la barra de estado según el tema. En el navegador
los recordatorios también piden permiso de notificaciones, pero solo llegan con la app abierta o en
segundo plano.

```bash
npm run build:native   # build web sin service worker + copia a android/ e ios/
npm run open:android   # abre Android Studio
npm run open:ios       # abre Xcode
```

Hace falta, y no viene en este repositorio:

- **Android:** Android Studio (incluye el JDK y el SDK).
- **iOS:** una Mac con Xcode completo. Las dependencias nativas van por Swift Package Manager; no
  hace falta CocoaPods.

Antes de la primera subida a las tiendas:

1. **Identificador:** `com.trainingseasonny.app` (en `capacitor.config.ts` y en los dos proyectos).
   No se puede cambiar una vez publicada la app: decídelo antes.
2. **Versión:** `versionCode`/`versionName` en `android/app/build.gradle` y versión/build en Xcode.
3. **Firma:** un keystore de subida para Android (no lo guardes en git) y el equipo de Apple
   Developer en Xcode.
4. **Fichas de las tiendas:** capturas, descripción, clasificación por edades, formulario de
   seguridad de datos (Google) y etiquetas de privacidad (Apple): la app no recopila datos. URL de
   la política de privacidad: la de arriba.
5. **Iconos y pantalla de inicio:** se regeneran desde `assets/logo.png` con
   `npx capacitor-assets generate --ios --android --iconBackgroundColor '#0f766e' --iconBackgroundColorDark '#0f766e' --splashBackgroundColor '#0f766e' --splashBackgroundColorDark '#0e1412' --logoSplashScale 0.6`.

Los proyectos nativos se generaron sin Xcode ni Android Studio en la máquina: **no se han compilado
ni probado en un simulador o un teléfono**. La primera compilación es el paso pendiente.

## Fórmulas

- IMC y categorías: OMS.
- Metabolismo basal: Mifflin-St Jeor (1990). Gasto diario: factores de actividad estándar (1,2–1,9).
- Objetivo: −20 % para perder grasa, +10 % para ganar músculo, con un mínimo de 1200 kcal (mujer) y
  1500 kcal (hombre); sin déficit durante el embarazo.
- Grasa corporal: método de circunferencias de la US Navy (Hodgdon y Beckett, 1984).

## English

- **Sections:** gym, functional, at-home (household items), Pilates, martial arts (kickboxing,
  jiu-jitsu, taekwondo, karate solo drills), stretching (by muscle group) and adapted (by health
  condition) exercise libraries, each filtered by muscle group;
  body metrics and nutrition; a generated four-week monthly plan; a guided workout player; progress
  tracking.
- **Data:** stored only on the device (`localStorage`). Back it up or move it from
  **Profile → Your data**.
- **Stack:** React 19, TypeScript, Vite, Vitest, oxlint; installable PWA deployed to GitHub Pages;
  Capacitor 8 shells for Android and iOS in `android/` and `ios/`.
- **Develop:** `npm install`, `npm run dev`, `npm run check`. Native: `npm run build:native`, then
  `npm run open:android` or `npm run open:ios` (needs Android Studio / Xcode). The native projects
  have not been compiled yet.

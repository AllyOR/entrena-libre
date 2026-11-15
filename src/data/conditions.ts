import type { ConditionId, L10n, L10nList } from '../types'

export interface Condition {
  id: ConditionId
  group: 'joint' | 'health' | 'stage'
  name: L10n
  /** What to do. */
  advice: L10nList
  /** What to leave out, in one sentence. */
  avoid: L10n
  /** How to modify an exercise marked "with care" for this condition. */
  cue: L10n
  /** Set from the profile's numbers, not chosen by hand. */
  derived?: boolean
}

export const CONDITIONS: readonly Condition[] = [
  {
    id: 'knee',
    group: 'joint',
    name: { es: 'Rodilla', en: 'Knee' },
    advice: {
      es: [
        'Fortalece glúteos y cuádriceps con rangos cortos y sin dolor.',
        'Prefiere ejercicios de bajo impacto: caminar, bicicleta, puentes.',
        'Mantén la rodilla alineada con el segundo dedo del pie.',
      ],
      en: [
        'Strengthen glutes and quadriceps through short, pain-free ranges.',
        'Prefer low-impact work: walking, cycling, bridges.',
        'Keep the knee in line with your second toe.',
      ],
    },
    avoid: {
      es: 'Saltos, sentadillas profundas con carga y zancadas con impacto.',
      en: 'Jumps, deep loaded squats and impact lunges.',
    },
    cue: {
      es: 'Rodilla: baja solo hasta donde no haya dolor y no dejes que la rodilla se vaya hacia dentro.',
      en: 'Knee: go only as low as is pain-free and never let the knee cave inward.',
    },
  },
  {
    id: 'lowerBack',
    group: 'joint',
    name: { es: 'Zona lumbar', en: 'Lower back' },
    advice: {
      es: [
        'Entrena el core con ejercicios de estabilidad: perro-pájaro, bicho muerto, plancha.',
        'Aprende la bisagra de cadera con poco peso antes de cargar.',
        'Muévete a diario: caminar suele aliviar más que el reposo.',
      ],
      en: [
        'Train the core with stability work: bird-dog, dead bug, plank.',
        'Learn the hip hinge with light weight before loading it.',
        'Move daily: walking usually helps more than rest.',
      ],
    },
    avoid: {
      es: 'Flexión de columna con carga, giros bruscos y pesos pesados desde el suelo.',
      en: 'Loaded spinal flexion, fast twisting and heavy lifts from the floor.',
    },
    cue: {
      es: 'Lumbar: mantén la columna neutra, aprieta el abdomen y reduce la carga a la mitad.',
      en: 'Lower back: keep a neutral spine, brace your abs and halve the load.',
    },
  },
  {
    id: 'shoulder',
    group: 'joint',
    name: { es: 'Hombro', en: 'Shoulder' },
    advice: {
      es: [
        'Fortalece la espalda alta con remos y bandas.',
        'Trabaja por debajo de la altura del hombro mientras haya dolor.',
        'Calienta con péndulos y movilidad suave.',
      ],
      en: [
        'Strengthen the upper back with rows and bands.',
        'Work below shoulder height while there is pain.',
        'Warm up with pendulums and gentle mobility.',
      ],
    },
    avoid: {
      es: 'Empujes por encima de la cabeza, fondos y jalones tras nuca.',
      en: 'Overhead pressing, dips and behind-the-neck pulls.',
    },
    cue: {
      es: 'Hombro: acorta el recorrido, mantén los codos a 45° del cuerpo y para si pellizca.',
      en: 'Shoulder: shorten the range, keep elbows 45° from your body and stop if it pinches.',
    },
  },
  {
    id: 'wrist',
    group: 'joint',
    name: { es: 'Muñeca', en: 'Wrist' },
    advice: {
      es: [
        'Apoya sobre los puños o sobre mancuernas para mantener la muñeca recta.',
        'Usa los antebrazos (plancha) en vez de las manos.',
        'Fortalece el agarre con cargas ligeras.',
      ],
      en: [
        'Support yourself on fists or dumbbell handles to keep the wrist straight.',
        'Use your forearms (plank) instead of your hands.',
        'Build grip strength with light loads.',
      ],
    },
    avoid: {
      es: 'Apoyos con la muñeca muy extendida y carga: flexiones completas, fondos.',
      en: 'Loaded positions with the wrist bent far back: full push-ups, dips.',
    },
    cue: {
      es: 'Muñeca: apoya sobre los puños o antebrazos para mantenerla recta.',
      en: 'Wrist: rest on your fists or forearms to keep it straight.',
    },
  },
  {
    id: 'neck',
    group: 'joint',
    name: { es: 'Cuello', en: 'Neck' },
    advice: {
      es: [
        'Mantén la mirada neutra: ni al techo ni al ombligo.',
        'Fortalece la espalda alta con remos.',
        'Haz retracciones de mentón varias veces al día.',
      ],
      en: [
        'Keep a neutral gaze: neither at the ceiling nor at your navel.',
        'Strengthen the upper back with rows.',
        'Do chin tucks several times a day.',
      ],
    },
    avoid: {
      es: 'Tirar de la cabeza en abdominales y cargar barra sobre el cuello.',
      en: 'Pulling on your head in crunches and resting a bar on your neck.',
    },
    cue: {
      es: 'Cuello: no tires de la cabeza; mantén la nuca larga y la mirada neutra.',
      en: 'Neck: never pull on your head; keep the back of your neck long and your gaze neutral.',
    },
  },
  {
    id: 'hip',
    group: 'joint',
    name: { es: 'Cadera', en: 'Hip' },
    advice: {
      es: [
        'Fortalece el glúteo medio con elevaciones laterales y puentes.',
        'Trabaja en rangos cómodos y aumenta poco a poco.',
        'Estira suavemente tras entrenar.',
      ],
      en: [
        'Strengthen the gluteus medius with side leg raises and bridges.',
        'Work within comfortable ranges and increase gradually.',
        'Stretch gently after training.',
      ],
    },
    avoid: {
      es: 'Impacto repetido y flexión profunda de cadera con carga.',
      en: 'Repeated impact and deep loaded hip flexion.',
    },
    cue: {
      es: 'Cadera: reduce la profundidad y la zancada; el movimiento debe ser indoloro.',
      en: 'Hip: reduce depth and stride length; the movement must be pain-free.',
    },
  },
  {
    id: 'ankle',
    group: 'joint',
    name: { es: 'Tobillo', en: 'Ankle' },
    advice: {
      es: [
        'Entrena el equilibrio sobre una pierna con apoyo cerca.',
        'Fortalece los gemelos con elevaciones de talones.',
        'Usa calzado estable y superficies planas.',
      ],
      en: [
        'Train single-leg balance with support nearby.',
        'Strengthen the calves with heel raises.',
        'Wear stable shoes and train on flat surfaces.',
      ],
    },
    avoid: {
      es: 'Saltos, cambios bruscos de dirección y superficies inestables.',
      en: 'Jumps, sudden changes of direction and unstable surfaces.',
    },
    cue: {
      es: 'Tobillo: hazlo en suelo plano, con apoyo cerca y sin rebotes.',
      en: 'Ankle: use flat ground, keep support nearby and do not bounce.',
    },
  },
  {
    id: 'hypertension',
    group: 'health',
    name: { es: 'Hipertensión', en: 'High blood pressure' },
    advice: {
      es: [
        'El ejercicio aeróbico moderado (caminar 30 min) es tu mejor aliado.',
        'Usa cargas moderadas con más repeticiones y descansos completos.',
        'Nunca contengas la respiración al hacer fuerza.',
      ],
      en: [
        'Moderate aerobic exercise (a 30-minute walk) is your best ally.',
        'Use moderate loads, more repetitions and full rests.',
        'Never hold your breath while straining.',
      ],
    },
    avoid: {
      es: 'Cargas máximas, isométricos largos y ejercicios con la cabeza por debajo del corazón.',
      en: 'Maximal loads, long isometric holds and head-below-heart positions.',
    },
    cue: {
      es: 'Presión arterial: exhala en el esfuerzo, no contengas el aire y usa una carga que te permita 12 repeticiones.',
      en: 'Blood pressure: exhale on effort, never hold your breath and use a load you can lift 12 times.',
    },
  },
  {
    id: 'heart',
    group: 'health',
    name: { es: 'Problema cardíaco', en: 'Heart condition' },
    advice: {
      es: [
        'Entrena solo con el visto bueno de tu cardiólogo.',
        'Mantén una intensidad en la que puedas conversar.',
        'Calienta y enfría al menos 10 minutos.',
      ],
      en: [
        'Train only with your cardiologist’s clearance.',
        'Keep an intensity at which you can hold a conversation.',
        'Warm up and cool down for at least 10 minutes.',
      ],
    },
    avoid: {
      es: 'Alta intensidad, intervalos al máximo y cargas pesadas.',
      en: 'High intensity, all-out intervals and heavy loads.',
    },
    cue: {
      es: 'Corazón: intensidad suave, descansos largos y detente ante dolor de pecho, mareo o falta de aire.',
      en: 'Heart: easy intensity, long rests, and stop at any chest pain, dizziness or breathlessness.',
    },
  },
  {
    id: 'diabetes',
    group: 'health',
    name: { es: 'Diabetes', en: 'Diabetes' },
    advice: {
      es: [
        'Combina fuerza y caminata: ambas mejoran el control de la glucosa.',
        'Mide tu glucosa antes y después si usas insulina, y ten a mano algo dulce.',
        'Revisa tus pies y usa calzado cómodo.',
      ],
      en: [
        'Combine strength work and walking: both improve glucose control.',
        'Check your glucose before and after if you use insulin, and keep a sugary snack at hand.',
        'Check your feet and wear comfortable shoes.',
      ],
    },
    avoid: {
      es: 'Entrenar en ayunas prolongado o con glucosa muy alta o muy baja.',
      en: 'Training after a long fast or with very high or very low glucose.',
    },
    cue: {
      es: 'Diabetes: ten a mano un carbohidrato rápido y no entrenes con síntomas de hipoglucemia.',
      en: 'Diabetes: keep fast carbohydrate at hand and do not train with symptoms of low blood sugar.',
    },
  },
  {
    id: 'asthma',
    group: 'health',
    name: { es: 'Asma', en: 'Asthma' },
    advice: {
      es: [
        'Calienta de forma gradual durante 10–15 minutos.',
        'Lleva siempre tu inhalador de rescate.',
        'Prefiere intervalos cortos con pausas a esfuerzos largos e intensos.',
      ],
      en: [
        'Warm up gradually for 10–15 minutes.',
        'Always carry your rescue inhaler.',
        'Prefer short intervals with pauses over long, intense efforts.',
      ],
    },
    avoid: {
      es: 'Esfuerzos intensos sin calentar y ejercicio con aire muy frío o seco.',
      en: 'Intense efforts without a warm-up and exercise in very cold or dry air.',
    },
    cue: {
      es: 'Asma: baja el ritmo si te falta el aire y respira por la nariz cuando puedas.',
      en: 'Asthma: slow down if you get short of breath and breathe through your nose when you can.',
    },
  },
  {
    id: 'osteoporosis',
    group: 'health',
    name: { es: 'Osteoporosis', en: 'Osteoporosis' },
    advice: {
      es: [
        'El ejercicio de fuerza con carga progresiva ayuda a mantener el hueso.',
        'Entrena el equilibrio para prevenir caídas.',
        'Mantén la espalda recta al agacharte: dobla cadera y rodillas.',
      ],
      en: [
        'Progressive strength training helps maintain bone.',
        'Train balance to prevent falls.',
        'Keep your back straight when bending: fold at the hips and knees.',
      ],
    },
    avoid: {
      es: 'Flexión y giro de columna con carga (abdominales, giros rusos) e impactos fuertes.',
      en: 'Loaded spinal flexion and twisting (crunches, Russian twists) and hard impacts.',
    },
    cue: {
      es: 'Osteoporosis: mantén la espalda recta y evita redondear o girar la columna con carga.',
      en: 'Osteoporosis: keep your back straight and avoid rounding or twisting the spine under load.',
    },
  },
  {
    id: 'pregnancy',
    group: 'stage',
    name: { es: 'Embarazo', en: 'Pregnancy' },
    advice: {
      es: [
        'Con embarazo sin complicaciones, 150 minutos semanales de actividad moderada son seguros.',
        'Prioriza caminar, fuerza ligera y movilidad.',
        'Hidrátate y evita el calor excesivo.',
      ],
      en: [
        'In an uncomplicated pregnancy, 150 minutes a week of moderate activity is safe.',
        'Prioritise walking, light strength work and mobility.',
        'Stay hydrated and avoid overheating.',
      ],
    },
    avoid: {
      es: 'Saltos, riesgo de caída, cargas máximas y, tras el primer trimestre, estar mucho tiempo boca arriba.',
      en: 'Jumps, fall risk, maximal loads and, after the first trimester, long periods lying on your back.',
    },
    cue: {
      es: 'Embarazo: tras el primer trimestre hazlo inclinada o de lado en vez de boca arriba, y no contengas el aire.',
      en: 'Pregnancy: after the first trimester do it inclined or on your side rather than flat on your back, and do not hold your breath.',
    },
  },
  {
    id: 'obesity',
    group: 'stage',
    derived: true,
    name: { es: 'IMC de 30 o más', en: 'BMI of 30 or more' },
    advice: {
      es: [
        'Empieza con bajo impacto: caminar, marcha en el sitio, fuerza con silla.',
        'La fuerza protege tus articulaciones y conserva músculo mientras pierdes grasa.',
        'Sube primero la frecuencia, luego la duración y por último la intensidad.',
      ],
      en: [
        'Start with low impact: walking, marching in place, chair-based strength.',
        'Strength work protects your joints and keeps muscle while you lose fat.',
        'Increase frequency first, then duration, and intensity last.',
      ],
    },
    avoid: {
      es: 'Saltos y carrera hasta ganar fuerza: cargan varias veces tu peso sobre las rodillas.',
      en: 'Jumping and running until you build strength: they load your knees with several times your weight.',
    },
    cue: {
      es: 'Por tu peso actual: usa un apoyo, reduce el rango y elige siempre la versión sin salto.',
      en: 'At your current weight: use a support, reduce the range and always pick the no-jump version.',
    },
  },
  {
    id: 'senior',
    group: 'stage',
    derived: true,
    name: { es: '65 años o más', en: 'Age 65 or over' },
    advice: {
      es: [
        'Fuerza dos o tres veces por semana: es lo que más protege la autonomía.',
        'Incluye equilibrio en cada sesión.',
        'Progresa despacio y respeta los descansos.',
      ],
      en: [
        'Strength training two or three times a week does the most to protect independence.',
        'Include balance work in every session.',
        'Progress slowly and respect your rest.',
      ],
    },
    avoid: {
      es: 'Saltos sobre cajón y movimientos con riesgo de caída sin apoyo.',
      en: 'Box jumps and movements with a fall risk when unsupported.',
    },
    cue: {
      es: 'Ten una pared o silla al alcance para el equilibrio y muévete con control.',
      en: 'Keep a wall or chair within reach for balance and move with control.',
    },
  },
]

const BY_ID = new Map(CONDITIONS.map((c) => [c.id, c]))

export const conditionById = (id: ConditionId): Condition => {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown condition: ${id}`)
  return found
}

/** Conditions a person picks by hand; the derived ones come from age and BMI. */
export const SELECTABLE_CONDITIONS = CONDITIONS.filter((c) => !c.derived)

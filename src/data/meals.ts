import type { L10n } from '../types'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type DishTag = 'veg' | 'lowGi' | 'lowSodium'

export interface Dish {
  id: string
  type: MealType
  name: L10n
  /** Ingredients for one base portion. */
  detail: L10n
  /** Per base portion. Estimates from standard food-composition tables. */
  kcal: number
  protein: number
  carbs: number
  fat: number
  tags: DishTag[]
}

const dish = (
  id: string,
  type: MealType,
  name: [string, string],
  detail: [string, string],
  [kcal, protein, carbs, fat]: [number, number, number, number],
  tags: DishTag[],
): Dish => ({
  id,
  type,
  name: { es: name[0], en: name[1] },
  detail: { es: detail[0], en: detail[1] },
  kcal,
  protein,
  carbs,
  fat,
  tags,
})

export const DISHES: readonly Dish[] = [
  dish(
    'b-oats-banana',
    'breakfast',
    ['Avena con plátano y maní', 'Oatmeal with banana and peanuts'],
    ['60 g de avena, 1 plátano, 200 ml de leche descremada, 10 g de maní', '60 g oats, 1 banana, 200 ml skimmed milk, 10 g peanuts'],
    [470, 19, 75, 11],
    ['veg', 'lowSodium'],
  ),
  dish(
    'b-eggs-toast',
    'breakfast',
    ['Huevos revueltos con tomate y pan integral', 'Scrambled eggs with tomato and wholemeal bread'],
    ['2 huevos, 1 tomate, 2 rebanadas de pan integral, 1 cdta. de aceite', '2 eggs, 1 tomato, 2 slices wholemeal bread, 1 tsp oil'],
    [380, 21, 30, 19],
    ['veg', 'lowGi'],
  ),
  dish(
    'b-yogurt-fruit',
    'breakfast',
    ['Yogur natural con fruta y granola', 'Plain yogurt with fruit and granola'],
    ['200 g de yogur natural, 1 taza de fruta picada, 30 g de granola', '200 g plain yogurt, 1 cup chopped fruit, 30 g granola'],
    [325, 14, 48, 8],
    ['veg', 'lowSodium'],
  ),
  dish(
    'b-avocado-toast',
    'breakfast',
    ['Tostadas integrales con palta y huevo', 'Wholemeal toast with avocado and egg'],
    ['2 tostadas integrales, ½ palta, 1 huevo duro, limón', '2 wholemeal toasts, ½ avocado, 1 boiled egg, lemon'],
    [360, 15, 30, 20],
    ['veg', 'lowGi', 'lowSodium'],
  ),
  dish(
    'b-smoothie',
    'breakfast',
    ['Batido de plátano, avena y maní', 'Banana, oat and peanut smoothie'],
    ['1 plátano, 40 g de avena, 250 ml de leche, 1 cda. de mantequilla de maní', '1 banana, 40 g oats, 250 ml milk, 1 tbsp peanut butter'],
    [478, 20, 68, 14],
    ['veg', 'lowSodium'],
  ),
  dish(
    'b-spinach-omelette',
    'breakfast',
    ['Tortilla de espinaca con queso fresco y naranja', 'Spinach omelette with fresh cheese and an orange'],
    ['2 huevos, 1 taza de espinaca, 30 g de queso fresco, 1 naranja', '2 eggs, 1 cup spinach, 30 g fresh cheese, 1 orange'],
    [305, 22, 16, 17],
    ['veg', 'lowGi'],
  ),
  dish(
    'b-quinoa-milk',
    'breakfast',
    ['Quinua con leche y canela', 'Quinoa porridge with milk and cinnamon'],
    ['60 g de quinua, 200 ml de leche descremada, canela, 1 cdta. de miel', '60 g quinoa, 200 ml skimmed milk, cinnamon, 1 tsp honey'],
    [343, 15, 55, 7],
    ['veg', 'lowGi', 'lowSodium'],
  ),

  dish(
    'l-chicken-rice',
    'lunch',
    ['Pollo a la plancha con arroz integral y ensalada', 'Grilled chicken with brown rice and salad'],
    ['150 g de pechuga, 1 taza de arroz integral cocido, ensalada, 1 cdta. de aceite', '150 g chicken breast, 1 cup cooked brown rice, salad, 1 tsp oil'],
    [520, 52, 50, 12],
    ['lowGi', 'lowSodium'],
  ),
  dish(
    'l-quinoa-soup',
    'lunch',
    ['Sopa de quinua con verduras y pollo', 'Quinoa soup with vegetables and chicken'],
    ['60 g de quinua, 100 g de pollo, zanahoria, apio, 1 papa pequeña', '60 g quinoa, 100 g chicken, carrot, celery, 1 small potato'],
    [500, 38, 62, 11],
    ['lowGi'],
  ),
  dish(
    'l-lentils',
    'lunch',
    ['Lentejas guisadas con arroz y ensalada', 'Stewed lentils with rice and salad'],
    ['1 taza de lentejas cocidas, ¾ taza de arroz, sofrito de cebolla y tomate, ensalada', '1 cup cooked lentils, ¾ cup rice, onion and tomato base, salad'],
    [455, 22, 78, 6],
    ['veg', 'lowGi', 'lowSodium'],
  ),
  dish(
    'l-baked-fish',
    'lunch',
    ['Trucha al horno con papa y verduras', 'Baked trout with potato and vegetables'],
    ['170 g de trucha, 200 g de papa, verduras al vapor, 1 cdta. de aceite', '170 g trout, 200 g potato, steamed vegetables, 1 tsp oil'],
    [480, 40, 42, 16],
    ['lowSodium'],
  ),
  dish(
    'l-beef-quinoa',
    'lunch',
    ['Carne magra salteada con verduras y quinua', 'Lean beef stir-fry with vegetables and quinoa'],
    ['130 g de carne magra, 1 taza de quinua cocida, pimiento, brócoli, 1 cdta. de aceite', '130 g lean beef, 1 cup cooked quinoa, pepper, broccoli, 1 tsp oil'],
    [510, 40, 48, 17],
    ['lowGi'],
  ),
  dish(
    'l-tuna-salad',
    'lunch',
    ['Ensalada de atún, huevo, choclo y palta', 'Tuna, egg, corn and avocado salad'],
    ['1 lata de atún al agua, 1 huevo, ½ taza de choclo, ½ palta, hojas verdes', '1 can tuna in water, 1 egg, ½ cup corn, ½ avocado, leafy greens'],
    [430, 36, 22, 22],
    ['lowGi'],
  ),
  dish(
    'l-chickpea-curry',
    'lunch',
    ['Garbanzos con verduras al curry y arroz', 'Chickpea and vegetable curry with rice'],
    ['1 taza de garbanzos cocidos, verduras, ½ taza de arroz, 1 cdta. de aceite', '1 cup cooked chickpeas, vegetables, ½ cup rice, 1 tsp oil'],
    [435, 18, 68, 10],
    ['veg', 'lowGi', 'lowSodium'],
  ),
  dish(
    'l-pasta-chicken',
    'lunch',
    ['Fideos integrales con pollo y salsa de tomate', 'Wholemeal pasta with chicken and tomato sauce'],
    ['80 g de fideo integral, 100 g de pollo, salsa de tomate casera, 1 cdta. de aceite', '80 g wholemeal pasta, 100 g chicken, homemade tomato sauce, 1 tsp oil'],
    [505, 38, 62, 11],
    [],
  ),

  dish(
    'd-veg-omelette',
    'dinner',
    ['Tortilla de verduras con ensalada', 'Vegetable omelette with salad'],
    ['2 huevos, zapallito, cebolla, 1 papa pequeña, 1 cdta. de aceite, ensalada', '2 eggs, courgette, onion, 1 small potato, 1 tsp oil, salad'],
    [331, 16, 24, 19],
    ['veg', 'lowGi'],
  ),
  dish(
    'd-squash-soup',
    'dinner',
    ['Crema de zapallo con pollo desmenuzado', 'Squash soup with shredded chicken'],
    ['300 g de zapallo, 80 g de pollo, 1 rebanada de pan integral, 1 cdta. de aceite', '300 g squash, 80 g chicken, 1 slice wholemeal bread, 1 tsp oil'],
    [335, 28, 30, 11],
    ['lowSodium'],
  ),
  dish(
    'd-chicken-wrap',
    'dinner',
    ['Wrap integral de pollo y verduras', 'Wholemeal chicken and vegetable wrap'],
    ['1 tortilla integral, 100 g de pollo, lechuga, tomate, salsa de yogur', '1 wholemeal tortilla, 100 g chicken, lettuce, tomato, yogurt sauce'],
    [335, 33, 30, 9],
    [],
  ),
  dish(
    'd-quinoa-salad',
    'dinner',
    ['Ensalada de quinua, verduras y queso fresco', 'Quinoa salad with vegetables and fresh cheese'],
    ['¾ taza de quinua cocida, pepino, tomate, 40 g de queso fresco, 1 cdta. de aceite', '¾ cup cooked quinoa, cucumber, tomato, 40 g fresh cheese, 1 tsp oil'],
    [355, 15, 40, 15],
    ['veg', 'lowGi'],
  ),
  dish(
    'd-fish-sweet-potato',
    'dinner',
    ['Pescado a la plancha con camote y ensalada', 'Grilled fish with sweet potato and salad'],
    ['150 g de pescado blanco, 150 g de camote, ensalada, 1 cdta. de aceite', '150 g white fish, 150 g sweet potato, salad, 1 tsp oil'],
    [355, 34, 34, 9],
    ['lowGi', 'lowSodium'],
  ),
  dish(
    'd-veg-soup-egg',
    'dinner',
    ['Sopa de verduras con huevo y arroz', 'Vegetable soup with egg and rice'],
    ['Verduras variadas, 1 huevo, ½ taza de arroz, 1 cdta. de aceite, poca sal', 'Mixed vegetables, 1 egg, ½ cup rice, 1 tsp oil, little salt'],
    [280, 11, 38, 9],
    ['veg', 'lowSodium'],
  ),
  dish(
    'd-chicken-stir-fry',
    'dinner',
    ['Salteado de pollo con verduras y arroz integral', 'Chicken and vegetable stir-fry with brown rice'],
    ['120 g de pollo, verduras, ½ taza de arroz integral, 1 cdta. de aceite, sin salsa de soya', '120 g chicken, vegetables, ½ cup brown rice, 1 tsp oil, no soy sauce'],
    [400, 40, 32, 12],
    ['lowGi', 'lowSodium'],
  ),

  dish(
    's-fruit-nuts',
    'snack',
    ['Manzana con un puñado de maní', 'Apple with a handful of peanuts'],
    ['1 manzana, 20 g de maní sin sal', '1 apple, 20 g unsalted peanuts'],
    [220, 6, 28, 10],
    ['veg', 'lowGi', 'lowSodium'],
  ),
  dish(
    's-yogurt-chia',
    'snack',
    ['Yogur natural con chía', 'Plain yogurt with chia'],
    ['150 g de yogur natural, 1 cda. de chía', '150 g plain yogurt, 1 tbsp chia seeds'],
    [150, 10, 12, 7],
    ['veg', 'lowGi', 'lowSodium'],
  ),
  dish(
    's-egg-tomato',
    'snack',
    ['Huevo duro con tomate y galleta integral', 'Boiled egg with tomato and a wholemeal cracker'],
    ['1 huevo duro, 1 tomate, 2 galletas integrales', '1 boiled egg, 1 tomato, 2 wholemeal crackers'],
    [155, 8, 12, 8],
    ['veg', 'lowGi'],
  ),
  dish(
    's-peanut-toast',
    'snack',
    ['Tostada integral con mantequilla de maní', 'Wholemeal toast with peanut butter'],
    ['1 tostada integral, 1 cda. de mantequilla de maní', '1 wholemeal toast, 1 tbsp peanut butter'],
    [175, 7, 16, 9],
    ['veg'],
  ),
  dish(
    's-milk-fruit',
    'snack',
    ['Batido de leche y fruta', 'Milk and fruit shake'],
    ['200 ml de leche descremada, ½ plátano', '200 ml skimmed milk, ½ banana'],
    [150, 8, 23, 3],
    ['veg', 'lowSodium'],
  ),
  dish(
    's-carrot-hummus',
    'snack',
    ['Zanahoria con hummus', 'Carrot sticks with hummus'],
    ['1 zanahoria en bastones, 60 g de hummus', '1 carrot in sticks, 60 g hummus'],
    [135, 5, 15, 6],
    ['veg', 'lowGi'],
  ),
  dish(
    's-corn-cheese',
    'snack',
    ['Mote con queso fresco', 'Hominy corn with fresh cheese'],
    ['½ taza de mote cocido, 30 g de queso fresco', '½ cup cooked hominy, 30 g fresh cheese'],
    [170, 9, 20, 6],
    ['veg'],
  ),
]

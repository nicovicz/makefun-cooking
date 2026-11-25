// Original ingredients, preparation states, and night-market recipes for Warung Ember.

export const PREP = {
  RAW: 'raw',
  CHOPPED: 'chopped',
  SEARED: 'seared',
  BURNT: 'burnt',
};

export const INGREDIENTS = {
  rice: {
    id: 'rice',
    name: 'Steamed Rice',
    short: 'Rice',
    color: '#faf4e6',
    accent: '#dfd2b8',
    needsPrep: null,
    readyState: PREP.RAW,
  },
  noodle: {
    id: 'noodle',
    name: 'Egg Noodles',
    short: 'Noodle',
    color: '#f5cc66',
    accent: '#c98e2b',
    needsPrep: null,
    readyState: PREP.RAW,
  },
  skewer: {
    id: 'skewer',
    name: 'Satay Skewer',
    short: 'Satay',
    color: '#d96b43',
    accent: '#7a2b14',
    needsPrep: 'cook',
    readyState: PREP.SEARED,
    cookTime: 3.4,
    burnTime: 6.4,
  },
  egg: {
    id: 'egg',
    name: 'Crispy Egg',
    short: 'Egg',
    color: '#fff9ec',
    accent: '#f59f1f',
    needsPrep: 'cook',
    readyState: PREP.SEARED,
    cookTime: 2.6,
    burnTime: 5.5,
  },
  scallion: {
    id: 'scallion',
    name: 'Scallion',
    short: 'Scallion',
    color: '#5cc458',
    accent: '#2b7028',
    needsPrep: 'chop',
    readyState: PREP.CHOPPED,
    chopSteps: 4,
  },
  chili: {
    id: 'chili',
    name: 'Ember Chili',
    short: 'Chili',
    color: '#e53e30',
    accent: '#941812',
    needsPrep: 'chop',
    readyState: PREP.CHOPPED,
    chopSteps: 4,
  },
};

export const RECIPES = [
  {
    id: 'satay-bowl',
    name: 'Ember Satay Bowl',
    shortName: 'Satay Bowl',
    price: 120,
    patience: 48,
    minWave: 1,
    badgeColor: '#e87a3e',
    items: [
      { id: 'rice', state: PREP.RAW },
      { id: 'skewer', state: PREP.SEARED },
      { id: 'scallion', state: PREP.CHOPPED },
    ],
  },
  {
    id: 'chili-noodle',
    name: 'Sizzling Chili Noodle',
    shortName: 'Chili Noodle',
    price: 115,
    patience: 46,
    minWave: 1,
    badgeColor: '#df4a36',
    items: [
      { id: 'noodle', state: PREP.RAW },
      { id: 'egg', state: PREP.SEARED },
      { id: 'chili', state: PREP.CHOPPED },
    ],
  },
  {
    id: 'skewer-noodle',
    name: 'Charred Skewer Noodle',
    shortName: 'Skewer Noodle',
    price: 130,
    patience: 48,
    minWave: 1,
    badgeColor: '#d99a2e',
    items: [
      { id: 'noodle', state: PREP.RAW },
      { id: 'skewer', state: PREP.SEARED },
      { id: 'scallion', state: PREP.CHOPPED },
    ],
  },
  {
    id: 'ember-platter',
    name: 'Fiery Ember Platter',
    shortName: 'Ember Platter',
    price: 145,
    patience: 50,
    minWave: 2,
    badgeColor: '#c94c24',
    items: [
      { id: 'skewer', state: PREP.SEARED },
      { id: 'egg', state: PREP.SEARED },
      { id: 'chili', state: PREP.CHOPPED },
    ],
  },
  {
    id: 'golden-fried-rice',
    name: 'Golden Wok Rice',
    shortName: 'Wok Rice',
    price: 165,
    patience: 54,
    minWave: 2,
    badgeColor: '#e0a82e',
    items: [
      { id: 'rice', state: PREP.RAW },
      { id: 'egg', state: PREP.SEARED },
      { id: 'scallion', state: PREP.CHOPPED },
      { id: 'chili', state: PREP.CHOPPED },
    ],
  },
  {
    id: 'midnight-special',
    name: 'Midnight Wok Special',
    shortName: 'Midnight Wok',
    price: 195,
    patience: 58,
    minWave: 3,
    badgeColor: '#9b4dca',
    items: [
      { id: 'rice', state: PREP.RAW },
      { id: 'skewer', state: PREP.SEARED },
      { id: 'egg', state: PREP.SEARED },
      { id: 'chili', state: PREP.CHOPPED },
    ],
  },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export function isItemReadyForPlate(item) {
  if (!item || item.kind !== 'ingredient') return false;
  const spec = INGREDIENTS[item.id];
  return Boolean(spec && item.state === spec.readyState);
}

export function canAddToPlate(plate, item) {
  if (!plate || plate.kind !== 'plate') return false;
  if (!isItemReadyForPlate(item)) return false;
  if (plate.items.length >= 4) return false;
  if (plate.items.some((existing) => existing.id === item.id)) return false;
  return true;
}

export function matchRecipe(plateItems) {
  if (!plateItems || plateItems.length === 0) return null;
  for (const recipe of RECIPES) {
    if (recipe.items.length !== plateItems.length) continue;
    const matched = recipe.items.every((req) =>
      plateItems.some((p) => p.id === req.id && p.state === req.state),
    );
    if (matched) return recipe;
  }
  return null;
}

export function findPartialRecipeMatches(plateItems) {
  if (!plateItems || plateItems.length === 0) return RECIPES;
  return RECIPES.filter((recipe) =>
    plateItems.every((p) =>
      recipe.items.some((req) => req.id === p.id && req.state === p.state),
    ),
  );
}

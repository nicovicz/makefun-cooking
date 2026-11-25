// Game state factory, shift presets, order spawning, and deterministic screenshot scenes.

import { createKitchenLayout, findStationAt, tileToWorld } from './kitchen.js';
import { PREP, RECIPES, RECIPE_BY_ID } from './recipes.js';

export const SHIFTS = [
  { id: 'lunch', name: 'Lunch Prep', duration: 120, spawnEvery: 14, maxOrders: 4, target: 700, desc: 'Steady tickets · Learn the pass' },
  { id: 'dinner', name: 'Dinner Rush', duration: 150, spawnEvery: 11, maxOrders: 5, target: 1100, desc: 'Hot woks · Combos & VIP rush' },
  { id: 'midnight', name: 'Midnight Wok', duration: 150, spawnEvery: 9, maxOrders: 5, target: 1450, desc: 'Full menu · High-heat frenzy' },
];

export function createIngredient(id, state = PREP.RAW) {
  return { kind: 'ingredient', id, state };
}

export function createPlate(items = []) {
  return { kind: 'plate', items: items.map((it) => ({ ...it })) };
}

export function createRng(seed = 1) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createGameState(seed = 1) {
  const stations = createKitchenLayout();
  const spawn = tileToWorld(5, 3);
  return {
    mode: 'title', // 'title' | 'playing' | 'summary'
    shiftIndex: 1,
    shift: SHIFTS[1],
    rng: createRng(seed),
    time: 0,
    timeLeft: SHIFTS[1].duration,
    wave: 1,
    rushActive: false,
    score: 0,
    tips: 0,
    combo: 0,
    bestCombo: 0,
    servedCount: 0,
    expiredCount: 0,
    burntCount: 0,
    servedByRecipe: {},
    nextOrderId: 1,
    spawnTimer: 1.2,
    orders: [],
    stations,
    chef: {
      x: spawn.x,
      y: spawn.y,
      facingX: 0,
      facingY: -1,
      held: null,
      dashTimer: 0,
      dashCooldown: 0,
      chopAnim: 0,
      walkCycle: 0,
      moveTarget: null,
      pendingStation: null,
    },
    particles: [],
    floaters: [],
    screenShake: 0,
    toast: null,
    muted: false,
  };
}

export function spawnOrder(state, forcedRecipeId = null, customTimeRatio = 1) {
  if (state.orders.length >= state.shift.maxOrders) return null;
  let recipe;
  if (forcedRecipeId && RECIPE_BY_ID[forcedRecipeId]) {
    recipe = RECIPE_BY_ID[forcedRecipeId];
  } else {
    const eligible = RECIPES.filter((r) => r.minWave <= state.wave);
    recipe = eligible[Math.floor(state.rng() * eligible.length)] ?? RECIPES[0];
  }
  const isVip = state.wave >= 2 && state.rng() < 0.22;
  const maxTime = recipe.patience * (isVip ? 0.85 : 1);
  const order = {
    id: state.nextOrderId++,
    recipe,
    timeLeft: maxTime * customTimeRatio,
    maxTime,
    isVip,
    flash: 0.45,
  };
  state.orders.push(order);
  return order;
}

export function startShift(state, shiftIndex = state.shiftIndex) {
  state.shiftIndex = shiftIndex;
  state.shift = SHIFTS[shiftIndex] ?? SHIFTS[1];
  state.mode = 'playing';
  state.time = 0;
  state.timeLeft = state.shift.duration;
  state.wave = 1;
  state.rushActive = false;
  state.score = 0;
  state.tips = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.servedCount = 0;
  state.expiredCount = 0;
  state.burntCount = 0;
  state.servedByRecipe = {};
  state.orders = [];
  state.particles = [];
  state.floaters = [];
  state.stations = createKitchenLayout();
  state.spawnTimer = 6.5;

  const spawn = tileToWorld(5, 3);
  state.chef.x = spawn.x;
  state.chef.y = spawn.y;
  state.chef.facingX = 0;
  state.chef.facingY = -1;
  state.chef.held = null;
  state.chef.moveTarget = null;
  state.chef.pendingStation = null;

  // Pre-place two clean plates on the central assembly counters so the kitchen reads immediately
  const asm1 = findStationAt(state.stations, 5, 2);
  const asm2 = findStationAt(state.stations, 6, 2);
  if (asm1) asm1.item = createPlate();
  if (asm2) asm2.item = createPlate();

  spawnOrder(state, 'satay-bowl', 1);
  spawnOrder(state, 'chili-noodle', 0.92);
}

// Populates live, authentic gameplay states for browser screenshot captures (?shot=...).
export function applyShotPreset(state, shot) {
  if (shot === 'title') {
    startShift(state, 1);
    state.mode = 'title';
    populateMidServiceKitchen(state);
    return;
  }
  if (shot === 'cover') {
    startShift(state, 1);
    state.time = 46;
    state.timeLeft = 104;
    state.wave = 2;
    state.score = 685;
    state.tips = 125;
    state.combo = 3;
    state.bestCombo = 3;
    state.servedCount = 5;
    populateMidServiceKitchen(state);
    return;
  }
  if (shot === 'rush') {
    startShift(state, 2);
    state.time = 74;
    state.timeLeft = 52;
    state.wave = 3;
    state.rushActive = true;
    state.score = 1140;
    state.tips = 240;
    state.combo = 5;
    state.bestCombo = 5;
    state.servedCount = 8;
    populateRushKitchen(state);
    return;
  }
  if (shot === 'summary') {
    startShift(state, 1);
    state.mode = 'summary';
    state.timeLeft = 0;
    state.score = 1385;
    state.tips = 295;
    state.bestCombo = 6;
    state.servedCount = 10;
    state.expiredCount = 1;
    state.burntCount = 0;
    state.servedByRecipe = {
      'satay-bowl': 3,
      'chili-noodle': 2,
      'skewer-noodle': 2,
      'golden-fried-rice': 2,
      'midnight-special': 1,
    };
    populateMidServiceKitchen(state);
  }
}

function populateMidServiceKitchen(state) {
  state.orders = [];
  state.nextOrderId = 1;
  spawnOrder(state, 'satay-bowl', 0.78);
  spawnOrder(state, 'chili-noodle', 0.62);
  spawnOrder(state, 'golden-fried-rice', 0.88);
  spawnOrder(state, 'skewer-noodle', 0.42);
  state.orders[2].isVip = true;

  // Ingredients on prep counters
  const prepTop = findStationAt(state.stations, 6, 0);
  if (prepTop) prepTop.item = createIngredient('scallion', PREP.CHOPPED);

  const garnish = findStationAt(state.stations, 0, 2);
  if (garnish) garnish.item = createIngredient('chili', PREP.CHOPPED);

  // Sizzling wok & grill mid-cook
  const wok1 = findStationAt(state.stations, 7, 0);
  if (wok1) {
    wok1.item = createIngredient('skewer', PREP.RAW);
    wok1.cookProgress = 2.6;
  }
  const grill = findStationAt(state.stations, 8, 0);
  if (grill) {
    grill.item = createIngredient('egg', PREP.SEARED);
    grill.cookProgress = 3.2;
  }

  // Chopping board mid-chop
  const chop1 = findStationAt(state.stations, 3, 2);
  if (chop1) {
    chop1.item = createIngredient('chili', PREP.RAW);
    chop1.chopProgress = 2;
  }
  const chop2 = findStationAt(state.stations, 4, 2);
  if (chop2) {
    chop2.item = createIngredient('scallion', PREP.CHOPPED);
  }

  // One dish MID-ASSEMBLY on central counter (Rice + Seared Satay, needs chopped scallion!)
  const asm1 = findStationAt(state.stations, 5, 2);
  if (asm1) {
    asm1.item = createPlate([
      createIngredient('rice', PREP.RAW),
      createIngredient('skewer', PREP.SEARED),
    ]);
  }
  // Second dish mid-assembly
  const asm2 = findStationAt(state.stations, 6, 2);
  if (asm2) {
    asm2.item = createPlate([
      createIngredient('noodle', PREP.RAW),
      createIngredient('egg', PREP.SEARED),
    ]);
  }

  // Completed steaming plate READY TO SERVE right beside the brass Service Pass!
  const readyLeft = findStationAt(state.stations, 4, 5);
  if (readyLeft) {
    readyLeft.item = createPlate([
      createIngredient('rice', PREP.RAW),
      createIngredient('skewer', PREP.SEARED),
      createIngredient('scallion', PREP.CHOPPED),
    ]);
  }
  const pass1 = findStationAt(state.stations, 5, 5);
  if (pass1) pass1.bellFlash = 0.65;

  // Chef carrying chopped chili towards the mid-assembly plate
  const pos = tileToWorld(5, 3);
  state.chef.x = pos.x + 12;
  state.chef.y = pos.y + 6;
  state.chef.facingX = 0;
  state.chef.facingY = -1;
  state.chef.held = createIngredient('scallion', PREP.CHOPPED);

  // Ambient steam & sizzle particles
  const wokPos = tileToWorld(7, 0);
  const readyPos = tileToWorld(4, 5);
  state.particles = [
    { x: wokPos.x - 10, y: wokPos.y - 18, vx: -8, vy: -32, life: 0.7, maxLife: 1.0, size: 8, color: '#ffd27d', kind: 'ember' },
    { x: wokPos.x + 12, y: wokPos.y - 24, vx: 10, vy: -38, life: 0.6, maxLife: 1.0, size: 11, color: 'rgba(255,244,230,0.45)', kind: 'steam' },
    { x: readyPos.x - 6, y: readyPos.y - 22, vx: -4, vy: -24, life: 0.8, maxLife: 1.1, size: 12, color: 'rgba(255,248,235,0.5)', kind: 'steam' },
    { x: readyPos.x + 10, y: readyPos.y - 30, vx: 5, vy: -28, life: 0.55, maxLife: 1.1, size: 14, color: 'rgba(255,248,235,0.4)', kind: 'steam' },
  ];
  state.floaters = [
    { x: tileToWorld(5, 5).x, y: tileToWorld(5, 5).y - 34, text: '+$155 · COMBO x3!', color: '#ffd659', life: 1.1, maxLife: 1.4 },
  ];
}

function populateRushKitchen(state) {
  populateMidServiceKitchen(state);
  state.orders = [];
  state.nextOrderId = 1;
  spawnOrder(state, 'midnight-special', 0.24);
  spawnOrder(state, 'golden-fried-rice', 0.54);
  spawnOrder(state, 'ember-platter', 0.72);
  spawnOrder(state, 'satay-bowl', 0.85);
  spawnOrder(state, 'chili-noodle', 0.94);
  state.orders[0].isVip = true;

  // Chef actively chopping chili at board (3, 2) with flying chop slices
  const chefPos = tileToWorld(3, 1);
  state.chef.x = chefPos.x;
  state.chef.y = chefPos.y + 10;
  state.chef.facingX = 0;
  state.chef.facingY = 1;
  state.chef.held = null;
  state.chef.chopAnim = 0.85;

  const chopPos = tileToWorld(3, 2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    state.particles.push({
      x: chopPos.x + Math.cos(a) * 14,
      y: chopPos.y + Math.sin(a) * 10 - 8,
      vx: Math.cos(a) * 45,
      vy: Math.sin(a) * 45 - 30,
      life: 0.45,
      maxLife: 0.6,
      size: 6,
      color: i % 2 === 0 ? '#ff5142' : '#ffcf54',
      kind: 'slice',
    });
  }

  // Wok 2 burning warning!
  const wok2 = findStationAt(state.stations, 9, 0);
  if (wok2) {
    wok2.item = createIngredient('skewer', PREP.SEARED);
    wok2.cookProgress = 5.4;
  }

  state.floaters = [
    { x: chopPos.x, y: chopPos.y - 36, text: 'CHOP! 3/4', color: '#ff8a65', life: 0.9, maxLife: 1.1 },
    { x: tileToWorld(5, 5).x, y: tileToWorld(5, 5).y - 42, text: '+$245 · RUSH x5!', color: '#ffe066', life: 1.0, maxLife: 1.4 },
  ];
}

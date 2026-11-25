// Kitchen simulation: movement, chopping, wok searing, plating, order timers, and serving.

import {
  STATION_TYPE,
  getInteractTarget,
  isPointWalkable,
  tileToWorld,
} from './kitchen.js';
import {
  INGREDIENTS,
  PREP,
  canAddToPlate,
  isItemReadyForPlate,
  matchRecipe,
} from './recipes.js';
import { createIngredient, createPlate, spawnOrder } from './state.js';

export function emitParticles(state, x, y, count, color, kind = 'spark') {
  for (let i = 0; i < count; i++) {
    const angle = state.rng() * Math.PI * 2;
    const speed = 28 + state.rng() * 75;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (kind === 'steam' ? 35 : 22),
      life: 0.35 + state.rng() * 0.4,
      maxLife: 0.75,
      size: kind === 'steam' ? 8 + state.rng() * 6 : 4 + state.rng() * 3,
      color,
      kind,
    });
  }
}

export function addFloatingText(state, x, y, text, color = '#ffe066') {
  state.floaters.push({ x, y, text, color, life: 1.25, maxLife: 1.25 });
}

export function performPrimaryAction(state, audio) {
  if (state.mode !== 'playing') return;
  const target = getInteractTarget(state.stations, state.chef);
  if (!target) return;

  const held = state.chef.held;
  const center = tileToWorld(target.col, target.row);

  // 1. Trash bin discards held item (or empties held plate)
  if (target.type === STATION_TYPE.TRASH) {
    if (!held) return;
    if (held.kind === 'plate') {
      held.items = [];
      addFloatingText(state, center.x, center.y - 24, 'PLATE CLEARED', '#d4b89c');
    } else {
      state.chef.held = null;
      addFloatingText(state, center.x, center.y - 24, 'TOSSED', '#d4b89c');
    }
    audio.playTrash();
    emitParticles(state, center.x, center.y - 10, 6, '#9c8672', 'spark');
    return;
  }

  // 2. Service Pass serves a plated dish
  if (target.type === STATION_TYPE.PASS) {
    if (held && held.kind === 'plate' && held.items.length > 0) {
      servePlate(state, target, held, audio);
    } else {
      addFloatingText(state, center.x, center.y - 26, 'HOLD A PLATED DISH', '#f2b880');
    }
    return;
  }

  // 3. Ingredient crate dispenses fresh ingredient if hands empty (or directly onto plate if ready base!)
  if (target.type === STATION_TYPE.CRATE) {
    const fresh = createIngredient(target.ingredient, PREP.RAW);
    if (!held) {
      state.chef.held = fresh;
      audio.playPickup();
      emitParticles(state, center.x, center.y - 12, 4, INGREDIENTS[target.ingredient].color);
      return;
    }
    if (held.kind === 'plate' && canAddToPlate(held, fresh)) {
      held.items.push(fresh);
      audio.playPlate();
      emitParticles(state, center.x, center.y - 12, 6, '#fff4d2');
      return;
    }
    return;
  }

  // 4. Plate stack gives a clean plate (or plates a ready ingredient in hand!)
  if (target.type === STATION_TYPE.PLATES) {
    if (!held) {
      state.chef.held = createPlate();
      audio.playPlate();
      return;
    }
    if (held.kind === 'ingredient' && isItemReadyForPlate(held)) {
      state.chef.held = createPlate([held]);
      audio.playPlate();
      emitParticles(state, center.x, center.y - 12, 6, '#fff4d2');
      return;
    }
    return;
  }

  // 5. Wok / Grill cooks raw cookable ingredients
  if (target.type === STATION_TYPE.WOK || target.type === STATION_TYPE.GRILL) {
    if (!target.item && held && held.kind === 'ingredient') {
      const spec = INGREDIENTS[held.id];
      if (spec.needsPrep === 'cook' && held.state === PREP.RAW) {
        target.item = held;
        target.cookProgress = 0;
        state.chef.held = null;
        audio.playSizzle();
        emitParticles(state, center.x, center.y - 10, 8, '#ffbe55', 'ember');
      } else {
        addFloatingText(state, center.x, center.y - 26, 'SEAR SATAY OR EGG', '#ffb469');
      }
      return;
    }
    if (target.item) {
      if (!held) {
        state.chef.held = target.item;
        target.item = null;
        target.cookProgress = 0;
        audio.playPickup();
        return;
      }
      if (held.kind === 'plate' && canAddToPlate(held, target.item)) {
        held.items.push(target.item);
        target.item = null;
        target.cookProgress = 0;
        audio.playPlate();
        emitParticles(state, center.x, center.y - 12, 7, '#ffe08a');
        return;
      }
    }
    return;
  }

  // 6. Chopping Board: place raw choppable item, or tap Space/E to chop when hands empty!
  if (target.type === STATION_TYPE.CHOP) {
    if (!target.item && held && held.kind === 'ingredient') {
      target.item = held;
      target.chopProgress = 0;
      state.chef.held = null;
      audio.playPickup();
      return;
    }
    if (target.item) {
      const spec = INGREDIENTS[target.item.id];
      if (!held && spec && spec.needsPrep === 'chop' && target.item.state === PREP.RAW) {
        performChopOnStation(state, target, audio);
        return;
      }
      if (!held) {
        state.chef.held = target.item;
        target.item = null;
        target.chopProgress = 0;
        audio.playPickup();
        return;
      }
      if (held.kind === 'plate' && canAddToPlate(held, target.item)) {
        held.items.push(target.item);
        target.item = null;
        target.chopProgress = 0;
        audio.playPlate();
        emitParticles(state, center.x, center.y - 12, 6, '#a5f09c');
        return;
      }
    }
    return;
  }

  // 7. General Counter / Assembly Counter
  if (target.type === STATION_TYPE.COUNTER) {
    if (!target.item && held) {
      target.item = held;
      state.chef.held = null;
      audio.playPickup();
      return;
    }
    if (target.item && !held) {
      state.chef.held = target.item;
      target.item = null;
      audio.playPickup();
      return;
    }
    if (target.item && held) {
      // Combine ingredient in hand onto plate on counter
      if (target.item.kind === 'plate' && canAddToPlate(target.item, held)) {
        target.item.items.push(held);
        state.chef.held = null;
        audio.playPlate();
        emitParticles(state, center.x, center.y - 14, 7, '#fff2c2');
        const matched = matchRecipe(target.item.items);
        if (matched) {
          addFloatingText(state, center.x, center.y - 30, `${matched.shortName.toUpperCase()} READY!`, '#8ff59d');
        }
        return;
      }
      // Combine ingredient on counter onto plate in hand
      if (held.kind === 'plate' && canAddToPlate(held, target.item)) {
        held.items.push(target.item);
        target.item = null;
        audio.playPlate();
        emitParticles(state, center.x, center.y - 14, 7, '#fff2c2');
        const matched = matchRecipe(held.items);
        if (matched) {
          addFloatingText(state, center.x, center.y - 30, `${matched.shortName.toUpperCase()} READY!`, '#8ff59d');
        }
        return;
      }
      // Swap items
      const tmp = target.item;
      target.item = held;
      state.chef.held = tmp;
      audio.playPickup();
    }
  }
}

export function performChopAction(state, audio) {
  if (state.mode !== 'playing') return;
  const target = getInteractTarget(state.stations, state.chef);
  if (!target || target.type !== STATION_TYPE.CHOP || !target.item) return;
  performChopOnStation(state, target, audio);
}

function performChopOnStation(state, station, audio) {
  const item = station.item;
  const spec = INGREDIENTS[item.id];
  if (!spec || spec.needsPrep !== 'chop' || item.state !== PREP.RAW) return;
  station.chopProgress += 1;
  state.chef.chopAnim = 1.0;
  audio.playChop();
  const center = tileToWorld(station.col, station.row);
  emitParticles(state, center.x, center.y - 8, 6, spec.color, 'slice');

  if (station.chopProgress >= spec.chopSteps) {
    item.state = PREP.CHOPPED;
    station.chopProgress = spec.chopSteps;
    addFloatingText(state, center.x, center.y - 28, `${spec.short.toUpperCase()} CHOPPED!`, '#a4f59f');
  }
}

function servePlate(state, passStation, plate, audio) {
  const center = tileToWorld(passStation.col, passStation.row);
  const recipe = matchRecipe(plate.items);
  if (!recipe) {
    addFloatingText(state, center.x, center.y - 28, 'NO MATCHING RECIPE', '#ff7b6b');
    audio.playBurnAlert();
    return;
  }

  // Match the most urgent open ticket for this recipe
  let bestIdx = -1;
  let lowestTime = Infinity;
  for (let i = 0; i < state.orders.length; i++) {
    if (state.orders[i].recipe.id === recipe.id && state.orders[i].timeLeft < lowestTime) {
      lowestTime = state.orders[i].timeLeft;
      bestIdx = i;
    }
  }

  if (bestIdx === -1) {
    addFloatingText(state, center.x, center.y - 28, 'NOT ON ORDER BOARD', '#ffb86c');
    audio.playBurnAlert();
    return;
  }

  const order = state.orders.splice(bestIdx, 1)[0];
  state.chef.held = null;
  state.servedCount += 1;
  state.combo += 1;
  if (state.combo > state.bestCombo) state.bestCombo = state.combo;
  state.servedByRecipe[recipe.id] = (state.servedByRecipe[recipe.id] || 0) + 1;

  const speedRatio = Math.max(0, order.timeLeft / order.maxTime);
  const tip = Math.round(recipe.price * 0.35 * speedRatio + (order.isVip ? 45 : 0));
  const comboBonus = Math.min(state.combo - 1, 5) * 15;
  const total = recipe.price + tip + comboBonus;

  state.score += total;
  state.tips += tip + comboBonus;
  passStation.bellFlash = 1.0;
  state.screenShake = 0.24;

  audio.playServeBell(state.combo);
  emitParticles(state, center.x, center.y - 16, 16, '#ffe066', 'spark');
  const label = state.combo > 1 ? `+$${total} · COMBO x${state.combo}!` : `+$${total}`;
  addFloatingText(state, center.x, center.y - 34, label, '#ffe066');

  if (state.orders.length === 0) {
    spawnOrder(state);
    state.spawnTimer = 4.5;
  }
}

export function stepSimulation(state, dt, keys, audio) {
  state.time += dt;
  if (state.screenShake > 0) state.screenShake = Math.max(0, state.screenShake - dt * 1.8);
  if (state.chef.chopAnim > 0) state.chef.chopAnim = Math.max(0, state.chef.chopAnim - dt * 5.5);

  // Update particles & floaters even on title/summary for lively ambiance
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.floaters.length - 1; i >= 0; i--) {
    const f = state.floaters[i];
    f.y -= 28 * dt;
    f.life -= dt;
    if (f.life <= 0) state.floaters.splice(i, 1);
  }

  if (state.mode !== 'playing') return;

  // Shift clock & wave progression
  state.timeLeft = Math.max(0, state.timeLeft - dt);
  const elapsed = state.shift.duration - state.timeLeft;
  state.wave = elapsed > state.shift.duration * 0.62 ? 3 : elapsed > state.shift.duration * 0.28 ? 2 : 1;
  state.rushActive = state.timeLeft <= 45;

  if (state.timeLeft <= 0) {
    state.mode = 'summary';
    return;
  }

  // Chef movement (keyboard overrides mouse waypoint)
  let mx = 0;
  let my = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;

  const chef = state.chef;
  if (chef.dashCooldown > 0) chef.dashCooldown = Math.max(0, chef.dashCooldown - dt);
  if (chef.dashTimer > 0) chef.dashTimer = Math.max(0, chef.dashTimer - dt);

  if (mx !== 0 || my !== 0) {
    chef.moveTarget = null;
    chef.pendingStation = null;
  } else if (chef.moveTarget) {
    const dx = chef.moveTarget.x - chef.x;
    const dy = chef.moveTarget.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 14) {
      chef.moveTarget = null;
      if (chef.pendingStation) {
        const sc = tileToWorld(chef.pendingStation.col, chef.pendingStation.row);
        const fdx = sc.x - chef.x;
        const fdy = sc.y - chef.y;
        const fl = Math.hypot(fdx, fdy) || 1;
        chef.facingX = fdx / fl;
        chef.facingY = fdy / fl;
        chef.pendingStation = null;
        performPrimaryAction(state, audio);
      }
    } else {
      mx = dx / dist;
      my = dy / dist;
    }
  }

  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    chef.facingX = mx;
    chef.facingY = my;
    const speed = chef.dashTimer > 0 ? 520 : 285;
    const nx = chef.x + mx * speed * dt;
    const ny = chef.y + my * speed * dt;
    if (isPointWalkable(state.stations, nx, chef.y)) chef.x = nx;
    if (isPointWalkable(state.stations, chef.x, ny)) chef.y = ny;
    chef.walkCycle += dt * (chef.dashTimer > 0 ? 18 : 11);
  }

  // Update stations (wok & grill cooking, bell flash, ambient steam)
  for (let i = 0; i < state.stations.length; i++) {
    const s = state.stations[i];
    if (s.bellFlash > 0) s.bellFlash = Math.max(0, s.bellFlash - dt * 1.4);

    if ((s.type === STATION_TYPE.WOK || s.type === STATION_TYPE.GRILL) && s.item) {
      const spec = INGREDIENTS[s.item.id];
      if (spec && spec.needsPrep === 'cook' && s.item.state !== PREP.BURNT) {
        s.cookProgress += dt;
        const center = tileToWorld(s.col, s.row);
        if (state.rng() < dt * 7) {
          const col = s.cookProgress > spec.cookTime + 1.2 ? 'rgba(60,50,45,0.65)' : 'rgba(255,236,198,0.5)';
          emitParticles(state, center.x + (state.rng() - 0.5) * 20, center.y - 16, 1, col, 'steam');
        }
        if (s.item.state === PREP.RAW && s.cookProgress >= spec.cookTime) {
          s.item.state = PREP.SEARED;
          audio.playSizzle();
          addFloatingText(state, center.x, center.y - 28, `${spec.short.toUpperCase()} SEARED!`, '#ffd466');
        } else if (s.item.state === PREP.SEARED && s.cookProgress >= spec.burnTime) {
          s.item.state = PREP.BURNT;
          state.burntCount += 1;
          audio.playBurnAlert();
          addFloatingText(state, center.x, center.y - 28, 'BURNT!', '#ff5c4d');
        }
      }
    }
  }

  // Update order timers & spawn new tickets
  const pace = state.rushActive ? 0.72 : 1;
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnOrder(state);
    state.spawnTimer = state.shift.spawnEvery * pace;
  }

  for (let i = state.orders.length - 1; i >= 0; i--) {
    const o = state.orders[i];
    if (o.flash > 0) o.flash = Math.max(0, o.flash - dt);
    o.timeLeft -= dt;
    if (o.timeLeft <= 0) {
      state.orders.splice(i, 1);
      state.expiredCount += 1;
      state.combo = 0;
      state.score = Math.max(0, state.score - 35);
      audio.playBurnAlert();
      addFloatingText(state, 320 + i * 190, 128, 'ORDER MISSED -$35', '#ff6b57');
    }
  }
}

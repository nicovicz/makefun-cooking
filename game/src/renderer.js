// Full scene renderer: warm night-market kitchen, order rail, HUD, title, and shift summary.

import { drawChef, drawIngredient, drawParticlesAndFloaters, drawPlate, drawStation, roundRect } from './art.js';
import { GRID_COLS, GRID_ROWS, KITCHEN_X, KITCHEN_Y, TILE_SIZE, getInteractTarget } from './kitchen.js';
import { INGREDIENTS, RECIPES, RECIPE_BY_ID } from './recipes.js';
import { SHIFTS } from './state.js';

export function renderGame(ctx, state) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.save();
  if (state.screenShake > 0) {
    const mag = state.screenShake * 7;
    ctx.translate((Math.sin(state.time * 60) * mag), (Math.cos(state.time * 52) * mag));
  }

  drawBackdropAndFloor(ctx, W, H, state.time);
  drawStationsAndChef(ctx, state);
  drawParticlesAndFloaters(ctx, state);
  drawOrderRailAndHud(ctx, state, W);
  drawFooterBar(ctx, state, W, H);

  ctx.restore();

  if (state.mode === 'title') {
    drawTitleOverlay(ctx, state, W, H);
  } else if (state.mode === 'summary') {
    drawShiftSummary(ctx, state, W, H);
  }
}

function drawBackdropAndFloor(ctx, W, H, time) {
  // Deep warm night-market wood backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#24160f');
  bg.addColorStop(1, '#140c08');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Checkered slate & terracotta kitchen floor
  const floorW = GRID_COLS * TILE_SIZE;
  const floorH = GRID_ROWS * TILE_SIZE;
  ctx.save();
  roundRect(ctx, KITCHEN_X - 8, KITCHEN_Y - 8, floorW + 16, floorH + 16, 14);
  ctx.fillStyle = '#332014';
  ctx.fill();
  ctx.strokeStyle = '#6b4528';
  ctx.lineWidth = 3;
  ctx.stroke();

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tx = KITCHEN_X + c * TILE_SIZE;
      const ty = KITCHEN_Y + r * TILE_SIZE;
      ctx.fillStyle = (r + c) % 2 === 0 ? '#3b2b22' : '#4a362a';
      ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = 'rgba(0,0,0,0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
    }
  }

  // Warm hanging paper lantern glow in corners of the kitchen
  const pulse = 0.85 + Math.sin(time * 2.4) * 0.1;
  for (const [lx, ly] of [[KITCHEN_X + 70, KITCHEN_Y + 40], [KITCHEN_X + floorW - 70, KITCHEN_Y + 40], [W * 0.5, KITCHEN_Y + floorH - 40]]) {
    const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, 240);
    g.addColorStop(0, `rgba(255, 178, 72, ${0.14 * pulse})`);
    g.addColorStop(1, 'rgba(255, 178, 72, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(KITCHEN_X, KITCHEN_Y, floorW, floorH);
  }
  ctx.restore();
}

function drawStationsAndChef(ctx, state) {
  const target = state.mode === 'playing' ? getInteractTarget(state.stations, state.chef) : null;
  for (let i = 0; i < state.stations.length; i++) {
    const s = state.stations[i];
    drawStation(ctx, s, target === s, state.time);
  }
  drawChef(ctx, state.chef, state.time);
}

function drawOrderRailAndHud(ctx, state, W) {
  // Dark lacquer timber ticket rail across the top
  const railH = 132;
  ctx.fillStyle = '#1d120c';
  ctx.fillRect(0, 0, W, railH);
  ctx.fillStyle = '#87572a';
  ctx.fillRect(0, railH - 4, W, 4);
  ctx.fillStyle = '#c9933c';
  ctx.fillRect(0, 14, W, 4);

  // Order tickets (left to right, up to 5)
  const cardW = 186;
  const cardH = 112;
  const startX = 18;
  for (let i = 0; i < state.orders.length; i++) {
    const o = state.orders[i];
    const x = startX + i * (cardW + 12);
    const y = 10;
    const ratio = Math.max(0, Math.min(1, o.timeLeft / o.maxTime));
    const urgent = ratio < 0.3;

    // Hanging ticket clip
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(x + cardW * 0.5 - 14, 3, 28, 10);

    // Paper ticket body
    roundRect(ctx, x, y, cardW, cardH, 9);
    ctx.fillStyle = o.isVip ? '#fff3d6' : '#fbf4e6';
    ctx.fill();
    ctx.lineWidth = urgent ? 3 : 2;
    ctx.strokeStyle = urgent ? '#e6392e' : o.isVip ? '#d99322' : '#bda88a';
    ctx.stroke();

    // Header band with recipe name & price
    roundRect(ctx, x + 4, y + 4, cardW - 8, 25, 6);
    ctx.fillStyle = o.recipe.badgeColor;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const title = o.isVip ? `★ ${o.recipe.shortName}` : o.recipe.shortName;
    ctx.fillText(title, x + 10, y + 16.5);
    ctx.textAlign = 'right';
    ctx.fillText(`$${o.recipe.price}`, x + cardW - 10, y + 16.5);

    // Mini plated dish preview on left
    drawPlate(ctx, { kind: 'plate', items: o.recipe.items }, x + 36, y + 63, 0.72, state.time);

    // Required ingredients list on right
    const items = o.recipe.items;
    for (let k = 0; k < items.length; k++) {
      const req = items[k];
      const spec = INGREDIENTS[req.id];
      const ix = x + 78 + (k % 2) * 52;
      const iy = y + 48 + Math.floor(k / 2) * 28;
      roundRect(ctx, ix - 16, iy - 12, 48, 24, 5);
      ctx.fillStyle = 'rgba(70, 44, 24, 0.1)';
      ctx.fill();
      drawIngredient(ctx, { kind: 'ingredient', id: req.id, state: req.state }, ix - 3, iy, 0.45);
      ctx.fillStyle = '#402818';
      ctx.font = '700 9.5px system-ui, sans-serif';
      ctx.textAlign = 'left';
      const prepTag = spec.needsPrep === 'cook' ? '🔥' : spec.needsPrep === 'chop' ? '🔪' : '';
      ctx.fillText(prepTag || spec.short.slice(0, 4), ix + 10, iy + 0.5);
    }

    // Countdown urgency bar at bottom of ticket
    const barX = x + 8;
    const barY = y + cardH - 14;
    const barW = cardW - 16;
    roundRect(ctx, barX, barY, barW, 8, 4);
    ctx.fillStyle = '#dfd2bc';
    ctx.fill();
    roundRect(ctx, barX, barY, Math.max(4, barW * ratio), 8, 4);
    ctx.fillStyle = ratio > 0.5 ? '#2fb859' : ratio > 0.25 ? '#f0a629' : '#e6392e';
    ctx.fill();
  }

  // Right HUD panel: Timer, Score, Combo & Rush status
  const hudX = W - 266;
  roundRect(ctx, hudX, 10, 250, 112, 10);
  ctx.fillStyle = '#2b1b12';
  ctx.fill();
  ctx.strokeStyle = state.rushActive ? '#ff6a3d' : '#c9933c';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Shift clock
  const mins = Math.floor(state.timeLeft / 60);
  const secs = Math.ceil(state.timeLeft % 60);
  const clockStr = `${mins}:${String(secs % 60).padStart(2, '0')}`;
  ctx.fillStyle = state.timeLeft <= 20 ? '#ff5c4d' : '#fff3d6';
  ctx.font = '900 30px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(clockStr, hudX + 16, 20);

  // Score
  ctx.fillStyle = '#ffd659';
  ctx.font = '900 28px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`$${state.score}`, hudX + 234, 21);

  // Sub-labels
  ctx.fillStyle = '#cbb396';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.shift.name.toUpperCase(), hudX + 16, 56);
  ctx.textAlign = 'right';
  ctx.fillText(`SERVED ${state.servedCount}`, hudX + 234, 56);

  // Combo & Rush pill
  roundRect(ctx, hudX + 14, 78, 222, 30, 7);
  ctx.fillStyle = state.rushActive ? 'rgba(230, 72, 46, 0.35)' : 'rgba(242, 193, 78, 0.16)';
  ctx.fill();
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = state.rushActive ? '#ffb36b' : '#ffe082';
  const statusText = state.rushActive
    ? `🔥 SERVICE RUSH · COMBO x${Math.max(1, state.combo)}`
    : `WAVE ${state.wave} · COMBO x${Math.max(1, state.combo)}`;
  ctx.fillText(statusText, hudX + 125, 93);
}

function drawFooterBar(ctx, state, W, H) {
  ctx.fillStyle = 'rgba(16, 10, 7, 0.88)';
  ctx.fillRect(0, H - 28, W, 28);
  ctx.fillStyle = '#d9c4aa';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const soundTag = state.muted ? 'M: Sound OFF' : 'M: Sound ON';
  ctx.fillText(
    `WASD / Arrows / Click: Move   ·   SPACE / E: Pick · Chop · Plate · Serve   ·   F: Chop   ·   SHIFT: Dash   ·   ${soundTag}   ·   R: Restart`,
    W * 0.5,
    H - 14,
  );
}

function drawTitleOverlay(ctx, state, W, H) {
  ctx.fillStyle = 'rgba(14, 8, 5, 0.72)';
  ctx.fillRect(0, 0, W, H);

  // Decorative lantern card
  roundRect(ctx, 180, 92, W - 360, 520, 18);
  ctx.fillStyle = 'rgba(34, 21, 14, 0.96)';
  ctx.fill();
  ctx.strokeStyle = '#e5b14c';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f5b942';
  ctx.font = '800 14px system-ui, sans-serif';
  ctx.fillText('NIGHT MARKET WOK & GRILL', W * 0.5, 134);

  ctx.fillStyle = '#fff6e3';
  ctx.font = '900 54px system-ui, sans-serif';
  ctx.fillText('WARUNG EMBER', W * 0.5, 184);

  ctx.fillStyle = '#d9c2a6';
  ctx.font = '500 16px system-ui, sans-serif';
  ctx.fillText(
    'Chop fresh scallions & chilies, sear satay and crispy eggs over live embers, plate combos, and beat the rush.',
    W * 0.5,
    230,
  );

  // Featured dish previews
  for (let i = 0; i < 4; i++) {
    const r = RECIPES[i];
    const rx = 310 + i * 220;
    drawPlate(ctx, { kind: 'plate', items: r.items }, rx, 276, 0.75, state.time);
  }

  // 3 shift selection cards
  for (let i = 0; i < SHIFTS.length; i++) {
    const sh = SHIFTS[i];
    const cx = 240 + i * 280;
    const selected = i === state.shiftIndex;
    roundRect(ctx, cx, 318, 240, 112, 12);
    ctx.fillStyle = selected ? '#4f2f19' : '#261710';
    ctx.fill();
    ctx.strokeStyle = selected ? '#ffd659' : '#6b472b';
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.stroke();

    ctx.fillStyle = selected ? '#ffe066' : '#f2dec2';
    ctx.font = '800 19px system-ui, sans-serif';
    ctx.fillText(sh.name, cx + 120, 352);

    ctx.fillStyle = '#cbb396';
    ctx.font = '600 12.5px system-ui, sans-serif';
    ctx.fillText(sh.desc, cx + 120, 382);
    ctx.fillStyle = '#9ce8a4';
    ctx.fillText(`Goal $${sh.target} · ${sh.duration}s`, cx + 120, 408);
  }

  // Start button
  roundRect(ctx, 480, 464, 320, 62, 12);
  const btn = ctx.createLinearGradient(480, 464, 480, 526);
  btn.addColorStop(0, '#f5b942');
  btn.addColorStop(1, '#d97a26');
  ctx.fillStyle = btn;
  ctx.fill();
  ctx.fillStyle = '#1f1208';
  ctx.font = '900 22px system-ui, sans-serif';
  ctx.fillText('OPEN THE KITCHEN  [ENTER]', W * 0.5, 496);

  ctx.fillStyle = '#bfa68a';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('Keyboard: WASD / Arrows + Space / F / Shift   ·   Mouse: Click any station to move & act', W * 0.5, 566);
}

function drawShiftSummary(ctx, state, W, H) {
  ctx.fillStyle = 'rgba(12, 7, 4, 0.78)';
  ctx.fillRect(0, 0, W, H);

  roundRect(ctx, 260, 86, W - 520, 550, 18);
  ctx.fillStyle = 'rgba(34, 21, 14, 0.97)';
  ctx.fill();
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f5b942';
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.fillText(`${state.shift.name.toUpperCase()} COMPLETE`, W * 0.5, 126);

  ctx.fillStyle = '#fff6e3';
  ctx.font = '900 42px system-ui, sans-serif';
  ctx.fillText(`$${state.score} EARNED`, W * 0.5, 174);

  // Star rating based on shift target
  const stars = state.score >= state.shift.target ? 3 : state.score >= state.shift.target * 0.65 ? 2 : 1;
  for (let i = 0; i < 3; i++) {
    ctx.font = '900 44px system-ui, sans-serif';
    ctx.fillStyle = i < stars ? '#ffd659' : '#4f3a2c';
    ctx.fillText('★', W * 0.5 + (i - 1) * 64, 232);
  }

  // Stats grid
  const stats = [
    ['Dishes Served', String(state.servedCount)],
    ['Tips & Combos', `$${state.tips}`],
    ['Best Combo', `x${Math.max(1, state.bestCombo)}`],
    ['Missed / Burnt', `${state.expiredCount} / ${state.burntCount}`],
  ];
  for (let i = 0; i < stats.length; i++) {
    const sx = 305 + (i % 2) * 340;
    const sy = 286 + Math.floor(i / 2) * 68;
    roundRect(ctx, sx, sy, 310, 54, 10);
    ctx.fillStyle = '#261710';
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbb396';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText(stats[i][0], sx + 18, sy + 27);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff3d6';
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.fillText(stats[i][1], sx + 292, sy + 27);
  }

  // Dish breakdown pills
  const entries = Object.entries(state.servedByRecipe);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d9c2a6';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText('DISHES SERVED TONIGHT', W * 0.5, 444);

  const count = Math.min(entries.length, 5);
  for (let i = 0; i < count; i++) {
    const [rid, qty] = entries[i];
    const rec = RECIPE_BY_ID[rid];
    if (!rec) continue;
    const bx = W * 0.5 - ((count - 1) * 130) / 2 + i * 130;
    drawPlate(ctx, { kind: 'plate', items: rec.items }, bx, 486, 0.65, state.time);
    ctx.fillStyle = '#ffe082';
    ctx.font = '800 13px system-ui, sans-serif';
    ctx.fillText(`×${qty}`, bx, 518);
  }

  // Replay button
  roundRect(ctx, 455, 548, 370, 58, 12);
  ctx.fillStyle = '#f5b942';
  ctx.fill();
  ctx.fillStyle = '#1f1208';
  ctx.font = '900 20px system-ui, sans-serif';
  ctx.fillText('RUN NEXT SHIFT  [ENTER / CLICK]', W * 0.5, 577);
}

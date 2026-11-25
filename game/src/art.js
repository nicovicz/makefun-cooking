// Procedural 2D canvas art for Warung Ember: food, plates, stations, chef, and particles.

import { KITCHEN_X, KITCHEN_Y, STATION_TYPE, TILE_SIZE, tileToWorld } from './kitchen.js';
import { INGREDIENTS, PREP, matchRecipe } from './recipes.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawIngredient(ctx, item, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (item.state === PREP.BURNT) {
    ctx.fillStyle = '#241e1c';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 13, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3d38';
    ctx.beginPath();
    ctx.arc(-5, -3, 5, 0, Math.PI * 2);
    ctx.arc(6, 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  switch (item.id) {
    case 'rice': {
      ctx.fillStyle = '#e8dec8';
      ctx.beginPath();
      ctx.ellipse(0, 3, 19, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fcf8ee';
      ctx.beginPath();
      ctx.ellipse(0, -1, 17, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Subtle sesame & rice grain highlights
      ctx.fillStyle = '#d4c3a1';
      for (const [gx, gy] of [[-7, -2], [4, -4], [8, 2], [-3, 4], [1, -1]]) {
        ctx.beginPath();
        ctx.ellipse(gx, gy, 2.3, 1.1, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#2d241c';
      for (const [sx, sy] of [[-4, -5], [3, -2], [0, 2]]) {
        ctx.fillRect(sx, sy, 1.8, 1.8);
      }
      break;
    }
    case 'noodle': {
      ctx.strokeStyle = '#c9881e';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-16, i * 4.2);
        ctx.bezierCurveTo(-6, i * 4.2 - 5, 6, i * 4.2 + 5, 16, i * 4.2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#f8d26a';
      ctx.lineWidth = 2.6;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(-15, i * 4.2 - 1);
        ctx.bezierCurveTo(-5, i * 4.2 - 6, 5, i * 4.2 + 4, 15, i * 4.2 - 1);
        ctx.stroke();
      }
      break;
    }
    case 'skewer': {
      ctx.rotate(-0.45);
      // Bamboo stick
      ctx.strokeStyle = '#d8b474';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(22, 0);
      ctx.stroke();
      const seared = item.state === PREP.SEARED;
      const base = seared ? '#993d18' : '#e07a5f';
      const hi = seared ? '#d96b27' : '#f2a28c';
      for (const ox of [-10, 0, 10]) {
        roundRect(ctx, ox - 5, -7, 10, 14, 3);
        ctx.fillStyle = base;
        ctx.fill();
        ctx.fillStyle = hi;
        ctx.fillRect(ox - 3, -5, 4, 9);
        if (seared) {
          ctx.fillStyle = '#3b1508';
          ctx.fillRect(ox - 4, -2, 8, 2);
          ctx.fillRect(ox - 4, 2, 8, 1.8);
        }
      }
      break;
    }
    case 'egg': {
      const seared = item.state === PREP.SEARED;
      if (!seared) {
        ctx.fillStyle = '#efe0c8';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 15, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff9f0';
        ctx.beginPath();
        ctx.ellipse(-3, -4, 4, 6, 0.15, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Crispy lacy fried egg
        ctx.fillStyle = '#c98838';
        ctx.beginPath();
        ctx.ellipse(0, 1, 18, 15, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fffdf5';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15.5, 12.5, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e1b';
        ctx.beginPath();
        ctx.arc(2, -1, 7.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd666';
        ctx.beginPath();
        ctx.arc(0, -3, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'scallion': {
      if (item.state === PREP.CHOPPED) {
        for (const [rx, ry] of [[-9, -5], [4, -7], [9, 2], [-6, 6], [2, 3], [-1, -1]]) {
          ctx.fillStyle = '#2d7a2d';
          ctx.beginPath();
          ctx.arc(rx, ry, 4.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#8ef07d';
          ctx.beginPath();
          ctx.arc(rx, ry, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.rotate(-0.55);
        ctx.fillStyle = '#eef5df';
        roundRect(ctx, -18, -4, 11, 8, 3);
        ctx.fill();
        ctx.fillStyle = '#48b548';
        roundRect(ctx, -8, -4.5, 26, 4.2, 2);
        ctx.fill();
        ctx.fillStyle = '#338f36';
        roundRect(ctx, -8, 0.5, 24, 4, 2);
        ctx.fill();
      }
      break;
    }
    case 'chili': {
      if (item.state === PREP.CHOPPED) {
        for (const [rx, ry] of [[-8, -4], [6, -6], [8, 4], [-5, 6], [1, 1]]) {
          ctx.fillStyle = '#d9261c';
          ctx.beginPath();
          ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffe38c';
          ctx.beginPath();
          ctx.arc(rx, ry, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.rotate(-0.35);
        ctx.strokeStyle = '#3d9938';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-15, -4);
        ctx.lineTo(-10, -1);
        ctx.stroke();
        ctx.fillStyle = '#e63325';
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.quadraticCurveTo(4, -7, 17, 2);
        ctx.quadraticCurveTo(3, 8, -10, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff8a75';
        ctx.beginPath();
        ctx.ellipse(-1, -1.5, 6, 1.8, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }

  ctx.restore();
}

export function drawPlate(ctx, plate, x, y, scale = 1, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const matched = matchRecipe(plate.items);

  // Golden ready glow when dish matches a complete recipe
  if (matched) {
    const pulse = 0.72 + Math.sin(time * 6) * 0.18;
    const grad = ctx.createRadialGradient(0, 0, 14, 0, 0, 36);
    grad.addColorStop(0, `rgba(255, 215, 92, ${0.42 * pulse})`);
    grad.addColorStop(1, 'rgba(255, 215, 92, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
  } else if (plate.items.length > 0) {
    // Mid-assembly subtle indicator ring
    ctx.strokeStyle = 'rgba(255, 198, 102, 0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ceramic celadon-cream plate
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 27, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e9e4d4';
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = matched ? '#f2b938' : '#7ea392';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f8f5ec';
  ctx.beginPath();
  ctx.arc(0, 0, 19.5, 0, Math.PI * 2);
  ctx.fill();

  // Draw layered ingredients in appetizing order: base -> protein -> garnish
  const order = ['rice', 'noodle', 'skewer', 'egg', 'scallion', 'chili'];
  const sorted = [...plate.items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  for (const it of sorted) {
    let ox = 0;
    let oy = 0;
    if (it.id === 'skewer') { ox = -2; oy = -3; }
    else if (it.id === 'egg') { ox = 5; oy = 3; }
    else if (it.id === 'scallion') { ox = -4; oy = -2; }
    else if (it.id === 'chili') { ox = 4; oy = -3; }
    drawIngredient(ctx, it, ox, oy, 0.88);
  }

  // Mini badge: green check if ready, or assembly count if mid-assembly
  if (matched) {
    ctx.fillStyle = '#2fb859';
    ctx.beginPath();
    ctx.arc(19, -18, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(15, -18);
    ctx.lineTo(18, -15);
    ctx.lineTo(23.5, -21.5);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawStation(ctx, station, isTarget, time) {
  const x = KITCHEN_X + station.col * TILE_SIZE;
  const y = KITCHEN_Y + station.row * TILE_SIZE;
  const pad = 4;
  const w = TILE_SIZE - pad * 2;
  const h = TILE_SIZE - pad * 2;
  const cx = x + TILE_SIZE * 0.5;
  const cy = y + TILE_SIZE * 0.5;

  // Counter shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  roundRect(ctx, x + pad + 2, y + pad + 5, w, h, 10);
  ctx.fill();

  // Base teakwood / brass counter body
  let topColor = '#6e472b';
  let borderColor = '#3f2414';
  if (station.type === STATION_TYPE.PASS) {
    topColor = '#8a5d22';
    borderColor = '#e3b24b';
  } else if (station.type === STATION_TYPE.WOK || station.type === STATION_TYPE.GRILL) {
    topColor = '#363230';
    borderColor = '#1c1816';
  } else if (station.type === STATION_TYPE.TRASH) {
    topColor = '#3e3a38';
    borderColor = '#211e1d';
  } else if (station.isAssembly) {
    topColor = '#7e5435';
    borderColor = '#b07b4f';
  }

  roundRect(ctx, x + pad, y + pad, w, h, 10);
  ctx.fillStyle = topColor;
  ctx.fill();
  ctx.lineWidth = isTarget ? 3.5 : 2;
  ctx.strokeStyle = isTarget ? '#ffe066' : borderColor;
  ctx.stroke();

  // Inner counter surface sheen
  roundRect(ctx, x + pad + 5, y + pad + 5, w - 10, h - 14, 7);
  ctx.fillStyle = 'rgba(255, 240, 210, 0.08)';
  ctx.fill();

  // Station-specific hardware
  if (station.type === STATION_TYPE.CRATE) {
    roundRect(ctx, x + 13, y + 12, w - 18, h - 26, 7);
    ctx.fillStyle = '#472d1b';
    ctx.fill();
    ctx.strokeStyle = '#a37143';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawIngredient(ctx, { kind: 'ingredient', id: station.ingredient, state: PREP.RAW }, cx, cy - 4, 1.05);
  } else if (station.type === STATION_TYPE.CHOP) {
    // Maple butcher block + cleaver
    roundRect(ctx, x + 14, y + 14, w - 20, h - 26, 6);
    ctx.fillStyle = '#d9b584';
    ctx.fill();
    ctx.strokeStyle = '#9e7544';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Knife on board corner
    ctx.fillStyle = '#cfd8df';
    ctx.fillRect(x + w - 19, y + 18, 9, 18);
    ctx.fillStyle = '#4a2b18';
    ctx.fillRect(x + w - 17, y + 36, 5, 11);
  } else if (station.type === STATION_TYPE.WOK || station.type === STATION_TYPE.GRILL) {
    // Glowing ember burner
    const ember = 0.65 + Math.sin(time * 7 + station.col) * 0.2;
    const grad = ctx.createRadialGradient(cx, cy - 3, 6, cx, cy - 3, 31);
    grad.addColorStop(0, `rgba(255, 110, 30, ${ember})`);
    grad.addColorStop(1, 'rgba(255, 60, 10, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 31, 0, Math.PI * 2);
    ctx.fill();

    if (station.type === STATION_TYPE.WOK) {
      // Brass-handled iron wok
      ctx.fillStyle = '#1f1d1c';
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d49d42';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.fillStyle = '#2d2a28';
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cast-iron charcoal grill grates
      roundRect(ctx, cx - 25, cy - 25, 50, 44, 7);
      ctx.fillStyle = '#221f1e';
      ctx.fill();
      ctx.strokeStyle = '#c47b3b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = '#4f4642';
      ctx.lineWidth = 2.4;
      for (let gx = -16; gx <= 16; gx += 8) {
        ctx.beginPath();
        ctx.moveTo(cx + gx, cy - 21);
        ctx.lineTo(cx + gx, cy + 15);
        ctx.stroke();
      }
    }
  } else if (station.type === STATION_TYPE.PLATES) {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 2 ? '#f8f5ec' : '#d8d2c2';
      ctx.beginPath();
      ctx.arc(cx, cy - 2 - i * 4, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7ea392';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  } else if (station.type === STATION_TYPE.PASS) {
    // Checkered service runner + brass bell
    roundRect(ctx, x + 10, y + 10, w - 12, h - 22, 6);
    ctx.fillStyle = station.bellFlash > 0 ? '#d99e2e' : '#5e3c16';
    ctx.fill();
    ctx.strokeStyle = '#f5ca64';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Brass service bell
    ctx.fillStyle = station.bellFlash > 0 ? '#fff099' : '#f2c14e';
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 15, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b57b1b';
    ctx.fillRect(cx - 17, cy - 4, 34, 5);
    ctx.fillStyle = '#ffe58f';
    ctx.beginPath();
    ctx.arc(cx, cy - 19, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (station.type === STATION_TYPE.TRASH) {
    ctx.fillStyle = '#252322';
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a726d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#5c5450';
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy - 12);
    ctx.lineTo(cx + 9, cy + 4);
    ctx.moveTo(cx + 9, cy - 12);
    ctx.lineTo(cx - 9, cy + 4);
    ctx.stroke();
  }

  // Draw item sitting on station
  if (station.item) {
    if (station.item.kind === 'plate') {
      drawPlate(ctx, station.item, cx, cy - 5, 1.0, time);
    } else {
      drawIngredient(ctx, station.item, cx, cy - 5, 1.08);
    }
  }

  // Cooking progress ring on Wok / Grill
  if ((station.type === STATION_TYPE.WOK || station.type === STATION_TYPE.GRILL) && station.item) {
    const spec = INGREDIENTS[station.item.id];
    if (spec && spec.needsPrep === 'cook') {
      const ratio = Math.min(1, station.cookProgress / spec.cookTime);
      const isSeared = station.item.state === PREP.SEARED;
      const burnRatio = isSeared ? Math.min(1, (station.cookProgress - spec.cookTime) / (spec.burnTime - spec.cookTime)) : 0;
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 30, -Math.PI / 2, Math.PI * 1.5);
      ctx.stroke();

      ctx.strokeStyle =
        station.item.state === PREP.BURNT
          ? '#6e2822'
          : isSeared
            ? burnRatio > 0.55 && Math.floor(time * 10) % 2 === 0
              ? '#ff4738'
              : '#4ee07a'
            : '#ffbe42';
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (isSeared ? 1 - burnRatio : ratio));
      ctx.stroke();
    }
  }

  // Chopping progress pips on Chopping Board
  if (station.type === STATION_TYPE.CHOP && station.item) {
    const spec = INGREDIENTS[station.item.id];
    if (spec && spec.needsPrep === 'chop' && station.item.state === PREP.RAW && station.chopProgress > 0) {
      const total = spec.chopSteps;
      const pipW = 12;
      const startX = cx - (total * (pipW + 3)) / 2;
      for (let i = 0; i < total; i++) {
        ctx.fillStyle = i < station.chopProgress ? '#7ef078' : 'rgba(20,14,10,0.65)';
        ctx.fillRect(startX + i * (pipW + 3), y + 10, pipW, 5);
      }
    }
  }

  // Crisp station label pill at bottom edge
  if (station.label) {
    ctx.fillStyle = 'rgba(18, 12, 8, 0.78)';
    roundRect(ctx, cx - 32, y + h - 13, 64, 15, 4);
    ctx.fill();
    ctx.fillStyle = isTarget ? '#ffe066' : '#f2dec2';
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(station.label, cx, y + h - 5.5);
  }
}

export function drawChef(ctx, chef, time) {
  ctx.save();
  const bob = Math.sin(chef.walkCycle) * 2.5;
  ctx.translate(chef.x, chef.y + bob);

  // Soft floor shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 24, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Indigo night-market apron & shoulders
  ctx.fillStyle = '#27466b';
  ctx.beginPath();
  ctx.ellipse(0, 4, 23, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Chef head + crisp headband
  ctx.fillStyle = '#f2c094';
  ctx.beginPath();
  ctx.arc(0, -4, 15, 0, Math.PI * 2);
  ctx.fill();

  // Red & white market bandana / chef cap
  ctx.fillStyle = '#d93d2b';
  ctx.beginPath();
  ctx.arc(0, -7, 14.5, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.ellipse(0, -14, 12, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes pointing in facing direction
  const ex = chef.facingX * 4.5;
  const ey = chef.facingY * 3.5;
  ctx.fillStyle = '#1f1612';
  ctx.beginPath();
  ctx.arc(-4 + ex, -3 + ey, 2.2, 0, Math.PI * 2);
  ctx.arc(4 + ex, -3 + ey, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Animated cleaver when chopping
  if (chef.chopAnim > 0) {
    ctx.save();
    ctx.translate(chef.facingX * 22, chef.facingY * 22);
    ctx.rotate(-0.4 + Math.sin(chef.chopAnim * Math.PI) * 1.1);
    ctx.fillStyle = '#dde5eb';
    ctx.fillRect(-4, -14, 12, 20);
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(-2, 6, 6, 10);
    ctx.restore();
  }

  // Held plate or ingredient out in front
  if (chef.held) {
    const hx = chef.facingX * 27;
    const hy = chef.facingY * 24 - 6;
    if (chef.held.kind === 'plate') {
      drawPlate(ctx, chef.held, hx, hy, 0.92, time);
    } else {
      drawIngredient(ctx, chef.held, hx, hy, 1.02);
    }
  }

  ctx.restore();
}

export function drawParticlesAndFloaters(ctx, state) {
  for (const p of state.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.kind === 'steam' ? 1.4 - alpha * 0.4 : 1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const f of state.floaters) {
    const alpha = Math.max(0, Math.min(1, (f.life / f.maxLife) * 1.4));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '800 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(20, 12, 8, 0.85)';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }
}

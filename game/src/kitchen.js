// Kitchen grid geometry, station definitions, collision checks, and interaction targeting.

export const GRID_COLS = 12;
export const GRID_ROWS = 6;
export const TILE_SIZE = 92;
export const KITCHEN_X = 88;
export const KITCHEN_Y = 148;

export const STATION_TYPE = {
  CRATE: 'crate',
  CHOP: 'chop',
  WOK: 'wok',
  GRILL: 'grill',
  COUNTER: 'counter',
  PLATES: 'plates',
  PASS: 'pass',
  TRASH: 'trash',
};

export function createKitchenLayout() {
  const stations = [];
  const add = (col, row, type, extra = {}) => {
    stations.push({
      id: `${type}-${col}-${row}`,
      col,
      row,
      type,
      item: null,
      cookProgress: 0,
      chopProgress: 0,
      bellFlash: 0,
      ...extra,
    });
  };

  // Top pantry & hot line (row 0)
  add(0, 0, STATION_TYPE.CRATE, { ingredient: 'rice', label: 'RICE' });
  add(1, 0, STATION_TYPE.CRATE, { ingredient: 'noodle', label: 'NOODLE' });
  add(2, 0, STATION_TYPE.CRATE, { ingredient: 'skewer', label: 'SATAY' });
  add(3, 0, STATION_TYPE.CRATE, { ingredient: 'egg', label: 'EGG' });
  add(4, 0, STATION_TYPE.CRATE, { ingredient: 'scallion', label: 'SCALLION' });
  add(5, 0, STATION_TYPE.CRATE, { ingredient: 'chili', label: 'CHILI' });
  add(6, 0, STATION_TYPE.COUNTER, { label: 'PREP' });
  add(7, 0, STATION_TYPE.WOK, { label: 'WOK 1' });
  add(8, 0, STATION_TYPE.GRILL, { label: 'GRILL' });
  add(9, 0, STATION_TYPE.WOK, { label: 'WOK 2' });
  add(10, 0, STATION_TYPE.COUNTER, { label: 'HEAT' });
  add(11, 0, STATION_TYPE.TRASH, { label: 'BIN' });

  // Central prep & assembly island (row 2, cols 3..8) — creates two clear kitchen lanes!
  add(3, 2, STATION_TYPE.CHOP, { label: 'CHOP' });
  add(4, 2, STATION_TYPE.CHOP, { label: 'CHOP' });
  add(5, 2, STATION_TYPE.COUNTER, { label: 'ASSEMBLE', isAssembly: true });
  add(6, 2, STATION_TYPE.COUNTER, { label: 'ASSEMBLE', isAssembly: true });
  add(7, 2, STATION_TYPE.COUNTER, { label: 'REST' });
  add(8, 2, STATION_TYPE.PLATES, { label: 'PLATES' });

  // Left & Right wing counters
  add(0, 2, STATION_TYPE.COUNTER, { label: 'GARNISH' });
  add(0, 3, STATION_TYPE.COUNTER, { label: 'GARNISH' });
  add(11, 2, STATION_TYPE.COUNTER, { label: 'HOLD' });
  add(11, 3, STATION_TYPE.COUNTER, { label: 'HOLD' });

  // Bottom service counter & glowing brass pass (row 5)
  add(0, 5, STATION_TYPE.COUNTER, { label: 'SIDE' });
  add(1, 5, STATION_TYPE.PLATES, { label: 'PLATES' });
  add(2, 5, STATION_TYPE.COUNTER, { label: 'PLATE' });
  add(3, 5, STATION_TYPE.COUNTER, { label: 'PLATE' });
  add(4, 5, STATION_TYPE.COUNTER, { label: 'READY' });
  add(5, 5, STATION_TYPE.PASS, { label: 'SERVE' });
  add(6, 5, STATION_TYPE.PASS, { label: 'SERVE' });
  add(7, 5, STATION_TYPE.COUNTER, { label: 'READY' });
  add(8, 5, STATION_TYPE.COUNTER, { label: 'PLATE' });
  add(9, 5, STATION_TYPE.CHOP, { label: 'CHOP' });
  add(10, 5, STATION_TYPE.COUNTER, { label: 'SIDE' });
  add(11, 5, STATION_TYPE.TRASH, { label: 'BIN' });

  return stations;
}

export function tileToWorld(col, row) {
  return {
    x: KITCHEN_X + col * TILE_SIZE + TILE_SIZE * 0.5,
    y: KITCHEN_Y + row * TILE_SIZE + TILE_SIZE * 0.5,
  };
}

export function worldToTile(x, y) {
  return {
    col: Math.floor((x - KITCHEN_X) / TILE_SIZE),
    row: Math.floor((y - KITCHEN_Y) / TILE_SIZE),
  };
}

export function findStationAt(stations, col, row) {
  for (let i = 0; i < stations.length; i++) {
    if (stations[i].col === col && stations[i].row === row) return stations[i];
  }
  return null;
}

export function isPointWalkable(stations, x, y, radius = 24) {
  const minX = KITCHEN_X + radius;
  const maxX = KITCHEN_X + GRID_COLS * TILE_SIZE - radius;
  const minY = KITCHEN_Y + radius;
  const maxY = KITCHEN_Y + GRID_ROWS * TILE_SIZE - radius;
  if (x < minX || x > maxX || y < minY || y > maxY) return false;

  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    const sx = KITCHEN_X + s.col * TILE_SIZE;
    const sy = KITCHEN_Y + s.row * TILE_SIZE;
    const nearestX = Math.max(sx, Math.min(x, sx + TILE_SIZE));
    const nearestY = Math.max(sy, Math.min(y, sy + TILE_SIZE));
    const dx = x - nearestX;
    const dy = y - nearestY;
    if (dx * dx + dy * dy < radius * radius) return false;
  }
  return true;
}

export function getInteractTarget(stations, chef) {
  const lookX = chef.x + chef.facingX * (TILE_SIZE * 0.68);
  const lookY = chef.y + chef.facingY * (TILE_SIZE * 0.68);
  const { col, row } = worldToTile(lookX, lookY);
  const direct = findStationAt(stations, col, row);
  if (direct) return direct;

  // Fallback: closest adjacent station within reach in front arc
  let best = null;
  let bestDist = 96;
  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    const center = tileToWorld(s.col, s.row);
    const dx = center.x - chef.x;
    const dy = center.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  }
  return best;
}

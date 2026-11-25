// Keyboard and mouse controls for Warung Ember.

import { KITCHEN_X, KITCHEN_Y, TILE_SIZE, findStationAt, isPointWalkable, tileToWorld, worldToTile } from './kitchen.js';
import { emitParticles, performChopAction, performPrimaryAction } from './simulation.js';
import { SHIFTS, startShift } from './state.js';

export function bindInput(canvas, state, audio) {
  const keys = new Set();

  function triggerDash() {
    if (state.mode !== 'playing') return;
    if (state.chef.dashCooldown <= 0) {
      state.chef.dashTimer = 0.18;
      state.chef.dashCooldown = 0.65;
      emitParticles(state, state.chef.x, state.chef.y + 12, 8, 'rgba(255,230,180,0.65)', 'steam');
    }
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) {
      if (e.code === 'KeyF') performChopAction(state, audio);
      return;
    }
    keys.add(e.code);

    if (state.mode === 'title') {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        state.shiftIndex = (state.shiftIndex + SHIFTS.length - 1) % SHIFTS.length;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        state.shiftIndex = (state.shiftIndex + 1) % SHIFTS.length;
      } else if (e.code === 'Enter' || e.code === 'Space') {
        startShift(state, state.shiftIndex);
      }
      return;
    }

    if (state.mode === 'summary') {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyR') {
        startShift(state, state.shiftIndex);
      }
      return;
    }

    if (e.code === 'Space' || e.code === 'KeyE') {
      performPrimaryAction(state, audio);
    } else if (e.code === 'KeyF') {
      performChopAction(state, audio);
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      triggerDash();
    } else if (e.code === 'KeyM') {
      state.muted = audio.toggleMute();
    } else if (e.code === 'KeyR') {
      startShift(state, state.shiftIndex);
    }
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (state.mode === 'title') {
      // Shift cards sit at y: 315..425, 3 cards centered across width 1280
      for (let i = 0; i < SHIFTS.length; i++) {
        const cx = 240 + i * 280;
        if (x >= cx && x <= cx + 240 && y >= 315 && y <= 430) {
          state.shiftIndex = i;
          return;
        }
      }
      // Start button at center (490..790, 465..525)
      if (x >= 470 && x <= 810 && y >= 455 && y <= 535) {
        startShift(state, state.shiftIndex);
      }
      return;
    }

    if (state.mode === 'summary') {
      if (x >= 440 && x <= 840 && y >= 540 && y <= 615) {
        startShift(state, state.shiftIndex);
      }
      return;
    }

    // Playing: click a station to walk up and interact, or click floor to walk there
    const { col, row } = worldToTile(x, y);
    const station = findStationAt(state.stations, col, row);
    if (station) {
      const sc = tileToWorld(station.col, station.row);
      if (Math.hypot(sc.x - state.chef.x, sc.y - state.chef.y) < 105) {
        const fdx = sc.x - state.chef.x;
        const fdy = sc.y - state.chef.y;
        const fl = Math.hypot(fdx, fdy) || 1;
        state.chef.facingX = fdx / fl;
        state.chef.facingY = fdy / fl;
        performPrimaryAction(state, audio);
        return;
      }
      // Find nearest walkable adjacent tile to the clicked station
      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];
      let bestSpot = null;
      let bestDist = Infinity;
      for (const [dc, dr] of dirs) {
        const p = tileToWorld(station.col + dc, station.row + dr);
        if (isPointWalkable(state.stations, p.x, p.y)) {
          const d = Math.hypot(p.x - state.chef.x, p.y - state.chef.y);
          if (d < bestDist) {
            bestDist = d;
            bestSpot = p;
          }
        }
      }
      if (bestSpot) {
        state.chef.moveTarget = bestSpot;
        state.chef.pendingStation = station;
      }
      return;
    }

    // Walk directly to clicked floor spot
    if (x >= KITCHEN_X && x <= KITCHEN_X + 12 * TILE_SIZE && y >= KITCHEN_Y && y <= KITCHEN_Y + 6 * TILE_SIZE) {
      state.chef.moveTarget = { x, y };
      state.chef.pendingStation = null;
    }
  });

  return keys;
}

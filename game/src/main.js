// Entrypoint for Warung Ember: boots state, audio, input, and animation loop.

import { createAudioEngine } from './audio.js';
import { bindInput } from './input.js';
import { renderGame } from './renderer.js';
import { stepSimulation } from './simulation.js';
import { applyShotPreset, createGameState } from './state.js';

export function bootGame() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed')) || 1;
  const shot = params.get('shot');

  const state = createGameState(seed);
  const audio = createAudioEngine();
  const keys = bindInput(canvas, state, audio);

  if (shot) {
    applyShotPreset(state, shot);
    renderGame(ctx, state);
    window.__warungReady = true;
    return;
  }

  // Show live kitchen behind title overlay
  applyShotPreset(state, 'title');

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    stepSimulation(state, dt, keys, audio);
    renderGame(ctx, state);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

bootGame();

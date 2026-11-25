// Warung Ember — Night Market Kitchen: packages game/, screenshots/, and dossier.json for make.fun.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function packageCookingEntry(): void {
  const gameSrc = join(repoRoot, 'game');
  const shotsSrc = join(repoRoot, 'screenshots');

  mkdirSync(outputDir, { recursive: true });
  cpSync(gameSrc, join(outputDir, 'game'), { recursive: true });

  const shotsDst = join(outputDir, 'screenshots');
  mkdirSync(shotsDst, { recursive: true });
  if (existsSync(shotsSrc)) {
    cpSync(shotsSrc, shotsDst, { recursive: true });
  }

  const dossierBytes = buildDossier(outputDir, DOSSIER_CAPS);
  writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
}

packageCookingEntry();

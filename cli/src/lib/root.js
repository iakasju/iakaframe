// Resolution du dossier chapeau (umbrella) - portable.
// Priorite : --root (param) > IAKAFRAME_ROOT (env) > defaut OS (~/work | C:\work).
import os from 'node:os';
import path from 'node:path';

export function resolveRoot(opt) {
  if (opt) return path.resolve(opt);
  if (process.env.IAKAFRAME_ROOT) return path.resolve(process.env.IAKAFRAME_ROOT);
  if (process.platform === 'win32') return 'C:\\work';
  return path.join(os.homedir(), 'work');
}

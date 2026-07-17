// Detection d'un executable dans le PATH - portable (Windows .exe/.cmd/.bat inclus).
import fs from 'node:fs';
import path from 'node:path';

export function hasCmd(name) {
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';').map(e => e.toLowerCase())
    : [''];
  for (const dir of dirs) {
    for (const ext of exts) {
      try {
        const p = path.join(dir, name + ext);
        if (fs.existsSync(p) && fs.statSync(p).isFile()) return true;
      } catch { /* ignore */ }
    }
  }
  return false;
}

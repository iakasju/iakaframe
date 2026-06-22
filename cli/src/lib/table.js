// Tableaux ASCII (box-drawing), JS pur, ZERO dependance. UTF-8 + repli ASCII.
// Cellules multi-lignes (separateur \n). Largeurs de colonnes auto.

const BOX = {
  utf8: { tl: '╔', tm: '╦', tr: '╗', ml: '╠', mm: '╬', mr: '╣', bl: '╚', bm: '╩', br: '╝', h: '═', v: '║' },
  ascii: { tl: '+', tm: '+', tr: '+', ml: '+', mm: '+', mr: '+', bl: '+', bm: '+', br: '+', h: '-', v: '|' },
};

// Coupe `s` en lignes <= width (par mots, avec coupe dure si un mot depasse).
export function wrap(s, width) {
  const out = [];
  for (const raw of String(s).split('\n')) {
    if (raw.length <= width) { out.push(raw); continue; }
    let line = '';
    for (const word of raw.split(' ')) {
      if (!line.length) line = word;
      else if ((line + ' ' + word).length <= width) line += ' ' + word;
      else { out.push(line); line = word; }
      while (line.length > width) { out.push(line.slice(0, width)); line = line.slice(width); }
    }
    out.push(line);
  }
  return out;
}

// headers: tableau de chaines (ou null = pas d'en-tete). rows: tableau de tableaux de cellules.
export function table(headers, rows, { ascii = false } = {}) {
  const b = ascii ? BOX.ascii : BOX.utf8;
  const ncols = Math.max(headers ? headers.length : 0, ...rows.map(r => r.length));
  const cells = (r) => Array.from({ length: ncols }, (_, c) => String(r[c] ?? '').split('\n'));
  const headCells = headers ? cells(headers) : null;
  const bodyCells = rows.map(cells);

  const width = Array.from({ length: ncols }, (_, c) => {
    let w = 0;
    if (headCells) for (const l of headCells[c]) w = Math.max(w, l.length);
    for (const r of bodyCells) for (const l of r[c]) w = Math.max(w, l.length);
    return w;
  });

  const line = (l, m, r) => l + width.map(w => b.h.repeat(w + 2)).join(m) + r;
  const rowOut = (rc) => {
    const h = Math.max(...rc.map(c => c.length));
    const out = [];
    for (let i = 0; i < h; i++) {
      out.push(b.v + rc.map((c, ci) => ' ' + (c[i] ?? '').padEnd(width[ci]) + ' ').join(b.v) + b.v);
    }
    return out.join('\n');
  };

  const parts = [line(b.tl, b.tm, b.tr)];
  if (headCells) { parts.push(rowOut(headCells)); parts.push(line(b.ml, b.mm, b.mr)); }
  rows.forEach((_, i) => { parts.push(rowOut(bodyCells[i])); });
  parts.push(line(b.bl, b.bm, b.br));
  return parts.join('\n');
}

// Garde d'anonymisation du MIROIR (frames/releases/<X>/) — gates par CLASSES, pas par enumeration.
// (specs/instructions/outillage-scrub-miroir-frame.md § 4)
//
// LE RENVERSEMENT QUI FONDE CE MODULE. Le gate precedent etait construit par ENUMERATION : une
// liste de tokens interdits (`sjupin`, `192.168`, `naonedge`, `iakabox`). Mesure faite sur le
// miroir : ces tokens etaient a ZERO, et 86 occurrences d'autres noms propres traversaient
// (`Hermes`, `iakagraph`, `iakaIDE`, `iakaHub`). Le gate ne mesurait pas la proprete du frame —
// il mesurait SA PROPRE LISTE, et il etait vert sur un frame qui fuyait.
//
// Une liste de noms propres a bannir est STRUCTURELLEMENT incapable d'attraper le nom propre
// SUIVANT. D'ou G2 : une ALLOWLIST courte et stable (`iakaframe`, `iakastart`, `iaka`, `iakalog`)
// qui refuse tout autre `iaka*` — y compris un nom cree APRES l'ecriture de cette regle. C'est la
// seule forme qui satisfait le principe du decideur (« le frame est un miroir du canon » : la
// propagation est repetee, donc une fuite non couverte est une fuite GARANTIE a terme).
//
// LE GATE CONSTATE, IL NE REECRIT PAS. Pas de `--fix` : une reecriture automatique sur un livrable
// destine a des tiers est un risque superieur a celui qu'elle previent (§ 5).
//
// CE QUE CE MODULE N'ATTRAPE PAS : voir LIMITS ci-dessous (section CONTRACTUELLE, reprise dans le
// README du miroir). Le gate ne rend PAS la relecture humaine inutile avant diffusion.
//
// Zero dependance runtime.
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.js';

// --- Allowlists (le coeur du calibrage) -----------------------------------------------------

// G2 — vocabulaire de marque AUTORISE. Volontairement COURT et STABLE : chaque entree ajoutee
// elargit la surface de fuite. Toute autre forme `iaka*` est refusee.
//   - iakaframe / iakastart / iaka : la marque du frame lui-meme.
//   - iakalog : outil EMBARQUE dans le frame (kits/.../iakaframe-log-conversation/iakalog.mjs).
//     Mesure : 92 occurrences. Sans cette entree, le gate emet 92 faux positifs sur du contenu
//     qu'il LIVRE lui-meme — et un gate bruyant est un gate desactive.
export const BRAND_ALLOW = new Set(['iaka', 'iakaframe', 'iakastart', 'iakalog']);

// G2 — TOLERANCE CIBLEE, explicite et documentee (jamais un oubli silencieux).
// `iakaIDE` (~35 occurrences) est structurel dans `cli/` : commandes `go`, `config`, `vocab`.
// Le scrubber FORKERAIT davantage le CLI, ce qui va contre le principe meme de miroir. Arbitrage
// du decideur (§ 9 point 2) : TOLERE dans `cli/`, BLOQUE partout ailleurs.
// A RECONSIDERER si le miroir vise une diffusion large.
export const BRAND_TOLERATED = [
  {
    prefix: 'iakaide',
    pathPrefix: 'cli/',
    reason: 'tolerance ciblee (decideur) : structurel dans cli/, le scrubber forkerait le CLI',
  },
];

// G5 — ports AUTORISES : ports publics/standards, ou services banalises non identifiants.
// Tout autre litteral de port est signale. 3001 (Forgejo prive), 4001 (LiteLLM prive) et
// 3041 (admin/health prive) sont donc attrapes — c'est l'intention.
export const PORT_ALLOW = new Set([
  22, 80, 443,          // publics
  3000, 5173, 8000, 8080, // dev web courants
  3306, 5432, 6379,     // moteurs de donnees standards
  8188, 11434,          // ComfyUI / Ollama : ports par defaut publics des outils
]);

// G6 — dictionnaire du frame : tout ce qui est LEGITIMEMENT capitalise dans le corpus.
// G6 etant un AVERTISSEMENT, ce dictionnaire n'a pas a etre exhaustif ni a etre « juste » : une
// entree manquante produit un avertissement de plus, JAMAIS un blocage. Il sert a rendre la
// sortie LISIBLE — c'est-a-dire utilisable. Sans lui, mesure faite : 614 avertissements pour
// 17 vraies fuites (97 % de faux positifs), soit un gate que personne ne lit.
export const G6_DICT = new Set([
  // Outils et produits publics (connaissance publique, pas du portefeuille)
  'anythingllm', 'openai', 'chatgpt', 'openwebui', 'webui', 'litellm', 'powershell', 'semver',
  'comfyui', 'javascript', 'typescript', 'nodejs', 'github', 'gitlab', 'forgejo', 'figlet',
  'claude', 'docker', 'codex', 'ollama', 'node', 'windows', 'linux', 'macos', 'ios', 'git',
  'markdown', 'discord', 'kubernetes', 'prometheus', 'google', 'python', 'rust', 'makefile',
  'anthropic', 'cline', 'minecraft', 'signal', 'shaka', 'douglas', 'jetbrains', 'devops',
  'imagemagick', 'typedoc', 'websocket', 'gotrue', 'openclaw', 'openhands', 'aider',
  // Outils du runner Claude Code (vocabulaire d'outillage, pas des noms propres prives)
  'websearch', 'webfetch', 'pretooluse', 'posttooluse', 'userpromptsubmit', 'subagentstop',
  'todowrite', 'notebookedit', 'bashoutput', 'killshell', 'exitplanmode', 'claudecode',
  'bash', 'grep', 'glob', 'edit', 'write', 'read', 'task', 'stop', 'desktop', 'settings',
  // Personas et references mythologiques du frame (contenu QU'IL LIVRE)
  'aragorn', 'gimli', 'legolas', 'helm', 'gandalf', 'loki', 'odin', 'nathalie', 'frodon',
  'allfather', 'hugin', 'munin', 'heimdall', 'bifrost', 'bifr', 'vinci', 'cowork',
  // Identifiants de code du frame, cites en prose hors backticks
  'createifabsent', 'rolekey', 'rolekeys', 'roleindex', 'personaid', 'agentsrolekeys',
  'afterphase', 'methodid', 'teamid', 'bindingid', 'workflowid', 'principleids', 'ritualids',
  'guardrailids', 'scaffoldids', 'nondestructive', 'nopush', 'vignetteteam', 'skillid',
  // Fragments et mots courants capitalises par la mise en forme markdown
  'agent', 'agents', 'code', 'open', 'staging', 'model', 'models', 'system', 'prompt',
  'cadrage', 'chat', 'gestion', 'production', 'surveillance', 'sans', 'mono', 'access',
  'workspace', 'team', 'coverage', 'avanc', 'key', 'keys', 'index', 'ids', 'phase', 'hub',
  'absent', 'destructive', 'submit', 'claw', 'ver', 'use', 'shell', 'continue', 'vx', 'md', 'js',
]);

// Extensions de fichiers TEXTE inspectees. Le binaire est hors de portee du gate (LIMITS).
const TEXT_EXT = new Set([
  '.md', '.js', '.mjs', '.cjs', '.json', '.ps1', '.sh', '.txt', '.css', '.html', '.svg', '.flf',
  '.yml', '.yaml', '.toml',
]);

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.venv', '__pycache__']);

// --- Ce que le gate n'attrapera PAS — section CONTRACTUELLE ----------------------------------
// Reprise telle quelle dans le README du miroir. Le dispositif ne doit JAMAIS etre presente
// comme une garantie.
export const LIMITS = [
  'Un nom propre minuscule sans prefixe de marque : `hermes` en prose passe tout (G2 ne le voit pas, G6 non plus).',
  'Un fait prive sans nom propre (« le serveur du salon », « mon fils ») : structurellement invisible, aucune classe de motifs n\'atteint la semantique.',
  'Une IP publique ou un domaine reel : G1 ne cible que les plages privees ; elargir produirait un bruit inacceptable.',
  'Un port de l\'allowlist, ou ecrit en variable/calcul (`PORT_BASE + 1`).',
  'Le contenu des archives `.zip` et de tout binaire : non inspectable.',
  'Une fuite entree dans le CANON : les gates portent sur le miroir, elle n\'est vue qu\'a la propagation suivante.',
  'Le gate ne rend PAS la relecture humaine inutile avant une diffusion a des tiers.',
];

export const GATES = [
  { id: 'G1', label: 'Secrets & infra', severity: 'blocking' },
  { id: 'G2', label: 'Marque / portefeuille (allowlist)', severity: 'blocking' },
  { id: 'G3', label: 'Identite du decideur', severity: 'blocking' },
  { id: 'G4', label: 'Couche produit & references pendantes', severity: 'blocking' },
  { id: 'G5', label: 'Ports d\'infra', severity: 'blocking' },
  { id: 'G6', label: 'Noms propres residuels', severity: 'warning' },
];

// --- G1 : secrets & infra (motifs STRUCTURELS, ~0 faux positif) ------------------------------
const RE_PRIVATE_IP = /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g;
// Creds en URL : segments LITTERAUX uniquement. Les classes excluent `$ { } < >` afin de ne pas
// signaler les TEMPLATES (`http://${user}:${t}@${base}` dans forgejo.js est du code qui CONSTRUIT
// une URL, pas un secret) ni les placeholders (`http://<user>:<token>@...`). Faux positif mesure
// puis elimine par cette restriction.
const RE_URL_CREDS = /\/\/[A-Za-z0-9_.-]+:[A-Za-z0-9_.%~-]+@/g;
const RE_HOME_PATH = /(?:\/Users\/[A-Za-z0-9_.-]+|\/home\/[A-Za-z0-9_.-]+|C:\\Users\\[A-Za-z0-9_.-]+|-Users-[A-Za-z0-9_-]+)/g;
const RE_PEM = /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/g;
const RE_JWT = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;

// --- G2 : marque, par ALLOWLIST --------------------------------------------------------------
// Insensible a la casse (§ 4.2 limite 7 : le grep d'origine etait sensible a la casse et ratait
// les variantes). `iaka[a-z0-9]*` s'arrete aux separateurs, donc `iakaframe-git` -> `iakaframe`
// (autorise) et `IAKAFRAME_HOSTS` -> `IAKAFRAME` -> `iakaframe` (autorise).
const RE_BRAND = /\biaka[a-z0-9]*/gi;

// --- G3 : identite du decideur ---------------------------------------------------------------
// Insensible a la casse, et applique au TEXTE BRUT : attrape aussi bien la prose que le litteral
// de regex execute `if (/^stephane-/.test(...))` — c'est precisement ce que l'ancien scrub ratait.
const RE_IDENTITY = /\b(?:st[eé]phane|sjupin)\b/gi;

// --- G5 : ports ------------------------------------------------------------------------------
// (a) Forme MOT-CLE, independante du separateur : `port: 3001`, `port=3001`, `ports : "3001"`.
//     C'est la forme que l'ancien grep de recette ratait : il cherchait le litteral `:3001` et ne
//     matchait donc PAS `port: 3001`.
const RE_PORT_KEYWORD = /\bports?\b\s*[:=]\s*["']?(\d{2,5})\b/gi;
// (b) Forme HOTE:PORT collee, 4-5 chiffres. Le seuil de 4 chiffres est un CALIBRAGE mesure : il
//     elimine les faux positifs `font-weight:800`, `postgres:16`, `width:100` (CSS minifiee et
//     tags d'image) sans perdre de port prive reel. Les ports a 2-3 chiffres sont de toute facon
//     publics (22/80/443) et donc dans l'allowlist.
const RE_PORT_HOST = /:(\d{4,5})\b/g;
// Exclusion des references `fichier.ext:ligne`, convention massivement employee dans le corpus.
const RE_FILE_LINE = /\.(?:js|mjs|cjs|md|ps1|json|css|html|txt|sh|flf|ya?ml|toml):\d+/g;

// --- G6 : noms propres residuels (AVERTISSEMENT) ---------------------------------------------
// Deux moities, et il FAUT les deux :
//  (a) CamelCase interne `[a-z][A-Z]` — attrape `iakaHub`-like et les identifiants composes.
//  (b) Capitale en MILIEU DE PHRASE — c'est la seule qui attrape `Hermes` (17 occurrences, la
//      plus grosse fuite residuelle du miroir), un nom propre sans capitale interne.
//
// CALIBRAGE de (b), mesure a chaque etape sur les 284 fichiers :
//   - capitale n'importe ou                        -> 3865 occurrences / 506 tokens  (inexploitable)
//   - capitale precedee d'un mot en minuscules      ->  446 / 50   mais `Hermes` RATE
//     (il s'ecrit toujours `n8n/Hermes` : le separateur `/` masquait la detection)
//   - + separateurs `/ , ( ' -` admis               ->  857 / 93   `Hermes` attrape, mais le
//     CamelCase interne repasse en double (`Absent` de `createIfAbsent`)
//   - + separateur REEL exige (espace ou ponctuation, jamais zero-width) -> 614 / 66  RETENU
//   - + dictionnaire                                ->  voir mesure finale
// Le pas de trop aurait ete de s'arreter a la 2e ligne : le gate aurait eu l'air propre en
// ratant la fuite principale.
const RE_CAMEL = /\b[A-Za-z]*[a-z][A-Z][A-Za-z]*\b/g;
const RE_MIDCAP = /[a-z0-9àéèêçùîô](?:[ ]+|[/,('’-][ ]*)([A-Z][a-z]{2,})\b/g;

function finding(gate, file, line, token, detail) {
  const f = { gate, file, line, token };
  if (detail) f.detail = detail;
  return f;
}

// Masque les spans de code d'une ligne markdown (`...`) : G6 vise la PROSE, pas les identifiants
// de code cites. Sans ce masquage, `createIfAbsent`, `roleKey`, `personaId` inondent la sortie.
function stripInlineCode(line) {
  return line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
}

// Un token de marque est-il tolere a cet emplacement ? (tolerance ciblee, cf. BRAND_TOLERATED)
export function brandTolerated(token, relPath) {
  const low = token.toLowerCase();
  const rel = relPath.split(path.sep).join('/');
  return BRAND_TOLERATED.some((t) => low.startsWith(t.prefix) && rel.startsWith(t.pathPrefix));
}

// --- Scan d'un contenu texte -----------------------------------------------------------------
// scanText(text, relPath) -> findings[]. Pur, sans I/O : c'est le point d'entree des tests.
export function scanText(text, relPath) {
  const findings = [];
  const rel = relPath.split(path.sep).join('/');
  const isMd = rel.endsWith('.md');
  const lines = text.split(/\r?\n/);
  let inFence = false;

  lines.forEach((raw, i) => {
    const no = i + 1;

    // G1 ----------------------------------------------------------------------------------
    for (const m of raw.matchAll(RE_PRIVATE_IP)) findings.push(finding('G1', rel, no, m[0], 'IP privee'));
    for (const m of raw.matchAll(RE_URL_CREDS)) findings.push(finding('G1', rel, no, m[0], 'identifiants dans une URL'));
    for (const m of raw.matchAll(RE_HOME_PATH)) findings.push(finding('G1', rel, no, m[0], 'chemin home absolu'));
    for (const m of raw.matchAll(RE_PEM)) findings.push(finding('G1', rel, no, m[0], 'cle privee PEM'));
    for (const m of raw.matchAll(RE_JWT)) findings.push(finding('G1', rel, no, m[0], 'jeton JWT'));

    // G2 ----------------------------------------------------------------------------------
    for (const m of raw.matchAll(RE_BRAND)) {
      const token = m[0];
      if (BRAND_ALLOW.has(token.toLowerCase())) continue;
      if (brandTolerated(token, rel)) continue;
      findings.push(finding('G2', rel, no, token, 'hors allowlist de marque'));
    }

    // G3 ----------------------------------------------------------------------------------
    for (const m of raw.matchAll(RE_IDENTITY)) findings.push(finding('G3', rel, no, m[0], 'identite du decideur'));

    // G5 ----------------------------------------------------------------------------------
    for (const m of raw.matchAll(RE_PORT_KEYWORD)) {
      const p = Number(m[1]);
      if (!PORT_ALLOW.has(p)) findings.push(finding('G5', rel, no, String(p), 'port hors allowlist (forme mot-cle)'));
    }
    const masked = raw.replace(RE_FILE_LINE, (m) => ' '.repeat(m.length));
    for (const m of masked.matchAll(RE_PORT_HOST)) {
      const p = Number(m[1]);
      if (!PORT_ALLOW.has(p)) findings.push(finding('G5', rel, no, String(p), 'port hors allowlist (forme hote:port)'));
    }

    // G6 — prose markdown uniquement, hors blocs et spans de code -------------------------
    if (isMd) {
      if (/^\s*(?:```|~~~)/.test(raw)) { inFence = !inFence; return; }
      if (inFence) return;
      const prose = stripInlineCode(raw);
      const seen = new Set();
      const keep = (token) => {
        const low = token.toLowerCase();
        if (G6_DICT.has(low) || BRAND_ALLOW.has(low)) return;
        // Deja signale par G2 (bloquant) : ne pas doubler le bruit en avertissement.
        if (/^iaka/i.test(token)) return;
        const key = token + '@' + no;
        if (seen.has(key)) return;   // (a) et (b) peuvent pointer le meme token
        seen.add(key);
        findings.push(finding('G6', rel, no, token, 'nom propre residuel possible'));
      };
      for (const m of prose.matchAll(RE_CAMEL)) keep(m[0]);
      for (const m of prose.matchAll(RE_MIDCAP)) keep(m[1]);
    }
  });

  return findings;
}

// --- G4 : couche produit & integrite referentielle (structurel, 0 faux positif) ---------------
// Le miroir embarque `capacity` + `family` et OMET la couche `product` : la regle est lue dans une
// METADONNEE deja presente, pas dans une liste de noms (§ 2.3). Une skill `layer: product` dans le
// miroir est donc une fuite par construction.
export function checkStructure(root) {
  const findings = [];
  const skillsDir = path.join(root, 'library', 'skills');
  const skillIds = new Set();

  if (fs.existsSync(skillsDir)) {
    for (const e of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const file = path.join(skillsDir, e.name, 'SKILL.md');
      if (!fs.existsSync(file)) continue;
      skillIds.add(e.name);
      const rel = `library/skills/${e.name}/SKILL.md`;
      let data = {};
      try { ({ data } = parseFrontmatter(fs.readFileSync(file, 'utf8'))); } catch { continue; }
      if (String(data.layer || '').trim() === 'product') {
        findings.push(finding('G4', rel, 1, 'layer: product', 'couche produit interdite au miroir'));
      }
    }
  }

  const principleIds = new Set();
  const princDir = path.join(root, 'library', 'principles');
  if (fs.existsSync(princDir)) {
    for (const n of fs.readdirSync(princDir)) {
      if (n.endsWith('.md') && n !== 'README.md') principleIds.add(n.replace(/\.md$/, ''));
    }
  }

  // References pendantes : `skills:` / `subskills:` -> skills existantes ; `principleIds:` ->
  // principes existants. C'est le controle qui empeche de livrer un renvoi vers un principe
  // absent du bundle (ex. `preuve-avant-declaration`, non embarque au miroir).
  const refSources = [
    { dir: path.join(root, 'library', 'personas'), prefix: 'library/personas' },
    { dir: path.join(root, 'library', 'skills'), prefix: 'library/skills', skill: true },
    { dir: path.join(root, 'methods'), prefix: 'methods' },
  ];
  for (const src of refSources) {
    if (!fs.existsSync(src.dir)) continue;
    for (const e of fs.readdirSync(src.dir, { withFileTypes: true })) {
      const file = src.skill
        ? path.join(src.dir, e.name, 'SKILL.md')
        : path.join(src.dir, e.name);
      if (src.skill ? !e.isDirectory() : !e.name.endsWith('.md')) continue;
      if (!fs.existsSync(file)) continue;
      const rel = src.skill ? `${src.prefix}/${e.name}/SKILL.md` : `${src.prefix}/${e.name}`;
      let data = {};
      try { ({ data } = parseFrontmatter(fs.readFileSync(file, 'utf8'))); } catch { continue; }
      for (const field of ['skills', 'subskills']) {
        for (const id of asArray(data[field])) {
          if (!skillIds.has(id)) findings.push(finding('G4', rel, 1, id, `reference pendante (${field})`));
        }
      }
      for (const id of asArray(data.principleIds)) {
        if (!principleIds.has(id)) findings.push(finding('G4', rel, 1, id, 'reference pendante (principleIds)'));
      }
    }
  }

  return findings;
}

function asArray(v) {
  if (v == null || v === '') return [];
  return Array.isArray(v) ? v : [v];
}

// --- Parcours du miroir ----------------------------------------------------------------------
export function listFrameFiles(root) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.claude') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(full);
      } else if (TEXT_EXT.has(path.extname(e.name).toLowerCase())) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out.sort();
}

// --- Verdict -----------------------------------------------------------------------------------
// verifyFrame(root) -> { ok, root, checked, findings, blocking, warnings, byGate }
// `ok` est faux des qu'il existe au moins un finding BLOQUANT. G6 (avertissement) ne fait JAMAIS
// basculer le verdict : un gate bruyant est un gate desactive — on prefere un avertissement lu
// a un blocage contourne.
export function verifyFrame(root) {
  const abs = path.resolve(root);
  const files = listFrameFiles(abs);
  const findings = [];

  for (const file of files) {
    const rel = path.relative(abs, file).split(path.sep).join('/');
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    findings.push(...scanText(text, rel));
  }
  findings.push(...checkStructure(abs));

  const warnGates = new Set(GATES.filter(g => g.severity === 'warning').map(g => g.id));
  const blocking = findings.filter(f => !warnGates.has(f.gate));
  const warnings = findings.filter(f => warnGates.has(f.gate));

  const byGate = {};
  for (const g of GATES) byGate[g.id] = findings.filter(f => f.gate === g.id).length;

  return {
    ok: blocking.length === 0,
    root: abs,
    checked: files.length,
    findings,
    blocking: blocking.length,
    warnings: warnings.length,
    byGate,
  };
}

// vocab.js - MIROIR JS pur du vocabulaire canonique de @iakaframe/core (strategie ALIGN, P2 §5).
//
// SOURCE DE VERITE = packages/core/src/vocab.json (depot iakaFrameGUI). Ce fichier en tient un
// miroir *sans import* : le CLI @naonedge/iakaframe reste **zero dependance runtime**, cross-OS,
// publiable. La parite miroir<->core est verifiee par cli/test/vocab-parity.test.js (empeche la
// re-divergence que l'audit a constatee : CLI ps/iakaide/aider vs Cockpit claude-code/...).
//
// ⚠️ Ne PAS editer une valeur ici sans mettre a jour packages/core/src/vocab.json (le test de
// parite echouera sinon). NODE (destination de deploiement) != RUNNER (harnais d'execution).

// --- Enums canoniques ---
export const RUNNER_KINDS = ['claude-code', 'ollama', 'litellm', 'codex'];
export const NODE_KINDS = ['claude', 'codex', 'ollama-localhost', 'ollama-lan', 'openwebui'];
export const KIT_FORMATS = ['claude-md', 'agents-md', 'openwebui-models'];

// --- Tables d'alias / retro-compat ---
export const RUNNER_ALIASES = {
  ps: 'claude-code',        // legacy (deprecie)
  iakaide: 'claude-code',   // legacy anti-modele (deprecie)
  'claude-code': 'claude-code',
  ollama: 'ollama',
  litellm: 'litellm',
  codex: 'codex',
};
export const DEPRECATED_RUNNER_ALIASES = ['ps', 'iakaide'];
// Launchers legacy conserves HORS enum RunnerKind (pas de suppression, Q-5). aider reste
// operationnel dans `go` comme runner legacy non canonique.
export const LEGACY_RUNNER_LAUNCHERS = ['aider'];

export const NODE_ALIASES = {
  claude: 'claude',
  codex: 'codex',
  ollama: 'ollama-localhost',   // valeur legacy indistincte -> localhost par defaut (Q-2)
  'ollama-localhost': 'ollama-localhost',
  'ollama-lan': 'ollama-lan',
  openwebui: 'openwebui',
};

export const CONTRACT_FILE_BY_FORMAT = {
  'claude-md': 'CLAUDE.md',
  'agents-md': 'AGENTS.md',
};
export const FORMAT_BY_NODE = {
  claude: 'claude-md',
  codex: 'agents-md',
  'ollama-localhost': 'agents-md',
  'ollama-lan': 'agents-md',
  openwebui: 'openwebui-models',
};
export const KIT_NAME_BY_NODE = {
  claude: 'kit-claude',
  codex: 'kit-codex',
  'ollama-localhost': 'kit-ollama',
  'ollama-lan': 'kit-ollama',
  openwebui: 'kit-openwebui',
};

// --- Helpers de format / nom de kit (miroir de node.ts) ---
export function kitFormatForNode(node) {
  return FORMAT_BY_NODE[node] || 'agents-md';
}
export function contractFileForNode(node) {
  return CONTRACT_FILE_BY_FORMAT[kitFormatForNode(node)] || 'AGENTS.md';
}
export function kitNameForNode(node) {
  return KIT_NAME_BY_NODE[node] || 'kit-claude';
}

/**
 * normalizeRunner(value) -> { kind, deprecated, legacyLauncher, raw }
 * - kind : RunnerKind canonique (ou null si non canonique)
 * - deprecated : true si alias deprecie (ps, iakaide) -> warning stderr attendu
 * - legacyLauncher : nom du launcher legacy (ex. 'aider') si hors enum, sinon null
 */
export function normalizeRunner(value) {
  const raw = value == null ? '' : String(value).trim().toLowerCase();
  if (LEGACY_RUNNER_LAUNCHERS.includes(raw)) {
    return { kind: null, deprecated: false, legacyLauncher: raw, raw };
  }
  const kind = RUNNER_ALIASES[raw] || null;
  return { kind, deprecated: DEPRECATED_RUNNER_ALIASES.includes(raw), legacyLauncher: null, raw };
}

/**
 * normalizeNode(value) -> { node, deprecated, raw }
 * - node : NodeKind canonique (ou null si inconnu) ; ollama nu -> ollama-localhost
 * - deprecated : true si valeur legacy indistincte ('ollama') -> warning stderr attendu
 */
export function normalizeNode(value) {
  const raw = value == null ? '' : String(value).trim().toLowerCase();
  const node = NODE_ALIASES[raw] || null;
  return { node, deprecated: raw === 'ollama', raw };
}

/** Valeur acceptee en entree pour un nœud (canonique OU alias legacy 'ollama'). */
export function isAcceptedNode(value) {
  return normalizeNode(value).node !== null;
}

/**
 * legacyTargetForNode(node) -> valeur "target" legacy equivalente (claude|codex|ollama), pour
 * le MIROIR retro-compat ecrit dans .iakaframe / iakaframe.json (les lecteurs anciens ne
 * connaissent que claude|codex|ollama). ollama-localhost et ollama-lan retombent sur 'ollama'.
 */
export function legacyTargetForNode(node) {
  if (typeof node === 'string' && node.startsWith('ollama')) return 'ollama';
  return node || 'claude';
}

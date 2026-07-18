// vocab.js - MIROIR JS pur du vocabulaire canonique de @iakaframe/core (strategie ALIGN, P2 §5).
//
// SOURCE DE VERITE = packages/core/src/vocab.json (depot iakaFrameGUI). Ce fichier en tient un
// miroir *sans import* : le CLI @naonedge/iakaframe reste **zero dependance runtime**, cross-OS,
// publiable. La parite miroir<->core est verifiee par cli/test/vocab-parity.test.js (empeche la
// re-divergence que l'audit a constatee : CLI ps/iakaide/aider vs Cockpit claude-code/...).
//
// ⚠️ Ne PAS editer une valeur ici sans mettre a jour packages/core/src/vocab.json (le test de
// parite echouera sinon). NODE (destination de deploiement) != RUNNER (harnais d'execution).
//
// Modele persona (instruction parite-enforcement-multirunner § 1/5.2/6.1) : deux plans ORTHOGONAUX.
//   - HOST = point d'entree {claude,codex,openwebui} : la ou vit l'enforcement, ou pointe le
//     Binding, cible d'installation. Un host N'EST PAS un runner.
//   - RUNNER = cible d'execution de persona {claude,chatgpt,ollama-local,ollama-distant,litellm}.
//     Le runner OpenAI-compatible s'appelle `chatgpt` (JAMAIS `openai` = norme d'API) ; `codex`
//     host != `chatgpt` runner. `litellm` = gateway, runner de PLEIN DROIT (jamais un host).
// NODE_KINDS reste une enum TRANSITOIRE (alias historique de host, § 6.2). anythingllm = HORS
// MODELE (ni host, ni runner, ni node) : ABSENT de toute enum (§ 0/§ 10).

// --- Enums canoniques ---
export const HOST_KINDS = ['claude', 'codex', 'openwebui'];
export const RUNNER_KINDS = ['claude', 'chatgpt', 'ollama-local', 'ollama-distant', 'litellm'];
export const NODE_KINDS = ['claude', 'codex', 'ollama-localhost', 'ollama-lan', 'openwebui'];
export const KIT_FORMATS = ['claude-md', 'agents-md', 'openwebui-models'];
// Registre (non exhaustif, MVP) des ids d'outils attachables a un persona (Binding.tools, § 6.3).
// Les ids sont libres (validation = string non vide) ; ce registre acte la NOTION et amorce les
// ids connus. tools (persona) != connectors (team, MCP) : deux axes distincts, sans couplage.
export const TOOL_KINDS = ['comfyui-local'];

// --- Tables d'alias / retro-compat ---
// Renommages § 6.1 (aucun binding casse) : claude-code->claude, ollama-localhost->ollama-local,
// ollama-lan->ollama-distant ; anciens noms CONSERVES en alias. `codex` reste resolvable en alias
// legacy (-> codex) pour la retro-compat du launcher CLI `go` et des configs existantes : dans le
// modele persona codex est un HOST, pas un runner canonique (promotion host-only = suivi B1/CLI).
export const RUNNER_ALIASES = {
  claude: 'claude',
  chatgpt: 'chatgpt',
  'ollama-local': 'ollama-local',
  'ollama-distant': 'ollama-distant',
  litellm: 'litellm',
  'claude-code': 'claude',  // legacy rename (§ 6.1)
  ps: 'claude',             // legacy (deprecie) -> claude
  iakaide: 'claude',        // legacy anti-modele (deprecie) -> claude
  ollama: 'ollama-local',   // legacy indistinct -> local par defaut
  'ollama-localhost': 'ollama-local',  // legacy rename (§ 6.1)
  'ollama-lan': 'ollama-distant',      // legacy rename (§ 6.1)
  codex: 'codex',           // legacy : host dans le modele persona, retro-compat launcher CLI
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

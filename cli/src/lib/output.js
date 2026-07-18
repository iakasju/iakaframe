// Source UNIQUE de la convention de sortie machine « C-JSON » du CLI (instruction
// specs/instructions/cli-api-surface-harmonisation.md, § 2 / § 4). Toute impression `--json`
// des commandes transite par ici. Contrat (5 regles) :
//   1. Racine = toujours un objet JSON (jamais un tableau ni un scalaire), 2-indente sur stdout.
//   2. `ok: boolean` obligatoire, en premiere cle.
//   3. Collection -> array sous cle au PLURIEL + frere `count` ; ressource/rapport -> champs a plat.
//   4. Erreur = { ok:false, error, ...diag } sur STDOUT, process.exitCode = 1, RIEN d'humain sur
//      stderr en mode `--json`.
//   5. `--json` est PARTOUT un booleen (aucune commande ne le detourne vers un fichier/valeur).
// Ce module est le VERROU anti-derive : ajouter une sortie machine sans passer par lui doit etre
// visible en revue (garde test/guard-json-output.test.js). Zero dependance runtime.

// Normalise une charge utile de succes en { ok:true, ...payload } (garantit `ok` en premiere cle).
export function ok(payload = {}) {
  return { ok: true, ...payload };
}

// Fabrique l'enveloppe d'une COLLECTION : { ok:true, count:<n>, [key]: arr, ...meta }. Interdit le
// tableau nu par construction ; `count` = longueur exacte de l'array (regle 3).
export function collection(key, arr, meta = {}) {
  const list = Array.isArray(arr) ? arr : [];
  return { ok: true, count: list.length, [key]: list, ...meta };
}

// Imprime un objet en JSON 2-indente sur stdout (une seule impression, regle 1). Point de passage
// bas niveau : les commandes n'appellent JAMAIS console.log(JSON.stringify(...)) en direct.
export function printJson(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

// Emet une sortie : si `json`, imprime `payload` en JSON sur stdout ; sinon delegue au rendu humain
// (inchange). Toute commande a `--json` passe par la.
export function emit(json, payload, humanFn) {
  if (json) { printJson(payload); return; }
  if (typeof humanFn === 'function') humanFn();
}

// Emet une ERREUR et positionne process.exitCode = 1 (regle 4). En mode `--json` : imprime
// { ok:false, error: message, ...diag } sur STDOUT (aucun texte humain sur stderr). Sinon : rend
// l'erreur humaine — `humanFn` si fourni (messages multi-lignes / astuces), sinon message sur stderr.
export function fail(json, message, diag = undefined, humanFn = undefined) {
  if (json) {
    const payload = { ok: false, error: message };
    if (diag && typeof diag === 'object') Object.assign(payload, diag);
    printJson(payload);
  } else if (typeof humanFn === 'function') {
    humanFn();
  } else {
    console.error(message);
  }
  process.exitCode = 1;
}

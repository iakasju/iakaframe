#!/usr/bin/env node
// identity-remind.mjs — Rappel d'identite iakaframe (hook UserPromptSubmit, portage macOS).
// Le stdout est injecte comme contexte additionnel avant la reponse de l'agent.
// Nudge doux, complement du garde bloquant identity-guard.mjs (Stop/SubagentStop).
//
// 2e amendement (specs/instructions/prise-de-parole-odin-aragorn.md, Lot P2, § P-5) : le rappel
// devient CONTEXTUEL — la voix depend du LIEU de lancement de la session (depot -> Aragorn,
// portefeuille/hors -> Odin), calculee par la fonction PURE `voiceOf` de guard-core.mjs (Lot P1,
// commit 9622f22). La voix est une regle de CONTRAT (qui parle), PAS un verdict de garde : ce
// hook ne bloque JAMAIS (exit 0 inconditionnel), n'ecrit JAMAIS sur disque, et ne modifie AUCUN
// verdict de garde existant (decision Q-P1 = A). Le repli est TOUJOURS le texte HISTORIQUE
// (verbatim, P-M1) : `guard-core.mjs` et `chantier-state.mjs` sont importes DYNAMIQUEMENT sous
// try/catch (le second est un fichier non suivi hier, cf. Lot 2 de la mere ; le premier peut,
// selon l'etat de deploiement, etre absent du meme dossier) — toute exception interne (import
// compris) retombe sur ce texte historique : la panne de ce hook ne doit jamais empecher le
// prompt de passer.

import { readFileSync } from "node:fs";

// Texte HISTORIQUE (P-M1), inchange, repli GENERIC — verbatim octet pour octet.
const TEXTE_HISTORIQUE =
  "[Garde d'identite iakaframe] Regle de la methode : tout agent qui prend la parole " +
  "s'identifie ET annonce ce qu'il fait. La POSITION de la pastille porte le sens. " +
  "Ouverture = pastille AVANT le bloc, en TOUTE PREMIERE ligne -> <pastille> [ROYAUME][Agent] " +
  "(ex: pastille jaune puis [PORTEFEUILLE][Odin]) suivi d'une courte annonce ; " +
  "cloture = pastille APRES le bloc en derniere ligne -> [ROYAUME][Agent] <pastille>. " +
  "Double badge par intervention. Une delegation = chaine de badges.\n";

// Suffixe ajoute au texte historique quand la voix est Odin (portefeuille/hors, P-5).
const SUFFIXE_PORTEFEUILLE =
  "Dans un depot, c'est Aragorn qui parle (session lancee dans le depot).\n";

// Texte REPO (turnVoice:"aragorn") : `royaume` en MAJUSCULE (badge), `name` tel quel (depot).
function texteRepo(royaume, name) {
  return (
    "[Garde d'identite iakaframe] Session lancee dans le depot `" + name + "` : tu parles en " +
    "Aragorn, a la premiere personne (je), jamais \"Aragorn fait...\". Ouverture en TOUTE " +
    "PREMIERE ligne -> `<pastille> [" + royaume + "][Aragorn]` - courte annonce (pastille = " +
    "phase servie, orange par defaut, jamais jaune) ; cloture en derniere ligne -> " +
    "`[" + royaume + "][Aragorn] <pastille>`. Odin ne parle ici que si le decideur l'interpelle " +
    "(\"odin, ...\"). Tu delegues aux autres agents : chaine de badges, restitution verbatim " +
    "sous le badge de l'emetteur.\n"
  );
}

// Texte ODIN-DANS-DEPOT (voice:"aragorn", turnVoice:"odin", P-3).
function texteOdinDansDepot(name) {
  return (
    "[Garde d'identite iakaframe] Le decideur interpelle Odin dans le depot `" + name + "` : CE " +
    "tour est dans la voix d'Odin (pastille jaune puis [PORTEFEUILLE][Odin]), ouverture et " +
    "cloture, en lecture seule ; tout geste portefeuille se fait dans la session du " +
    "portefeuille. Au tour suivant, Aragorn reprend la parole.\n"
  );
}

function readAll() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

async function computeText() {
  const raw = readAll();
  let payload = {};
  try {
    payload = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }
  if (!payload || typeof payload !== "object") payload = {};

  const cwd = process.env.CLAUDE_PROJECT_DIR || payload.cwd || null;

  // Import dynamique sous try : `guard-core.mjs` (voiceOf) et `chantier-state.mjs` (keyOf) —
  // toute exception (fichier absent, cwd inexploitable...) retombe sur le texte GENERIC.
  const { voiceOf } = await import("./guard-core.mjs");
  const { keyOf } = await import("./chantier-state.mjs");
  const launchKey = cwd ? keyOf(cwd) : null;
  const { voice, royaume, turnVoice } = voiceOf({
    launchKey, agentType: payload.agent_type, prompt: payload.prompt,
  });

  if (voice === "aragorn" && turnVoice === "aragorn") return texteRepo(royaume, launchKey.name);
  if (voice === "aragorn" && turnVoice === "odin") return texteOdinDansDepot(launchKey.name);
  if (voice === "odin") return TEXTE_HISTORIQUE + SUFFIXE_PORTEFEUILLE;
  return TEXTE_HISTORIQUE; // voice === "generic"
}

async function main() {
  let text;
  try {
    text = await computeText();
  } catch {
    text = TEXTE_HISTORIQUE; // panne interne (import, keyOf, voiceOf...) : repli GENERIC
  }
  process.stdout.write(text);
  process.exit(0);
}

main();

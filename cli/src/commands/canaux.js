// iakaframe canaux - etat des depots synchrones, et rattrapage en AVANCE RAPIDE seulement.
// Instruction : specs/instructions/bundle-complet-install-4-composants.md, § 5 lot 0.c.
//
// LE VERBE REPOND A DEUX QUESTIONS :
//   1. « les trois sont-ils d'accord ? »        -> une ligne par cible, mesuree EN DIRECT
//   2. « que faut-il rattraper, maintenant que celui-ci est revenu ? »  -> --rattraper
//
// POURQUOI IL EXISTE. Le fan-out (0.a) peut echouer en silence : sans mesure, on croit avoir
// trois sauvegardes quand un seul depot recoit (fait A2 : 15 commits d'ecart non vus, R6/R7).
// C'est ce verbe qui rend la redondance VERIFIABLE au lieu de DECLAREE.
//
// 🛑 Il ne pousse JAMAIS autre chose qu'une avance rapide, et dit ce qu'il refuse (CA-13, R8).
// 🛑 Il est le chemin RESEAU assume : `range` reste zero-reseau, et rien ici ne le modifie.
import { parseArgs } from 'node:util';
import path from 'node:path';
import { isRepo, currentBranch } from '../lib/git.js';
import { emit, fail, collection } from '../lib/output.js';
import { splitCanaux } from '../lib/forgejo.js';
import {
  listerRemotes, mesurerCanaux, accord, rattraper, DELAI_DEFAUT_S,
} from '../lib/canaux.js';

const USAGE = `Usage : iakaframe canaux [options]

Etat des depots synchrones (git), MESURE EN DIRECT : a jour / en retard de N / en avance de M /
divergent / injoignable, avec la date de la mesure. Sait rattraper ce qui est une AVANCE RAPIDE,
et REFUSE tout le reste en le disant (jamais de --force).

Options :
  --path <dir>       Racine du depot (defaut : dossier courant)
  --remotes <a,b,c>  Cibles a mesurer (defaut : TOUS les remotes configures, origin d'abord)
  --branch <nom>     Branche mesuree (defaut : la branche courante)
  --rattraper        Pousse les cibles EN RETARD (avance rapide seulement)
  --timeout <sec>    Delai par cible (defaut : ${DELAI_DEFAUT_S})
  --json             Sortie machine (C-JSON)

Une cible injoignable n'est PAS une erreur : c'est un etat, et il est nomme.`;

const MARQUE = {
  'a-jour': '[OK]', 'en-retard': '[<-]', 'en-avance': '[->]',
  'divergent': '[><]', 'branche-absente': '[..]', 'injoignable': '[--]', 'inconnu': '[??]',
};

function libelle(c) {
  switch (c.etat) {
    case 'a-jour': return 'a jour';
    case 'en-retard': return `en retard de ${c.retard} commit(s)`;
    case 'en-avance': return `en AVANCE de ${c.avance} commit(s) (c'est NOUS qui sommes en retard)`;
    case 'divergent': return `divergent : ${c.avance} commit(s) chez lui, ${c.retard} chez nous`;
    case 'branche-absente': return `branche absente sur la cible`;
    // Le motif n'est affiche que s'il AJOUTE quelque chose (un delai depasse n'est pas la meme
    // chose qu'une machine eteinte) — « injoignable (injoignable) » ne dit rien.
    case 'injoignable': return c.motif && c.motif !== 'injoignable' ? `injoignable : ${c.motif}` : 'injoignable';
    default: return `inconnu (${c.motif})`;
  }
}

export function runCanaux(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      path: { type: 'string' }, remotes: { type: 'string' }, branch: { type: 'string' },
      rattraper: { type: 'boolean', default: false }, timeout: { type: 'string' },
      json: { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }

  const root = path.resolve(values.path || process.cwd());
  if (!isRepo(root)) {
    fail(values.json, `pas un depot git : ${root}`, { path: root });
    return;
  }
  const remotes = values.remotes ? splitCanaux(values.remotes) : listerRemotes(root);
  if (!remotes.length) {
    fail(values.json, `aucun remote configure dans ${root} : il n y a aucun canal a mesurer`, { path: root });
    return;
  }
  const timeoutMs = Math.max(2, parseInt(values.timeout, 10) || DELAI_DEFAUT_S) * 1000;
  const branch = values.branch || currentBranch(root);

  const mesure = mesurerCanaux(root, remotes, branch, { timeoutMs });
  const actions = values.rattraper ? rattraper(root, mesure, { timeoutMs }) : [];
  const dAccord = accord(mesure.canaux);

  const payload = collection('canaux', mesure.canaux, {
    depot: root,
    branche: mesure.branche,
    local: mesure.local,
    // NOM EXPLICITE : cette date est celle de la MESURE reseau, pas celle d'un fetch anterieur.
    mesureLe: mesure.mesureLe,
    accord: dAccord,
    rattrapage: values.rattraper ? actions : null,
  });

  emit(values.json, payload, () => {
    console.log(`\n=== iakaframe canaux : ${path.basename(root)} (branche ${mesure.branche}) ===`);
    console.log(`mesure EN DIRECT le ${mesure.mesureLe}  |  local ${mesure.local.slice(0, 7) || '(branche absente)'}`);
    for (const c of mesure.canaux) {
      const sha = c.distant ? ` ${c.distant.slice(0, 7)}` : '';
      console.log(`  ${MARQUE[c.etat]} ${c.remote.padEnd(10)} ${libelle(c)}${sha}`);
      if (c.detail) console.log(`       ${c.detail}`);
      // Le SOUVENIR, jamais confondu avec la mesure : il est indente, nomme, et date a part.
      if (c.dernierConnu) {
        const d = c.dernierConnu.date ? `dernier fetch ${c.dernierConnu.date}` : 'date du dernier fetch inconnue';
        console.log(`       dernier etat CONNU (ref locale, PAS une mesure) : ${c.dernierConnu.sha.slice(0, 7)}, ${d}`);
      }
    }
    const nb = mesure.canaux.length;
    console.log(dAccord
      ? `\nVERDICT : les ${nb} canaux sont d accord (tous a jour), mesure a l instant.`
      : `\nVERDICT : les ${nb} canaux ne sont PAS tous d accord — voir les etats ci-dessus.`);
    if (actions.length) {
      console.log('\nRattrapage (avance rapide UNIQUEMENT, jamais de --force) :');
      for (const a of actions) console.log(`  - ${a.remote} : ${a.action}${a.motif ? ` — ${a.motif}` : ''}`);
    } else if (!dAccord) {
      console.log('Rattraper ce qui peut l etre (avance rapide seulement) : iakaframe canaux --rattraper');
    }
    console.log('');
  });
  return payload;
}


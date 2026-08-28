// iakaframe endpoints - etat MESURE du canal de LECTURE d'une app (auto-update), et bascule.
// Instruction : specs/instructions/bundle-complet-install-4-composants.md, § 5 lot 0.b — CA-11.
//
// LE PENDANT EN LECTURE DE `canaux`. `canaux` mesure l'ECRITURE (les depots recoivent-ils ?) ;
// celui-ci mesure la LECTURE (les endpoints d'update servent-ils ?). Meme regle, meme raison :
// une redondance qu'on ne mesure pas est une redondance qu'on croit avoir. Le 2026-08-28, un
// manifeste a ete declare « desormais trouve » sans qu'aucun endpoint n'ait ete interroge — et
// les trois rendaient 404, 404 et 000. Ce verbe existe pour que cette phrase ne puisse plus
// s'ecrire sans chiffre.
//
// 🛑 Il ne PUBLIE rien, n'ecrit rien, ne met a jour aucune app : il mesure et il dit.
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { emit, fail, collection } from '../lib/output.js';
import {
  lireEndpoints, resoudre, sonderTous, verdictRedondance, formater, DELAI_DEFAUT_S,
  sonderArtefacts, verdictArtefacts, formaterArtefacts,
} from '../lib/endpoints.js';

const USAGE = `Usage : iakaframe endpoints [options]

Etat MESURE EN DIRECT des endpoints d'auto-update d'une app Tauri : lesquels servent un manifeste
exploitable, lequel gagne, et si la bascule (CA-11) a reellement sur quoi s'appuyer.

Un code 200 ne suffit pas : un depot prive rend volontiers 200 + une page de connexion. Un
endpoint n'est compte comme SERVANT que s'il rend un manifeste au contrat (version + platforms).

Options :
  --app <dir>        Racine de l'app (lit <dir>/src-tauri/tauri.conf.json)
  --conf <fichier>   Chemin direct d'un tauri.conf.json
  --url <a,b,c>      Liste d'endpoints a mesurer, dans l'ordre (au lieu d'une configuration)
  --premier          S'arreter au premier qui sert (contrat exact de l'updater)
  --timeout <sec>    Delai par endpoint (defaut : ${DELAI_DEFAUT_S})
  --artefacts        Mesure AUSSI les URL d'artefacts annoncees par le manifeste retenu
  --manifeste <f>    Mesure les artefacts d'un manifeste LOCAL (avant publication), sans lire
                     le reseau cote endpoints : « ce que je m apprete a annoncer, est-ce la ? »
  --json             Sortie machine (C-JSON)

Sans --premier, TOUS les endpoints sont mesures : c'est le seul moyen de savoir combien de canaux
repondent vraiment, donc si le premier a le droit de mourir.

Servir un manifeste ne suffit pas : le 2026-08-28, deux apps voyaient leur mise a jour sur deux
canaux et AUCUNE des cinq URL annoncees n'etait telechargeable. --artefacts mesure ce second
demi-tour, celui par lequel la mise a jour s installe reellement.`;

function confDe(values) {
  if (values.conf) return path.resolve(values.conf);
  const app = path.resolve(values.app || process.cwd());
  return path.join(app, 'src-tauri', 'tauri.conf.json');
}

export async function runEndpoints(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      app: { type: 'string' }, conf: { type: 'string' }, url: { type: 'string' },
      premier: { type: 'boolean', default: false }, timeout: { type: 'string' },
      artefacts: { type: 'boolean', default: false }, manifeste: { type: 'string' },
      json: { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }

  const timeoutMsLocal = Math.max(2, parseInt(values.timeout, 10) || DELAI_DEFAUT_S) * 1000;

  // MODE MANIFESTE LOCAL — « ce que je m apprete a annoncer, est-ce la ? ». Il n'y a rien a lire
  // sur le reseau : le fichier n'est pas encore publie. On mesure donc SES artefacts, et on le dit
  // (`source` porte le chemin, pas une URL) : personne ne doit confondre cette mesure avec l'etat
  // du canal servi.
  if (values.manifeste) {
    const f = path.resolve(values.manifeste);
    if (!fs.existsSync(f)) { fail(values.json, `manifeste introuvable : ${f}`, { manifeste: f }); return null; }
    let man;
    try { man = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {
      fail(values.json, `manifeste illisible : ${f} (${e.message})`, { manifeste: f }); return null;
    }
    const mesures = await sonderArtefacts(man, { timeoutMs: timeoutMsLocal });
    const va = verdictArtefacts(mesures);
    const payload = collection('artefacts', mesures, {
      source: f,
      mesureLe: new Date().toISOString(),
      version: typeof man.version === 'string' ? man.version : null,
      annonces: va.total,
      telechargeables: va.telechargeables,
      complet: va.complet,
      hotes: va.hotes,
    });
    emit(values.json, payload, () => {
      console.log(`\n=== iakaframe endpoints : manifeste local ${f} ===`);
      console.log(`mesure EN DIRECT le ${payload.mesureLe}`);
      for (const l of formaterArtefacts(mesures)) console.log(l);
      console.log('');
    });
    return payload;
  }

  let endpoints = [];
  let source = '';
  if (values.url) {
    endpoints = values.url.split(',').map((s) => s.trim()).filter(Boolean);
    source = '--url';
  } else {
    const conf = confDe(values);
    if (!fs.existsSync(conf)) {
      fail(values.json, `configuration introuvable : ${conf}`, { conf });
      return null;
    }
    try {
      endpoints = lireEndpoints(conf);
    } catch (e) {
      fail(values.json, `configuration illisible : ${conf} (${e.message})`, { conf });
      return null;
    }
    source = conf;
  }
  if (!endpoints.length) {
    fail(values.json, `aucun endpoint d update declare (${source}) : il n y a rien a mesurer`, { source });
    return null;
  }

  const timeoutMs = timeoutMsLocal;
  const res = values.premier
    ? await resoudre(endpoints, { timeoutMs })
    : await sonderTous(endpoints, { timeoutMs });
  const v = verdictRedondance(res.essais);

  // Le manifeste retenu n'est pas recopie dans la sortie : on en garde la VERSION (ce qui interesse)
  // sans deverser un document entier dans un rapport d'etat.
  const essais = res.essais.map(({ manifeste, ...e }) => ({ ...e, version: manifeste ? manifeste.version : null }));

  // Second demi-tour : le manifeste retenu tient-il sa promesse ? `null` — et non un tableau vide
  // — quand on n'a pas demande la mesure ou qu'aucun manifeste n'a ete retenu : « pas mesure » ne
  // se confond jamais avec « rien de telechargeable ».
  const mesuresArtefacts = values.artefacts && res.manifeste
    ? await sonderArtefacts(res.manifeste, { timeoutMs })
    : null;
  const va = mesuresArtefacts ? verdictArtefacts(mesuresArtefacts) : null;

  const payload = collection('essais', essais, {
    source,
    // NOM EXPLICITE : date de la MESURE reseau, jamais d'un cache (garde d'honnetete, § 9).
    mesureLe: res.mesureLe,
    declares: endpoints.length,
    retenu: res.retenu ? res.retenu.url : null,
    version: res.manifeste ? res.manifeste.version : null,
    servent: v.servent,
    // `null` et non `false` quand la liste n'a pas ete mesuree en entier : ne pas confondre
    // « pas redondant » avec « pas mesure ».
    redondant: res.complet ? v.redondant : null,
    complet: res.complet,
    artefacts: mesuresArtefacts,
    telechargeables: va ? va.telechargeables : null,
    artefactsComplet: va ? va.complet : null,
  });

  emit(values.json, payload, () => {
    for (const l of formater(res, path.basename(path.dirname(path.dirname(source))) || source)) console.log(l);
    if (values.premier && res.essais.length < endpoints.length) {
      console.log(`(${endpoints.length - res.essais.length} endpoint(s) non mesure(s) : --premier s arrete au premier qui sert)`);
    }
    if (mesuresArtefacts) for (const l of formaterArtefacts(mesuresArtefacts)) console.log(l);
    else if (values.artefacts) console.log('\nARTEFACTS ANNONCES : non mesures — aucun manifeste retenu.');
    console.log('');
  });
  return payload;
}

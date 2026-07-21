// iakaframe vendor-check - constate que le vendorage de iakaFrameGUI est fidele au canon iakaframe.
// (specs/instructions/garde-vendor-check-cross-repo.md § 3.2/3.4/4.4/4.5)
//
// La source detient la verite ; c'est elle qui constate que son miroir a decroche. Le verbe rend
// la garde INVOCABLE a la demande et scriptable (--json), et surtout : il donne le geste de
// remediation. Une garde qui affiche un rouge que personne ne sait eteindre est une garde qu'on
// finit par desactiver.
//
// GRACIEUX PAR DEFAUT : depot frere absent -> exit 0 (on ne bloque pas un clone isole) mais
// ok:false (rien n'a ete compare). --strict pour l'usage portefeuille, ou l'on SAIT que les deux
// depots sont la.
import { parseArgs } from 'node:util';
import { libraryRoot } from '../lib/library.js';
import { checkVendor } from '../lib/vendor.js';
import { emit } from '../lib/output.js';

// --- Remediation DERIVEE de l'etat mesure (specs/instructions/remede-vendor-check-derive-de-l-etat.md)
//
// POURQUOI CE BLOC A ETE REECRIT. Il exposait deux listes CONSTANTES, imprimees a l'identique quelle
// que soit la derive constatee. La commande MESURE finement (famille, nature, raison exacte —
// cli/src/lib/vendor.js:163-173) puis JETAIT cette information au moment de conseiller. Trois
// symptomes d'une seule cause :
//   1. `cp library/personas/*.md` embarquait `_TEMPLATE.md` (9 fichiers pour 8 fixtures) -> la
//      copie fabriquait un `fixture-surnumeraire`, donc exit 1. LE REMEDE FABRIQUAIT LA PANNE.
//   2. `iakaframe assemble ... --write` visait `kits/<id>.md`, fichier qui n'est dans AUCUNE ligne
//      de fixtureTable() : jamais lu par la garde, donc sans effet possible sur le verdict — et
//      destructeur avec --force (serializeKit rend un corps-stub, cf. library.js:318-327).
//   3. Sur `niveau2-contrat-vivant-different`, seul un `cp` du golden etait imprime — or cette
//      raison signifie que LE GOLDEN LUI-MEME est perime : le copier propage le perime.
// Un outil de diagnostic qui imprime un remede fautif est PIRE qu'un outil muet : le muet fait
// chercher, celui-la fait obeir.
//
// INVARIANT CONSERVE (l'ancien commentaire le protegeait, il reste vrai) : aucune derivee de mode
// `frontmatter` (methode, methode wrapped, team) ne peut produire une action `copy`. Les copier
// detruirait la forme canonique sur laquelle methodMd/teamMd.test.ts sont batis. C'est desormais
// une propriete de la table ci-dessous, plus une consigne en prose.

const FIXTURES_REL_POSIX = 'packages/core/__tests__/fixtures';
const CMD_GEN_FIXTURES = 'node packages/core/scripts/gen-fixtures.mjs';
const CMD_GEN_GOLDEN = 'node cli/scripts/gen-agents-golden.mjs';

// Derivees SERIALISEES cote GUI : regeneration, jamais copie.
const SERIALIZED_FAMILIES = new Set(['methode', 'methode-wrapped', 'team']);

// Ordre d'application : regenerer AVANT de copier (sinon on propage un canon perime, cf. § 2.4),
// supprimer en dernier. `investigate` remonte en tete : il n'y a rien a appliquer tant que
// l'anomalie cote canon n'est pas levee.
const ACTION_RANK = { investigate: 0, run: 1, copy: 2, delete: 3 };

// Toutes les raisons emises par cli/src/lib/vendor.js. Le test d'exhaustivite (C-7) RELIT le source
// de vendor.js et croise avec cet ensemble : une raison ajoutee plus tard sans remede rougit.
export const KNOWN_REASONS = new Set([
  'contenu-different',
  'contenu-different-vs-golden-depouille',
  'en-tete-golden-illisible',
  'fixture-manquante',
  'fixture-surnumeraire',
  'frontmatter-different',
  'golden-vendore-sans-frontmatter',
  'niveau2-contrat-vivant-different',
  'niveau2-injouable',
  'source-introuvable',
]);

const posix = (p) => String(p).split(/[\\/]/).join('/');

// Copie NOMMEE, jamais de joker (§ 3.2). `source` est relatif a la racine iakaframe, `dest` a la
// racine du miroir : deux racines, deux chemins, aucune ambiguite pour un consommateur machine.
function copyEntry(base, source, dest, note) {
  return {
    ...base, action: 'copy', source, dest,
    command: `cp ${source}   <GUI>/${dest}`,
    ...(note ? { note } : {}),
  };
}

// Le kit est le SEUL geste de copie qui TRANSFORME son contenu : la reference est le golden CLI
// DEPOUILLE de son en-tete (A21, vendor.js:198-207). Un `cp` nu fabriquerait une nouvelle derive —
// d'ou `strip: true` (consommateur machine) ET une note explicite (operateur humain).
function kitEntry(base, source, dest) {
  return {
    ...base, action: 'copy', source, dest, strip: true,
    command: `copier ${source} DEPOUILLE de son en-tete vers <GUI>/${dest}`,
    // NE JAMAIS citer ici l'ancien geste fautif, meme pour dire qu'il est retire : la note est
    // lue par un operateur qui copie ce qu'il voit (C-3 verrouille l'absence de la chaine).
    note: 'retirer tout ce qui precede le premier `---` (en-tete <!-- ... -->). Un `cp` nu '
      + 'laisserait l\'en-tete et produirait une nouvelle derive.',
  };
}

function runEntry(base, command, cwd, note) {
  return { ...base, action: 'run', command: `${command}   (depuis ${cwd})`, ...(note ? { note } : {}) };
}

function deleteEntry(base, dest) {
  return {
    ...base, action: 'delete', dest,
    command: `rm <GUI>/${dest}`,
    note: 'fichier non attendu par fixtureTable() : le SUPPRIMER. Aucune copie ne l\'eteindrait.',
  };
}

function investigateEntry(base, note) {
  return { ...base, action: 'investigate', command: '(aucun geste automatique)', note };
}

// Gestes pour UNE raison portee par UNE fixture. Table EXHAUSTIVE : aucune raison sans geste.
function entriesForReason(f, r) {
  const fixture = posix(f.fixture);
  const dest = `${FIXTURES_REL_POSIX}/${fixture}`;
  const source = f.source ? posix(f.source) : null;
  const base = { reason: r.reason, fixture, family: f.family };

  switch (r.reason) {
    // Copie byte-a-byte perdue (personas, goldens, binding) : re-copier la source nommee.
    case 'contenu-different':
    case 'golden-vendore-sans-frontmatter':
      return [copyEntry(base, source, dest)];

    // Fixture absente : le geste de sa propre famille, jamais un geste generique.
    case 'fixture-manquante':
      if (SERIALIZED_FAMILIES.has(f.family)) {
        return [runEntry(base, CMD_GEN_FIXTURES, '<GUI>', 'le script recree la derivee absente.')];
      }
      if (f.family === 'kit') return [kitEntry(base, source, dest)];
      return [copyEntry(base, source, dest)];

    // Kit : egalite byte contre le golden DEPOUILLE (§ 3.3, comble le trou du § 2.3).
    case 'contenu-different-vs-golden-depouille':
      return [kitEntry(base, source, dest)];

    // Derivee serialisee : REGENERATION. Jamais `cp` — invariant historique d'A14.
    case 'frontmatter-different':
      return [runEntry(base, CMD_GEN_FIXTURES, '<GUI>',
        'derivee SERIALISEE : la copier detruirait sa forme canonique.')];

    // Le golden vendore differe du contrat REGENERE depuis le canon vivant : le golden CLI est
    // peut-etre lui-meme perime. Regenerer d'abord, copier ensuite (§ 2.4) — l'ordre est porte
    // par ACTION_RANK, pas laisse a la lecture.
    case 'niveau2-contrat-vivant-different':
      return [
        runEntry(base, CMD_GEN_GOLDEN, 'iakaframe',
          'le golden CLI peut etre perime : le copier tel quel propagerait le perime.'),
        copyEntry(base, source, dest, 'a faire APRES la regeneration ci-dessus.'),
      ];

    case 'fixture-surnumeraire':
      return [deleteEntry(base, dest)];

    // Anomalies cote CANON : aucun geste de copie ne s'applique, le miroir n'est pas en cause.
    case 'source-introuvable':
      return [investigateEntry(base,
        `source absente cote iakaframe : ${source}. Anomalie du canon, pas du miroir.`)];
    case 'en-tete-golden-illisible':
      return [investigateEntry(base,
        `golden sans en-tete exploitable cote iakaframe : ${source}.`)];
    case 'niveau2-injouable':
      return [investigateEntry(base,
        'canon illisible, le niveau 2 n\'a pas pu etre joue' + (r.detail ? ` : ${r.detail}` : '.'))];

    // Filet : une raison inconnue ne doit JAMAIS sortir silencieusement sans geste (C-7).
    default:
      return [{
        ...base, action: 'investigate', unknown: true,
        command: '(aucun geste automatique)',
        note: `raison non couverte par la table de remediation : ${r.reason}. `
          + 'A traiter dans cli/src/commands/vendor-check.js (entriesForReason).',
      }];
  }
}

// Fonction PURE, sans E/S : le remede est une DONNEE DERIVEE de la mesure, plus un texte constant.
// Le nombre de lignes rendues est proportionnel a la DERIVE, jamais a l'inventaire.
export function remediationFor(res) {
  if (!res || !Array.isArray(res.files) || res.status === 'skipped') return [];
  const out = [];
  const seen = new Set();
  for (const f of res.files) {
    for (const r of f.reasons || []) {
      for (const e of entriesForReason(f, r)) {
        // Une meme copie peut etre demandee par deux raisons (niveau 1 + niveau 2 sur un golden) :
        // l'operateur ne doit la lire qu'une fois.
        const key = `${e.action}|${e.source || ''}|${e.dest || ''}|${e.command}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(e);
      }
    }
  }
  return out.sort((a, b) => (ACTION_RANK[a.action] - ACTION_RANK[b.action])
    || String(a.dest || a.fixture).localeCompare(String(b.dest || b.fixture)));
}

function humanReport(res, strict) {
  if (res.status === 'skipped') {
    console.log('vendor-check : SKIP - ' + res.reason);
    console.log('  chemins essayes :');
    for (const c of res.candidates) console.log('    - ' + c);
    console.log('  override : IAKAFRAME_GUI_ROOT=<chemin absolu vers iakaFrameGUI>');
    if (strict) console.log('  --strict : absence du frere traitee comme un echec.');
    return;
  }
  if (res.ok) {
    console.log(`vendor-check : OK - ${res.checked} copies + ${res.derived} derivees conformes au canon.`);
    console.log('  miroir : ' + res.guiRoot);
    return;
  }

  console.log(`vendor-check : DERIVE - ${res.drift} fixture(s) sur ${res.checked + res.derived} verifiee(s).`);
  console.log('  miroir : ' + res.guiRoot);
  console.log('');
  for (const f of res.files) {
    const nature = f.kind === 'derived' ? 'derivee' : (f.kind === 'unexpected' ? 'surnumeraire' : 'copie');
    console.log(`  - ${f.fixture}  [${f.family} / ${nature}]`);
    for (const r of f.reasons) {
      let line = '      ' + r.reason;
      if (r.fields) line += ' : ' + r.fields.map((d) => d.field).join(', ');
      if (r.detail) line += ' : ' + r.detail;
      console.log(line);
    }
    if (f.source) console.log('      source : ' + f.source);
  }
  // Le remede est DERIVE de ce qui vient d'etre mesure : un geste par derive constatee, dans
  // l'ordre d'application. Zero derive sur une famille -> aucune ligne sur cette famille.
  const remediation = remediationFor(res);
  if (!remediation.length) return;
  console.log('');
  console.log(`  REMEDE - ${remediation.length} geste(s), un par derive constatee, DANS CET ORDRE :`);
  console.log('  (ne jamais copier une derivee serialisee : sa forme canonique serait detruite)');
  let n = 0;
  for (const e of remediation) {
    console.log(`  ${++n}. [${e.action}] ${e.fixture}  <- ${e.reason}`);
    console.log('       ' + e.command);
    if (e.note) {
      for (const line of wrapNote(e.note)) console.log('       ' + line);
    }
  }
}

// Enveloppe une note longue a ~86 colonnes, pour rester lisible en terminal etroit.
function wrapNote(note, width = 86) {
  const words = String(note).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur.length + 1 + w.length) > width) { lines.push(cur); cur = w; }
    else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

export function runVendorCheck(argv) {
  const { values } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' },
      gui: { type: 'string' },
      strict: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
    },
  });
  const json = values.json;
  const root = libraryRoot(values.root);
  const res = checkVendor({ root, guiRoot: values.gui || undefined });

  if (res.status === 'skipped') {
    if (values.strict) {
      // --strict : l'absence du frere devient un echec (usage portefeuille).
      const payload = { ok: false, error: res.reason, status: 'skipped', candidates: res.candidates };
      emit(json, payload, () => humanReport(res, true));
      process.exitCode = 1;
      return payload;
    }
    // Defaut gracieux : exit 0, mais ok:false — rien n'a ete verifie.
    emit(json, res, () => humanReport(res, false));
    return res;
  }

  // `remediation` est ADDITIF (§ 3.5 / C-9) : aucune cle existante n'est renommee ni supprimee, et
  // le spread preserve l'ordre d'insertion, donc `ok` reste en PREMIERE cle (C-JSON). C'est ce qui
  // rend le bouclage mecanisable par un agent consommateur, sans passer par un shell.
  const payload = { ...res, remediation: remediationFor(res) };
  emit(json, payload, () => humanReport(res, values.strict));
  if (!res.ok) process.exitCode = 1;
  return payload;
}

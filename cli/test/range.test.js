// Verbe `range` (sauvegarde du portefeuille) — instruction specs/instructions/sauvegarde-portefeuille.md.
//
// Ce que ces tests gardent, et pourquoi ce sont EUX qui comptent : le lot est presque
// entierement de la CONFIGURATION. Il n'y a quasiment rien a relire dans le depot, donc les
// seules choses qu'on peut tenir dans le temps sont (1) le REFUS d'un perimetre non reconnu,
// (2) l'ABSENCE du secret dans l'argv, (3) l'existence du point de debrayage `D4`.
//
// Aucun test ne touche au vrai depot de sauvegarde, ne demande le reseau, ni ne lance restic :
// tout passe par des fonctions PURES et des tmpdir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_PASSWORD_COMMAND, DEFAULT_REPOSITORY, TAG_RANGE,
  buildBackupArgs, buildEnv, defaultExcludeFile, extraireResume,
  listerProjets, resoudrePerimetre, validerNomProjet,
} from '../src/lib/range.js';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'index.js');

// 🛑 CE HARNAIS EST NE D'UN INCIDENT REEL, LE 2026-08-15 — ne pas l'alleger.
// Pendant la falsification des gardes (on sabote la source, on verifie que le test rougit), le
// sabotage « un projet inconnu retombe sur all » a fait qu'un test lancant le CLI a REELLEMENT
// ecrit un instantane dans le DEPOT DE PRODUCTION. Rien n'a ete detruit — `range` n'appelle ni
// `forget` ni `prune` — mais la lecon est nette : *un test qui lance le vrai binaire herite des
// vrais defauts*, et `range` n'a ni confirmation ni simulation par defaut.
// Parade STRUCTURELLE : tout CLI lance ici pointe sur un depot JETABLE et INEXISTANT. Si une
// regression de resolution de perimetre survient, restic echoue sur un depot absent au lieu
// d'ecrire chez le voisin. Le harnais protege donc de la faute qu'il sert a detecter.
function envSans(depotReel, tmp) {
  const env = { ...process.env };
  delete env.RESTIC_REPOSITORY;
  delete env.RESTIC_PASSWORD_COMMAND;
  env.IAKA_RANGE_REPOSITORY = path.join(tmp, 'depot-jetable-inexistant');
  env.IAKA_RANGE_PASSWORD_COMMAND = 'printf mot-de-passe-de-test';
  return env;
}

function chapeauFactice() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-range-'));
  fs.mkdirSync(path.join(root, 'alpha'));
  fs.mkdirSync(path.join(root, 'beta'));
  fs.writeFileSync(path.join(root, 'un-fichier.md'), 'pas un projet\n');
  fs.mkdirSync(path.join(root, '.cache'));
  return root;
}
const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

// --- perimetre : ce qui est accepte -------------------------------------------------------------

test('range all : le perimetre est le chapeau entier, etiquete perimetre:all', () => {
  const root = chapeauFactice();
  try {
    const p = resoudrePerimetre('all', root);
    assert.equal(p.portee, 'all');
    assert.equal(p.projet, null);
    assert.equal(p.chemin, root);
    assert.deepEqual(p.tags, [TAG_RANGE, 'perimetre:all']);
  } finally { rm(root); }
});

test('range <projet> : le perimetre est CE projet seul, etiquete projet:<nom>', () => {
  const root = chapeauFactice();
  try {
    const p = resoudrePerimetre('alpha', root);
    assert.equal(p.portee, 'projet');
    assert.equal(p.projet, 'alpha');
    assert.equal(p.chemin, path.join(root, 'alpha'));
    assert.deepEqual(p.tags, [TAG_RANGE, 'projet:alpha']);
    // La cible ne remonte JAMAIS au chapeau : c'est ce qui fait qu'un instantane cible
    // ne contient que le projet vise.
    assert.notEqual(p.chemin, root);
  } finally { rm(root); }
});

test('listerProjets : repertoires de premier niveau seulement (ni fichiers, ni caches)', () => {
  const root = chapeauFactice();
  try {
    assert.deepEqual(listerProjets(root), ['alpha', 'beta']);
  } finally { rm(root); }
});

// --- perimetre : ce qui est REFUSE (famille CTRL-1) ----------------------------------------------
// Un argument non reconnu ne retombe JAMAIS sur le defaut. Sans ces temoins, `range zzz` pourrait
// sauvegarder tout le chapeau — ou produire un instantane vide qui a l'air d'avoir marche.

test('TEMOIN NEGATIF : un projet inconnu est REFUSE, jamais un repli sur all', () => {
  const root = chapeauFactice();
  try {
    assert.throws(() => resoudrePerimetre('nexiste-pas', root), /projet inconnu/);
    // et le message dit quoi taper a la place : un refus muet est un mur
    try { resoudrePerimetre('nexiste-pas', root); } catch (e) {
      assert.match(e.message, /range --list/);
    }
  } finally { rm(root); }
});

test('TEMOIN NEGATIF : un fichier de premier niveau n\'est pas un projet', () => {
  const root = chapeauFactice();
  try {
    assert.throws(() => resoudrePerimetre('un-fichier.md', root), /projet inconnu/);
  } finally { rm(root); }
});

test('TEMOIN NEGATIF : la traversee de chemin est refusee AVANT tout acces disque', () => {
  const root = chapeauFactice();
  try {
    for (const mauvais of ['..', '.', '../../etc', 'a/b', 'a\\b', path.join(root, 'alpha')]) {
      assert.throws(() => resoudrePerimetre(mauvais, root), /interdit/, `refuse : ${mauvais}`);
    }
    // un nom commencant par '-' serait lu par restic comme une OPTION
    assert.ok(validerNomProjet('--repo').includes('option'));
  } finally { rm(root); }
});

// --- argv : le contrat de la commande lancee ------------------------------------------------------

test('buildBackupArgs : chemin, fichier d\'exclusion et etiquettes sont TOUS presents', () => {
  const root = chapeauFactice();
  try {
    const p = resoudrePerimetre('alpha', root);
    const args = buildBackupArgs(p, { excludeFile: '/tmp/excl.txt' });
    assert.equal(args[0], 'backup');
    assert.equal(args[1], path.join(root, 'alpha'));
    assert.ok(args.includes('--exclude-file') && args.includes('/tmp/excl.txt'));
    assert.ok(args.includes('projet:alpha'));
    assert.ok(!args.includes('--dry-run'));
    const sim = buildBackupArgs(p, { excludeFile: '/tmp/excl.txt', dryRun: true, json: true });
    assert.ok(sim.includes('--dry-run') && sim.includes('--json'));
  } finally { rm(root); }
});

test('🛑 GARDE : le verbe n\'appelle JAMAIS forget ni prune (il ecrit, il ne supprime pas)', () => {
  const root = chapeauFactice();
  try {
    const args = buildBackupArgs(resoudrePerimetre('all', root), { excludeFile: '/tmp/e' });
    for (const interdit of ['forget', 'prune', 'unlock', 'init']) {
      assert.ok(!args.includes(interdit), `argv ne porte pas ${interdit}`);
    }
  } finally { rm(root); }
});

test('🛑 GARDE : le SECRET n\'est jamais dans l\'argv — seulement la commande qui le lit', () => {
  const root = chapeauFactice();
  try {
    const args = buildBackupArgs(resoudrePerimetre('all', root), { excludeFile: '/tmp/e' });
    const plat = args.join(' ');
    // ni option de mot de passe, ni valeur : restic le lira sur la SORTIE d'une commande.
    assert.ok(!/--password/.test(plat), 'aucune option --password* dans l\'argv');
    assert.ok(!/RESTIC_PASSWORD/.test(plat), 'aucune variable de mot de passe dans l\'argv');

    const env = buildEnv({ repository: 'sftp:h:/d', passwordCommand: 'cmd-qui-rend-le-secret' }, {});
    assert.equal(env.RESTIC_REPOSITORY, 'sftp:h:/d');
    assert.equal(env.RESTIC_PASSWORD_COMMAND, 'cmd-qui-rend-le-secret');
    // le mot de passe LUI-MEME n'a aucune place ici :
    assert.equal(env.RESTIC_PASSWORD, undefined);
  } finally { rm(root); }
});

test('defauts : depot et lecture de cle sur DEUX machines distinctes (garde de D5)', () => {
  // Le depot vit sur une machine, la cle sur une AUTRE. Les reunir donnerait, a qui compromet
  // cette machine, et les donnees chiffrees et la cle.
  const hoteDepot = DEFAULT_REPOSITORY.split(':')[1];
  assert.ok(hoteDepot, 'le depot par defaut nomme un hote');
  assert.ok(!DEFAULT_PASSWORD_COMMAND.includes(` ${hoteDepot} `),
    `la cle ne se lit pas sur l'hote qui porte le depot (${hoteDepot})`);
  assert.ok(!/^\s*cat\b/.test(DEFAULT_PASSWORD_COMMAND),
    'la cle ne se lit pas sur le poste local');
});

// --- point de debrayage D4 -----------------------------------------------------------------------

test('🛑 le point de debrayage D4 EXISTE (fichier d\'exclusion versionne)', () => {
  const f = defaultExcludeFile();
  assert.ok(fs.existsSync(f), `fichier d'exclusion present : ${f}`);
  // Il doit rester LISIBLE et documente : c'est ce que le decideur ouvrira le jour ou il exclut.
  assert.match(fs.readFileSync(f, 'utf8'), /D4/);
});

// --- lecture du resume restic --------------------------------------------------------------------

test('extraireResume : retient le dernier summary du flux nd-json, sinon null', () => {
  const flux = [
    '{"message_type":"status","percent_done":0.5}',
    '{"message_type":"summary","files_new":3,"data_added":42}',
    '',
  ].join('\n');
  assert.equal(extraireResume(flux).files_new, 3);
  assert.equal(extraireResume('{"message_type":"status"}'), null, 'aucun summary => null, jamais un chiffre invente');
  assert.equal(extraireResume(''), null);
});

// --- surface CLI ---------------------------------------------------------------------------------

test('range <inconnu> --json : { ok:false } sur stdout et exitCode 1', () => {
  const root = chapeauFactice();
  try {
    const r = spawnSync(process.execPath, [CLI, 'range', 'nexiste-pas', '--root', root, '--json'],
      { encoding: 'utf8', env: envSans(null, root) });
    assert.equal(r.status, 1);
    const o = JSON.parse(r.stdout);
    assert.equal(o.ok, false);
    assert.match(o.error, /projet inconnu/);
    assert.equal(r.stderr.trim(), '', 'rien d\'humain sur stderr en mode --json');
  } finally { rm(root); }
});

test('range --list --json : collection au pluriel + count', () => {
  const root = chapeauFactice();
  try {
    const r = spawnSync(process.execPath, [CLI, 'range', '--list', '--root', root, '--json'],
      { encoding: 'utf8', env: envSans(null, root) });
    assert.equal(r.status, 0);
    const o = JSON.parse(r.stdout);
    assert.equal(o.ok, true);
    assert.equal(o.count, 2);
    assert.deepEqual(o.projets, ['alpha', 'beta']);
  } finally { rm(root); }
});

test('range sans argument : usage + exitCode 1 (aucun perimetre par defaut)', () => {
  const root = chapeauFactice();
  try {
    const r = spawnSync(process.execPath, [CLI, 'range'], { encoding: 'utf8', env: envSans(null, root) });
    assert.equal(r.status, 1, 'ne sauvegarde RIEN par defaut');
    assert.match(r.stderr + r.stdout, /Usage : iakaframe range/);
  } finally { rm(root); }
});

test('🛑 HARNAIS : un CLI lance par les tests ne peut PAS atteindre le depot par defaut', () => {
  const root = chapeauFactice();
  try {
    // Meme si la resolution de perimetre regressait, ce lancement ecrirait dans un depot
    // JETABLE et INEXISTANT — donc il echouerait — jamais dans le depot du portefeuille.
    const env = envSans(null, root);
    assert.ok(env.IAKA_RANGE_REPOSITORY.startsWith(root), 'le depot de test vit dans le tmpdir');
    assert.equal(env.RESTIC_REPOSITORY, undefined, "aucun depot herite de l'environnement");
    assert.notEqual(env.IAKA_RANGE_REPOSITORY, DEFAULT_REPOSITORY);

    const r = spawnSync(process.execPath, [CLI, 'range', 'alpha', '--root', root, '--json'],
      { encoding: 'utf8', env });
    // Le verdict qui compte : quoi qu'il arrive, ca N'ABOUTIT PAS sur un depot reel.
    assert.equal(r.status, 1, 'echoue plutot que d\'ecrire ailleurs');
    const o = JSON.parse(r.stdout);
    assert.equal(o.ok, false);
    assert.ok(!String(o.repository || '').startsWith('sftp:'),
      'le depot vise n\'est jamais celui de production');
  } finally { rm(root); }
});

test('range est route et documente dans l\'aide', () => {
  const r = spawnSync(process.execPath, [CLI, '--help'], { encoding: 'utf8' });
  assert.match(r.stdout, /range <all\|projet>/);
  assert.match(r.stdout, /SUR COMMANDE/);
});

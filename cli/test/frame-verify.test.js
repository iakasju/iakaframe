// Recette de la garde d'anonymisation du MIROIR (specs/instructions/outillage-scrub-miroir-frame.md).
//
// CE QUE CETTE SUITE VERROUILLE, ET POURQUOI ELLE EXISTE. Avant ce lot, la regle d'anonymisation
// n'etait PAS testee : c'etait une ligne de recette dans un `.md`, a executer a la main, et ce
// grep cherchait le litteral `:3001` — il ne matchait donc meme pas `port: 3001`, la forme
// reellement presente dans le miroir. Angle mort complet : la suite ne couvrait pas le frame.
//
// Le test le plus important du fichier est `C6bis` : un token de marque INVENTE, absent de toute
// liste, doit etre attrape. C'est la propriete demandee par le decideur — attraper le nom SUIVANT —
// et c'est exactement ce qu'une blacklist ne peut structurellement pas faire.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  scanText, checkStructure, verifyFrame, listFrameFiles,
  BRAND_ALLOW, PORT_ALLOW, GATES, LIMITS, brandTolerated,
} from '../src/lib/frame.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const CLI = path.join(REPO, 'cli', 'src', 'index.js');
const MIRROR = path.join(REPO, 'frames', 'releases', 'StefFrame2');

const gates = (text, file) => scanText(text, file).map(f => f.gate);
const of = (text, file, gate) => scanText(text, file).filter(f => f.gate === gate);

function tmpdir(prefix = 'frame-verify-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// =================================================================================================
// C5 - chaque gate G1..G6 : au moins un cas POSITIF (doit echouer) et un cas NEGATIF (doit passer)
// =================================================================================================

// --- G1 : secrets & infra ------------------------------------------------------------------------
test('G1 positif : IP privee, creds en URL, chemin home, cle PEM, JWT', () => {
  assert.equal(of('host = 192.168.2.11', 'a.js', 'G1').length, 1);
  assert.equal(of('const h = "10.0.0.5"', 'a.js', 'G1').length, 1);
  assert.equal(of('voir 172.16.0.1 ici', 'a.md', 'G1').length, 1);
  assert.equal(of('http://bob:s3cr3t@git.local/x.git', 'a.md', 'G1').length, 1);
  assert.equal(of('cd /Users/quelquun/work', 'a.md', 'G1').length, 1);
  assert.equal(of('-----BEGIN RSA PRIVATE KEY-----', 'a.txt', 'G1').length, 1);
  assert.equal(of('t=eyJhbGciOiJIUzI1.eyJzdWIiOiIxMjM0.SflKxwRJSMeKKF2QT4', 'a.md', 'G1').length, 1);
});

test('G1 negatif : IP publique, template d\'URL et placeholder ne sont pas des fuites', () => {
  assert.equal(of('dns 8.8.8.8 et 1.1.1.1', 'a.md', 'G1').length, 0);
  // Faux positif MESURE puis elimine : forgejo.js CONSTRUIT une URL, il ne porte pas de secret.
  assert.equal(of('return `http://${user}:${t}@${base}/x.git`;', 'cli/src/lib/forgejo.js', 'G1').length, 0);
  assert.equal(of('http://<user>:<token>@<host>/x.git', 'a.md', 'G1').length, 0);
  assert.equal(of('chemin ~/work/projet', 'a.md', 'G1').length, 0);
});

// --- G2 : marque, par ALLOWLIST ------------------------------------------------------------------
test('G2 positif : tout iaka* hors allowlist est refuse', () => {
  for (const tok of ['iakaHub', 'iakagraph', 'iakabox', 'iakaFrameGUI', 'iakaIDE']) {
    assert.equal(of(`texte ${tok} texte`, 'library/a.md', 'G2').length, 1, tok);
  }
});

test('C6bis - G2 attrape un token de marque INVENTE, absent de toute liste', () => {
  // Le critere qui prouve la propriete demandee par le decideur : attraper le nom SUIVANT.
  // Aucun de ces tokens n'existe nulle part dans le projet ni dans le code du gate.
  for (const tok of ['iakaZzztest', 'iakaQuantumForge', 'iakaNimbus7', 'iakaWidgetry']) {
    const hits = of(`la brique ${tok} du portefeuille`, 'library/a.md', 'G2');
    assert.equal(hits.length, 1, `${tok} doit etre attrape par G2`);
    assert.equal(hits[0].token, tok);
  }
});

test('G2 negatif : la marque du frame passe, quelle que soit la casse', () => {
  for (const tok of ['iakaframe', 'iakastart', 'iaka', 'iakalog', 'IAKAFRAME', 'IakaFrame']) {
    assert.equal(of(`texte ${tok} texte`, 'library/a.md', 'G2').length, 0, tok);
  }
  // Les composes a separateur se reduisent au radical autorise.
  assert.equal(of('skill iakaframe-git et IAKAFRAME_HOSTS', 'a.js', 'G2').length, 0);
});

test('G2 tolerance ciblee : iakaIDE tolere dans cli/, bloque partout ailleurs', () => {
  // Arbitrage explicite du decideur (§ 9 point 2) : scrubber cli/ forkerait davantage le CLI.
  // La tolerance doit rester EXPLICITE, jamais un oubli silencieux -> elle est testee.
  assert.equal(of('runner iakaIDE', 'cli/src/commands/go.js', 'G2').length, 0);
  assert.equal(of('runner iakaIDEBinary', 'cli/src/commands/config.js', 'G2').length, 0);
  assert.equal(of('runner iakaIDE', 'library/skills/x/SKILL.md', 'G2').length, 1);
  assert.equal(of('runner iakaIDE', 'methode-de-travail.md', 'G2').length, 1);
  assert.equal(brandTolerated('iakaIDE', 'cli/src/x.js'), true);
  assert.equal(brandTolerated('iakaIDE', 'kits/x/README.md'), false);
  assert.equal(brandTolerated('iakaHub', 'cli/src/x.js'), false, 'la tolerance ne vaut que pour iakaIDE');
});

// --- G3 : identite du decideur --------------------------------------------------------------------
test('G3 positif : identite en prose, en commentaire ET en position de regex', () => {
  assert.equal(of('« qui est Stephane » priment', 'a.js', 'G3').length, 1);
  // L'ecart reel mesure est DANS UN LITTERAL DE REGEX EXECUTE. Un scrub qui ne lit que la prose
  // le rate : c'etait le cas de l'ancien.
  assert.equal(of('if (/^stephane-/.test(fiche.name)) return 3;', 'a.js', 'G3').length, 1);
  assert.equal(of('// commentaire sjupin ici', 'a.js', 'G3').length, 1);
  assert.equal(of('Stéphane décide', 'a.md', 'G3').length, 1, 'variante accentuee');
  assert.equal(of('STEPHANE', 'a.md', 'G3').length, 1, 'casse-insensible');
});

test('G3 negatif : ni le role ni un mot contenant la sous-chaine ne declenchent', () => {
  assert.equal(of('le decideur tranche', 'a.md', 'G3').length, 0);
  assert.equal(of('stephanotis est une plante', 'a.md', 'G3').length, 0);
});

// --- G4 : couche produit & references pendantes ---------------------------------------------------
test('G4 positif : skill layer:product et references pendantes', () => {
  const root = tmpdir();
  const mk = (p, c) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), c); };
  mk('library/skills/iakaframe-forgejo/SKILL.md', '---\nid: iakaframe-forgejo\nlayer: product\n---\n# x\n');
  mk('library/skills/iakaframe-cadrage/SKILL.md', '---\nid: iakaframe-cadrage\nlayer: capacity\n---\n# x\n');
  mk('library/personas/gandalf.md', '---\nid: gandalf\nskills: [iakaframe-cadrage, iakaframe-absente]\n---\n# x\n');
  mk('methods/m.md', '---\nid: m\nprincipleIds: [preuve-avant-declaration]\n---\n# x\n');
  fs.mkdirSync(path.join(root, 'library/principles'), { recursive: true });

  const f = checkStructure(root);
  assert.ok(f.some(x => x.token === 'layer: product'), 'couche produit interdite au miroir');
  assert.ok(f.some(x => x.token === 'iakaframe-absente'), 'reference pendante vers une skill absente');
  assert.ok(f.some(x => x.token === 'preuve-avant-declaration'), 'reference pendante vers un principe absent');
  fs.rmSync(root, { recursive: true, force: true });
});

test('G4 negatif : capacity/family + toutes references resolues -> aucun constat', () => {
  const root = tmpdir();
  const mk = (p, c) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), c); };
  mk('library/skills/iakaframe-cadrage/SKILL.md', '---\nid: iakaframe-cadrage\nlayer: capacity\n---\n# x\n');
  mk('library/skills/iakaframe-git/SKILL.md', '---\nid: iakaframe-git\nlayer: family\n---\n# x\n');
  mk('library/personas/gandalf.md', '---\nid: gandalf\nskills: [iakaframe-cadrage]\n---\n# x\n');
  mk('library/principles/preuve-avant-declaration.md', '---\nid: preuve-avant-declaration\n---\n# x\n');
  mk('methods/m.md', '---\nid: m\nprincipleIds: [preuve-avant-declaration]\n---\n# x\n');

  assert.deepEqual(checkStructure(root), []);
  fs.rmSync(root, { recursive: true, force: true });
});

// --- G5 : ports d'infra ----------------------------------------------------------------------------
test('G5 positif : port hors allowlist, INDEPENDAMMENT du separateur', () => {
  // Le defaut historique : la recette grepait le litteral `:3001` et ratait donc `port: 3001`.
  assert.equal(of("{ name: 'git (Forgejo)', port: 3001, path: '/x' }", 'a.js', 'G5').length, 1);
  assert.equal(of('port=3001', 'a.js', 'G5').length, 1);
  assert.equal(of('port : "3001"', 'a.md', 'G5').length, 1);
  assert.equal(of('http://<box>:4001/v1', 'a.md', 'G5').length, 1);
  assert.equal(of('`:3041` = admin/health', 'a.md', 'G5').length, 1);
});

test('G5 negatif : ports de l\'allowlist, CSS minifiee, tags d\'image et refs fichier:ligne', () => {
  assert.equal(of("{ name: 'Ollama', port: 11434 }", 'a.js', 'G5').length, 0);
  assert.equal(of('http://<box>:11434', 'a.md', 'G5').length, 0);
  assert.equal(of('ports: ["<port-hote-decale>:5432"]', 'a.md', 'G5').length, 0);
  // Faux positifs MESURES sur le corpus reel, elimines par le seuil de 4 chiffres :
  assert.equal(of('h1{font-weight:800;font-size:1.9rem;}', 'a.js', 'G5').length, 0);
  assert.equal(of('.r{border-radius:999px;}', 'a.js', 'G5').length, 0);
  assert.equal(of('image: postgres:16', 'a.md', 'G5').length, 0);
  // ... et par le masquage de la convention `fichier.ext:ligne`, massive dans le corpus :
  assert.equal(of('cf. consolidate.js:1115 et methode-de-travail.md:4200', 'a.md', 'G5').length, 0);
});

// --- G6 : noms propres residuels (AVERTISSEMENT, jamais bloquant) ----------------------------------
test('G6 positif : CamelCase interne ET capitale en milieu de phrase', () => {
  assert.ok(of('le service ZorgTech tourne', 'a.md', 'G6').length >= 1, 'CamelCase interne');
  // La moitie (b) : `Hermes` n'a AUCUNE capitale interne. Sans elle, la plus grosse fuite
  // residuelle du miroir (17 occurrences) passait inapercue.
  assert.ok(of('le service Hermes tourne', 'a.md', 'G6').some(f => f.token === 'Hermes'));
  // ... y compris derriere un separateur, forme reelle du corpus (`n8n/Hermes`).
  assert.ok(of('pilote par n8n/Hermes en chaine', 'a.md', 'G6').some(f => f.token === 'Hermes'));
});

test('G6 negatif : dictionnaire, code, debut de phrase, et .md uniquement', () => {
  assert.equal(of('avec Docker et Claude sur Ollama', 'a.md', 'G6').length, 0, 'dictionnaire');
  assert.equal(of('Gimli remet a Legolas', 'a.md', 'G6').length, 0, 'personas du frame');
  assert.equal(of('Une phrase. Puis une autre.', 'a.md', 'G6').length, 0, 'debut de phrase');
  assert.equal(of('le champ `roleKey` du binding', 'a.md', 'G6').length, 0, 'span de code masque');
  // G6 ne lit que la PROSE markdown : sans cela, 3020 occurrences brutes de CamelCase (les
  // identifiants de tout le code source) rendaient la sortie inexploitable.
  assert.equal(of('const roleIndex = createIfAbsent(x);', 'a.js', 'G6').length, 0, 'hors .md');
});

test('G6 ne fait JAMAIS basculer le verdict (avertissement par construction)', () => {
  const root = tmpdir();
  fs.writeFileSync(path.join(root, 'a.md'), 'le service ZorgTech et MachinChose tournent ici\n');
  const res = verifyFrame(root);
  assert.ok(res.warnings > 0, 'des avertissements sont bien emis');
  assert.equal(res.blocking, 0);
  assert.equal(res.ok, true, 'un miroir sans fuite bloquante reste vert malgre des G6');
  fs.rmSync(root, { recursive: true, force: true });
});

// =================================================================================================
// Verdict, contrat de sortie, CLI
// =================================================================================================

test('C1 - verifyFrame sort vert sur un miroir conforme', () => {
  const root = tmpdir();
  fs.writeFileSync(path.join(root, 'README.md'), '# iakaframe\n\nMethode outillee, port 8080.\n');
  fs.writeFileSync(path.join(root, 'a.js'), "const h = process.env.IAKAFRAME_HOSTS || ['localhost'];\n");
  const res = verifyFrame(root);
  assert.equal(res.ok, true);
  assert.equal(res.blocking, 0);
  assert.equal(res.checked, 2);
  fs.rmSync(root, { recursive: true, force: true });
});

test('C2 - contrat --json : { ok, checked, findings:[{gate,file,line,token}] }', () => {
  const root = tmpdir();
  fs.writeFileSync(path.join(root, 'a.md'), 'fuite iakaHub ici\n');
  const r = spawnSync(process.execPath, [CLI, 'frame', 'verify', '--frame', root, '--json'], { encoding: 'utf8' });
  assert.equal(r.status, 1, 'exit non-zero sur miroir en fuite');
  const out = JSON.parse(r.stdout);
  assert.equal(typeof out.ok, 'boolean');
  assert.equal(out.ok, false);
  assert.equal(typeof out.checked, 'number');
  assert.ok(Array.isArray(out.findings));
  assert.deepEqual(Object.keys(out.findings[0]).sort(), ['file', 'gate', 'line', 'token']);
  assert.equal(out.findings[0].gate, 'G2');
  assert.equal(out.findings[0].token, 'iakaHub');
  assert.equal(out.findings[0].line, 1);
  fs.rmSync(root, { recursive: true, force: true });
});

test('C1 - `frame verify --help` sort 0 et n\'exige aucune dependance externe', () => {
  const r = spawnSync(process.execPath, [CLI, 'frame', 'verify', '--help'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /ALLOWLIST/);
  // Les limites du gate sont AFFICHEES : le dispositif ne doit jamais etre presente comme
  // une garantie (§ 4.2, section contractuelle).
  assert.match(r.stdout, /Ce que le gate n'attrape PAS/);
  assert.ok(LIMITS.length >= 6);
});

test('exit 0 sur miroir conforme via le CLI', () => {
  const root = tmpdir();
  fs.writeFileSync(path.join(root, 'README.md'), '# iakaframe\n');
  const r = spawnSync(process.execPath, [CLI, 'frame', 'verify', '--frame', root], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /OK - 1 fichiers, 0 fuite bloquante/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('miroir introuvable -> erreur explicite, pas de crash', () => {
  const r = spawnSync(process.execPath, [CLI, 'frame', 'verify', '--frame', '/n/existe/pas', '--json'], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.equal(JSON.parse(r.stdout).ok, false);
});

// =================================================================================================
// C6 - LE TEST DU TEST : sur le miroir REEL non corrige, le gate doit ECHOUER et rapporter
// precisement ce que l'ancien gate manquait. Ce lot livre le DETECTEUR, pas la correction :
// ces 57 constats sont donc attendus, et leur disparition sans commit de correction signalerait
// une REGRESSION du gate.
// =================================================================================================

test('C6 - le miroir reel StefFrame2 est en FUITE et le gate le prouve', { skip: !fs.existsSync(MIRROR) }, () => {
  const res = verifyFrame(MIRROR);
  assert.equal(res.ok, false, 'le miroir actuel fuit : le gate DOIT etre rouge');

  const tok = (g) => new Set(res.findings.filter(f => f.gate === g).map(f => f.token));
  const at = (g, file, line) => res.findings.some(f => f.gate === g && f.file === file && f.line === line);

  // G2 : exactement les noms que l'ancien gate (par enumeration) n'enumerait pas.
  for (const t of ['iakaHub', 'iakagraph', 'iakaIDE']) assert.ok(tok('G2').has(t), `G2 doit voir ${t}`);

  // G3 : les DEUX lignes, dont celle ou le prenom est en position de REGEX EXECUTEE.
  assert.ok(at('G3', 'cli/src/lib/consolidate.js', 111), 'G3 doit voir consolidate.js:111');
  assert.ok(at('G3', 'cli/src/lib/consolidate.js', 115), 'G3 doit voir consolidate.js:115 (la regex)');

  // G5 : le port dont le separateur n'est PAS `:` — le cas que la recette manuelle ratait.
  assert.ok(at('G5', 'cli/src/commands/services.js', 11), 'G5 doit voir services.js:11 (`port: 3001`)');
  assert.ok(tok('G5').has('3001'));

  // G6 : Hermes, la fuite residuelle que seule la moitie « capitale en milieu de phrase » attrape.
  assert.ok(tok('G6').has('Hermes'), 'G6 doit voir Hermes');

  // G1 : aucune fuite de secret/infra ne subsiste (0 mesure), et surtout AUCUN faux positif sur
  // le template d'URL de forgejo.js.
  assert.equal(res.byGate.G1, 0);
});

test('C6 - calibrage : aucun faux positif sur le miroir reel (tokens attendus, exhaustifs)', { skip: !fs.existsSync(MIRROR) }, () => {
  // Verrou de CALIBRAGE. Le risque de ce lot n'est pas le code : c'est le bruit. Un gate trop
  // bruyant finit desactive. On fige donc l'ENSEMBLE EXACT des tokens signales : toute nouvelle
  // classe de bruit fait echouer ce test, et sera vue en revue.
  const res = verifyFrame(MIRROR);
  const distinct = (g) => [...new Set(res.findings.filter(f => f.gate === g).map(f => f.token))].sort();

  assert.deepEqual(distinct('G1'), []);
  assert.deepEqual(distinct('G2'), ['iakaHub', 'iakaIDE', 'iakagraph', 'iakaide']);
  assert.deepEqual(distinct('G3'), ['Stephane', 'stephane']);
  assert.deepEqual(distinct('G4'), []);
  assert.deepEqual(distinct('G5'), ['3001', '3041', '4001']);
  assert.deepEqual(distinct('G6'), ['Hermes'], 'G6 doit etre calibre a 0 faux positif');
});

// =================================================================================================
// Invariants du module
// =================================================================================================

test('l\'allowlist de marque reste COURTE et stable (chaque entree elargit la fuite)', () => {
  assert.ok(BRAND_ALLOW.size <= 6, `allowlist de marque trop large : ${[...BRAND_ALLOW]}`);
  for (const t of ['iakaframe', 'iakastart']) assert.ok(BRAND_ALLOW.has(t));
  for (const t of ['iakahub', 'iakagraph', 'iakabox', 'iakaide']) {
    assert.equal(BRAND_ALLOW.has(t), false, `${t} ne doit JAMAIS etre dans l'allowlist`);
  }
});

test('les ports prives ne sont pas dans l\'allowlist de ports', () => {
  for (const p of [3001, 3041, 4001, 3010]) assert.equal(PORT_ALLOW.has(p), false, String(p));
  for (const p of [443, 8080, 11434, 8188]) assert.ok(PORT_ALLOW.has(p), String(p));
});

test('G6 est le SEUL gate en avertissement ; G1-G5 sont bloquants', () => {
  const warn = GATES.filter(g => g.severity === 'warning').map(g => g.id);
  assert.deepEqual(warn, ['G6']);
  assert.equal(GATES.filter(g => g.severity === 'blocking').length, 5);
});

test('listFrameFiles ignore le binaire et les dossiers de build', () => {
  const root = tmpdir();
  fs.writeFileSync(path.join(root, 'a.md'), 'x');
  fs.writeFileSync(path.join(root, 'b.zip'), 'binaire');
  fs.writeFileSync(path.join(root, 'c.png'), 'binaire');
  fs.mkdirSync(path.join(root, 'node_modules'));
  fs.writeFileSync(path.join(root, 'node_modules', 'd.js'), 'x');
  const files = listFrameFiles(root).map(f => path.basename(f));
  assert.deepEqual(files, ['a.md']);
  fs.rmSync(root, { recursive: true, force: true });
});

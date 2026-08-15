#!/usr/bin/env node
// Genere docs/modeles-ia-des-agents.md DEPUIS LES SOURCES — jamais a la main.
//
// POURQUOI UN GENERATEUR. Le lot `models` a trouve la meme table de suggestions recopiee dans
// TROIS fichiers, toutes les trois perimees, plus quatre autres et six JSON de configuration
// decouverts au gate. Une table de doc ecrite a la main serait la huitieme copie, et elle
// divergerait comme les autres. Ici la doc est DERIVEE de :
//   - models/suggestions.json   (source unique des suggestions par roleKey)
//   - bindings/*.md             (affectations reelles par persona)
//   - library/personas/*.md     (nom, pastille, roleKey)
// Un test verifie que le fichier commite est identique a la regeneration : la doc ne PEUT plus
// se perimer en silence.
//
// Usage : node cli/scripts/gen-models-doc.mjs [--check]
//   --check : ne reecrit rien, sort 1 si le fichier sur disque differe de la regeneration.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(ROOT, 'docs', 'modeles-ia-des-agents.md');

function frontmatter(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].trim();
  }
  data._block = m[1];
  return data;
}

function personas() {
  const dir = path.join(ROOT, 'library', 'personas');
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => ({ id: f.replace(/\.md$/, ''), ...frontmatter(path.join(dir, f)) }))
    .filter(p => p.roleKey);
}

// Affectations d'un binding : { personaId -> model }.
//
// GATE QUALITE 4e passe : ce parseur lisait `model:\s*"…"` — donc UNIQUEMENT la forme entre
// guillemets doubles, et SANS limite de mot. Deux consequences reproduites en bac a sable :
//   - `model: sonnet` ou `model: 'sonnet'` (formes que `replaceModelInLine` accepte
//     explicitement) donnaient une case VIDE : « cet agent n'a pas de modele », faux et muet ;
//   - `basemodel: "PIEGE"` sur la meme ligne etait capture a la place du vrai modele.
// La lecture est desormais ALIGNEE sur `replaceModelInLine` (`\bmodel\s*:` + les trois formes) :
// deux parseurs du meme depot ne doivent pas lire deux langages differents.
const MODEL_RE = /\bmodel\s*:\s*("([^"]*)"|'([^']*)'|([^,}\s]+))/;

function assignments(bindingId) {
  const file = path.join(ROOT, 'bindings', `${bindingId}.md`);
  if (!fs.existsSync(file)) return null;
  const block = frontmatter(file)._block || '';
  const out = {};
  for (const line of block.split(/\r?\n/)) {
    const id = line.match(/personaId:\s*([\w-]+)/);
    const model = line.match(MODEL_RE);
    if (!id || !model) continue;
    const valeur = model[2] ?? model[3] ?? model[4] ?? '';
    // Une SECONDE ligne pour la meme persona ecrasait la premiere en silence : on refuse.
    if (out[id[1]] !== undefined && out[id[1]] !== valeur) {
      throw new Error(`${bindingId} : deux affectations differentes pour « ${id[1]} » `
        + `(« ${out[id[1]]} » puis « ${valeur} ») — la doc ne peut pas trancher a votre place.`);
    }
    out[id[1]] = valeur;
  }
  return out;
}

const sug = JSON.parse(fs.readFileSync(path.join(ROOT, 'models', 'suggestions.json'), 'utf8'));
const team = frontmatter(path.join(ROOT, 'teams', 'iakaframe-8.md'));
const roster = (team.personas || '').replace(/[[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean);
const byId = new Map(personas().map(p => [p.id, p]));
const claude = assignments('iakaframe-claude-default') || {};
const ollama = assignments('iakaframe-ollama-default') || {};

const lignes = [];
const L = s => lignes.push(s);

L('# Quels modèles d\'IA font tourner les agents');
L('');
L('> **Fichier généré — ne pas modifier à la main.**');
L('> Source : `models/suggestions.json` + `bindings/*.md` + `library/personas/*.md`.');
L('> Régénérer : `node cli/scripts/gen-models-doc.mjs`. Un test vérifie qu\'il est à jour.');
L('');
L('Chaque agent de l\'équipe travaille avec **un modèle d\'IA**. Ce document dit lequel, pourquoi,');
L('et comment en changer. Il ne parle pas de code : uniquement de ce que vous voyez et décidez.');
L('');
L('## L\'équipe et ses modèles');
L('');
L('Deux configurations coexistent. Elles portent **la même équipe** et **les mêmes rôles** —');
L('seul le moteur change. Aucune n\'est imposée : on choisit celle qu\'on veut utiliser.');
L('');
L('| Agent | Rôle | Sur Claude *(par défaut)* | En local *(Ollama)* |');
L('|---|---|---|---|');
// GATE QUALITE 4e passe : `if (!p) continue;` faisait DISPARAITRE de la doc toute persona du
// roster non resolue (par exemple sans `roleKey`) — un agent entier s'evaporait sans un mot, et
// la garde restait verte. Un trou silencieux dans une doc EST la copie perimee que ce lot
// combat. On sort desormais en erreur : mieux vaut pas de doc qu'une doc amputee.
for (const id of roster) {
  const p = byId.get(id);
  if (!p) {
    throw new Error(`persona « ${id} » du roster ${team.id || 'iakaframe-8'} introuvable ou sans `
      + `roleKey : la doc serait AMPUTEE d'un agent. Corriger library/personas/${id}.md.`);
  }
  const manquants = [['claude', claude], ['ollama', ollama]]
    .filter(([, a]) => Object.keys(a).length && a[id] === undefined)
    .map(([nom]) => nom);
  if (manquants.length) {
    throw new Error(`persona « ${id} » sans affectation dans le(s) binding(s) : ${manquants.join(', ')}. `
      + `Une case vide se lit « cet agent n'a pas de modele » — c'est faux, et muet.`);
  }
  const pastille = (p.pastille || '').replace(/"/g, '');
  L(`| ${pastille} ${p.name || id} | \`${p.roleKey}\` | ${claude[id] ? `\`${claude[id]}\`` : '—'} | ${ollama[id] ? `\`${ollama[id]}\`` : '—'} |`);
}
L('');
L('## Pourquoi ces modèles-là');
L('');
L('Ces choix ne sont pas des préférences : ils viennent de **mesures faites sur nos propres');
L('tâches**. Un modèle plus gros s\'est révélé plus rapide et plus docile qu\'un plus petit ;');
L('une suggestion a dû être corrigée deux fois le même jour parce que la première mesure était');
L('trop étroite.');
L('');
L('| Rôle | Modèle local retenu | Motif |');
L('|---|---|---|');
for (const [key, r] of Object.entries(sug.roles)) {
  const motif = String(r.why || '').replace(/\s+/g, ' ');
  const court = motif.length > 190 ? motif.slice(0, motif.lastIndexOf(' ', 190)) + ' […]' : motif;
  L(`| \`${key}\` | \`${r.recommended}\`${r.sizeGb ? ` *(~${r.sizeGb} Go)*` : ''} | ${court} |`);
}
L('');
if (sug.embedding) {
  L(`**Embedding** : \`${sug.embedding.recommended}\`${sug.embedding.dimensions ? ` (${sug.embedding.dimensions} dimensions)` : ''} — ${sug.embedding.why}`);
  L('');
}
if (sug.familles) {
  L('## Quelles familles de modèles la passerelle sait servir');
  L('');
  L(`*Vérifié le ${sug.familles.eprouve_le} — ${sug.familles.methode}*`);
  L('');
  L('| Famille | Servie ? | Ce qu\'il faut savoir |');
  L('|---|---|---|');
  for (const [nom, detail] of Object.entries(sug.familles.servies || {})) {
    L(`| **${nom}** | ✅ | ${String(detail).replace(/\s+/g, ' ')} |`);
  }
  for (const [nom, detail] of Object.entries(sug.familles.non_servie || {})) {
    L(`| **${nom}** | ❌ | ${String(detail).replace(/\s+/g, ' ')} |`);
  }
  L('');
}
L('## Voir où en est votre installation');
L('');
L('```');
L('iakaframe models');
L('```');
L('');
L('La commande affiche, rôle par rôle : le modèle **affecté**, le modèle **suggéré**, et un statut.');
L('');
L('| Statut | Ce que ça veut dire |');
L('|---|---|');
L('| `en-place` | le modèle suggéré est affecté **et** réellement disponible |');
L('| `disponible` | le modèle est là, mais un autre est affecté |');
L('| `a-installer` | le modèle suggéré n\'est présent sur aucune cible |');
L('| `indetermine` | aucune cible n\'a répondu : la disponibilité est **inconnue**, pas supposée |');
L('| `non-couvert` | ce rôle n\'a aucun agent |');
L('| `sans-suggestion` | ce rôle n\'a pas de modèle recommandé dans la source |');
L('');
L('Elle propose ensuite d\'installer, de remplacer ou de retirer. **Rien n\'est téléchargé ni écrit');
L('sans une confirmation explicite** : vous pouvez la lancer par simple curiosité.');
L('');
L('Cinq cibles sont mesurées : `ollama-local`, `ollama-distant`, `litellm`, `claude`, `codex`.');
L('Pour les deux dernières, « installer » signifie **vérifier** — il n\'y a rien à télécharger.');
L('');
L('## Trois pièges mesurés, à connaître avant de conclure à une panne');
L('');
for (const n of sug.notes || []) {
  const t = String(n).replace(/\s+/g, ' ');
  L(`- ${t}`);
}
L('');
if (sug.hardware) {
  L('## La contrainte matérielle');
  L('');
  L(`- **Carte** : ${sug.hardware.gpu}`);
  L(`- **Partage** : ${sug.hardware.partage}`);
  L(`- **Plafond** : ${sug.hardware.plafond}`);
  L(`- **Arbitrage** : ${sug.hardware.arbitrage}`);
  L('');
}
if (sug.veille) {
  L(`## Veille — état de l'art au ${sug.veille.date}`);
  L('');
  L(`*Méthode : ${sug.veille.methode}*`);
  L('');
  for (const c of sug.veille.constats || []) L(`- ${String(c).replace(/\s+/g, ' ')}`);
  L('');
}
L('---');
L('');
L(`*Suggestions v${sug.version}, mises à jour le ${sug.updatedAt}. La fraîcheur est affichée à`);
L('chaque lancement de `iakaframe models` ; au-delà de 90 jours, elle est signalée `A RAFRAICHIR`.*');
L('');

const contenu = lignes.join('\n');
if (process.argv.includes('--check')) {
  const actuel = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (actuel !== contenu) {
    console.error('docs/modeles-ia-des-agents.md est PERIME : regenerer avec `node cli/scripts/gen-models-doc.mjs`');
    process.exit(1);
  }
  console.log('docs/modeles-ia-des-agents.md : a jour');
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, contenu, 'utf8');
  console.log(`ecrit : ${path.relative(ROOT, OUT)} (${lignes.length} lignes)`);
}

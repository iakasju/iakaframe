#!/usr/bin/env node
// Générateur HISTORIQUE des pages docs/architecture/ (charte Studio clair).
// Transforme des notes de lecture au format Markdown en pages HTML standalone
// (CSS inliné, deux thèmes). Usage : node build.mjs [dossier-des-notes]
//
// ⚠️ NE PAS relancer tel quel sur les pages déjà en place : il régénère un
// fichier *.html ENTIER à partir d'un fichier .md par logiciel, et ne connaît
// PAS les ajouts faits à la main après le premier jet (repères numérotés sur
// les captures .pin-frame/.pin-dot, schémas SVG « Schéma de flux » par page,
// schéma des brokers de mqtt.html). Le relancer écraserait ces ajouts.
// Voir docs/architecture/MAINTENANCE.md pour la procédure de mise à jour
// recommandée (relecture du code + édition ciblée du HTML existant).
//
// Ce script reste utile (a) comme référence de la structure/gabarit d'origine,
// (b) si un jour on rebâtit le jeu de pages de zéro à partir de notes neuves —
// il faudrait alors reporter à la main les annotations/schémas après coup.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Dossier des notes .md sources : passé en argument, sinon un sous-dossier
// notes/ à côté de ce script (à créer/peupler soi-même — les notes d'origine
// du 27/09/2026 vivaient dans un scratchpad de session, éphémère, donc non
// versionné ici).
const NOTES_DIR = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(__dirname, "notes");
const CSS_PATH = "/Users/sjupin/work/iakaframe/design-studio-clair/studio-clair.css";
const OUT_DIR = "/Users/sjupin/work/iakaframe/docs/architecture";

if (!existsSync(NOTES_DIR)) {
  console.error(`Dossier de notes introuvable : ${NOTES_DIR}`);
  console.error("Usage : node build.mjs <dossier-contenant-les-.md>");
  console.error("Voir docs/architecture/MAINTENANCE.md.");
  process.exit(1);
}

const SC_CSS = readFileSync(CSS_PATH, "utf8");

const FONTS_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Public+Sans:wght@400;500;600&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">';

// ---------------------------------------------------------------------------
// Pages du set (ordre du nav). slug -> {file, title, sub, repo, img}
// ---------------------------------------------------------------------------
const PAGES = [
  { slug: "index", title: "Vue d'ensemble", nav: "Vue d'ensemble" },
  { slug: "iakaagentsmonitor", file: "IakaAgentsMonitor.md", title: "IakaAgentsMonitor", nav: "IakaAgentsMonitor", img: "IakaAgentsMonitor.png", imgCaption: "Popover — bandeau, tableau d'agents (arbre de délégation), pied « tick 5 s / seuil 90 s »." },
  { slug: "iakaboxlogs", file: "iakaboxlogs.md", title: "iakaboxlogs", nav: "iakaboxlogs" },
  { slug: "iakacockpit", file: "IakaCockpit.md", title: "IakaCockpit", nav: "IakaCockpit", img: "IakaCockpit.png", imgCaption: "Étagère du portefeuille — bandeau d'indicateurs, graphique « Tokens par jour et par projet ». " },
  { slug: "iakaframe", file: "iakaframe.md", title: "iakaframe", nav: "iakaframe" },
  { slug: "iakaframegui", file: "iakaFrameGUI.md", title: "iakaFrameGUI", nav: "iakaFrameGUI", img: "iakaFrameGUI.png", imgCaption: "Atelier Team — colonne Personas, panneau d'édition Aragorn, copilote Fëanor, fichier persona généré." },
  { slug: "iakahub", file: "iakaHub.md", title: "iakaHub", nav: "iakaHub" },
  { slug: "iakatokencounter", file: "iakaTokenCounter.md", title: "iakaTokenCounter", nav: "iakaTokenCounter", img: "iakaTokenCounter.png", imgCaption: "Popover — cartes de compte (claude/max, codex/default), jauges 5h/7j/30j." },
  { slug: "mqtt", file: "mqtt.md", title: "MQTT — inventaire transverse", nav: "MQTT (transverse)" },
  { slug: "naonedge-vps", file: "naonedge-vps.md", title: "naonedge-vps — broker VPS", nav: "naonedge-vps" },
];

// ---------------------------------------------------------------------------
// Mini-markdown -> HTML (sous-ensemble : ##, ###, tables, listes, gras, code,
// liens, citations). Suffisant pour des notes déjà structurées en markdown.
// ---------------------------------------------------------------------------
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s) {
  let t = escapeHtml(s);
  // badges sémantiques
  t = t.replace(/\*\*\[V\]\*\*/g, '<span class="sc-badge b-ok">V</span>');
  t = t.replace(/\*\*\[S\]\*\*/g, '<span class="sc-badge b-warn">S</span>');
  t = t.replace(/\[V\]/g, '<span class="sc-badge b-ok">V</span>');
  t = t.replace(/\[S\]/g, '<span class="sc-badge b-warn">S</span>');
  t = t.replace(/\bVÉRIFIÉ\b/g, '<span class="sc-badge b-ok">VÉRIFIÉ</span>');
  t = t.replace(/\bSUPPOSÉ\b/g, '<span class="sc-badge b-warn">SUPPOSÉ</span>');
  t = t.replace(/\bPRÉVU\b/g, '<span class="sc-badge b-info">PRÉVU</span>');
  // gras
  t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  // code
  t = t.replace(/`([^`]+?)`/g, '<code class="sc-chip">$1</code>');
  // liens simples [texte](url)
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return t;
}

function parseTableBlock(lines, i) {
  const rows = [];
  while (i < lines.length && lines[i].trim().startsWith("|")) {
    rows.push(lines[i].trim());
    i++;
  }
  // drop separator row (---|---)
  const dataRows = rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r));
  const cells = dataRows.map((r) =>
    r
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim())
  );
  if (cells.length === 0) return { html: "", next: i };
  const [head, ...body] = cells;
  let html = '<div class="sc-scroll"><table class="sc-table"><thead><tr>';
  html += head.map((h) => `<th>${inline(h)}</th>`).join("");
  html += "</tr></thead><tbody>";
  for (const row of body) {
    html += "<tr>" + row.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>";
  }
  html += "</tbody></table></div>";
  return { html, next: i };
}

function mdToHtml(md) {
  const lines = md.split("\n");
  let html = "";
  let i = 0;
  let inList = false;
  let sectionOpen = false;

  function closeList() {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  }
  function closeSection() {
    closeList();
    if (sectionOpen) {
      html += "</div></section>";
      sectionOpen = false;
    }
  }

  while (i < lines.length) {
    const line = lines[i];

    if (/^# /.test(line)) {
      i++;
      continue; // titre H1 déjà porté par le hero de page
    }
    if (/^## /.test(line)) {
      closeSection();
      const label = line.replace(/^## /, "").trim();
      html += `<section class="sc-card sc-section"><h2>${inline(label)}</h2><div class="sc-section-body">`;
      sectionOpen = true;
      i++;
      continue;
    }
    if (/^### /.test(line)) {
      closeList();
      const label = line.replace(/^### /, "").trim();
      html += `<h3>${inline(label)}</h3>`;
      i++;
      continue;
    }
    if (/^\s*>/.test(line)) {
      closeList();
      let quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      html += `<div class="sc-note info">${inline(quote.join(" "))}</div>`;
      continue;
    }
    if (line.trim().startsWith("|")) {
      closeList();
      const { html: tableHtml, next } = parseTableBlock(lines, i);
      html += tableHtml;
      i = next;
      continue;
    }
    if (/^-\s+/.test(line.trim())) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inline(line.trim().replace(/^-\s+/, ""))}</li>`;
      i++;
      continue;
    }
    if (/^\d+\.\s+/.test(line.trim())) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inline(line.trim().replace(/^\d+\.\s+/, ""))}</li>`;
      i++;
      continue;
    }
    if (line.trim() === "") {
      closeList();
      i++;
      continue;
    }
    // paragraphe
    closeList();
    let para = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^#{1,3}\s/.test(lines[i]) && !lines[i].trim().startsWith("|") && !/^\s*>/.test(lines[i]) && !/^-\s+/.test(lines[i].trim())) {
      para.push(lines[i]);
      i++;
    }
    html += `<p>${inline(para.join(" "))}</p>`;
  }
  closeSection();
  return html;
}

// ---------------------------------------------------------------------------
// Gabarit de page
// ---------------------------------------------------------------------------
function nav(activeSlug) {
  return (
    '<nav class="sc-tabs page-nav">' +
    PAGES.map((p) => {
      const href = p.slug === "index" ? "index.html" : `${p.slug}.html`;
      const cls = p.slug === activeSlug ? "sc-tab active" : "sc-tab";
      return `<a class="${cls}" href="${href}">${escapeHtml(p.nav)}</a>`;
    }).join("") +
    "</nav>"
  );
}

function shell({ title, activeSlug, heroKicker, heroTitle, heroSub, body }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
${FONTS_LINK}
<style>
${SC_CSS}

/* ---- gabarit page architecture (extension locale, mêmes jetons --sc-*) ---- */
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body.sc { padding-block: 28px; }
.sc-page { max-width: 980px; margin: 0 auto; padding-inline: 20px; display: flex; flex-direction: column; gap: 18px; }
.page-nav { position: sticky; top: env(safe-area-inset-top, 0px); background: var(--sc-bg); z-index: 5; padding-top: 4px; overflow-x: auto; flex-wrap: nowrap; }
.page-nav .sc-tab { text-decoration: none; }
.sc-hero { padding-top: 6px; }
.sc-hero h1 { font-size: clamp(1.5rem, 1.1rem + 1.6vw, 2.1rem); }
.sc-hero .sc-sub { max-width: 70ch; line-height: 1.5; }
.sc-section { padding: 18px 22px; display: flex; flex-direction: column; gap: 10px; }
.sc-section h2 { font-family: var(--sc-font-display); font-size: 1.05rem; margin: 0 0 2px; letter-spacing: -0.005em; }
.sc-section-body { display: flex; flex-direction: column; gap: 10px; }
.sc-section-body h3 { font-family: var(--sc-font-display); font-size: 0.92rem; margin: 6px 0 -2px; color: var(--sc-ink); }
.sc-section-body p { margin: 0; line-height: 1.55; font-size: 0.9rem; }
.sc-section-body ul { margin: 0; padding-left: 1.2em; display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem; line-height: 1.5; }
.sc-scroll { overflow-x: auto; border-radius: 6px; }
.sc-shot { display: flex; flex-direction: column; gap: 8px; }
.sc-shot img { width: 100%; border-radius: 6px; border: 1px solid var(--sc-border); display: block; }
.sc-shot figcaption { font-size: 0.78rem; color: var(--sc-ink-muted); font-family: var(--sc-font-mono); }
.sc-legend { display: flex; gap: 10px; flex-wrap: wrap; font-size: 0.78rem; color: var(--sc-ink-muted); align-items: center; }
.idx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
.idx-card { padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; text-decoration: none; color: inherit; transition: border-color .15s; }
.idx-card:hover { border-color: var(--sc-accent); }
.idx-card h3 { margin: 0; font-family: var(--sc-font-display); font-size: 1rem; color: var(--sc-ink); }
.idx-card p { margin: 0; font-size: 0.82rem; color: var(--sc-ink-muted); line-height: 1.4; }
.sc-pre-card { padding: 16px 18px; }
.sc-pre-card h2 { font-family: var(--sc-font-display); font-size: 1.05rem; margin: 0 0 10px; }
pre.sc-pre { margin: 0; overflow-x: auto; font-family: var(--sc-font-mono); font-size: 0.66rem; line-height: 1.35; background: var(--sc-well); border: 1px solid var(--sc-border); border-radius: 6px; padding: 12px 14px; color: var(--sc-ink); }
footer.sc-foot { text-align: center; font-size: 0.72rem; color: var(--sc-ink-faint); font-family: var(--sc-font-mono); padding-block: 10px 30px; }
/* chemins/hash/refs longs sans espace (ex. src-tauri/src/broker.rs:31-37) : jamais de
   débordement horizontal de la page — on les casse plutôt que d'élargir le corps. */
.sc-page p, .sc-page li, .sc-page .sc-note, .sc-page td, .sc-page th,
.sc-page code, .sc-page .sc-chip, .sc-page .sc-sub, .sc-page .idx-card p {
  overflow-wrap: break-word;
}
@media (max-width: 640px) {
  .sc-section { padding: 14px 16px; }
}
</style>
</head>
<body class="sc">
<div class="sc-page">
  ${nav(activeSlug)}
  <div class="sc-hero">
    <span class="sc-section-label">${escapeHtml(heroKicker)}</span>
    <h1>${escapeHtml(heroTitle)}</h1>
    <p class="sc-sub">${heroSub}</p>
    <div class="sc-legend">
      <span class="sc-badge b-ok">V / VÉRIFIÉ</span> lu dans le code ou la config
      <span class="sc-badge b-warn">S / SUPPOSÉ</span> déduit, non prouvé
      <span class="sc-badge b-info">PRÉVU</span> cadré, non livré
    </div>
  </div>
  ${body}
  <footer class="sc-foot">iakaframe · docs/architecture · généré le 27/09/2026 · charte Studio clair</footer>
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Génération des pages projet
// ---------------------------------------------------------------------------
for (const p of PAGES) {
  if (p.slug === "index") continue;
  const md = readFileSync(join(NOTES_DIR, p.file), "utf8");
  const lines = md.split("\n");
  let sub = "";
  for (let k = 1; k < lines.length; k++) {
    if (lines[k].trim() && !lines[k].startsWith("#")) {
      sub = lines[k].trim();
      break;
    }
  }
  let body = "";
  if (p.img) {
    body += `<figure class="sc-card sc-shot" style="padding:14px;">
      <img src="img/${p.img}" alt="Capture ${escapeHtml(p.title)}" loading="lazy">
      <figcaption>${escapeHtml(p.imgCaption || "")}</figcaption>
    </figure>`;
  }
  body += mdToHtml(md);
  const html = shell({
    title: `${p.title} — architecture iakaframe`,
    activeSlug: p.slug,
    heroKicker: "IAKAFRAME · ARCHITECTURE",
    heroTitle: p.title,
    heroSub: inline(sub),
    body,
  });
  writeFileSync(join(OUT_DIR, `${p.slug}.html`), html, "utf8");
  console.log("écrit", p.slug + ".html", `(${(html.length / 1024).toFixed(0)} Ko)`);
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------
const IMG_DIR = join(OUT_DIR, "img");
const banner = readFileSync(join(IMG_DIR, "iakaframe-banner.txt"), "utf8");
const portfolio = readFileSync(join(IMG_DIR, "iakaframe-portfolio.txt"), "utf8");

const DESC = {
  iakaagentsmonitor: "Moniteur de barre de menus macOS — qui travaille, pour quel projet, sur quel runner, combien de temps reste-t-il.",
  iakaboxlogs: "Main courante centralisée des conversations d'agents — MQTT → pont → CouchDB → Fauxton. Hors service depuis le 19/08.",
  iakacockpit: "Cockpit desktop du portefeuille — une session par projet, PTY, délégations, économie tokens/coûts.",
  iakaframe: "Réservoir de la méthode (méthodes, frames, teams, personas, skills, kits) et CLI de déploiement + hooks de garde.",
  iakaframegui: "La « forge » build-time de la méthode — compose personas, skills, teams et livre des kits vers IakaCockpit.",
  iakahub: "Passerelle Discord humain↔agents en mode absence, + saisie directe d'Odin sur #odin. Démon Node, sans lien MQTT.",
  iakatokencounter: "Moniteur de consommation IA multi-comptes — jauges de quota par compte, bus MQTT embarqué (iakahub/rumqttd).",
  mqtt: "Inventaire transverse des 4 brokers de la famille et de leurs topics — état réel constaté le 27/09, aucun broker actif.",
  "naonedge-vps": "Broker Mosquitto du VPS NaonEdge — successeur chiffré (TLS 8883) et authentifié du broker LAN iakabox, schéma réservé.",
};

const idxCards = PAGES.filter((p) => p.slug !== "index")
  .map(
    (p) => `<a class="sc-card idx-card" href="${p.slug}.html">
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(DESC[p.slug] || "")}</p>
    </a>`
  )
  .join("");

const idxBody = `
<section class="idx-grid">${idxCards}</section>

<section class="sc-card sc-pre-card">
  <h2>Bannière CLI — <code class="sc-chip">iakaframe banner</code></h2>
  <pre class="sc-pre">${escapeHtml(banner)}</pre>
</section>

<section class="sc-card sc-pre-card">
  <h2>Portefeuille — <code class="sc-chip">iakaframe portfolio</code></h2>
  <pre class="sc-pre">${escapeHtml(portfolio)}</pre>
</section>
`;

const idxHtml = shell({
  title: "Architecture iakaframe — vue d'ensemble",
  activeSlug: "index",
  heroKicker: "IAKAFRAME · ARCHITECTURE",
  heroTitle: "Architecture du portefeuille",
  heroSub:
    "Neuf lectures indépendantes (lecture seule) : rôle, stack, flux, API, MQTT, interactions et points ouverts de chaque logiciel de la famille iakaframe/NaonEdge, plus un inventaire transverse des brokers MQTT.",
  body: idxBody,
});
writeFileSync(join(OUT_DIR, "index.html"), idxHtml, "utf8");
console.log("écrit index.html", `(${(idxHtml.length / 1024).toFixed(0)} Ko)`);

// vitrine.js — GENERATEUR DE LA SECTION « Installation » DU README RACINE. Fonction pure, zero I/O,
// zero reseau, deterministe.
//
// LE DEFAUT FERME (L42, defauts H-1 et H-4). Le README de ce depot annoncait **v0.20.4** — le
// dernier tag publie, du 2026-08-04 — alors que la version d'autorite (`cli/package.json`) etait
// deja **0.39.0**. Dix-neuf mineures d'ecart, et TOUTE LA SUITE ETAIT VERTE : 795 tests passaient
// sur une vitrine qui envoyait un inconnu telecharger une version de trois semaines. Rien, nulle
// part, ne rougissait.
//
// ET UN SECOND MENSONGE, PLUS DISCRET : le README ignorait l'artefact que sa PROPRE chaine produit.
// `.github/workflows/release.yml` fabrique `naonedge-iakaframe-<v>.tgz` en ecrivant en commentaire
// « installable par npm install -g <fichier>.tgz sur les trois OS » — et le README envoyait le
// visiteur chercher l'archive SOURCE, la decompresser, puis `npm install -g ./cli`. Le chemin le
// plus court et le plus sur etait produit, puis tu.
//
// POURQUOI CE DEPOT A SON PROPRE GENERATEUR, ET NE PARTAGE PAS CELUI DES DEUX APPLICATIONS.
// Les deux apps sont des JUMELLES : meme bundler, memes sept plateformes, meme forme de nom de
// fichier — d'ou une table de motifs BYTE-IDENTIQUE entre elles, gardee par le registre de
// convergence. La CLI n'a rien de tout cela : UN artefact, un autre harnais de test
// (`node --test`, pas vitest), un autre mode d'installation. La regle est donc ecrite trois fois,
// et c'est un choix DIT : chercher a unifier les trois dans ce lot supposerait un mecanisme de
// portefeuille que l'instruction exclut nommement (successeur « verbe de vitrine »). Le prix est
// connu : une evolution de la regle se propage a la main.
//
// AR-1 = (a) : LE README EST UN PORTEUR. Il annonce la version que LE DEPOT PORTE
// (`cli/package.json`, l'autorite posee par `dette-version-source-unique.md`), pas la derniere
// publiee. Consequence ASSUMEE et voulue : tant que la publication n'a pas rattrape l'autorite, la
// face EN LIGNE rougit. Cette rougeur est une DETTE DE PUBLICATION rendue visible ; elle est HORS
// gate, elle informe et ne bloque aucun lot.

/** L'unique artefact installable que la chaine de publication produit. */
export const ARTEFACT = {
  motif: "naonedge-iakaframe-{V}.tgz",
  raison:
    "tarball npm produit par `.github/workflows/release.yml` (etape « Produire le tarball npm ») " +
    "et attache a la release. Installable en UNE commande sur les trois OS, sans decompression " +
    "manuelle : c'est le chemin le plus court et le plus sur, et il etait tu par le README",
};

export const debutZone = (nom) => `<!-- vitrine:debut:${nom} -->`;
export const finZone = (nom) => `<!-- vitrine:fin:${nom} -->`;

/** Substitue `{V}` — rien d'autre n'est interprete. */
export function substituer(motif, version) {
  return String(motif).replaceAll('{V}', version);
}

/** Le nom exact de l'artefact pour une version. */
export function nomArtefact(version) {
  return substituer(ARTEFACT.motif, version);
}

/**
 * Rend la zone « installation ». Ordre DELIBERE (etape 6.2 de l'instruction) :
 *   1. le `.tgz` de la release — voie RECOMMANDEE, celle que le CI produit deja ;
 *   2. l'archive source + `npm install -g ./cli` — conservee en second ;
 *   3. le registre npm prive `@naonedge` — explicitement BORNE au reseau interne : il ne sert
 *      pas l'audience de ce lot, un inconnu ne peut pas l'atteindre.
 */
export function rendreInstallation({ version, depot }) {
  const tag = `v${version}`;
  const tgz = nomArtefact(version);
  const urlTag = `https://github.com/${depot}/releases/tag/${tag}`;
  const l = [];
  l.push(`La version scellée courante est **[${tag}](${urlTag})** — voir`);
  l.push(`[toutes les versions](https://github.com/${depot}/releases).`);
  l.push("");
  l.push("**Prérequis :** Node.js **≥ 20** (rien d'autre : la CLI est en Node pur, **zéro");
  l.push("dépendance** runtime, identique sous Windows, macOS et Linux).");
  l.push("");
  l.push("### Installer depuis la release — voie recommandée");
  l.push("");
  l.push(`Un seul fichier à télécharger sur la [page de la release](${urlTag}) :`);
  l.push("");
  l.push("| Fichier | Commande |");
  l.push("|---|---|");
  l.push(`| \`${tgz}\` | \`npm install -g ${tgz}\` |`);
  l.push("");
  l.push("```bash");
  l.push("# 1. Télécharger le fichier ci-dessus depuis la page de la release (Assets)");
  l.push(`# 2. L'installer globalement — identique sous Windows, macOS et Linux`);
  l.push(`npm install -g ${tgz}`);
  l.push("");
  l.push("# 3. Vérifier");
  l.push("iakaframe --help");
  l.push("iakaframe banner IAKAFRAME");
  l.push("```");
  l.push("");
  l.push("### Depuis l'archive des sources");
  l.push("");
  l.push("```bash");
  l.push("# 1. Récupérer l'archive de la version depuis la page des releases");
  l.push("#    (Assets > Source code), puis la décompresser");
  l.push(`cd iakaframe-${version}`);
  l.push("");
  l.push("# 2. Installer la CLI globalement depuis le dossier cli/");
  l.push("npm install -g ./cli");
  l.push("```");
  l.push("");
  l.push("Sans installation globale, la CLI s'exécute directement depuis l'archive :");
  l.push("");
  l.push("```bash");
  l.push("node cli/src/index.js --help");
  l.push("```");
  l.push("");
  l.push("> **Réservé au réseau interne** — le paquet est aussi publié sur un registre npm privé :");
  l.push("> `npm install -g @naonedge/iakaframe`. Ce registre n'est **pas accessible depuis");
  l.push("> Internet** : hors du LAN, prendre le `.tgz` de la release ci-dessus.");
  return l.join("\n");
}

export function rendreVitrine({ version, depot }) {
  return { installation: rendreInstallation({ version, depot }) };
}

/** Lit les zones. Un marqueur manquant est un REFUS, jamais une zone vide (sinon : faux vert). */
export function lireZones(readme, noms) {
  const out = {};
  for (const nom of noms) {
    const d = readme.indexOf(debutZone(nom));
    const f = readme.indexOf(finZone(nom));
    if (d === -1 || f === -1 || f < d) {
      throw new Error(
        `zone de vitrine « ${nom} » introuvable dans README.md : marqueurs ${debutZone(nom)} / ` +
          `${finZone(nom)} absents ou inverses. Les retirer desactiverait la garde en silence.`,
      );
    }
    out[nom] = readme.slice(d + debutZone(nom).length, f).replace(/^\n/, "").replace(/\n$/, "");
  }
  return out;
}

export function ecrireZones(readme, zones) {
  let out = readme;
  for (const [nom, contenu] of Object.entries(zones)) {
    const d = out.indexOf(debutZone(nom));
    const f = out.indexOf(finZone(nom));
    if (d === -1 || f === -1 || f < d) {
      throw new Error(`zone de vitrine « ${nom} » introuvable : impossible de reecrire.`);
    }
    out = out.slice(0, d + debutZone(nom).length) + "\n" + contenu + "\n" + out.slice(f);
  }
  return out;
}

/** La version ANNONCEE par le README, ou `null` — jamais une supposition. */
export function versionAnnoncee(readme) {
  const m = readme.match(/La version scellée courante est \*\*\[v(\d+\.\d+\.\d+)\]/);
  return m ? m[1] : null;
}

/** Les ecarts zone par zone, chacun NOMMANT sa zone et sa ligne. */
export function ecartsDeVitrine(lues, attendues) {
  const ecarts = [];
  for (const [nom, attendu] of Object.entries(attendues)) {
    const lu = lues[nom];
    if (lu === attendu) continue;
    const a = (lu ?? "").split("\n");
    const b = attendu.split("\n");
    const i = a.findIndex((l, k) => l !== b[k]);
    const rang = i === -1 ? Math.min(a.length, b.length) : i;
    ecarts.push({ zone: nom, ligne: rang + 1, lu: a[rang] ?? "(fin de zone)", attendu: b[rang] ?? "(fin de zone)" });
  }
  return ecarts;
}

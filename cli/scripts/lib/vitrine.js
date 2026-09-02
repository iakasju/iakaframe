// vitrine.js — GENERATEUR DE LA SECTION « Installation » DU README RACINE. Fonction pure, zero I/O,
// zero reseau, deterministe.
//
// LE DEFAUT FERME (L42, defauts H-1 et H-4). Le README de ce depot annoncait **v0.20.4** — le
// dernier tag publie, du 2026-08-04 — alors que la version d'autorite (`cli/package.json`) etait
// deja **0.39.0**. Dix-neuf mineures d'ecart, et TOUTE LA SUITE ETAIT VERTE : 795 tests passaient
// sur une vitrine qui envoyait un inconnu telecharger une version de trois semaines. Rien, nulle
// part, ne rougissait.
//
// ET UN SECOND MENSONGE, PLUS DISCRET : le README ignorait l'artefact que sa PROPRE chaine DECLARE
// produire. `.github/workflows/release.yml` decrit la fabrication de `naonedge-iakaframe-<v>.tgz`
// en ecrivant en commentaire « installable par npm install -g <fichier>.tgz sur les trois OS » — et
// le README envoyait le visiteur chercher l'archive SOURCE, la decompresser, puis
// `npm install -g ./cli`. Le chemin le plus court etait decrit, puis tu.
//
// NUANCE MESUREE, ET ELLE PORTE LOIN (voir le commentaire d'`ARTEFACT`) : ce workflow N'A JAMAIS
// TOURNE — `GET /repos/iakasju/iakaframe/actions/runs` rend `total_count: 0` le 2026-08-29. Le
// `.tgz` de v0.20.4 a ete depose A LA MAIN par `iakasju`, douze minutes avant l'enregistrement du
// workflow. Ce fichier ne dit donc plus « produit » la ou la mesure ne montre que « declare ».
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
//
// ⚠️ LEVEE le 2026-09-02 (lot fix/R2-et-levee-absence-iakaframe) — CE QUI PRECEDE EST DATE DU
// 2026-08-29/2026-08-30, PAS EFFACE. Le workflow a depuis tourne pour la premiere fois (run
// `33635520511`, `completed`/`success`), `actions/runs` -> `total_count: 1` (n'est plus 0), et
// l'asset `naonedge-iakaframe-0.39.0.tgz` de v0.39.0 porte `uploader.login = github-actions[bot]`.
// La dette de publication decrite ci-dessus est PAYEE : `vitrine:en-ligne` rend `exit 0` (mesure
// le 2026-09-02), et les deux voies qui etaient DECLAREES absentes dans
// `cli/fixtures/vitrine-locale.json` ont ete retirees le meme jour (cliquet E-5).

/**
 * L'unique artefact installable que la chaine de publication DECLARE produire.
 *
 * « DECLARE », ET PAS « PRODUIT » — la nuance est le resultat d'une mesure, pas une precaution de
 * style. Une premiere redaction affirmait ici que le `.tgz` etait « produit par
 * `.github/workflows/release.yml` et attache a la release ». MESURE ANONYME du 2026-08-29 :
 *
 *   GET /repos/iakasju/iakaframe/actions/runs      -> total_count: 0
 *   GET /repos/iakasju/iakaframe/actions/workflows -> le workflow `release` existe,
 *                                                     enregistre le 2026-08-05T15:36:53Z
 *   L'unique .tgz de v0.20.4 : uploader.login = « iakasju », cree le 2026-08-05T15:24:17Z
 *
 * Le seul tarball publie a donc ete DEPOSE A LA MAIN — douze minutes AVANT que le workflow
 * n'existe —, et ce workflow n'a jamais tourne, pas une fois. La chaine decrite ci-dessous est
 * ECRITE mais NON EPROUVEE ; c'est aussi vrai du `make_latest` calcule qu'on vient d'y poser.
 *
 * STATUT DE LA RECOMMANDATION (AU 2026-08-29, DATE — voir LEVEE ci-dessous) : la voie `.tgz` reste
 * recommandee au visiteur — c'est bien le chemin le plus court, et le nom de l'artefact est
 * derive du meme motif que `npm pack` emploie — mais elle est NON EPROUVEE tant qu'aucun run n'a
 * eu lieu. CONDITION DE LEVEE : la premiere publication reelle (acte du decideur), qui fera passer
 * `actions/runs` a un total non nul et portera un asset dont l'`uploader` est
 * `github-actions[bot]`. Tant que ce n'est pas fait, l'absence est DECLAREE dans
 * `cli/fixtures/vitrine-locale.json` et visible dans le README.
 *
 * ⚠️ LEVEE le 2026-09-02 — la condition ci-dessus est REMPLIE : run `33635520511`
 * (`completed`/`success`), `actions/runs.total_count = 1`, asset `naonedge-iakaframe-0.39.0.tgz`
 * avec `uploader.login = github-actions[bot]`. L'absence n'est plus DECLAREE dans
 * `cli/fixtures/vitrine-locale.json` (`"absents": []` depuis ce meme lot) : la voie `.tgz` est
 * desormais aussi bien RECOMMANDEE qu'EPROUVEE. CE QUI RESTE VRAI, PRECISEMENT : ce run a CREE la
 * release v0.39.0, il n'a pas EDITE une release deja existante — ce que fait `softprops` sur une
 * release EXISTANTE (au lieu d'une creation) reste NON MESURE sur ce depot.
 */
export const ARTEFACT = {
  motif: "naonedge-iakaframe-{V}.tgz",
  raison:
    "tarball npm que `.github/workflows/release.yml` DECLARE produire (etape « Produire le " +
    "tarball npm ») et attache a la release. Au 2026-08-29 le workflow n'avait jamais ete " +
    "execute (actions/runs = 0) ; LEVE le 2026-09-02 (run 33635520511, actions/runs.total_count " +
    "= 1, uploader github-actions[bot]) : la chaine est desormais ecrite ET eprouvee. Installe " +
    "en UNE commande sur les trois OS, sans decompression manuelle",
};

/**
 * Les VOIES d'installation que la vitrine peut annoncer, et ce dont chacune depend cote release.
 *
 * Une voie declaree ABSENTE n'est plus presentee comme disponible : elle apparait en clair dans le
 * bloc « Non fourni », avec son motif, sa date et sa condition de levee. C'est le meme mecanisme
 * que celui des deux applications jumelles, et la meme raison : une plateforme — ici une voie —
 * non produite est DECLAREE MANQUANTE, JAMAIS PROMISE (V5 de l'instruction).
 *
 * Une cle inconnue est un REFUS, pas une ligne muette : declarer l'absence d'une voie qui n'existe
 * pas rendrait la vitrine muette sur une vraie voie.
 */
export const VOIES = {
  tgz: { libelle: "Archive npm attachée à la release", motif: ARTEFACT.motif },
  archive: { libelle: "Archive des sources de la release (Assets > Source code)" },
};

/**
 * L'OUVERTURE d'un bloc d'ABSENCE DECLAREE, ecrite par le generateur ET relue par les gardes — une
 * seule source pour les deux gestes, sans quoi la lecture deviendrait la premiere a diverger.
 */
export const SENTINELLE_ABSENTS = "> **⚠️ Non fourni pour ";

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
 *   1. le `.tgz` de la release — voie RECOMMANDEE, celle que le CI declare produire ;
 *   2. l'archive source + `npm install -g ./cli` — conservee en second ;
 *   3. le registre npm prive `@naonedge` — explicitement BORNE au reseau interne : il ne sert
 *      pas l'audience de ce lot, un inconnu ne peut pas l'atteindre.
 *
 * ET, SI DES VOIES SONT DECLAREES ABSENTES, LE BLOC QUI LE DIT — avant tout le reste, parce qu'il
 * change ce que le visiteur doit faire.
 *
 * LE DEFAUT QUE CE PARAMETRE FERME. Le README est un PORTEUR (AR-1 = a) : il annonce la version que
 * le depot porte, pas la derniere publiee. Consequence non traitee jusqu'ici : l'autorite est
 * 0.39.0 et la derniere release publiee est v0.20.4 — mesure le 2026-08-29,
 * `GET /repos/iakasju/iakaframe/releases/tags/v0.39.0` -> HTTP 404. Le README annoncait donc une
 * page qui N'EXISTE PAS, avec un tableau de telechargement et une commande d'installation, la ou
 * il annoncait AVANT une page reelle. Pour ce depot, la vitrine promettait une 404 : le visiteur
 * etait laisse plus mal qu'il n'avait ete trouve.
 *
 * LE REMEDE N'EST PAS DE REVENIR A AR-1(b). Annoncer la derniere version PUBLIEE rendrait la
 * vitrine invérifiable hors ligne — le defaut meme qu'on repare. Le remede est celui que
 * l'instruction nomme en V5 et que les deux applications appliquent deja a leurs `.dmg` : DECLARER
 * l'absence. Le README continue d'annoncer ce que le depot porte, et DIT que cette version n'est
 * pas encore publiee, avec motif, date et condition de levee — puis renvoie vers ce qui existe
 * REELLEMENT, sans jamais nommer un numero de version publie (le nommer recreerait la source de
 * verite recopiee qu'on vient de supprimer : elle serait la premiere a se perimer).
 */
export function rendreInstallation({ version, depot, absents = [] }) {
  const tag = `v${version}`;
  const tgz = nomArtefact(version);
  const urlTag = `https://github.com/${depot}/releases/tag/${tag}`;
  const urlToutes = `https://github.com/${depot}/releases`;
  const absentes = new Set(absents.map((a) => a.cle));
  for (const a of absents) {
    if (!VOIES[a.cle]) {
      throw new Error(
        `absent déclaré sur une voie inconnue : « ${a.cle} ». Les voies valides sont ` +
          `${Object.keys(VOIES).join(', ')}. Déclarer l'absence d'une voie qui n'existe pas ` +
          "rendrait la vitrine muette sur une vraie voie.",
      );
    }
  }

  const l = [];
  l.push(`La version scellée courante est **[${tag}](${urlTag})** — voir`);
  l.push(`[toutes les versions](${urlToutes}).`);
  l.push("");
  l.push("**Prérequis :** Node.js **≥ 20** (rien d'autre : la CLI est en Node pur, **zéro");
  l.push("dépendance** runtime, identique sous Windows, macOS et Linux).");

  if (absents.length > 0) {
    // Le libelle ET le nom de fichier sont DERIVES de la table des voies : une declaration
    // d'absence ne recopie jamais un nom, sans quoi elle deviendrait la deuxieme source de verite.
    l.push("");
    l.push(`${SENTINELLE_ABSENTS}${tag}** — les voies ci-dessous ne sont **pas** disponibles pour`);
    l.push("> cette version. L'absence est déclarée, datée et levable ; elle n'est pas un oubli, et");
    l.push("> rien ci-dessous ne la promet.");
    l.push(">");
    for (const a of absents) {
      const v = VOIES[a.cle];
      const nom = v.motif ? ` (\`${substituer(v.motif, version)}\`)` : "";
      l.push(`> - **${v.libelle}**${nom}`);
      l.push(`>   — *constaté sur ${a.constate_sur}, le ${a.depuis}.* ${a.motif_absence}`);
      l.push(`>   **Levée :** ${a.condition_de_levee}`);
    }
    l.push(">");
    l.push(`> En attendant, la [page des versions](${urlToutes}) liste ce qui est **réellement**`);
    l.push("> publié. Aucun numéro n'est recopié ici : cette page dit la vérité toute seule, et");
    l.push("> continuera de la dire quand celle-ci aura vieilli.");
  }

  if (!absentes.has("tgz")) {
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
  }

  if (!absentes.has("archive")) {
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
  }

  // LA VOIE QUI RESTE VRAIE QUOI QU'IL ARRIVE. Elle ne depend d'aucune release : c'est la seule
  // qu'on puisse promettre a un inconnu quand la publication est en retard sur l'autorite. Elle
  // est donc rendue INCONDITIONNELLEMENT — et elle est ce qui empeche le bloc « Non fourni »
  // ci-dessus de laisser le visiteur sans rien.
  l.push("");
  l.push("### Depuis le dépôt — sans dépendre d'une release");
  l.push("");
  l.push("```bash");
  l.push(`git clone https://github.com/${depot}.git`);
  l.push("cd iakaframe");
  l.push("npm install -g ./cli");
  l.push("```");
  l.push("");
  l.push("Sans installation globale, la CLI s'exécute directement depuis les sources :");
  l.push("");
  l.push("```bash");
  l.push("node cli/src/index.js --help");
  l.push("```");
  l.push("");
  l.push("> **Réservé au réseau interne** — le paquet est aussi publié sur un registre npm privé :");
  l.push("> `npm install -g @naonedge/iakaframe`. Ce registre n'est **pas accessible depuis");
  if (absentes.has("tgz")) {
    l.push("> Internet** : hors du LAN, installer depuis le dépôt (ci-dessus).");
  } else {
    l.push("> Internet** : hors du LAN, prendre le `.tgz` de la release ci-dessus.");
  }
  return l.join("\n");
}

export function rendreVitrine({ version, depot, absents = [] }) {
  return { installation: rendreInstallation({ version, depot, absents }) };
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

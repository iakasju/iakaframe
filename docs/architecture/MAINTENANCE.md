# Maintenir `docs/architecture/`

Documentation HTML autoporteuse (CSS inliné, charte **Studio clair**) qui explique
l'architecture des logiciels de la famille iakaframe/NaonEdge et leurs interactions,
notamment via MQTT. Une page par logiciel + une page MQTT transverse + un index.

Principe directeur (hérité de la commande d'origine, 26-27/09/2026) : **on n'invente
rien**. Tout ce qui n'est pas lu dans le code est marqué `SUPPOSÉ` (déduit) ou `PRÉVU`
(cadré, non livré) — jamais présenté comme un fait acquis.

## Fichiers du dossier

| Fichier | Contenu |
|---|---|
| `index.html` | Vue d'ensemble + schéma SVG des interactions constatées |
| `iakaagentsmonitor.html`, `iakaboxlogs.html`, `iakacockpit.html`, `iakaframe.html`, `iakaframegui.html`, `iakahub.html`, `iakatokencounter.html`, `naonedge-vps.html` | Une page par logiciel : rôle, stack, fonctionnement, **schéma de flux SVG**, API, MQTT, interactions, ergonomie (annotée sur capture quand une capture existe), points ouverts |
| `mqtt.html` | Inventaire transverse : état réel du broker local, les brokers de la famille, **schéma SVG des brokers/publieurs/abonnés**, inventaire complet des topics |
| `img/*.png` | Captures d'écran annotées (repères numérotés `.pin-dot` sur `.pin-frame`) pour IakaAgentsMonitor, IakaCockpit, iakaFrameGUI, iakaTokenCounter |
| `tools/build.mjs` | Générateur historique (Markdown → HTML) utilisé pour le premier jet du 27/09/2026 — **voir avertissement ci-dessous avant de le relancer** |

## Sources à relire pour une mise à jour

Il n'existe **pas** de notes Markdown versionnées servant de source unique : celles du
27/09/2026 vivaient dans un scratchpad de session (répertoire temporaire, non
versionné, disparu depuis). **La source de vérité est le code de chaque dépôt**, en
lecture seule (jamais de modification depuis cette tâche de doc) :

| Logiciel | Dépôt | HEAD au 27/09/2026 (cette mise à jour) |
|---|---|---|
| iakaframe (CLI + bibliothèque) | `~/work/iakaframe` | `8c12e94` |
| IakaAgentsMonitor | `~/work/IakaAgentsMonitor` | `3ec4986` |
| iakaTokenCounter (+ broker iakahub) | `~/work/iakaTokenCounter` | `7ae1cec` |
| IakaCockpit | `~/work/IakaCockpit` | `2ed1690` |
| iakaFrameGUI | `~/work/iakaFrameGUI` | `bb6c831` |
| iakaboxlogs (« iakalog ») | `~/work/iakaboxlogs` | `f5210df` |
| iakaHub | `~/work/iakaHub` | `5a418d1` |
| naonedge-vps (broker VPS) | `~/work/naonedge-vps` | `5a0a3e5` |

Avant de corriger une page, vérifier si le HEAD du dépôt concerné a bougé :

```sh
git -C ~/work/<Dépôt> rev-parse --short HEAD
```

S'il a bougé, relire au moins les fichiers déjà cités dans la page (chaque affirmation
`VÉRIFIÉ` porte son chemin:ligne) et vérifier qu'ils sont toujours exacts avant de
mettre à jour le texte et la référence de commit dans le `<p class="sc-sub">` d'en-tête.

## Comment mettre à jour une page (procédure recommandée)

**Ne pas régénérer les fichiers depuis zéro.** Les pages contiennent désormais des
ajouts faits à la main après le premier jet — repères numérotés sur les captures et
schémas SVG de flux — qu'aucun générateur ne sait reproduire aujourd'hui. La bonne
méthode est l'édition ciblée :

1. Relire le code source concerné (repo ci-dessus), à la ligne citée par chaque
   `VÉRIFIÉ`.
2. Si un fait a changé : corriger le texte en place (chemin:ligne inclus), et si le
   changement touche le HEAD documenté, le mettre à jour dans le `<p class="sc-sub">`
   de la page ET dans le tableau ci-dessus.
3. Si un statut `PRÉVU` est désormais livré (ou l'inverse) : le signaler clairement
   (« livré aux commits … », capture éventuellement antérieure au changement — le
   dire aussi, cf. le paragraphe A7 d'`iakaagentsmonitor.html` pour un exemple).
4. Rendre la page modifiée en Chrome headless, clair **et** sombre, et regarder le
   PNG avant de committer (boucle « voir puis juger », cf. commande ci-dessous).
5. Committer en conventional commit, ne toucher que `docs/architecture/`.

## Régénérer une capture annotée

1. Reprendre une capture existante dans `img/` (ou en refaire une, à l'identique de
   la fenêtre réelle de l'app — dimensions notées dans le `<figcaption>` de chaque
   page).
2. Dans le HTML de la page, le conteneur `.pin-frame` (position relative) porte des
   `.pin-dot` positionnés en `%` (`left`/`top`) par rapport à l'image entière (avant
   recadrage CSS éventuel — voir le cas `IakaCockpit.png`, recadré par
   `aspect-ratio`+`overflow:hidden`+`object-position:top` : les pourcentages des pins
   restent relatifs au cadre affiché, pas à l'image source complète — convertir avec
   `%cadre = %image_complète × (hauteur_image / hauteur_cadre)` si on repart de zéro).
3. Une légende `<ul class="pin-legend">` numérotée accompagne chaque figure, un
   `<li>` par repère, dans le même ordre.
4. Après édition : rendre en Chrome headless et **regarder** le PNG (repères sur les
   bonnes zones, rien de coupé, lisible en clair et en sombre) avant de committer.

## Régénérer un schéma SVG (flux logiciel ou brokers MQTT)

Chaque page logiciel porte une section **« Schéma de flux »** (SVG inline, 3 à 5
nœuds) et `mqtt.html` porte un schéma plus large des brokers/publieurs/abonnés.
Convention commune (reprise du schéma de `index.html`) :
- classes `.xx-box` (nœud réel), `.xx-off` (non câblé / en panne, pointillé fin),
  `.xx-lk` (lien réel, flèche pleine), `.xx-lk-prevu` (PRÉVU, pointillé + couleur
  `--sc-info`), `.xx-lk-off` (non câblé, pointillé fin, couleur `--sc-ink-faint`) —
  préfixe `xx` propre à chaque page pour éviter les collisions d'id de `<marker>` ;
- couleurs par variables `--sc-*` de la charte Studio clair (s'adaptent automatiquement
  au thème clair/sombre, aucune couleur en dur) ;
- légende systématique sous le schéma (traits + libellé).

Pour ajouter un nœud ou un lien : dupliquer un `<rect>`/`<text>`/`<line>` existant du
même schéma, ajuster les coordonnées, garder le style. Toujours rendre et regarder
après modification (boucle ci-dessous).

## Rendu et vérification (boucle obligatoire)

Chrome headless est utilisé pour rendre et lire chaque page modifiée, clair et
sombre, avant tout commit. Le thème sombre ne se déclenche pas de façon fiable avec
les flags `--force-prefers-color-scheme`/`--blink-settings=preferredColorScheme` sur
ce Mac (testé le 27/09/2026, sans effet) : le moyen qui fonctionne est de basculer le
**mode sombre système** le temps du rendu :

```sh
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
D=/Users/sjupin/work/iakaframe/docs/architecture
OUT=/tmp/archi-shots   # ou le scratchpad de session

# clair
"$CHROME" --headless=new --disable-gpu --force-color-profile=srgb \
  --window-size=1200,1400 --screenshot="$OUT/page-light.png" "file://$D/page.html"

# sombre (bascule système le temps du rendu)
osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to true'
"$CHROME" --headless=new --disable-gpu --force-color-profile=srgb \
  --window-size=1200,1400 --screenshot="$OUT/page-dark.png" "file://$D/page.html"
osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to false'
```

Puis lire les deux PNG (outil `Read` / prévisualisation) et juger : repères bien
posés, flèches lisibles, rien de coupé, contraste correct dans les deux thèmes.
Un visuel non rendu et non regardé n'est pas livré (doctrine Loki).

## Générateur historique (`tools/build.mjs`)

`tools/build.mjs` a servi à produire le tout premier jet des 10 pages (26-27/09/2026)
à partir de notes Markdown de lecture (une par logiciel), aujourd'hui perdues (elles
vivaient dans un scratchpad de session). **Ne pas le relancer sur ce dossier tel
quel** : il régénère chaque `*.html` en entier depuis un `.md`, et ne sait pas
reproduire les repères de capture ni les schémas de flux ajoutés après coup — il les
écraserait. Il reste utile comme référence du gabarit d'origine, ou si l'on décide un
jour de tout rebâtir depuis des notes neuves (il faudrait alors reporter les
annotations/schémas à la main ensuite). Usage, si besoin :

```sh
node docs/architecture/tools/build.mjs <dossier-contenant-les-.md>
```

Le dossier de notes doit contenir un `.md` par logiciel, nommé comme référencé dans
la constante `PAGES` du script (ex. `IakaAgentsMonitor.md`, `mqtt.md`).

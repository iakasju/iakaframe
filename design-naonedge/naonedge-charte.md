# NaonEdge — Charte de design (label « design NaonEdge »)

> Design figé pour **tous les supports NaonEdge** : documents HTML, decks/slides,
> flyers, visuels/images, exports. Dérivé de la charte **iakabox** (dark premium · or).
> Source de vérité : [`naonedge.css`](./naonedge.css). Ne pas diverger sans mettre à jour ce dossier.

---

## 1. Marque

- **Nom : `NaonEdge`** — mot-valise : **Naoned** (« Nantes » en breton) **+ Edge**
  (le côté innovation / cutting-edge). Le « ed » de *Naoned* fusionne avec *Edge*.
- **Wordmark** : `Naon` en encre claire + **`Edge`** en dégradé or (E majuscule pour
  surfacer l'innovation).
  HTML : `<span class="ne-wordmark"><b>Naon</b><span class="edge">Edge</span></span>`
- **Domaine / fichiers / handles** : `naonedge` en minuscules.
- **Logo** : [`naonedge-logo.svg`](./naonedge-logo.svg) — badge noir, contour or, motif
  « nœuds + arêtes » (graphe / *edge*). Zone de respiration ≥ hauteur d'un nœud.
- **Icône de famille** : [`naonedge-grue.svg`](./naonedge-grue.svg) — la **grue jaune**
  (réf. grue Titan de Nantes), marqueur des produits NaonEdge/iaka. Voir §7.
- Ne pas : écrire « NAO Edge » / « Nao Edge » (perd le jeu de mots), changer l'or, étirer le logo,
  poser le wordmark sur fond clair sans inverser.

## 2. Palette

| Rôle | Variable | Hex |
|---|---|---|
| Fond global | `--bg-primary` | `#0a0a0a` |
| Cartes / panneaux | `--bg-card` | `#1a1a1a` |
| Blocs profonds / code | `--bg-deep` | `#111111` |
| Bords | `--line` | `#2a2a2a` |
| Texte principal | `--text-primary` | `#f0f0f0` |
| Texte secondaire | `--text-secondary` | `#8a8a8a` |
| Texte discret | `--text-muted` | `#555555` |
| **Accent or** | `--accent-gold` | `#c8a44e` |
| **Accent or clair** | `--accent-gold-light` | `#e8c960` |
| Dégradé signature | `--gradient-accent` | `135deg, #c8a44e → #e8c960` |

**Sémantique** (encarts, badges) : rouge `#e74c3c` · vert `#2ecc71` · bleu `#3498db` ·
orange `#e67e22` · cyan `#1abc9c` · violet `#9b59b6`.

> Règle : **un seul accent** (l'or) porte la marque. Les couleurs sémantiques ne servent
> qu'aux états (alerte/ok/info), jamais comme accent décoratif.

## 3. Typographie (alignée sur naonedge.com)

Trois familles, via Google Fonts :
- **Fraunces** (serif d'affichage) — hero, titres `h1`/`h2`, slides. Élégant, contrasté.
- **IBM Plex Sans** — corps de texte, cartes, listes.
- **JetBrains Mono** — libellés de section (`.section-label`), kickers, chiffres, badges.

Lien à inclure dans le `<head>` (après les `preconnect`) :

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,800&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;700&display=swap" rel="stylesheet">
```

- Titres serrés (`letter-spacing` négatif), graisses fortes sur les hero/h1.
- Libellés de section et kickers en **mono, majuscules, or**.

## 4. Composants (classes de `naonedge.css`)

`hero` + `hero-badge` + `hero-subtitle` + `hero-meta` · `tabs`/`tab` (onglets) ·
`section-label` · `card` (+`.glow`) · `grid.two`/`grid.three` · `tag` (`t-go`,`t-on`,
`t-wait`,`t-keep`,`t-info`) · `note` (`warn`,`tip`,`info`) · `scroll`+`table` (+`dots`,
`dots.risk`, `num`, `tr.grp`) · `seq` (liste numérotée) · `footer`+`accent-line` ·
`slide`/`slides-root` (decks).

## 5. Supports & gabarits

| Support | Gabarit | Notes |
|---|---|---|
| Document HTML | [`template-doc.html`](./template-doc.html) | onglets optionnels ; pour partage, **inliner** `naonedge.css` |
| Slides / deck | [`template-slides.html`](./template-slides.html) | plein écran, scroll-snap ; export PDF en paysage |
| Flyer / affiche | [`template-flyer.svg`](./template-flyer.svg) | format A5 ; éditer textes ; exporter PNG/PDF |

### Formats d'images recommandés
- **Flyer** : A5 (1748×2480 px @300 dpi) ou A4 (2480×3508). Fond `#0a0a0a`, accent or, Inter.
- **Réseaux** : carré 1080×1080, story/portrait 1080×1350 ou 1080×1920.
- **Bannière** : 1500×500. Toujours : fond sombre, **un** accent or, logo en respiration.

## 6. Règle d'usage

1. Lier ou inliner `naonedge.css` — ne pas réécrire les couleurs à la main.
2. Réutiliser les composants existants avant d'en inventer.
3. Conserver l'avertissement de bas de page sur les chiffres indicatifs si le doc en contient.
4. Toute évolution de la charte se fait **ici** (CSS + cette page), puis se propage.

## 7. Icônes de famille

Deux marqueurs visuels distinguent les familles de produits — un petit « blason » apposé
devant le nom du produit.

| Famille | Marqueur | Sens | Fichiers |
|---|---|---|---|
| **Robby** (produits de veille) | petit **robot** | l'assistant qui surveille | logos `robby-*` (accent couleur par robby) |
| **NaonEdge / iaka** (cabinet, atelier, outils) | petite **grue jaune** | Nantes (grue Titan) + ingénierie | `naonedge-grue.svg` (badge) · `naonedge-grue-glyph.svg` (inline) |

- La **grue jaune** marque tout ce qui relève de NaonEdge et de l'atelier « iaka » :
  favicon, en-tête, et **devant le nom d'un produit/outil** — exactement comme le petit
  robot précède un « Robby ».
- Jaune `#f4c430` (sur badge noir, contour or). Une version glyphe est fournie pour un
  usage inline (devant un intitulé).
- Règle : **une seule grue** par composition ; ne pas mélanger grue et robot sur un même
  produit (chaque produit appartient à une seule famille).

---

_Label **« design NaonEdge »** · d'après iakabox · à charger après les polices
(Fraunces · IBM Plex Sans · JetBrains Mono)._

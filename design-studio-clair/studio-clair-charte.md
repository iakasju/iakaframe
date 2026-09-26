# Studio clair — Charte de design (label « design Studio clair »)

> Design par défaut pour les supports de **projets de dev logiciel** (iakaFrameGUI,
> iakaframe, apps outillage — ex. IakaAgentsMonitor, iakaTokenCounter). Registre : **atelier
> technique clair**, lisible, dense en information, sans emphase marketing. Distinct de
> NaonEdge (dark premium · or, réservé aux supports NaonEdge / conseil-pro) : ici on montre
> un outil qui tourne, pas une marque qu'on vend.
>
> Source de vérité : [`studio-clair.css`](./studio-clair.css). Ne pas diverger sans mettre à
> jour ce dossier. Ce dossier **matérialise** la charte que `library/personas/loki.md`
> désignait déjà comme défaut contextuel « dev logiciel » sans l'avoir encore posée sur
> disque — combler ce manque fait partie du travail, pas une extension hors mandat.

## 1. Ton

Un outil de bureau/CLI qui donne un état, pas une brochure. Densité d'information
prioritaire sur l'esthétique décorative : cartes fines, bordures nettes, hiérarchie par le
poids et la taille du texte plutôt que par la couleur. La couleur est réservée au
**sens** (badges, statuts, pastilles de rôle) — jamais à la décoration.

## 2. Palette

Deux jeux de jetons : **clair** (défaut) et **sombre** (`prefers-color-scheme: dark` ou
`data-theme="dark"`).

| Rôle | Variable | Clair | Sombre |
|---|---|---|---|
| Fond global | `--sc-bg` | `#f7f7f4` | `#14161a` |
| Cartes / panneaux | `--sc-surface` | `#ffffff` | `#1c1f24` |
| Fond creux (code, zébrage) | `--sc-well` | `#f0efeb` | `#22252b` |
| Bordure | `--sc-border` | `#e2e0d9` | `#2d3138` |
| Texte principal | `--sc-ink` | `#1c1c1a` | `#e9e8e4` |
| Texte secondaire | `--sc-ink-muted` | `#6f6d64` | `#9a9a92` |
| Texte discret | `--sc-ink-faint` | `#a3a199` | `#63666c` |
| **Accent** (interaction, liens) | `--sc-accent` | `#3454d1` | `#7c93f0` |
| **Accent 2** (vivant / actif) | `--sc-accent-2` | `#0e8a82` | `#3fd6c8` |
| Succès | `--sc-ok` | `#1a7f5a` | `#4ad393` |
| Alerte | `--sc-warn` | `#b5790a` | `#e0a83f` |
| Danger | `--sc-danger` | `#c1372c` | `#ef6b5e` |
| Info | `--sc-info` | `#2f6fb5` | `#7fb2ec` |

> Règle : **un seul accent** (`--sc-accent`) porte l'identité visuelle de la charte ; l'accent
> 2 (teal) marque exclusivement « vivant / en cours ». Les couleurs sémantiques ne servent
> qu'aux états, jamais en décoration. Les **pastilles de rôle** (roster iakaframe) sont une
> palette à part (§5) : elles ne sont pas des jetons de charte, elles identifient un persona.

## 3. Typographie

Trois familles, via Google Fonts — choisies pour ne pas recouper NaonEdge (Fraunces / IBM
Plex Sans / JetBrains Mono) ni les défauts génériques (Inter, Space Grotesk) :

- **Manrope** (600/700/800) — titres, hero, libellés de section.
- **Public Sans** (400/500/600) — corps de texte, cartes, listes.
- **Fira Code** (400/500) — identifiants, horodatages, compteurs, code, libellés denses.

```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Public+Sans:wght@400;500;600&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
```

- Titres compacts, `letter-spacing` légèrement négatif sur les grandes tailles.
- Chiffres et horodatages toujours en **Fira Code** (alignement tabulaire, lisibilité).

## 4. Composants

`hero` (+`hero-sub`) · `tabs`/`tab` (onglets de navigation entre versions) · `section-label`
(kicker mono majuscule) · `card` (bordure fine, pas d'ombre lourde) · `grid` (colonnes
responsives) · `badge` (`b-ok`,`b-warn`,`b-danger`,`b-info`,`b-live`) · `pastille` (rond de
couleur de rôle, 8-10px) · `chip` (étiquette compacte : runner, modèle) · `note`
(`warn`,`tip`,`info`) · `scroll`+`table` (tableaux denses) · `sprite` (grille pixel-art, §5).

## 5. Pastilles & sprites de rôle (roster iakaframe)

Palette figée des personas — reprise du roster iakaframe, **jamais recolorée** projet par
projet :

| Persona | Pastille | Hex |
|---|---|---|
| Odin | 🟡 | `#d6a916` |
| Aragorn | 🟠 | `#d9772e` |
| Gandalf | 🔵 | `#3b6ea5` |
| Gimli (dev) | 🔴 | `#c0392b` |
| Gimli (staging) | 🟢 | `#2e9e5b` |
| Legolas (P2) | 🔴 | `#c0392b` |
| Legolas (P3) | 🟢 | `#2e9e5b` |
| Helm | 🟣 | `#7d4fb5` |
| Loki | 🟠 | `#d9772e` |
| Nathalie | 🟠 | `#d9772e` |
| Feanor | 🟠 | `#d9772e` |
| Type hors roster | ⚪ | `#8a8a86` |

Chaque persona a en outre une **icône pixel art** (sprite 8×8, deux couleurs : fond
pastille + glyphe clair) — un petit attribut visuel qui rappelle le rôle sans dépendre de la
lettre seule. Convention héritée d'iakaOS (grille + palette limitée) : voir
`sprites.svg`/défs inline dans les gabarits, jamais de bitmap importé.

## 6. Supports & gabarits

| Support | Notes |
|---|---|
| Doc / maquette HTML | standalone, CSS inliné, polices Google Fonts liées ; onglets pour comparer des partis pris |
| App / outil | mêmes jetons, densité assumée, pas de hero plein écran |

### Règle d'usage

1. Réutiliser les jetons `--sc-*` — ne jamais coder une couleur en dur hors palette de rôle.
2. Les deux thèmes (clair/sombre) sont **obligatoires** dès qu'un support est autonome.
3. Toute évolution se fait **ici** (ce fichier + `studio-clair.css`), puis se propage.

---

_Label **« design Studio clair »** · matérialisé le 2026-09-26 (Loki) pour combler le défaut
contextuel « dev logiciel » resté non posé sur disque · polices Manrope · Public Sans · Fira
Code._

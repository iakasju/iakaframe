# Charte `starter` — charte de démarrage neutre

Charte **par défaut** de la méthode iakaframe : sobre, sans marque, prête à l'emploi. La skill
de design (`iakaframe-design`, agent Loki) la résout via les placeholders
`<CHARTES_DIR>=design-starter` et `<charte-defaut>=starter`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `starter.css` | Feuille de style canonique (variables CSS, composants, tables, notes, slides). |
| `logo.svg` | Logo placeholder neutre — à remplacer par votre marque. |
| `template-doc.html` | Gabarit document (lecture longue) liant `starter.css`. |
| `template-slides.html` | Gabarit présentation (un écran = une idée, scroll-snap). |
| `template-flyer.svg` | Gabarit flyer une page (A4 portrait). |
| `charte.md` | Ce mode d'emploi. |

## Palette (variables `:root` de `starter.css`)

- Fond `--bg` `#ffffff` · surface `--surface` `#f4f5f7` · filets `--border` `#d9dce1`.
- Texte `--text` `#1c1e21` · secondaire `--muted` `#5b616b`.
- Accent `--accent` `#2f6df0`. Sémantiques : `--ok` vert, `--warn` orange, `--stop` rouge, `--info` bleu.
- Typo : piles **système** (aucune police à télécharger).

## Créer VOTRE charte

1. **Dupliquer** ce dossier : `design-starter/` → `design-<votre-nom>/`.
2. **Renommer** `starter.css` → `<votre-nom>.css` et adapter les variables `:root`.
3. **Remplacer** `logo.svg` et adapter les gabarits.
4. La skill de design découvre automatiquement toute charte présente sous `<CHARTES_DIR>` —
   aucun code à modifier.

## Règles

- **Standalone** : pour un fichier partagé seul, **inliner** le CSS dans une balise `<style>`.
- **Réutiliser** les classes existantes (`.hero`, `.card`, `.tag`, `.note`, `.slide`) avant
  d'écrire du CSS neuf.
- **Ne pas diverger** d'une charte sans mettre à jour son dossier d'abord.
- Contenu en **français** ; classes/identifiants en **anglais**.

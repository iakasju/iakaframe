# Instruction : tous les docs iakaframe en charte NaonEdge

> Phase cadrage (🧙 Gandalf / 🎭 Loki). Statut : 🟡 **à valider / à planifier**.
> Règle posée par le décideur : **tous les docs/supports iakaframe ont le look & feel NaonEdge.**

## Règle

Tout document iakaframe (HTML, PDF, decks, flyers) suit la **charte NaonEdge**
(`design-naonedge/` : dark premium + **accent or**, polices **Inter / Fraunces / JetBrains
Mono**, **grue jaune**, footer signé). Tout **nouveau** doc s'y conforme dès sa création ; les
docs **existants** sont alignés (audit ci-dessous). Propriétaire : 🎭 **Loki**.

## Audit des docs existants

| Doc | État charte | Action |
|---|---|---|
| `methode-de-travail.html` | ✅ NaonEdge (onglets, or, grue) | RAS / vérifier détails |
| `iakaframe-methode.html` | à vérifier | aligner si besoin |
| `iakaframe-skills.html` | à vérifier | aligner si besoin |
| `iakabox-usage.html` | ✅ tokens NaonEdge | RAS / vérifier |
| `specs/etat-des-lieux.html` | ❌ template du **snapshot** | **mettre le gabarit HTML de `iakaframe-snapshot.ps1` en charte NaonEdge** |
| Doc d'install/usage **PDF** (à venir) | — | produire on-brand (HTML→PDF) |

## Étapes (proposées)

1. **Audit** : ouvrir/differ chaque HTML vs `design-naonedge/naonedge.css` + charte ; lister les écarts.
2. **Gabarit snapshot** : porter le HTML généré par `iakaframe-snapshot.ps1` sur la charte
   (variables CSS NaonEdge, footer, grue) — c'est le doc le plus consulté et le seul **généré**.
3. **Aligner** les HTML hors-charte (méthode/skills si besoin).
4. **PDF versionné** : pipeline HTML(on-brand)→PDF (cf. onboarding v2, étape doc PDF).
5. Inscrire dans la skill Loki (`iakaframe-naonedge`) : « tout doc iakaframe = charte NaonEdge ».

## Hors scope

Les fichiers **Markdown** (READMEs, instructions) restent en MD brut (rendu par git) — la règle
vise les **supports mis en forme** (HTML/PDF/decks).

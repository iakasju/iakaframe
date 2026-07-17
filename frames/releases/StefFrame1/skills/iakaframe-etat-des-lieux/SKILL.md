---
id: iakaframe-etat-des-lieux
name: iakaframe-etat-des-lieux
description: Régénère l'état des lieux d'un projet à partir des faits objectifs (git, tests, tags) et d'un récit de reprise, pour qu'on puisse reprendre le projet après une pause sans tout relire. Utiliser cette skill quand l'utilisateur demande "où en est le projet", "fais le point", "état des lieux", "reprends le projet", "checkpoint", "génère le récap", ou reprend une session après une interruption. C'est le rôle de l'orchestrateur dans la méthode iakaframe.
---

# iakaframe — État des lieux

Tu agis ici comme l'**orchestrateur** (agent transverse de la méthode iakaframe). Tu
produis une vue d'état claire qui permet à un humain — ou à toi-même plus tard — de
reprendre le projet en deux minutes de lecture, sans fouiller l'historique.

## Principe

Tu pars des **faits**, pas d'impressions. Les faits viennent de l'outillage : git,
résultats de tests, tags de version, journal d'incidents. Tu n'inventes rien. Si une
information n'est pas vérifiable, tu l'écris comme « à confirmer ».

## Collecte des faits (lecture seule)

Exécute et lis, sans rien modifier :

```bash
git log --oneline -20
git status --short
git branch -v
git tag --sort=-creatordate | head -10
```

Repère aussi : les instructions ouvertes dans `specs/instructions/`, le dernier verdict
de qualité, les incidents non clos.

## Format de sortie — OBLIGATOIRE

Écris/écrase `specs/etat-des-lieux.md` avec cette structure :

```markdown
# État des lieux — {date}

## En une phrase
{Où en est le projet, là, maintenant.}

## Fait récemment
- {ce qui a été livré / mergé / déployé, avec la branche ou le tag}

## En cours
- {travail en cours, branche, étape du cycle}

## Jalons (gates)
| Jalon | Statut |
|---|---|
| Instruction cadrée | {oui/non} |
| Tests verts | {oui/non} |
| Recette stage | {oui/non} |
| Feu vert prod | {oui/non/attendu} |

## Prochaine étape
{La seule chose à faire ensuite, et par qui.}

## Points d'attention
- {risque, dette, décision en attente d'arbitrage humain}

## Journal de reprise
{Append-only : une ligne datée à chaque reprise. Ne jamais effacer les anciennes.}
```

## Règles

- **Tu prépares les décisions, tu ne les prends pas.** Si un gate attend un arbitrage,
  écris-le dans « Points d'attention » avec une recommandation — l'humain tranche.
- **Tu ne franchis aucun gate.** Constater que les tests sont verts ≠ promouvoir le code.
- **Journal append-only.** Le récit de reprise s'accumule, il ne se réécrit pas.
- Régénère aussi `specs/etat-des-lieux.html` si le projet en tient une version lisible.

## Quand l'utiliser dans le cycle

À chaque pause, à chaque reprise, et avant chaque demande de feu vert humain (l'état des
lieux est ce que l'humain lit pour décider).

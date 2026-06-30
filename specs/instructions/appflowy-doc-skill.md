# Instruction — Skill `iakaframe-appflowy-doc` (mémoire humaine AppFlowy)

> Cadrée par 🟡 Odin (coordinateur — Gandalf retiré, cf. décision d'org). Cible : réalisation
> par 🔴 Gimli, gate 🔴 Legolas. Statut : **cadré, non démarré**.

## Pourquoi

La méthode prévoit désormais une **mémoire humaine** des projets dans AppFlowy auto-hébergé
(cf. `methode-de-travail.md` → « Cycle de documentation → Mémoire humaine »). Cette skill est
l'**exécuteur machine** de cette habitude : publier/rafraîchir les docs structurants d'un projet
dans AppFlowy, par instrumentation, sans geste manuel.

Calque de référence : la skill existante `iakaframe-log-conversation` (`iakalog.mjs`) — **CLI
Node, config par variables d'env, aucun secret en dépôt, défensif**.

## Cible (modèle de données, tranché avec Stéphane)

- **Un espace AppFlowy par projet** (nommé d'après le projet).
- Dans cet espace : **une page « vue d'ensemble »** (synthèse + liens vers les sous-pages).
- **Une sous-page par fichier important.**
- **Fichiers importants = docs structurants** : `CLAUDE.md`, `specs/PROJET.md`,
  `specs/instructions/*`, `specs/etat-des-lieux.md`, `docs/qualite/*`. **Jamais le code ni les
  fichiers générés.**
- **Idempotent & non destructif** : créer si absent, **mettre à jour** sinon ; jamais d'écrasement
  aveugle ni de page/espace fantôme ; relancer la skill deux fois = même état (pas de doublon).

## Contrat API AppFlowy (VALIDÉ en réel le 2026-06-30, instance `notes.bigserver.local`)

Base = `$APPFLOWY_URL` (ex. `http://192.168.2.14:3008`, ou `http://notes.bigserver.local` via proxy).

1. **Auth** : `POST {base}/gotrue/token?grant_type=password` `{email,password}` → `access_token` (JWT ~2 h) + `refresh_token`.
2. **Provision** (1ʳᵉ fois, idempotent) : `GET {base}/api/user/verify/{access_token}` → crée l'`af_user` (`is_new`).
3. **Workspaces** : `GET {base}/api/workspace` (Bearer) → `data[].workspace_id`.
4. **Arbre** : `GET {base}/api/workspace/{wid}/folder?depth=N` → arbre (`view_id`, `is_space`, `name`, `children`).
5. **Créer page** : `POST {base}/api/workspace/{wid}/page-view` `{parent_view_id, layout:0, name}` → `{view_id}`.
6. **Écrire contenu** : `POST {base}/api/workspace/{wid}/page-view/{vid}/append-block`
   `{"blocks":[{"type":"paragraph","data":{"delta":[{"insert":"texte"}]}}]}` (champ `type`, **pas** `ty`).

## ⚠️ Deux inconnues à lever en TOUT DÉBUT d'implémentation (spike court, ~0,5 j)

L'API « happy path » est prouvée (création de page + contenu OK). Restent **deux mécanismes non
encore vérifiés**, qui conditionnent la cible :

1. **Créer un ESPACE par projet** (pas seulement une page). Dans l'arbre, un espace a
   `is_space:true` + `extra.is_space`. Vérifier si `page-view` accepte un flag d'espace, ou s'il
   existe un endpoint dédié. **Repli si non supporté proprement** : une **page racine par projet**
   sous l'espace « General » (au lieu d'un espace) — la cible « 1 espace/projet » devient « 1 page
   racine/projet », à confirmer avec Stéphane si on doit basculer sur ce repli.
2. **Mise à jour idempotente du CONTENU** d'une sous-page (remplacer, pas empiler).
   `append-block` **ajoute** → relancer dupliquerait. Trouver le mécanisme de **remplacement**
   (vider/réécrire le document, ou supprimer+recréer la sous-page). C'est le **vrai risque** de la
   skill ; à trancher avant d'écrire la logique de mise à jour.

Le spike rend un verdict écrit sur ces deux points ; si un repli est nécessaire, il est validé par
Stéphane avant de continuer.

## Périmètre de la skill

**Dans le périmètre :**
- CLI Node `iakaframe-appflowy-doc/appflowy-doc.mjs` (+ `skill.md` de description, format iakaframe).
- **Config 100 % env** : `APPFLOWY_URL`, `APPFLOWY_EMAIL`, `APPFLOWY_PASSWORD` (jamais en dur, jamais commités).
- Usage : `node appflowy-doc.mjs --project <nom> --root <chemin-projet>` → résout les docs structurants,
  garantit l'espace/la page projet, crée/met à jour la vue d'ensemble + une sous-page par fichier.
- **Idempotence** par correspondance de nom (espace=projet, sous-page=chemin relatif du fichier) :
  réutiliser la vue existante (lue dans `/folder`) au lieu d'en recréer.
- **Défensif** : token expiré → ré-auth ; provision si `af_user` absent ; fichier manquant → ignoré
  proprement (jamais de crash) ; sortie claire (créé/à-jour/ignoré par fichier).
- **Dégradation** : instance injoignable / creds absents → message net + code de sortie non nul, **sans**
  jamais bloquer le flux appelant (calque `iakalog`).
- Tests : unitaires sur la **résolution des fichiers** et le **mapping → blocs** (purs, mock du HTTP) ;
  recette réelle manuelle contre l'instance.

**Hors périmètre (différé tracé) :**
- Câblage automatique dans `iakaframe-update.ps1`/snapshot (la skill est appelable, le branchement aux
  moments version/pause/reprise est un lot suivant).
- Rendu riche (titres, listes, code blocks fidèles au Markdown) au-delà du paragraphe — MVP = texte
  fidèle, mise en forme avancée différée.
- Multi-utilisateur / espaces partagés (instance CE = 1 user).
- Secret au keychain (MVP = env ; keychain = évolution alignée sur les autres skills si besoin).

## Critères d'acceptation (vérifiables)

1. `node appflowy-doc.mjs --project demo --root <repo>` crée, sur une instance vierge, l'espace (ou la
   page racine selon spike) « demo », une vue d'ensemble et une sous-page par doc structurant présent.
2. **Relancer la même commande ne crée AUCUN doublon** et met à jour le contenu (idempotence prouvée).
3. Aucun secret dans le dépôt ni dans la sortie ; config lue uniquement via env.
4. Instance injoignable → échec propre (message + code retour), pas de stacktrace, pas de blocage.
5. Tests unitaires verts (résolution fichiers + mapping blocs) ; recette réelle OK (captures/desc).

## Estimation (méthode : estimation obligatoire au jalon dev)

- **~1,5–2 j-homme.** Spike inconnues (0,5 j) + CLI auth/provision/folder (0,3 j) + logique
  idempotente espace/page/sous-pages + mapping contenu (0,7 j) + tests/mocks + recette réelle (0,5 j).
- **Complexité/risque : moyen**, concentré sur l'**inconnue n°2** (mise à jour idempotente du contenu).
  Si le remplacement de contenu n'est pas exposé proprement par l'API 0.15.21, repli = supprimer+recréer
  la sous-page (à valider). Estimation = ordre de grandeur révisable, pas un engagement ferme.

## Références

- `methode-de-travail.md` → « Cycle de documentation → Mémoire humaine ».
- Skill calque : `skills/iakaframe-log-conversation/iakalog.mjs`.
- Recette API + accès : mémoire projet `appflowy-homelab-api` (instance, proxy NPM, endpoints).

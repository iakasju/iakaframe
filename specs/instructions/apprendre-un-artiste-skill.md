# Instruction — Skill `iakaframe-etude-artiste` (apprendre un artiste, restituer « à la façon de »)

> **Phase** : P1 — Cadrage · **Cadreur** : l'architecte-cadreur (Gandalf) · **Exécutant** : le
> développeur-devops (Gimli) · **Gate** : Legolas puis validation de Stéphane.
> **Statut** : **cadré, non démarré** — en attente de validation du décideur.
> **Date de cadrage** : 2026-07-29. Doc en français ; identifiants, tokens de prompt et noms de
> fichiers de modèles en anglais.
>
> **Arbitrages déjà tranchés par le décideur (non rouverts ici)** :
> 1. la skill vit dans la **bibliothèque partagée** `library/skills/` (réutilisable par tous les
>    projets, pas propriété d'iakaFreeVision) ;
> 2. elle produit **les trois livrables** : fiche artiste persistée, prompt positif/négatif prêt à
>    l'emploi, recommandation de checkpoint + LoRA **dans le catalogue réellement disponible** ;
> 3. **aucune restriction, aucun avertissement** sur le périmètre des artistes — pas de mention de
>    droits, d'artiste vivant ou de domaine public. Décision assumée du décideur : **ne pas
>    réintroduire de garde-fou juridique ni de disclaimer** dans la skill (critère d'acceptation 10).
>
> **Références lues pour ce cadrage**
> - Conventions de skill : `library/skills/README.md`, `library/skills/iakaframe-naonedge/SKILL.md`,
>   `library/skills/iakaframe-nathalie/SKILL.md`, `library/skills/iakaframe-learning/SKILL.md`,
>   `library/skills/iakaframe-frame/SKILL.md` (+ son `corpus/`), `library/_schema/frontmatter.json`.
> - Méthode : `methode-de-travail.md` (§ Incarnation : personas + skills, § Identité).
> - Canon mémoire (précédent de persistance) : `specs/instructions/boucle-apprentissage-incrementale.md`
>   § 4.1–4.2, et son implémentation `cli/src/lib/memory.js`.
> - Catalogue aval réel : `~/work/iakaFreeVision/docs/guide-utilisateur.md` § « Les modèles à ta
>   disposition », `~/work/iakaFreeVision/specs/PROJET.md`,
>   `~/work/iakaFreeVision/specs/instructions/01-comfyui-models-video-iakabox.md`,
>   `~/work/iakaFreeVision/specs/instructions/02-wan-vace-video2video.md`.
> - Chaîne d'outillage impactée : `cli/src/lib/resolve-skills.js`, `cli/src/lib/skills-deploy.js`,
>   `cli/src/lib/vendor.js`, `cli/scripts/gen-{skills,agents}-golden.mjs`,
>   `cli/scripts/gen-methode-vitrine.mjs`.

---

## 1. Problème (avant la solution)

Le besoin exprimé : « **apprendre un artiste** = chercher sur le web pour apprendre ses œuvres, et
pouvoir ensuite répondre à “**crée à la façon de …**” ».

Aujourd'hui, quand on demande à un agent de produire « à la façon de X », il arrive **trois
défauts**, tous observés dans la pratique :

1. **La connaissance est refaite à chaque fois, et jamais gardée.** Le travail d'étude d'un artiste
   (périodes, palette, facture) est refait de zéro à chaque demande, avec un résultat différent à
   chaque tour. Rien ne capitalise.
2. **Le style est « deviné », pas observé.** Sans protocole de sourçage, l'agent restitue le
   souvenir flou d'un nom d'artiste — souvent une paraphrase d'une seule page encyclopédique — au
   lieu d'attributs tirés d'œuvres réellement regardées. La palette est le premier champ halluciné.
3. **La restitution n'est pas exécutable.** Un paragraphe littéraire sur « l'atmosphère
   crépusculaire de l'artiste » ne se met pas dans un `CLIPTextEncode`. Il manque la traduction
   mécanique : tokens de prompt, prompt négatif, **et le modèle sur lequel lancer ça**, choisi dans
   ce qui est réellement installé, sous **12 Go de VRAM**.

Le troisième point est celui qui coûte le plus : une reco de checkpoint tirée d'un catalogue
théorique (« prends SDXL 1.0 base avec le LoRA X ») est **inutilisable** sur l'infra réelle.

**Ce que ce lot n'est pas** : ni un moteur de génération, ni un entraîneur de LoRA, ni un
téléchargeur de modèles. C'est une **skill de connaissance** : elle apprend, elle persiste, elle
traduit. L'exécution reste au projet consommateur.

---

## 2. Ce qui existe (état constaté au 2026-07-29)

| Élément | Où | État |
|---|---|---|
| Bibliothèque de skills partagée | `library/skills/` (26 dossiers) | opérationnelle ; frontmatter typé (`library/_schema/frontmatter.json` → `skills.required = {id, name}`) |
| Mécanique de déploiement d'une skill | `cli/src/lib/skills-deploy.js` + `resolve-skills.js` | une skill n'est déployée dans `<projet>/.claude/skills/` **que** si elle est dans la fermeture transitive des `skills:` d'une persona déployée |
| Persona « expert art & histoire de l'art » | `library/personas/loki.md` (🎭 Loki, `roleKey: design`) | déjà doté de `WebSearch`/`WebFetch`, `skills: [iakaframe-naonedge]` ; déjà déployé sur iakaFreeVision (`.claude/agents/loki.md`) |
| Précédent « données à côté du SKILL.md » | `library/skills/iakaframe-frame/corpus/` | validé : le dossier entier est copié au déploiement, référencé en **relatif** depuis `SKILL.md` |
| Canon neutre de fichiers | `~/.iaka/` (`IAKA_MEMORY_HOME` → `~/.iaka/memory/`) | implémenté (`cli/src/lib/memory.js`) ; substrat **propriété de personne**, jamais sous `~/.claude/` |
| Catalogue de modèles génératifs réel | ComfyUI `comfyui-clean`, `http://192.168.2.12:8190` (RTX 3060 **12 Go**) | 5 checkpoints image + 2 pipelines vidéo (§ 4, D6) |
| Catalogue de **LoRA** réel | `/mnt/comfyui-models/loras/` | **vide** — aucun LoRA installé (aucune trace dans iakaFreeVision hors mention du dossier). À confirmer en Phase 0 |
| Corpus d'artistes appris | *nulle part* | **c'est le manque que ce lot comble** |

> **Fait structurant à ne pas manquer.** `skills-deploy.js` déploie une skill par `syncDir()`, qui
> fait `fs.rmSync(dst, { recursive: true, force: true })` **avant** de recopier le canon, et
> `skillStatus()` rapporte `drift` dès qu'un fichier surnuméraire apparaît côté cible. **Écrire une
> donnée apprise à l'intérieur du dossier de la skill est donc structurellement interdit** : elle
> serait détruite au déploiement suivant et ferait rougir `skills deploy --check` d'ici là. Ce fait
> tranche à lui seul la question de la persistance (§ 4, D4).

---

## 3. Faits vérifiés sur le web (2026-07-29) + sources

Ces faits **conditionnent la table de recommandation** (§ 8) : sans eux, la reco serait un catalogue
théorique. Ils sont recopiés dans `references/catalogue-genai.md` pour être lisibles au runtime.

**FLUX.1 [dev] — le piège du prompt négatif.** FLUX.1 [dev] est **distillé en guidance** : il
s'utilise à **CFG = 1** dans le KSampler, et un prompt négatif y est **inopérant** dans le workflow
standard. Le levier est `FluxGuidance` (valeur ~3,5), pas le CFG. Des contournements existent
(DynamicThresholding, Perpendicular Negative Guidance) mais coûtent **2× à 3× le temps de
génération**. → Conséquence gravée : **si le style demande beaucoup d'anti-traits, ne pas choisir
FLUX** ; et quand FLUX est choisi, le négatif est rendu **avec la mention explicite qu'il ne
s'applique pas**, les anti-traits étant repliés dans le positif.

**Pony Diffusion V6 XL — trois réglages non négociables.** Préfixe de qualité **complet**
`score_9, score_8_up, score_7_up, score_6_up` (le `score_9` seul a un effet bien plus faible) ;
**CLIP skip 2** obligatoire (sinon « low quality blobs ») ; CFG ~7, Euler a, 25–30 steps,
résolutions 1024×1024 / 832×1216 / 1216×832.

**DreamShaper XL Turbo DPM++ SDE — sampler imposé.** CFG **2** (3–4 pour un style marqué),
**4–7 steps**, sampler **DPM++ SDE Karras uniquement** (ne pas utiliser 2M sur la variante Turbo).
La même variante peut se jouer en mode non-Turbo (DPM++ 2M SDE Karras / Euler, CFG 6, 20–40 steps).

**SD 3.5 Medium.** 20–35 steps, CFG **3–6**, `dpmpp_2m` ou Euler ; **n'aime pas les prompts
longs** — garder le prompt court. (Skip Layer Guidance améliore composition/anatomie ; hors MVP.)

**Style : ce qui porte le style, en 2026.** Le **modèle de base détermine l'essentiel du style**
(~70 % selon les guides de référence), LoRA et prompt font le reste. Pour un style qui doit
**tenir** sur beaucoup de scènes, l'outil juste reste le **LoRA de style**. L'**IP-Adapter est peu
efficace sur FLUX** (son équivalent FLUX est **Redux**) ; pour un **transfert de style exact**,
SDXL (famille Juggernaut) garde le meilleur support communautaire. FLUX se justifie pour
l'**adhérence au prompt**, à partir de 12 Go de VRAM, en **fp8** (checkpoint **et** CLIP/T5 en fp8)
— c'est exactement la configuration installée.

Sources :
- [FLUX.1 dev — exemples ComfyUI officiels](https://comfyanonymous.github.io/ComfyUI_examples/flux/) ·
  [Flux negative prompting workflows (Civitai)](https://civitai.com/models/625042/flux-negative-prompting-workflows) ·
  [All-in-One FluxDev workflow (dynamic thresholding)](https://github.com/Ling-APE/ComfyUI-All-in-One-FluxDev-Workflow)
- [Pony Diffusion V6 XL (Civitai)](https://civitai.com/models/257749/pony-diffusion-v6-xl) ·
  [Pony Diffusion v6 XL — Stable Diffusion Art](https://stable-diffusion-art.com/pony-diffusion-v6-xl/)
- [DreamShaper XL (Civitai)](https://civitai.com/models/112902/dreamshaper-xl) ·
  [DreamShaper XL Turbo DPM++ SDE (Diffus)](https://www.diffus.me/models/dreamshaper-xl-turbo-dpm-sde)
- [SD 3.5 Medium sur ComfyUI — Stable Diffusion Art](https://stable-diffusion-art.com/stable-diffusion-3-5-medium-comfyui/) ·
  [SD 3.5 Medium : Skip Layer Guidance (sandner.art)](https://sandner.art/sd-35-medium-skip-layer-guidance-and-fix-composition-hands-and-anatomy/)
- [Prompting art and design styles in Flux (sandner.art)](https://sandner.art/prompting-art-and-design-styles-in-flux-in-forge-and-comfyui/) ·
  [AI art styles & workflows: SD and Flux guide (InsiderLLM, 2026)](https://insiderllm.com/guides/ai-art-styles-workflows-guide/) ·
  [How to use Flux LoRAs in ComfyUI (Next Diffusion)](https://www.nextdiffusion.ai/tutorials/how-to-use-flux-lora-in-comfyui)

---

## 4. Décisions tranchées

| # | Décision | Raison |
|---|---|---|
| **D1** | **Nom de la skill : `iakaframe-etude-artiste`.** | Convention de la bibliothèque : préfixe `iakaframe-` + **nom français, kebab-case ASCII sans accent** (`iakaframe-etat-des-lieux`, `iakaframe-gestion-de-source`, `iakaframe-lecture-maquettes`). « Étude » est le mot d'atelier exact : l'exercice par lequel on étudie la manière d'un maître pour la reproduire — il couvre les deux gestes (apprendre **et** restituer) sans inventer un anglicisme. |
| **D2** | **Skill atomique** : pas de `subskills:`, **pas de champ `layer:`**. | Elle ne pilote aucune autre skill et n'entre pas dans la chaîne capacité→famille→produit : comme le design (patron B de `library/skills/README.md`), son concret est de la **donnée résolue au runtime** (le catalogue de modèles), pas un skill-produit interchangeable. Forcer une chaîne à 3 couches ici serait de la sur-ingénierie (règle MVP d'abord). |
| **D3** | **Porteur : la persona 🎭 Loki** (`library/personas/loki.md` → `skills: [iakaframe-naonedge, iakaframe-etude-artiste]`). | (a) C'est le **seul mécanisme de déploiement** : `unionSkills()` ne déploie que la fermeture des `skills:` des personas de la cible — une skill non rattachée est une skill morte. (b) Loki est déjà défini comme expert **art & histoire de l'art**, déjà doté de `WebSearch`/`WebFetch`, et **déjà déployé sur iakaFreeVision**. (c) Aucun autre rôle n'a ce périmètre sans le déborder. |
| **D4** | **Persistance de la fiche : dans un corpus neutre hors dépôt et hors skill** — `$IAKA_CORPUS_HOME` (défaut **`~/.iaka/corpus/`**), fiches en `artists/<slug>.md`. | Trois options pesées. **(a) Dans `references/` de la skill : impossible** — `skills-deploy.js` fait `rm -rf` du dossier cible avant recopie, la fiche serait détruite au déploiement suivant et rendrait `skills deploy --check` en `drift` d'ici là (§ 2). **(b) Dans le projet consommateur : rejeté** — le décideur a tranché que la skill est partagée ; enfermer le corpus dans iakaFreeVision obligerait à réapprendre chaque artiste dans chaque projet, exactement la fragmentation par scope que `boucle-apprentissage-incrementale.md` combat (§ 2, manque n°1). **(c) Corpus neutre au niveau *home* : retenu** — c'est le précédent exact du canon `~/.iaka/memory/` (substrat de fichiers **propriété de personne**, lisible par n'importe quel runner, robuste au déplacement de `~/work`, déjà couvert par la procédure de reconstruction PC). **Frère, pas fils, du canon mémoire** : `~/.iaka/corpus/` et non `~/.iaka/memory/`, parce que le layout de `memory/` est possédé par `cli/src/lib/memory.js` (plafonds durs, `close`, `recall`, `consolidate`) et qu'un corpus d'artistes n'obéit à aucune de ces sémantiques. Aucun code CLI n'est donc à modifier. |
| **D5** | **`references/` = données livrées avec la skill, en LECTURE SEULE.** Trois fichiers : `gabarit-fiche-artiste.md`, `catalogue-genai.md`, `sources-de-reference.md`. | Corollaire de D4 : ce qui est **versionné et stable** voyage avec la skill (précédent `iakaframe-frame/corpus/`) ; ce qui est **appris et mutable** vit dans le corpus. La frontière est vérifiable (critère 11). |
| **D6** | **Le catalogue de modèles est de la DONNÉE (patron B), pas de la prose.** Ordre de résolution gravé : `$IAKA_GENAI_CATALOG` (surcharge) → `<projet>/specs/catalogue-modeles.md` s'il existe → `references/catalogue-genai.md` (défaut livré). **Rafraîchissement facultatif** : si l'endpoint ComfyUI répond, `GET /object_info/CheckpointLoaderSimple` et `GET /object_info/LoraLoader` **font foi** et tout écart est signalé. | Une reco ne vaut que si elle nomme un fichier réellement chargeable. Nommer l'hôte LAN dans la bibliothèque partagée a un précédent assumé (`iakaframe-forgejo` nomme `192.168.2.11:3001`). La surcharge par projet garde la skill utilisable ailleurs. |
| **D7** | **Aucun LoRA n'est installé aujourd'hui** → la sortie normale est `LoRA : aucun (catalogue vide)`, **jamais** un nom inventé. Quand le style résiste sans LoRA, la skill émet une **« demande d'ajout au catalogue »** (nom, base compatible, URL, taille, poids conseillé) à faire passer par le cycle d'instruction du projet. | Recommander un LoRA non installé, c'est produire une reco non exécutable — le défaut n°3 du § 1. La demande d'ajout est la sortie honnête, et elle respecte le gate humain. |
| **D8** | **La skill ne lance AUCUNE génération.** Elle rend un bloc prêt à coller ; l'exécution reste au projet consommateur. | (a) Le décideur a fermé le livrable à **trois artefacts** (fiche, prompts, reco) — générer n'en fait pas partie. (b) Étanchéité : une skill de la bibliothèque **partagée** ne pilote pas l'infra d'un projet. (c) La règle 12 Go « un seul modèle chargé à la fois » implique un arbitrage GPU qui appartient à iakabox (cf. `04-arbitre-gpu-litellm.md`), pas à une skill de connaissance. **Réversible** : brancher la génération est un lot ultérieur identifié (§ 9). |
| **D9** | **Aucun avertissement, aucune restriction d'artiste** dans la skill ni dans les fiches. | Décision explicite du décideur. Gravée ici pour qu'un exécutant zélé ne la « corrige » pas ; contrôlée par le critère d'acceptation 10 (grep = 0 occurrence). |

---

## 5. Le geste d'APPRENDRE — protocole de recherche web (fermé)

Déclenché par « apprends / étudie le style de X », ou implicitement par « crée à la façon de X »
quand la fiche manque (§ 7).

**Étape 1 — Désambiguïsation, AVANT toute recherche approfondie.**
Une requête d'identification (`"<nom>" peintre OR artiste OR photographe OR illustrateur`). Si
**deux personnes distinctes plausibles** apparaissent (homonymes, dynastie, père/fils) :
→ **ne rien écrire**, poser **une question** à l'utilisateur listant **2 à 3 candidats discriminés**
par époque + médium + pays. Si l'utilisateur a déjà fourni un discriminant, l'employer et le graver
dans `id` et `aka` (ex. `pieter-bruegel-l-ancien`). C'est la seule interruption prévue du parcours.

**Étape 2 — Amorce (facultative, non comptée).** Une page encyclopédique pour verrouiller
l'orthographe, les dates, le mouvement et les titres des œuvres majeures. **`wikipedia.org` ne
compte pour aucune source** dans le décompte de l'étape 3 : c'est le garde-fou anti-« je résume la
page Wikipédia ».

**Étape 3 — Collecte : minimum 4 sources de domaines DISTINCTS**, dont :
- **≥ 2 institutionnelles** : musée / collection publique / fondation ou succession de l'artiste /
  catalogue raisonné / base d'œuvres documentée ;
- **≥ 1 visuelle** : une page permettant de **voir des reproductions** (sans quoi palette,
  composition et facture ne sont que devinées) ;
- l'échelle de priorité complète et la liste de domaines de référence vivent dans
  `references/sources-de-reference.md` (donnée enrichissable sans toucher au corps de la skill).

**Étape 4 — Observer, pas paraphraser.** Palette, composition, lumière et texture se déduisent des
**œuvres regardées**. La fiche cite **≥ 5 œuvres nommées et datées** ; chaque attribut de style doit
pouvoir se rattacher à au moins une d'elles. **Une palette non observée n'est jamais inventée** :
elle reste en `## Lacunes`.

**Étape 5 — Périodiser.** Si l'artiste a des périodes marquées, les distinguer (elles ne donnent pas
le même prompt). Sinon écrire explicitement « période unique » — jamais un champ vide.

**Étape 6 — Déclarer la confiance.**

| `confiance` | Condition |
|---|---|
| `haute` | ≥ 4 sources (hors Wikipédia) dont ≥ 2 institutionnelles **et** ≥ 1 visuelle **et** ≥ 5 œuvres nommées |
| `moyenne` | 3 sources, **ou** aucune source visuelle, **ou** 3–4 œuvres nommées |
| `basse` | < 3 sources, artiste obscur, ou attributs majoritairement non étayés |

**Étape 7 — Artiste obscur : écrire quand même, honnêtement.** Ne jamais refuser, ne jamais combler.
`confiance: basse` + une section `## Lacunes` qui **nomme les champs non étayés**. Il est interdit de
remplir un champ par analogie avec un artiste voisin ; si un rapprochement stylistique éclaire, il
est écrit comme tel : `rapprochement : <artiste> — hypothèse, non sourcé`.

**Étape 8 — Écrire la fiche** (§ 6) puis **annoncer en clair** à l'utilisateur : slug, confiance,
nombre de sources, et les lacunes s'il y en a.

---

## 6. Format de la fiche artiste — **traduisible mécaniquement en prompt**

Une fiche littéraire est inutile ici. Chaque section porte des **tokens exploitables** (en anglais,
séparés par des virgules), pas de la prose. Le gabarit exact est livré dans
`references/gabarit-fiche-artiste.md` et doit être **copié tel quel** :

```markdown
---
id: <slug-ascii-kebab>            # translittéré, sans diacritique : zdzislaw-beksinski
name: <Nom d'usage>
aka: [<variantes>, <discriminant d'homonymie>]
vie: <1929-2005 | actif depuis 2011>
courants: [<mouvement>, ...]
mediums: [<oil on canvas>, ...]
confiance: haute|moyenne|basse
sources_count: <n, hors Wikipédia>
updated: AAAA-MM-JJ
---

# <Nom> — fiche de style

## Périodes
| Période | Années | Ce qui change | Tokens (EN) |

## Motifs récurrents        <!-- tokens EN, 5 à 12 -->
## Palette
| Rôle | Couleur | Hex approx. | Note |
Saturation : … · Valeurs : … · Contraste : …

## Composition & cadrage    <!-- point de vue, symétrie, profondeur, échelle du sujet, horizon -->
## Lumière                  <!-- source, dureté, direction, contraste -->
## Médium & texture         <!-- impasto, grain argentique, hachure, aplat, craquelure… -->
## Sujets                   <!-- ce qu'il représente -->
## Anti-sujets / anti-traits <!-- ce qui trahirait le style → alimente le prompt négatif -->
## Œuvres de référence      <!-- >= 5 -->
| Titre | Année | Où la voir |

## Prompt — positif (EN)
## Prompt — négatif (EN)
## Reco modèles
| Cible | Checkpoint | LoRA | Paramètres | Note VRAM |
## Sources
| # | Domaine | Type (musée / catalogue / base / presse) | Ce qu'elle apporte | Consultée le |
## Lacunes / incertitudes
```

**Ordre canonique du prompt positif** (gravé, appliqué à toute restitution) :
`[sujet demandé] , [médium/support] , [traits de style de la période] , [composition & cadrage] ,
[lumière] , [palette] , [texture/facture] , [qualificatifs de rendu]`.
Le nom de l'artiste est cité en tête des traits de style (`in the style of <Nom>`) **sauf sur
FLUX**, où l'on s'appuie d'abord sur la **description** des traits (§ 3).

**Prompt négatif** = anti-traits + anti-sujets + défauts génériques (+ le négatif de base attendu par
le checkpoint retenu, cf. `references/catalogue-genai.md`).

**Plafond de la fiche** : cible **≤ 6 000 caractères**, **plafond dur 8 000** (`wc -c`). Au-delà, on
condense — les **tokens priment sur la prose**. Même discipline que les plafonds du canon : c'est le
plafond qui force la curation.

---

## 7. Persistance et geste de RESTITUER

**Emplacement (D4).** `$IAKA_CORPUS_HOME` (défaut `~/.iaka/corpus/`), fiches dans
`artists/<slug>.md`, plus un `artists/INDEX.md` (une ligne par fiche : slug · nom · confiance ·
`updated`) tenu à jour à chaque écriture. Interdits, comme pour le canon mémoire : **sous
`~/.claude/`**, et **dans le dossier de la skill**. Créer l'arborescence si absente, ne jamais
écraser sans relire.

**Idempotence.** Une seconde étude du même artiste **met à jour la fiche existante** (même chemin,
`updated` rafraîchi, sections réécrites) — elle ne crée jamais de doublon ni de fichier suffixé.

**Geste de restitution — ce qui se passe exactement sur « crée à la façon de X »** :

1. **Résoudre** le slug, chercher `artists/<slug>.md`.
2. **Décider** :
   - fiche **absente** → **lancer l'apprentissage (§ 5) puis restituer, dans le même tour**, sans
     demander la permission (seule exception : l'homonymie de l'étape 1, qui suspend tout) ;
   - fiche **présente et `updated` < 180 jours** → l'utiliser telle quelle ;
   - fiche **présente mais plus ancienne, ou `confiance` ≠ `haute`** → l'utiliser **en le signalant**
     et **proposer** un rafraîchissement — ne pas le déclencher d'office (le décideur arbitre).
3. **Rendre un bloc unique, copiable, toujours dans cet ordre** :

```
Artiste : <Nom> · fiche <slug> · confiance <haute|moyenne|basse> · mise à jour <AAAA-MM-JJ>

— PROMPT POSITIF (EN) —
<bloc>

— PROMPT NÉGATIF (EN) —
<bloc>            [⚠ inopérant si le checkpoint retenu est FLUX — CFG=1, cf. catalogue]

— MODÈLE —
checkpoint : <nom de fichier EXACT du catalogue>   (pourquoi : <une ligne>)
LoRA       : <nom + poids>  |  aucun (catalogue vide) → candidat à faire installer : <nom, base, URL, taille>
paramètres : sampler/scheduler · cfg · steps · résolution · clip-skip
VRAM       : <note 12 Go — un seul modèle chargé à la fois>

— SOURCES DE LA FICHE — <n> sources dont <n> institutionnelles
```

4. **Ne rien exécuter** (D8). Le bloc est le livrable.

---

## 8. La reco checkpoint / LoRA — table de décision

Vit comme **donnée** dans `references/catalogue-genai.md` (D6), avec les faits et sources du § 3.
Catalogue par défaut = l'installé réel de `comfyui-clean` (`192.168.2.12:8190`, RTX 3060 12 Go) :

| Nature du style de l'artiste | Checkpoint recommandé (nom de fichier exact) | Paramètres de départ | Pièges |
|---|---|---|---|
| Photographie, photoréalisme, hyperréalisme | `Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors` | `dpmpp_2m` + `karras`, cfg 5–7, 25–35 steps, 1024×1024 | famille SDXL : bande de paramètres standard, pas de réglage exotique |
| Peinture figurative complexe, scène narrative, prompt long en langage naturel, texte dans l'image | `flux1-dev-fp8.safetensors` | `euler` + `simple`/`normal`, **cfg 1**, `FluxGuidance` ~3.5, 20–25 steps | **prompt négatif inopérant** ; CLIP/T5 en **fp8** obligatoire en 12 Go |
| Illustration, anime, cartoon, BD, character art | `ponyDiffusionV6XL.safetensors` | `euler_ancestral`, cfg 7, 25–30 steps, **clip-skip 2**, 1024×1024 / 832×1216 / 1216×832 | **préfixe complet** `score_9, score_8_up, score_7_up, score_6_up` ; sans clip-skip 2 → bouillie |
| Polyvalent, composition graphique, prompt court | `sd3.5_medium_incl_clips_t5xxlfp8scaled.safetensors` | `dpmpp_2m` ou `euler`, cfg 3–6, 20–35 steps | **n'aime pas les prompts longs** — condenser les tokens |
| Brouillon rapide, itération de cadrage | `dreamshaperXL_turboDpmppSDE.safetensors` | **`dpmpp_sde` + `karras` uniquement**, cfg 2 (3–4 si style marqué), 4–7 steps | ne pas utiliser `2M` sur la variante Turbo |
| Style de mouvement / artiste du film et de l'animation | `ltx-video-2b-v0.9.5.safetensors` (léger) ou **Wan 2.2 TI2V 5B** (3 loaders : `wan2.2_ti2v_5B_fp16` en `fp8_e4m3fn` + `umt5_xxl_fp8_e4m3fn_scaled` type `wan` device `cpu` + `wan2.2_vae`) | cf. `iakaFreeVision/docs/guide-utilisateur.md` | vidéo = le goulot 12 Go : petites résolutions, peu de frames |

**Règles de départage, dans cet ordre :**
1. **Le style prime sur le rendu.** Si les anti-traits sont nombreux (le style se définit surtout par
   ce qu'il n'est pas), **écarter FLUX** — son négatif ne s'applique pas (§ 3).
2. **Illustration/anime → Pony**, même si FLUX « rendrait mieux » : la base porte le style.
3. **Photo → Juggernaut** avant FLUX quand le style doit être *exact* plutôt que *joli*.
4. **Un seul modèle chargé à la fois** (12 Go) : la reco nomme **un** checkpoint, jamais un pipeline
   à deux modèles, et signale quand le choix est tendu.
5. **Toujours donner un repli** : un second checkpoint du catalogue, en une ligne, avec la raison.

**LoRA (D7).** Le catalogue de LoRA est **vide** → sortie normale `LoRA : aucun (catalogue vide)`.
La skill ne télécharge ni n'installe rien. Si le style résiste, elle émet une **demande d'ajout au
catalogue** en précisant la **base compatible** — un LoRA SDXL ne se transpose ni sur Pony (base
divergente, à tester) ni sur FLUX (architecture différente) — le poids conseillé, l'URL et la taille.
Cette demande passe par le cycle d'instruction normal du projet consommateur.

---

## 9. Périmètre

**Inclus :**
- `library/skills/iakaframe-etude-artiste/SKILL.md` + `references/` (3 fichiers de données).
- Rattachement à la persona Loki + réalignement complet de la chaîne de dérivés et du vendor (§ 11).
- Le corpus `~/.iaka/corpus/artists/` (créé au premier usage par la skill elle-même, aucun code CLI).
- Recette réelle sur 3 artistes (§ 12, R1–R5).

**Exclu — explicitement, et c'est un choix :**
- **Lancer une génération** : aucun `POST /prompt`, aucun fichier image/vidéo produit (D8).
- **Télécharger ou installer** un modèle, un LoRA, un custom_node.
- **Entraîner un LoRA** (dataset, captioning, FluxGym…) — autre métier, autre lot.
- **Produire un workflow ComfyUI JSON** prêt à charger — candidat au lot suivant, pas au MVP.
- **Stocker des images** : le corpus est **textuel**, on ne rapatrie aucune reproduction.
- **Une commande CLI `iakaframe artist`** ou un panneau GUI : la skill est conversationnelle ; aucun
  code `cli/src/` n'est ajouté (seul `vendor.js` est amendé, cf. § 11).
- **Toute restriction ou avertissement** sur l'artiste traité (D9).
- Modifier le catalogue de modèles : la skill le **lit**, elle ne l'écrit pas.

**Différés tracés** (à cadrer plus tard si le besoin se confirme) : émission d'un workflow ComfyUI
prêt à exécuter ; branchement optionnel de la génération derrière un gate humain ; versionnement du
corpus dans un dépôt (`IAKA_CORPUS_HOME` pointé sur un dossier git) ; extension du corpus à d'autres
axes que l'artiste (mouvement, studio, directeur photo).

---

## 10. Phase 0 — GATE (constat avant écriture)

**Aucune ligne n'est écrite avant ce constat rendu.** Si un point diverge de ce cadrage,
**l'exécutant revient au cadrage** au lieu d'improviser.

1. **Catalogue réel.** `curl -s http://192.168.2.12:8190/object_info/CheckpointLoaderSimple` et
   `.../LoraLoader` → relever la **liste exacte** des checkpoints et des LoRA. Si la box est
   éteinte, se rabattre sur `iakaFreeVision/docs/guide-utilisateur.md` **et le noter** dans le
   constat.
   - **Écart sur les checkpoints** (nom de fichier différent, modèle absent/ajouté) → retour cadrage.
   - **`loras/` non vide** → retour cadrage : la règle D7 (« aucun LoRA ») et la table du § 8 doivent
     être révisées avec les LoRA réels.
2. **Chaîne de dérivés au vert AVANT modification.** `node --test cli/test/` vert,
   `iakaframe vendor-check --strict` propre, et **présence du dépôt frère** `~/work/iakaFrameGUI`
   (fixtures `packages/core/__tests__/fixtures/`). Si les tests sont **déjà rouges** ou si le frère
   est absent → **s'arrêter et rendre compte** (ne pas laisser un vendor à moitié fait).
3. **Valeurs à confirmer sur le disque** (elles bougent) : `EXPECTED_COPIES` dans
   `cli/src/lib/vendor.js` (constaté **78**) et `counts.skills` dans
   `cli/test/fixtures/skills-golden/manifest.json` (constaté **26**). L'exécutant relit les valeurs
   réelles et incrémente à partir d'elles — il ne recopie pas aveuglément les chiffres de ce document.
4. **Absence de collision** : aucun `library/skills/iakaframe-etude-artiste/`, aucun
   `~/.iaka/corpus/` préexistant avec un autre usage.

---

## 11. Étapes d'implémentation (ordonnées)

Chemins **relatifs au dépôt `~/work/iakaframe/`** sauf mention contraire. Commits atomiques
(*conventional commits*) à chaque tâche.

**T1 — Phase 0** (§ 10) : rendre le constat écrit. *Gate.*

**T2 — `library/skills/iakaframe-etude-artiste/SKILL.md`.** Frontmatter :

```yaml
---
id: iakaframe-etude-artiste
name: iakaframe-etude-artiste
description: Apprend le style d'un artiste par recherche web sourcée (musées, collections, catalogues raisonnés, bases d'œuvres), en persiste une fiche exploitable, puis restitue un prompt positif/négatif prêt à l'emploi et une recommandation de checkpoint/LoRA parmi les modèles RÉELLEMENT installés (contrainte 12 Go de VRAM). Utiliser cette skill quand l'utilisateur dit "apprendre un artiste", "apprends/étudie le style de …", "crée à la façon de …", "dans le style de …", "à la manière de …", "fais-moi un prompt façon <artiste>", ou demande quel modèle utiliser pour imiter un artiste. Elle NE lance aucune génération et n'installe aucun modèle : elle rend le prompt et la reco ; l'exécution reste au projet consommateur.
---
```

Corps (sections imposées, style des skills existantes) : principe directeur → désambiguïsation →
protocole de recherche (§ 5) → écriture de la fiche (§ 6, renvoi à `references/gabarit-fiche-artiste.md`)
→ persistance (§ 7) → geste de restitution avec le **bloc de sortie littéral** → reco modèles (renvoi
à `references/catalogue-genai.md`) → garde-fous → **identité** : `🟠 [ROYAUME][Loki]`, royaume en
MAJUSCULE, jamais sur les logs (calque `iakaframe-naonedge`). Les `references/` sont référencées **en
relatif** (précédent `iakaframe-frame/corpus/`).

**T3 — `references/gabarit-fiche-artiste.md`** : le gabarit du § 6, copiable tel quel, + un exemple
court de section remplie (2–3 lignes) pour lever toute ambiguïté sur le format des tokens.

**T4 — `references/catalogue-genai.md`** : l'ordre de résolution (D6), le catalogue par défaut, la
table de décision et les règles de départage du § 8, les bandes de paramètres et les pièges du § 3
**avec leurs sources**, la règle LoRA (D7) et le gabarit de « demande d'ajout au catalogue ».

**T5 — `references/sources-de-reference.md`** : échelle de priorité des sources (succession/fondation
→ musées & collections → catalogues raisonnés et bases d'œuvres → presse spécialisée et entretiens →
Wikipédia **en amorce non comptée**), liste de domaines institutionnels de référence, règle des
**4 sources de domaines distincts dont 2 institutionnelles et 1 visuelle**, et conduite à tenir sur
homonyme et artiste obscur.

**T6 — Rattacher à Loki** : `library/personas/loki.md` → `skills: [iakaframe-naonedge,
iakaframe-etude-artiste]`, plus **un court paragraphe** dans le corps du persona nommant la skill
(le corps est recopié dans le contrat généré — d'où T7).

**T7 — Réaligner les dérivés, dans cet ordre exact :**
1. `node cli/scripts/gen-skills-golden.mjs` → `cli/test/fixtures/skills-golden/manifest.json`
   (`counts.skills` 26→27, nouvelle entrée, `resolution.loki` à deux ids).
2. `node cli/scripts/gen-agents-golden.mjs` → `cli/test/fixtures/agents-golden/loki.md`
   (ligne `skills:` + corps + `sha256`).
3. `node cli/scripts/gen-methode-vitrine.mjs` → zone `CODE_BLOCKS` de `methode-de-travail.html`.
4. `cli/src/lib/vendor.js` : ajouter `'iakaframe-etude-artiste'` à **`SKILL_IDS`** (union des
   `persona.skills` — sans quoi la skill n'est pas vendorée) **et** incrémenter **`EXPECTED_COPIES`**
   (78 → 79) en mettant à jour le commentaire de décompte (19 → 20 skills).
5. **Vendorer côté GUI** (`~/work/iakaFrameGUI/packages/core/__tests__/fixtures/`) :
   `skills/iakaframe-etude-artiste/SKILL.md` (copie du canon) et `agents-golden/loki.md`
   (copie du golden régénéré).
6. Vérifier : `node --test cli/test/` vert **et** `iakaframe vendor-check --strict` → drift 0,
   `checked == 79`.

> ⚠️ Si le dépôt frère est absent ou hors permission d'écriture → **s'arrêter, rendre compte** ;
> un vendor à moitié fait laisse la garde rouge pour les deux dépôts.

**T8 — Documentation** : ajouter la ligne de `iakaframe-etude-artiste` au tableau de
`library/skills/README.md` (colonne « Se déclenche quand… »). **Ne pas** ouvrir le chantier des
compteurs affichés (« 23 skills » dans `README.md` et `iakaframe-skills.html` alors que le canon en
compte 26) : c'est une **dette préexistante**, à **signaler au cadrage**, pas à corriger ici (règle
MVP, périmètre fermé). Puis `iakaframe update`.

**T9 — Recette réelle (gate humain)** : les scénarios R1–R5 du § 12, joués et restitués.

---

## 12. Critères d'acceptation (observables)

Le lot est **PASS** si **tous** les points sont constatables.

1. **Skill valide.** `library/skills/iakaframe-etude-artiste/SKILL.md` existe, son frontmatter
   satisfait `library/_schema/frontmatter.json` (`id`, `name` requis ; pas de champ inconnu), et sa
   `description` contient **littéralement** les quatre déclencheurs : `apprendre un artiste`,
   `étudie le style de`, `crée à la façon de`, `dans le style de`.
2. **Déployée là où on l'attend.** Après `iakaframe skills deploy --project ~/work/iakaFreeVision`,
   `~/work/iakaFreeVision/.claude/skills/iakaframe-etude-artiste/SKILL.md` **et** les 3 fichiers
   `references/` sont présents ; `iakaframe skills deploy --check` rapporte **drift 0**.
3. **R1 — étude d'un artiste bien documenté.** « apprends le style de Zdzisław Beksiński » produit
   `~/.iaka/corpus/artists/zdzislaw-beksinski.md` contenant : le frontmatter (`id`, `name`,
   `confiance`, `sources_count`, `updated`) **et** les sections `Périodes`, `Motifs récurrents`,
   `Palette`, `Composition & cadrage`, `Lumière`, `Médium & texture`, `Sujets`,
   `Anti-sujets / anti-traits`, `Œuvres de référence` (**≥ 5 lignes**), `Prompt — positif`,
   `Prompt — négatif`, `Reco modèles`, `Sources`, `Lacunes`. La table `## Sources` compte
   **≥ 4 domaines distincts**, dont **≥ 2 institutionnels**, **aucun `wikipedia.org` compté**.
   `wc -c` de la fiche **≤ 8 000**. `artists/INDEX.md` contient la ligne correspondante.
4. **Idempotence.** Relancer la même demande **ne crée aucun second fichier** : même chemin,
   `updated` rafraîchi.
5. **R2 — homonymie.** « apprends le style de Bruegel » **n'écrit aucune fiche** et pose une question
   de désambiguïsation listant **≥ 2 candidats** discriminés par époque et médium.
6. **R3 — artiste obscur** (choisi par l'exécutant, < 4 sources trouvables) : la fiche est **écrite**
   avec `confiance: basse` et une section `## Lacunes` **non vide** ; aucun attribut de palette ou de
   composition n'est renseigné sans œuvre citée en regard.
7. **R4 — restitution.** « crée un portrait à la façon de Beksiński » rend le **bloc du § 7 complet**
   (positif, négatif, checkpoint, LoRA, paramètres, VRAM, sources). Le `checkpoint:` est un **nom de
   fichier présent dans le catalogue réel** (comparaison à `/object_info/CheckpointLoaderSimple`) ;
   les paramètres tiennent dans la bande de sa famille (§ 8) ; si le choix est FLUX, la mention
   « négatif inopérant (CFG 1) » est présente ; si c'est Pony, le préfixe `score_*` **complet** et
   `clip-skip 2` sont présents.
8. **R5 — apprentissage à la volée.** « crée à la façon de <artiste jamais étudié> » déclenche
   l'étude **puis** la restitution **dans le même tour** : la fiche est créée **et** le bloc rendu,
   sans refus ni demande de permission.
9. **Aucune génération déclenchée.** Sur R1–R5 : aucun `POST /prompt`, aucun fichier image ou vidéo
   produit — vérifiable dans la trace d'outils de la session.
10. **Aucun avertissement juridique** (D9). `grep -ri "droit\|copyright\|domaine public\|artiste
    vivant\|licence" library/skills/iakaframe-etude-artiste/ ~/.iaka/corpus/artists/` → **0
    occurrence** ; et aucune mention de ce registre dans les sorties de R1–R5.
11. **Frontière données/skill respectée.** Après R1–R5, **rien** n'a été écrit dans
    `library/skills/iakaframe-etude-artiste/` ni dans sa copie déployée :
    `iakaframe skills deploy --check` reste **drift 0**.
12. **Dérivés réalignés.** `node --test cli/test/` **vert** ; `iakaframe vendor-check --strict` →
    **drift 0** avec `checked == 79` ; `skills-golden/manifest.json` porte `counts.skills == 27` et
    `resolution.loki == ["iakaframe-naonedge", "iakaframe-etude-artiste"]` ; le golden
    `agents-golden/loki.md` porte la ligne `skills: [iakaframe-naonedge, iakaframe-etude-artiste]`.

---

## 13. Risques

| Risque | Mitigation |
|---|---|
| **Hallucination de palette / de composition** (le défaut n°2 du § 1) | Règle « ≥ 5 œuvres nommées + ≥ 1 source visuelle » ; champ `confiance` ; section `## Lacunes` obligatoire ; interdiction écrite de combler par analogie (§ 5, étapes 4 et 7) |
| **Se contenter d'une page Wikipédia** | Wikipédia **non comptée** dans les sources ; critère 3 vérifiable (≥ 4 domaines distincts, ≥ 2 institutionnels) |
| **Corpus hors git** (perte au reformatage machine) | `~/.iaka/` est déjà un actif de la **procédure de reconstruction PC** (cf. `boucle-apprentissage-incrementale.md` Q-1) ; `IAKA_CORPUS_HOME` peut être pointé sur un dossier versionné (différé tracé) |
| **Le catalogue dérive du réel** (modèle ajouté/retiré côté iakabox) | Ordre de résolution D6 + rafraîchissement facultatif par `/object_info` qui **fait foi** et signale l'écart ; Phase 0 le reconstate |
| **Chaîne de goldens + vendor cross-repo** (transverse, facile à laisser à moitié) | T7 ordonnée, commandes exactes, gate explicite si le dépôt frère est absent ; critère 12 chiffré |
| **Fiches qui gonflent en prose** | Plafond dur 8 000 caractères, `wc -c` vérifiable ; consigne « les tokens priment sur la prose » |
| **Reco non exécutable** (LoRA inventé, checkpoint absent) | D7 (« aucun (catalogue vide) » est une réponse valide) + critère 7 qui compare le nom au catalogue réel |
| **Contention GPU 12 Go** au moment où l'utilisateur exécutera le bloc | Hors périmètre (D8) mais **signalé** dans le bloc (« un seul modèle chargé à la fois ») ; traité par `iakaFreeVision/specs/instructions/04-arbitre-gpu-litellm.md` |

---

## 14. Estimation (méthode : estimation obligatoire au jalon dev)

**~0,5 à 0,8 j-homme.** SKILL.md + 3 fichiers `references/` (0,3 j) · rattachement persona + chaîne
de dérivés + vendor cross-repo (0,2 j) · recette réelle R1–R5 et corrections (0,2–0,3 j).
**Complexité faible, risque moyen-bas**, concentré sur **T7** (mécanique mais transverse : un oubli
dans `SKILL_IDS`/`EXPECTED_COPIES` fait rougir `vendor-check` dans les deux dépôts). Ordre de
grandeur révisable, pas un engagement ferme.

---

## 15. Journal de décision

- **2026-07-29** — Cadrage Gandalf du besoin « apprendre un artiste ». **Tranché** : nom
  **`iakaframe-etude-artiste`** (D1) ; skill **atomique**, sans `layer:` (D2) ; portée par la persona
  **Loki** — seul mécanisme de déploiement effectif et seul rôle dont le périmètre couvre l'art (D3) ;
  **persistance des fiches hors du dépôt et hors de la skill**, dans le corpus neutre
  `$IAKA_CORPUS_HOME` (défaut `~/.iaka/corpus/artists/`), **frère** du canon mémoire — imposé par le
  `rm -rf` de `skills-deploy.js` et par le refus de la fragmentation par projet (D4) ; `references/`
  = **données livrées en lecture seule** (D5) ; **catalogue de modèles = donnée résolue au runtime**
  avec rafraîchissement facultatif par `/object_info` (D6) ; **aucun LoRA installé** → la réponse
  honnête est « aucun » + demande d'ajout au catalogue (D7) ; la skill **ne génère rien** (D8) ;
  **aucun avertissement ni restriction d'artiste**, décision du décideur gravée et contrôlée par un
  critère (D9). Faits externes vérifiés le jour même (FLUX/CFG 1 et négatif inopérant, préfixe
  `score_*` + clip-skip 2 de Pony, sampler imposé de DreamShaper Turbo, bande SD 3.5 Medium, primat
  du modèle de base sur le style) — § 3 avec sources. **Cadrage seul, aucun code de production.**

> **Statut : cadré, non démarré.** L'implémentation (Gimli) démarre après validation de Stéphane,
> selon T1..T9 (§ 11), Phase 0 en gate.

# Instruction : Revue Qualité de Version (RQV) — jalon entre versions

> Phase cadrage (🧙 Gandalf). Propriétaires : 🏹 **Legolas** (qualité/tests) + 📖 **Nathalie**
> (qualité doc). Statut : 🟡 **à valider / à planifier**.

## Concept

> **Processus OPTIONNEL** (impact iakaframe) : activable **par projet** selon l'enjeu — tout
> projet n'a pas besoin d'une RQV complète. Proposé à l'onboarding. **Infra hébergée sur iakabox**
> (stack `stack-qualite/`).

Quand une modif (ou une série) **mérite une version mineure**, on produit **avant le bump** un
**document RQV** : une **évaluation complète** du logiciel, on-brand **NaonEdge**, versionnée et
archivée. C'est le **gate qualité de version** (au-dessus du gate de phase).

## Contenu de la RQV

1. **Qualité du code** : bugs, vulnérabilités, code smells, duplication, maintainabilité,
   dette technique, **hotspots** (fichiers les plus modifiés × complexité).
2. **Couverture des tests unitaires** : % global + par module + tendance vs version précédente.
3. **Rapport d'exécution de TOUS les tests** : passés/échoués/ignorés, durée, flaky, par suite.
4. **Couverture des requirements** : **traçabilité** `specs/instructions/<feature>` ↔ tests ↔
   commits (chaque feature cadrée a-t-elle des tests / est-elle livrée ?).
5. **Qualité de la doc** : API docs générées à jour, état des lieux, guides utilisateurs (Nathalie).
6. **KPI CI / DORA** : deployment frequency, lead time, change failure rate, MTTR + taux de
   réussite build/test.
7. **Verdict** : go/no-go pour le bump de version mineure (gate humain : Stéphane).

## Outillage recommandé (références du métier, 2026)

> Self-hosted / open-source d'abord (cohérent iakaframe). Mapping depuis tes anciens repères :

| Besoin | Ancien (toi) | Référence moderne (recommandée) |
|---|---|---|
| **Quality gate / analyse statique** | « zonar » = **SonarQube** | **SonarQube Community** (self-hosted) — gate, smells, sécurité, import couverture. Alt : **CodeScene** (dette/hotspots comportementaux), **Qodana** (JetBrains), **Semgrep** (SAST). |
| **Métriques / « radar »** | radar | couvert par **Sonar** + **CodeScene** (radar de dette/risque) ; deps : **OWASP Dependency-Check** / **Trivy**. |
| **Doc d'API** | **Javadoc** | par langage : **TypeDoc** (TS), **rustdoc** (`cargo doc`), **Sphinx** (Py) ; site : **Docusaurus** / **MkDocs Material**. |
| **Couverture tests** | — | natif : **Vitest v8/istanbul** (TS), **cargo-llvm-cov** (Rust), **pytest-cov** (Py), **JaCoCo** (Java) → agrégé dans **Sonar** ou **Codecov**. |
| **Rapport d'exécution tests** | — | **Allure Report** (riche, multi-langages) à partir du **JUnit XML** ; format émergent **CTRF**. |
| **KPI CI / DORA** | — | **Apache DevLake** (open-source, DORA) + **Grafana** ; ou Sleuth/LinearB (SaaS). |

**Outil de rapport « std » unique** : si on n'en veut qu'un, c'est **SonarQube Community**
(centralise gate + couverture + sécurité + tendance) ; complété d'**Allure** pour le rapport
d'exécution des tests, et **Apache DevLake** pour les KPI DORA. La **RQV** agrège ces sources
dans un document **NaonEdge** versionné.

## Étapes (proposées, à découper)

1. ✅ **Stack DÉPLOYÉE** (2026-06-20) sur **VM4 iakabox** (`192.168.2.13`, stack séparée
   `/opt/iakaframe-qualite/`) : SonarQube `:9002` (UP) + Postgres + Allure `:5051` ; VM4 montée
   à 8 Go, sysctl appliqué. DevLake = phase 2. **Reste** : brancher l'analyse par projet
   (sonar-scanner + couverture).
2. Couverture par langage → import Sonar ; **Allure** pour le rapport d'exécution.
3. **DevLake** (DORA) branché sur Forgejo si supporté (sinon KPI minimaux maison).
4. **Traçabilité requirements** : convention liant `specs/instructions/<feature>` ↔ tests.
5. **Générateur RQV** : assembler Sonar + Allure + couverture + DORA + traçabilité en un
   document **NaonEdge** versionné (`specs/rqv/RQV-vX.Y.Z.html`/`.pdf`), déclenché avant chaque
   bump mineur. Verdict go/no-go = gate humain.

## Hors scope (pour l'instant)

Mise en place complète de l'infra Sonar/DevLake ; gating bloquant automatique ; certif/normes.
On commence par **figer le concept + le stack + le gabarit RQV**.

# stack-qualite — SonarQube + Allure (+ DevLake en phase 2)

Stack qualité iakaframe pour produire la **Revue Qualité de Version (RQV)**
(cf. `specs/instructions/revue-qualite-version.md`). Isolation par projet (réseau/volumes/ports
préfixés `iqual` / `iakaframe-qualite`).

## Ports (hôte)

| Service | URL | Rôle |
|---|---|---|
| SonarQube | `http://<hote>:9001` | quality gate, couverture, sécurité, tendance |
| Allure | `http://<hote>:5051` | rapport d'exécution des tests |

Choisis pour éviter les collisions iakabox (9000 Portainer/ComfyUI/Whisper, 3001 Forgejo,
8188 ComfyUI, 11434 Ollama, 3009 Obot, 3008 AppFlowy…). Ajuster si besoin.

## Prérequis hôte (Linux)

SonarQube embarque Elasticsearch → **obligatoire** :
```
sudo sysctl -w vm.max_map_count=262144
echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-sonarqube.conf
```
RAM : prévoir **~3-4 Go** pour SonarQube seul (DB + ES). Allure est léger.

## Déploiement

```
cp .env.example .env   # renseigner SONAR_DB_PASSWORD
docker compose up -d
# SonarQube met ~1-2 min a demarrer (ES). Login initial admin/admin -> changer.
```

## Brancher un projet (CI)

1. Dans SonarQube : créer le projet + un token.
2. Côté projet : générer la **couverture** (Vitest v8 / cargo-llvm-cov / pytest-cov / JaCoCo) au
   format lcov/cobertura, puis lancer **sonar-scanner** (image `sonarsource/sonar-scanner-cli`)
   avec `sonar.host.url=http://<hote>:9001` + token + chemin de couverture.
3. Tests → produire du **JUnit XML** → envoyer à Allure (`/allure-results`) → rapport sur :5051.

## DevLake (KPI DORA) — phase 2

Apache DevLake se déploie via **son propre compose** (mysql + devlake + config-ui + grafana) :
`https://github.com/apache/incubator-devlake` (ports config-ui/grafana à décaler).
⚠️ **Caveat Forgejo** : DevLake cible nativement GitHub/GitLab/Bitbucket/Azure/Jira ; **Forgejo
/ Gitea n'est pas un connecteur natif**. Options : KPI DORA minimaux calculés maison depuis git,
ou attendre/contribuer un plugin. À trancher en phase 2.

## RQV (génération)

La RQV agrège **SonarQube** (API : mesures du quality gate) + **Allure** (résultats) +
couverture + (DORA si DevLake) en un document **NaonEdge** versionné
(`specs/rqv/RQV-vX.Y.Z.html`/`.pdf`), produit avant chaque bump mineur. Générateur à outiller.

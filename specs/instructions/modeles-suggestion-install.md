# Instruction : Suggestion & installation de modèles (Ollama / ComfyUI)

> Phase cadrage (🧙 Gandalf). Statut : 🟡 **à valider / à planifier** (pour plus tard).
> Étend la détection de services (`iakaframe-services.ps1`) vers la **gestion des modèles**.

## Besoin (décideur)

1. Quand un **modèle IA serait plus adapté** à la tâche, **🛡️ Aragorn** le **suggère** et propose
   de l'**installer** sur **Ollama** (LLM) ou **ComfyUI** (image), au lieu de subir un modèle
   inadapté.
2. À l'**onboarding**, **🎭 Loki** **vérifie** que les **modèles image/design** nécessaires pour
   bien travailler sont **présents** ; sinon il **propose de les installer** (lui-même ou la team).

## Décisions / pistes

- **Inventaire des modèles** (extension de la détection de services) :
  - **Ollama** : lister via `GET /api/tags` (déjà sondé) → modèles présents.
  - **ComfyUI** : lister les checkpoints/loras via l'API (`/object_info`, listes par loader) ou le
    système de fichiers `models/` ; **ComfyUI n'a pas d'API d'install standard** → passer par
    **ComfyUI-Manager** ou un téléchargement + placement dans le bon dossier.
- **Suggestion (Aragorn)** : à partir de la nature de la tâche (raisonnement, code, vision,
  image…), recommander un modèle adapté **déjà présent** ; sinon proposer une **install** (avec
  taille/coût/temps estimés) — **gate humain** avant tout pull.
- **Install** :
  - Ollama : `ollama pull <model>` (ou API `POST /api/pull`). Réversible, simple.
  - ComfyUI : download du checkpoint/LoRA → dossier `models/...` (via Manager si dispo). Plus lourd.
- **Loki à l'onboarding** : un **set de modèles design/image de référence** (à définir : un
  modèle SDXL/Flux + quelques LoRA on-brand) ; Loki compare au présent et **propose** d'installer
  le manquant (gate humain). Réutilise l'inventaire ComfyUI.
- **Gate humain systématique** avant toute install (taille disque, bande passante, temps).

## Étapes (proposées, à découper)

1. Étendre l'inventaire : modèles **Ollama** (fait via `/api/tags`) + **ComfyUI** (à brancher).
2. **Aragorn** : table « type de tâche → modèle conseillé » + logique de suggestion + proposition
   d'install (gate).
3. **Loki onboarding** : set de référence design/image + check + proposition d'install.
4. Actions d'install : `ollama pull` (simple) ; ComfyUI via Manager/download (à cadrer).

## Hors scope (pour l'instant)

Install automatique sans validation ; gestion fine du disque/quotas ; fine-tuning ; catalogue
de modèles exhaustif. On commence par **détecter + suggérer**, l'install reste **sur feu vert**.

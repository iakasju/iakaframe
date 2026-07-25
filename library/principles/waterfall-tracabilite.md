---
id: waterfall-tracabilite
label: "Traçabilité de bout en bout"
policy: "Chaque exigence est identifiée et suivie à travers toutes les phases : exigence → élément de conception → module de code → cas de test. Toute chaîne doit être complète et vérifiable ; un maillon manquant est un défaut de traçabilité."
trigger: "à chaque phase produisant un livrable dérivé d'un livrable amont"
---
# Traçabilité de bout en bout

Principe fondateur du modèle en cascade (traçabilité des exigences, systems engineering). Le
narratif de référence est le cycle de vie en cascade.

**Politique.** Chaque **exigence** est **identifiée** et **suivie** à travers toutes les phases :
exigence (SRS) → élément de conception (SDD) → module de code → cas de test. Toute chaîne doit être
**complète et vérifiable** ; un **maillon manquant** (une exigence non conçue, un code sans exigence,
une exigence non testée) est un **défaut de traçabilité** qui bloque le gate concerné. La matrice de
traçabilité est le fil qui relie l'intention initiale à la preuve finale.

**Déclencheur.** à chaque phase produisant un livrable dérivé d'un livrable amont.

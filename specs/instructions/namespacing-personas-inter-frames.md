# Instruction — Namespacing des personas inter-frames → REMPLACÉE

> 🔵 Gandalf, 2026-07-26. **Cette instruction est remplacée.**

Le cadrage initial (Finding 4) proposait une **garde `name-collision`** au lint pour rendre
l'homonymie de personas inter-frames visible. Le **décideur a sécurisé l'architecture le 2026-07-26**
(4 réponses) : l'homonymie inter-frames est **légitime et voulue** (deux frames peuvent caster le même
personnage dans des rôles différents, sous **ids distincts** — `ohno` natif / `leanstartup-ohno`
emprunteur — le `name:` restant « Ohno »). Une garde qui pousse à qualifier **irait contre le modèle**.

Finding 4 n'est donc **pas** un défaut mécanique à outiller, mais une **constitution non écrite** à
graver — **doc pur, zéro code, zéro renommage, zéro rework**. L'enforcement existant (résolution des
références par `frame lint` + `id == nom de fichier`) **suffit**.

➡️ **Instruction active : [`constitution-modele-de-frame.md`](./constitution-modele-de-frame.md)**
(les 5 invariants C-1..C-5, la seule correction de texte — § 3.3 du rangement — et la recette de
non-mouvement).

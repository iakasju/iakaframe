---
id: kanban-wip-limit
label: Limite de WIP respectée
kind: wip-limit
hook: "flux:tirage d'un item (discipline visuelle sur le tableau, Flow Manager garant)"
policy: "Chaque étape a une limite de travail en cours (WIP) explicite ; on ne tire un nouvel item que si la capacité est libre sous la limite. Quand la limite est atteinte, on NE COMMENCE RIEN de neuf — on finit ou on débloque d'abord. Le Flow Manager en est le garant."
---
# Limite de WIP respectée

Garde-fou **central** de Kanban (*Kanban Method*, David J. Anderson). Le narratif de référence est
cette littérature. C'est **le cœur** du frame : sans limite de WIP, il n'y a pas de système *pull*,
et Kanban n'est plus qu'un tableau décoratif.

**Politique.** Chaque étape porte une **limite de WIP explicite** ; on ne **tire** un nouvel item
**que si** la capacité est **libre** sous la limite. Quand la limite est **atteinte**, on **ne
commence rien de neuf** — on **finit** ou on **débloque** d'abord (*stop starting, start
finishing*). Le **Flow Manager** en est le garant, avec toute l'équipe.

> **Enforcement** — comme les garde-fous du frame Scrum (et à la différence des garde-fous
> iakaframe adossés à des *hooks* runtime), la limite de WIP est une **discipline visuelle et
> collective** : elle vit **sur le tableau** (colonnes coiffées d'un nombre) et dans la culture
> d'équipe. Un outil de tableau peut la **matérialiser** (bloquer visuellement un tirage au-delà de
> la limite, colorer le dépassement), mais la comptabilité reste **humaine** — on peut toujours
> transgresser ; le système rend la transgression **visible et coûteuse**, il ne la rend pas
> **impossible**. C'est le contraste structurel entre un frame de flux (WIP visualisé) et un frame
> à hooks bloquants.

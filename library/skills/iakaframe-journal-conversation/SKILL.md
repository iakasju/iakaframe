---
id: iakaframe-journal-conversation
name: iakaframe-journal-conversation
description: Tracer un message de conversation dans une main courante centralisée — publier un échange utilisateur↔agent ou agent↔agent, le persister et le rendre consultable. Utiliser cette skill quand un agent doit "logguer la conversation", "tracer cet échange", "alimenter la main courante", "journaliser un tour de dialogue". Échec propre non bloquant si l'infra est absente. Capacité agnostique du produit : le transport et le stockage concrets sont portés par le sous-skill sélectionné à l'install.
layer: capacity
subskills: [iakaframe-log-conversation]
---

# iakaframe — Journal de conversation (capacité)

Tu agis ici comme la **capacité de main courante** de la méthode iakaframe : n'importe quel
agent peut **tracer un échange** (utilisateur↔agent, agent↔agent) dans une main courante
centralisée. C'est **ce qu'on veut faire** — pas **avec quel transport ni quel stockage**.
Le *comment* concret (protocole de publication, base de persistance, outil) est **délégué au
sous-skill sélectionné à l'install**, jamais gravé ici.

> **Agnosticisme, règle cardinale.** Cette skill ne nomme **aucun** protocole concret,
> aucun serveur, aucune base, aucun endpoint, aucune IP, aucune variable. Elle décrit la
> capacité et ses garde-fous ; le concret descend dans la couche produit.

## Ce que porte la capacité

- **Publier** un message de conversation dans une **main courante centralisée**.
- **Persister** cet échange pour qu'il survive à la session.
- **Rendre consultable** l'historique des échanges (pour audit, suivi, reprise).
- **Modèle logique du message** : horodatage, royaume et nom de l'agent, identifiant de
  conversation, rôle (utilisateur / agent), contenu, métadonnées éventuelles.

## Délégation au concret

Le **quoi** est ici ; le **comment** est dans le sous-skill produit :

- Le **produit** (feuille de la chaîne, sélectionné à l'install) porte la **mécanique
  concrète** : protocole de publication, base de persistance, conventions de nommage,
  identifiants, outil de ligne de commande.

Autrement dit : pour *tracer un échange*, cette capacité **renvoie au produit installé** ;
le transport et le stockage réels sont ceux **présents chez l'utilisateur** (présence =
sélection).

## Garde-fous (principes, sans nommer de produit)

- **Échec propre non bloquant** : si l'infra est absente, la configuration incomplète ou le
  service injoignable → **message net + code de sortie non nul**, **sans jamais bloquer** le
  travail de l'agent. Tracer est un service transverse, pas un point de rupture.
- **Secret jamais commité** : les identifiants d'accès sont fournis par **variables
  d'environnement** (jamais en clair, jamais dans un fichier suivi). Le concret vit dans le
  produit.
- **Non intrusif** : tracer un échange ne modifie pas le flux métier de l'agent.

## Place dans le cycle

Capacité **transverse** : appelable par n'importe quel agent, éventuellement automatisée par
un hook de cycle (à chaque tour de dialogue). Les appelants réfèrent **cette capacité**, pas
un transport particulier ; le produit effectif est celui **installé chez l'utilisateur**. La
même capacité sert tous les environnements sans réécriture.

<!--
ANCRE DE PARITE core<->CLI. Ce golden reproduit EXACTEMENT la sortie de
`iakaframe assemble iakaframe iakaframe-8 --write` (serializeKit, cli/src/lib/library.js),
calquee byte-a-byte sur @iakaframe/core :
  packages/core/__tests__/fixtures/kit.iakaframe-claude.md (serializeKitMd).
Le CORPS n'est plus un stub : il est THREADE depuis kits/iakaframe-claude.md (le corps authored
traverse serializeKit, parite exacte avec serializeKitMd(k, body) du coeur). Ce golden = en-tete
de provenance + contenu VERBATIM de kits/iakaframe-claude.md (frontmatter + corps Manifeste).
Toute divergence = regression de parite. NE PAS editer a la main : REGENERER depuis le canon.
Le test parity-kit.test.js retire ce bloc d'en-tete (tout ce qui precede la 1re ligne `---`)
puis compare le reste byte-a-byte a la sortie du CLI (corps du canon threade).
-->
---
id: iakaframe-claude
methodId: iakaframe
teamId: iakaframe-8
bindingId: iakaframe-claude-default
node: claude
emits: [".claude/agents/*", ".claude/skills/*", ".claude/hooks/*", "CLAUDE.md"]
---
# Kit iakaframe-claude

Manifeste du livrable généré pour le runner **claude**. L'arborescence runner rangée dans
`kits/iakaframe-claude/` est le gabarit de déploiement (relié method+team+binding).
La **génération automatique** depuis un binding est [différé] : au MVP, le kit est rangé tel quel.

Runner de référence au MVP (un seul binding défaut). Émet subagents, skills, hooks d'identité/périmètre et le contrat CLAUDE.md.

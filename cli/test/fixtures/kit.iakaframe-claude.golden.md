<!--
ANCRE DE PARITE core<->CLI. Ce golden reproduit EXACTEMENT la sortie de
`iakaframe assemble iakaframe iakaframe-8 --write` (serializeKit, cli/src/lib/library.js),
calquee byte-a-byte sur @iakaframe/core :
  packages/core/__tests__/fixtures/kit.iakaframe-claude.md (serializeKitMd).
Toute divergence = regression de parite. NE PAS editer a la main.
Le test parity-kit.test.js retire ce bloc d'en-tete (tout ce qui precede la 1re ligne `---`)
puis compare le reste byte-a-byte a la sortie du CLI.
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

#!/usr/bin/env bash
# Wrapper POSIX mince : delegue tout a install.mjs (Node >= 20).
exec node "$(dirname "$0")/install.mjs" "$@"

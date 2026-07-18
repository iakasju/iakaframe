#!/usr/bin/env python3
"""Tests du Filter d'identite OpenWebUI (Lot A2).

Deux garanties :
  1) PARITE DE REGLE : le verdict Python `verdict_identity` COINCIDE avec le verdict Node
     `guard-core.verdictIdentity` sur un jeu de cas partages (le meme `turn` en entree donne
     le meme {skip/startOk/stopOk}). Comme le Filter ne peut PAS importer guard-core (.mjs),
     ce test compare les deux implementations en shellant vers Node quand il est disponible.
     Si Node est absent (env sans runtime JS), la comparaison est SKIPPEE et seuls les verdicts
     Python attendus sont verifies (honnete : la parite exacte se reprouve des que Node est la).
  2) COMPORTEMENT ADAPTATEUR : inlet re-injecte le rappel ; outlet laisse passer une reponse
     conforme et LEVE une Exception si un badge manque ; fail-open sur body illisible.

Lancer :  python3 -m unittest kits.iakaframe-openwebui.functions.test_identity_filter
     ou :  cd kits/iakaframe-openwebui/functions && python3 -m unittest test_identity_filter
"""
import json
import os
import shutil
import subprocess
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import iakaframe_identity_filter as mod  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
# guard-core.mjs canonique (kit-claude) — source de verite de la regle Node.
GUARD_CORE = os.path.abspath(
    os.path.join(
        HERE, "..", "..", "iakaframe-claude", "global", "hooks", "guard-core.mjs"
    )
)

# --- Jeu de cas partages (turn ANTI-CHRONO : turn[0] = dernier message) ------
# Les textes conformes/incomplets reprennent ceux des fixtures guard partagees
# (cli/test/fixtures/guard/*), pour prouver la parite de REGLE sur les memes entrees.
OPEN = "🟡 [PORTEFEUILLE][Odin] — j'ouvre et je fais le travail."
CONFORME = OPEN + "\n\nVoici le detail du travail effectue.\n\nC'est termine [PORTEFEUILLE][Odin] 🟡"
MISSING_CLOSE = OPEN + "\n\nVoici le detail du travail effectue.\n\nVoila, c'est fini sans badge de cloture."
MISSING_OPEN = "Voici mon travail, j'attaque directement sans badge d'ouverture.\n\nDetail.\n\nC'est termine [PORTEFEUILLE][Odin] 🟡"

SHARED_TURNS = [
    ("vide", []),
    ("conforme", [CONFORME]),
    ("missing-close", [MISSING_CLOSE]),
    ("missing-open", [MISSING_OPEN]),
    ("one-liner-ouverture", ["🟡 [PORTEFEUILLE][Odin] — un seul badge"]),
    ("ouverture-message-anterieur", [
        "suite du travail\n\nfini [PORTEFEUILLE][Odin] 🟡",
        "🟡 [PORTEFEUILLE][Odin] — j'ouvre le tour.",
    ]),
    ("bleu-royaume", ["🔵 [ROYAUME][Legolas] verdict rendu 🔵"]),
]


def _node_verdict(turn):
    """Verdict Node de guard-core.verdictIdentity pour un `turn` donne (None si Node absent)."""
    node = shutil.which("node")
    if not node:
        return None
    script = (
        "import { verdictIdentity } from " + json.dumps(GUARD_CORE) + ";"
        "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{"
        "const turn=JSON.parse(d);process.stdout.write(JSON.stringify(verdictIdentity(turn)));});"
    )
    proc = subprocess.run(
        [node, "--input-type=module", "-e", script],
        input=json.dumps(turn), capture_output=True, text=True,
    )
    if proc.returncode != 0:
        raise AssertionError("node guard-core a echoue : " + proc.stderr)
    return json.loads(proc.stdout)


class ParityRuleTest(unittest.TestCase):
    """Le verdict Python doit coincider avec le verdict Node guard-core, cas par cas."""

    def test_python_vs_node_guard_core(self):
        node_ok = shutil.which("node") is not None and os.path.exists(GUARD_CORE)
        if not node_ok:
            self.skipTest("node absent ou guard-core introuvable : parite exacte reprouvee avec Node")
        for name, turn in SHARED_TURNS:
            with self.subTest(cas=name):
                py = mod.verdict_identity(turn)
                nd = _node_verdict(turn)
                self.assertEqual(py, nd, "verdict Python != verdict Node pour le cas " + name)


class VerdictExpectedTest(unittest.TestCase):
    """Verdicts Python attendus (verifies meme sans Node)."""

    def test_vide_skip(self):
        self.assertEqual(mod.verdict_identity([]), {"skip": True})
        self.assertEqual(mod.verdict_identity(None), {"skip": True})

    def test_conforme(self):
        self.assertEqual(
            mod.verdict_identity([CONFORME]),
            {"skip": False, "startOk": True, "stopOk": True},
        )

    def test_missing_close(self):
        self.assertEqual(
            mod.verdict_identity([MISSING_CLOSE]),
            {"skip": False, "startOk": True, "stopOk": False},
        )

    def test_missing_open(self):
        self.assertEqual(
            mod.verdict_identity([MISSING_OPEN]),
            {"skip": False, "startOk": False, "stopOk": True},
        )

    def test_one_liner_unique_badge(self):
        self.assertEqual(
            mod.verdict_identity(["🟡 [PORTEFEUILLE][Odin] — un seul badge"]),
            {"skip": False, "startOk": True, "stopOk": True},
        )


class OutletBehaviorTest(unittest.TestCase):
    def setUp(self):
        self.f = mod.Filter()

    def _body(self, assistant_text):
        return {"messages": [
            {"role": "user", "content": "fais le boulot"},
            {"role": "assistant", "content": assistant_text},
        ]}

    def test_reponse_conforme_passe_sans_alteration(self):
        body = self._body(CONFORME)
        out = self.f.outlet(dict(body))
        self.assertEqual(out["messages"][-1]["content"], CONFORME)

    def test_reponse_sans_cloture_leve_exception(self):
        with self.assertRaises(Exception) as ctx:
            self.f.outlet(self._body(MISSING_CLOSE))
        self.assertIn("cloture", str(ctx.exception))
        self.assertIn("iakaframe (OpenWebUI)", str(ctx.exception))

    def test_reponse_sans_ouverture_leve_exception(self):
        with self.assertRaises(Exception) as ctx:
            self.f.outlet(self._body(MISSING_OPEN))
        self.assertIn("ouverture", str(ctx.exception))

    def test_mode_audit_ne_leve_pas(self):
        self.f.valves.block_on_violation = False
        out = self.f.outlet(self._body(MISSING_CLOSE))  # ne doit PAS lever
        self.assertEqual(out["messages"][-1]["content"], MISSING_CLOSE)

    def test_fail_open_body_illisible(self):
        # body sans messages exploitables -> skip -> allow (aucune exception).
        self.assertEqual(self.f.outlet({"foo": "bar"}), {"foo": "bar"})
        self.assertEqual(self.f.outlet(None), None)

    def test_content_liste_de_blocs(self):
        body = {"messages": [
            {"role": "assistant", "content": [{"type": "text", "text": CONFORME}]},
        ]}
        out = self.f.outlet(body)  # ne doit pas lever
        self.assertIs(out, body)


class InletBehaviorTest(unittest.TestCase):
    def setUp(self):
        self.f = mod.Filter()

    def test_injecte_rappel(self):
        body = {"messages": [{"role": "user", "content": "salut"}]}
        out = self.f.inlet(body)
        self.assertEqual(out["messages"][0]["role"], "system")
        self.assertIn("identite iakaframe", out["messages"][0]["content"])

    def test_inject_desactivable(self):
        self.f.valves.inject_reminder = False
        body = {"messages": [{"role": "user", "content": "salut"}]}
        out = self.f.inlet(body)
        self.assertEqual(out["messages"][0]["role"], "user")

    def test_fail_open_inlet(self):
        self.assertEqual(self.f.inlet(None), None)


if __name__ == "__main__":
    unittest.main()

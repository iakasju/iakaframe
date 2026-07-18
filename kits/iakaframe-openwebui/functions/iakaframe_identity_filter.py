"""
title: iakaframe Identity Guard
author: iakaframe
author_url: http://192.168.2.11:3001/sjupin/iakaframe
version: 0.1.0
required_open_webui_version: 0.5.17
description: Force le rituel d'identite iakaframe (badge d'ouverture + de cloture) sur chaque reponse d'un persona iakaframe.
"""
# ---------------------------------------------------------------------------
# iakaframe_identity_filter.py — ADAPTATEUR OPENWEBUI de la garde d'identite iakaframe
# (Lot A2 de specs/instructions/parite-enforcement-multirunner.md).
#
# POURQUOI un port Python et pas un import de guard-core.mjs :
#   guard-core est du Node (.mjs). Une Filter Function OpenWebUI est une classe PYTHON
#   executee DANS le backend OWUI (pas de process Node, pas d'import cross-langage). La REGLE
#   d'identite (position de la pastille = sens : ouverture AVANT le bloc, cloture APRES) est donc
#   RE-IMPLEMENTEE ici FIDELEMENT a guard-core.verdictIdentity. La parite de REGLE (pas de
#   partage de code) est verrouillee par test_identity_filter.py, qui compare ce verdict Python
#   au verdict Node de guard-core sur un jeu de cas partages.
#
# CE QUE CET ADAPTATEUR FAIT (parite honnete — cf. README) :
#   - inlet()  : re-injecte un RAPPEL d'identite (equivalent identity-remind Claude) avant le modele ;
#   - outlet() : verifie que la reponse complete OUVRE et CLOT par un badge [ROYAUME][Agent] ;
#                badge manquant -> leve une Exception (OWUI refuse/annonce l'echec a l'utilisateur).
#
# LIMITES ASSUMEES (OpenWebUI n'est PAS un repo, pas un dispatch multi-agents) :
#   - maille = UNE reponse (turn = [dernier message assistant]) ;
#   - PERIMETRE et DELEGATION = N/A sur OWUI (pas d'ecriture repo, pas de sous-agent natif) ;
#   - FAIL-OPEN : toute erreur interne / config absente / body illisible => on laisse passer
#     (un garde ne doit jamais figer une conversation).
#
# NE PAS transformer la regle ici sans repercuter guard-core (et inversement) : le test de parite
# casse si les deux divergent.
# ---------------------------------------------------------------------------

import re
from typing import Optional

try:  # OWUI fournit pydantic ; on reste tolerant hors runtime OWUI (tests unittest).
    from pydantic import BaseModel, Field
except Exception:  # pragma: no cover - fallback minimal pour les tests hors OWUI
    class BaseModel:  # type: ignore
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

    def Field(default=None, **kwargs):  # type: ignore
        return default


# ---------------------------------------------------------------------------
# REGLE D'IDENTITE — port fidele de guard-core.mjs (verdictIdentity + reOpen/reClose/linesOf).
# Pastilles = memes code points que PASTILLES cote guard-core.
#   0x1f7e1 🟡  0x1f535 🔵  0x1f534 🔴  0x1f7e2 🟢  0x1f7e3 🟣  0x1f7e0 🟠
# ---------------------------------------------------------------------------

PASTILLES = [chr(cp) for cp in (0x1F7E1, 0x1F535, 0x1F534, 0x1F7E2, 0x1F7E3, 0x1F7E0)]
_PAST_ALT = "|".join(re.escape(p) for p in PASTILLES)
_BRACKET = r"\[[^\]]+\]\s*`?\s*\[[^\]]+\]"  # [ROYAUME][Agent]
# reOpen : pastille AVANT le bloc, ancree en debut de ligne.
RE_OPEN = re.compile(r"^(?:" + _PAST_ALT + r")\s*`?\s*" + _BRACKET)
# reClose : pastille APRES le bloc, suivie d'un blanc ou de la fin.
RE_CLOSE = re.compile(_BRACKET + r"\s*`?\s*(?:" + _PAST_ALT + r")(?:\s|$)")


def lines_of(txt: str):
    """Equivalent de linesOf : rstrip chaque ligne (\\s+$), garde les non-vides (apres trim)."""
    out = []
    for ln in str(txt).split("\n"):
        r = re.sub(r"\s+$", "", ln)
        if r.strip() != "":
            out.append(r)
    return out


def verdict_identity(turn):
    """Port fidele de guard-core.verdictIdentity.

    `turn` = messages-texte assistant du tour, ANTI-CHRONO (turn[0] = dernier message).
    Retourne :
      {"skip": True}                                  -> rien a juger (=> allow)
      {"skip": False, "startOk": bool, "stopOk": bool} -> verdict sur le tour courant
    """
    if not isinstance(turn, (list, tuple)) or len(turn) == 0:
        return {"skip": True}

    def opens_with(txt):
        ne = lines_of(txt)
        return len(ne) > 0 and RE_OPEN.search(ne[0].strip()) is not None

    start_ok = any(opens_with(t) for t in turn)

    non_empty = lines_of(turn[0])
    if len(non_empty) == 1:
        single = (
            RE_OPEN.search(non_empty[0].strip()) is not None
            or RE_CLOSE.search(non_empty[0].strip()) is not None
        )
        stop_ok = single
        # Tour reduit a un unique one-liner : on tolere ouverture OU cloture pour les deux.
        if len(turn) == 1:
            start_ok = single
    else:
        stop_ok = False
        idxs = [len(non_empty) - 1]
        if len(non_empty) >= 3:
            idxs.append(len(non_empty) - 2)
        for idx in idxs:
            if idx == 0:
                continue
            if RE_CLOSE.search(non_empty[idx].strip()) is not None:
                stop_ok = True
                break

    return {"skip": False, "startOk": start_ok, "stopOk": stop_ok}


# ---------------------------------------------------------------------------
# ADAPTATEUR OWUI : lecture du body -> reconstruction du `turn` canonique -> verdict.
# ---------------------------------------------------------------------------

_REMINDER = (
    "Rappel identite iakaframe : ouvre ta reponse par un badge (pastille AVANT le bloc, "
    "ex. 🟡 [ROYAUME][Agent] — ...) et clos-la par un badge (pastille APRES le bloc, "
    "ex. ... [ROYAUME][Agent] 🟡). La POSITION de la pastille porte le sens."
)


def _text_of(content):
    """Extrait le texte d'un content OWUI (string, ou liste de blocs {type,text})."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for c in content:
            if isinstance(c, dict) and isinstance(c.get("text"), str):
                parts.append(c["text"])
            elif isinstance(c, str):
                parts.append(c)
        return "\n".join(parts)
    if isinstance(content, dict) and isinstance(content.get("text"), str):
        return content["text"]
    return ""


def _last_assistant_text(body):
    """Reconstruit le `turn` OWUI = [texte du dernier message assistant]. [] si introuvable."""
    if not isinstance(body, dict):
        return []
    messages = body.get("messages")
    if not isinstance(messages, list):
        return []
    for m in reversed(messages):
        if isinstance(m, dict) and str(m.get("role", "")).lower() == "assistant":
            txt = _text_of(m.get("content")).strip()
            return [txt] if txt else []
    return []


class Filter:
    class Valves(BaseModel):
        # Refuser (lever une Exception) une reponse sans badge. False => audit silencieux (allow).
        block_on_violation: bool = Field(
            default=True,
            description="Lever une Exception si la reponse n'ouvre/ne clot pas par un badge.",
        )
        # Re-injecter un rappel d'identite avant le modele (equivalent identity-remind).
        inject_reminder: bool = Field(
            default=True,
            description="Injecter un rappel d'identite (system) avant l'appel modele.",
        )
        # Priorite du filtre (ordonnancement OWUI ; laisse a 0 par defaut).
        priority: int = Field(default=0, description="Priorite d'application du filtre.")

    def __init__(self):
        # id / name : reglages OWUI (poses a l'import admin/API) ; laisses ici a titre indicatif.
        self.id = "iakaframe_identity_guard"
        self.name = "iakaframe Identity Guard"
        self.valves = self.Valves()

    def inlet(self, body: dict, __user__: Optional[dict] = None) -> dict:
        """Avant le modele : re-injecte un rappel d'identite. FAIL-OPEN sur toute erreur."""
        try:
            if not getattr(self.valves, "inject_reminder", True):
                return body
            if not isinstance(body, dict) or not isinstance(body.get("messages"), list):
                return body
            body["messages"] = [
                {"role": "system", "content": _REMINDER}
            ] + body["messages"]
        except Exception:
            return body
        return body

    def outlet(self, body: dict, __user__: Optional[dict] = None) -> dict:
        """Apres la reponse complete : verifie les badges d'ouverture/cloture.

        Badge manquant + block_on_violation -> Exception (OWUI refuse/annonce). Sinon allow.
        FAIL-OPEN : toute erreur interne / config absente => on laisse passer sans juger.
        """
        # 1) Extraction + verdict : tout echec ICI est du fail-open (on ne fige pas la conversation).
        try:
            turn = _last_assistant_text(body)
            res = verdict_identity(turn)
        except Exception:
            return body
        # 2) Decision : allow si rien a juger, conforme, ou mode audit.
        if res.get("skip") or (res.get("startOk") and res.get("stopOk")):
            return body
        if not getattr(self.valves, "block_on_violation", True):
            return body  # mode audit : on n'annule pas la reponse
        # 3) Refus explicite (hors du try : cette Exception DOIT remonter a OWUI).
        miss = []
        if not res.get("startOk"):
            miss.append(
                "ouverture (pastille AVANT le bloc en PREMIERE ligne, ex: 🟡 [ROYAUME][Agent])"
            )
        if not res.get("stopOk"):
            miss.append(
                "cloture (pastille APRES le bloc en derniere ligne, ex: [ROYAUME][Agent] 🟡)"
            )
        raise Exception(
            "Garde d'identite iakaframe (OpenWebUI) : badge manquant -> "
            + " + ".join(miss)
            + ". Convention : ouverture = pastille AVANT, cloture = pastille APRES."
        )

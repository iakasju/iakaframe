# identity-guard.ps1 — Garde d'identité iakaframe (méthode : double badge ouverture+clôture)
# Câblé sur les hooks Stop et SubagentStop.
# Vérifie que la dernière réponse de l'agent OUVRE et CLÔT par un badge.
# Convention markup (depuis 2026-06-23) — la POSITION de la pastille porte le sens :
#   ouverture (balise ouvrante) = pastille AVANT le bloc  ->  🟡 [PORTEFEUILLE][Odin]
#   clôture   (balise fermante) = pastille APRES le bloc  ->  [PORTEFEUILLE][Odin] 🟡
#   (backticks/espaces tolérés autour des crochets)
# Si un badge manque -> exit 2 (refus) : l'agent doit corriger avant de rendre la main.
#
# Sécurité : FAIL-OPEN. Toute erreur interne (parse, lecture, etc.) => exit 0 (laisse passer),
#            jamais bloquer pour un bug du garde. Respecte stop_hook_active (anti-boucle :
#            ne bloque qu'une fois, puis laisse passer pour ne jamais figer une session).

$ErrorActionPreference = 'Stop'

function Out-Allow { exit 0 }
function Out-Block($msg) {
    [Console]::Error.WriteLine($msg)
    exit 2
}

try {
    $raw = [Console]::In.ReadToEnd()
    if (-not $raw) { Out-Allow }
    $payload = $raw | ConvertFrom-Json

    # Anti-boucle : si on est déjà dans une relance de hook Stop, on laisse passer.
    if ($payload.stop_hook_active) { Out-Allow }

    $tp = $payload.transcript_path
    if (-not $tp -or -not (Test-Path -LiteralPath $tp)) { Out-Allow }

    $lines = @(Get-Content -LiteralPath $tp -Encoding UTF8 -ErrorAction Stop)
    if (-not $lines) { Out-Allow }

    # Dernier message assistant (texte) dans le transcript JSONL.
    $text = $null
    for ($i = $lines.Count - 1; $i -ge 0; $i--) {
        $line = ([string]$lines[$i]).Trim()
        if (-not $line) { continue }
        try { $obj = $line | ConvertFrom-Json } catch { continue }
        if ($obj.type -eq 'assistant' -and $obj.message -and $obj.message.content) {
            $parts = @()
            foreach ($c in $obj.message.content) {
                if ($c.type -eq 'text' -and $c.text) { $parts += [string]$c.text }
            }
            if ($parts.Count -gt 0) { $text = ($parts -join "`n").Trim(); break }
        }
    }
    if (-not $text) { Out-Allow }   # rien d'exploitable -> on ne bloque pas

    # Pastilles autorisées, construites par code point (pas d'emoji littéral dans le fichier).
    $pastilles = (0x1F7E1, 0x1F535, 0x1F534, 0x1F7E2, 0x1F7E3, 0x1F7E0) |
        ForEach-Object { [char]::ConvertFromUtf32($_) }
    $bracket = '\[[^\]]+\]\s*`?\s*\[[^\]]+\]'   # [ROYAUME][Agent], backtick interne toléré
    $pastAlt = ($pastilles | ForEach-Object { [regex]::Escape($_) }) -join '|'

    # Orientation = sémantique (comme un markup) :
    #   ouvrant  -> pastille AVANT le bloc crochets   (ouverture)
    #   fermant  -> pastille APRES le bloc crochets   (clôture)
    function Test-BadgeOpen([string]$s) {
        if (-not $s) { return $false }
        return ($s.Trim() -match ('^(?:' + $pastAlt + ')\s*`?\s*' + $bracket))
    }
    function Test-BadgeClose([string]$s) {
        if (-not $s) { return $false }
        return ($s.Trim() -match ($bracket + '\s*`?\s*(?:' + $pastAlt + ')(?:\s|$)'))
    }

    $nonEmpty = $text -split "`n" | ForEach-Object { $_.TrimEnd() } | Where-Object { $_.Trim() -ne '' }
    if ($nonEmpty.Count -eq 0) { Out-Allow }

    $startOk = Test-BadgeOpen $nonEmpty[0]

    if ($nonEmpty.Count -eq 1) {
        # Réponse d'une seule ligne : ouverture et clôture confondues, une orientation suffit.
        $single = $startOk -or (Test-BadgeClose $nonEmpty[0])
        $startOk = $single
        $stopOk  = $single
    }
    else {
        # Clôture = badge FERMANT (pastille APRES) dans l'une des 2 dernières lignes, hors ouverture (index 0).
        $stopOk = $false
        $idxs = @($nonEmpty.Count - 1)
        if ($nonEmpty.Count -ge 3) { $idxs += ($nonEmpty.Count - 2) }
        foreach ($idx in $idxs) {
            if ($idx -eq 0) { continue }
            if (Test-BadgeClose $nonEmpty[$idx]) { $stopOk = $true; break }
        }
    }

    if ($startOk -and $stopOk) { Out-Allow }

    $miss = @()
    if (-not $startOk) { $miss += 'ouverture (pastille AVANT le bloc en PREMIERE ligne, ex: 🟡 [ROYAUME][Agent])' }
    if (-not $stopOk)  { $miss += 'cloture (pastille APRES le bloc en derniere ligne, ex: [ROYAUME][Agent] 🟡)' }
    Out-Block ("Garde d'identite iakaframe : badge manquant -> " + ($miss -join ' + ') + ". " +
        "Convention markup : ouverture = pastille AVANT (balise ouvrante), cloture = pastille APRES (balise fermante).")
}
catch {
    Out-Allow   # fail-open : un bug du garde ne doit jamais bloquer une session
}

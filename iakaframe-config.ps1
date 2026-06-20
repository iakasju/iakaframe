# ============================================================================
#  iakaframe - conf projet : ecrit/maj <projet>/iakaframe.json
#  Definit le RUNNER (bouton "Go" du dashboard) et la CIBLE d'incarnation.
#  Pense pour etre appele par l'onboarding (questions + diagnostic) ou seul.
#    runner : ps (Claude Code/PowerShell) | codex (Codex CLI) | iakaide (app iakaIDE)
#    target : claude | codex | ollama
#  Usage : powershell -File iakaframe-config.ps1 -Path C:\work\<projet> [-Runner codex] [-Target codex]
# ============================================================================
param(
  [string]$Path = (Get-Location).Path,
  [ValidateSet('ps','codex','iakaide','')] [string]$Runner = '',
  [ValidateSet('claude','codex','ollama','')] [string]$Target = ''
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Path -PathType Container)) { throw "Dossier introuvable : $Path" }

# --- diagnostic de disponibilite des runners ---
$hasCodex   = [bool](Get-Command codex -ErrorAction SilentlyContinue)
$hasClaude  = [bool](Get-Command claude -ErrorAction SilentlyContinue)
$iakaideExe = Get-ChildItem (Join-Path 'C:\work\iakaide' 'src-tauri\target\release') -Filter *.exe -ErrorAction SilentlyContinue |
              Where-Object { $_.Name -notmatch 'build|deps' } | Select-Object -First 1
$hasIakaide = [bool]$iakaideExe

Write-Host "Diagnostic runners : claude=$hasClaude  codex=$hasCodex  iakaIDE=$hasIakaide"

# --- deduction du runner si non fourni (cible -> runner, selon dispo) ---
if (-not $Runner) {
  switch ($Target) {
    'codex'  { $Runner = if ($hasCodex) { 'codex' } else { 'ps' } }
    default  { $Runner = 'ps' }   # claude/ollama -> Claude Code en terminal
  }
}
if ($Runner -eq 'codex'   -and -not $hasCodex)  { Write-Warning "Codex CLI absent : 'Go' basculera sur Claude (ps) au runtime." }
if ($Runner -eq 'iakaide' -and -not $hasIakaide){ Write-Warning "iakaIDE non build : 'Go' basculera sur Claude (ps) au runtime." }
if (-not $Target) { $Target = if ($Runner -eq 'codex') { 'codex' } else { 'claude' } }

# --- ecrire/fusionner iakaframe.json (ne pas ecraser des cles inconnues) ---
$cfgPath = Join-Path $Path 'iakaframe.json'
$cfg = [ordered]@{}
if (Test-Path $cfgPath) {
  try { (Get-Content $cfgPath -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $cfg[$_.Name] = $_.Value } } catch {}
}
$cfg['runner'] = $Runner
$cfg['target'] = $Target
if (-not $cfg.Contains('note')) {
  $cfg['note'] = "Conf iakaframe du projet (runner du bouton Go, cible d'incarnation). runner: ps | codex | iakaide."
}
($cfg | ConvertTo-Json -Depth 5) | Set-Content -Path $cfgPath -Encoding UTF8
Write-Host "OK - $cfgPath  (runner=$Runner, target=$Target)"

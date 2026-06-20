<#
.SYNOPSIS
  iakaframe - etat des lieux des ALTERNATIVES d'agents (modeles locaux Ollama par agent).

.DESCRIPTION
  Table "quel modele pour quel agent" + confrontation aux modeles reellement installes sur
  Ollama. Utile pour la cible "ollama" (ni Claude ni ChatGPT) ET pour proposer un modele local
  plus performant en cible claude/codex. Lançable a la demande par Odin.
  PowerShell 5.1, ASCII pur.

.PARAMETER OllamaUrl
  Base URL Ollama (defaut http://192.168.2.12:11434).

.PARAMETER Json
  Chemin ou ecrire le rapport JSON (optionnel).

.EXAMPLE
  powershell C:\work\iakaframe\iakaframe-alternatives.ps1
#>
[CmdletBinding()]
param(
  [string]$OllamaUrl = "http://192.168.2.12:11434",
  [string]$Json,
  [int]$TimeoutSec = 4
)

$ErrorActionPreference = "Stop"

# Table de reference : modele local conseille par agent (+ alternatives, par famille).
# Familles candidates : gpt-oss, mistral, deepseek, kimi, qwen, llama, llava.
$map = @(
  @{ Agent = "Odin";     Role = "portefeuille/raisonnement"; Reco = "qwen3";          Alt = @("gpt-oss", "mistral") },
  @{ Agent = "Aragorn";  Role = "coordination";              Reco = "qwen3";          Alt = @("mistral", "gpt-oss") },
  @{ Agent = "Gandalf";  Role = "cadrage/raisonnement";      Reco = "deepseek-r1";    Alt = @("qwen3", "gpt-oss", "kimi") },
  @{ Agent = "Gimli";    Role = "dev/code";                  Reco = "qwen2.5-coder";  Alt = @("deepseek-coder", "codestral") },
  @{ Agent = "Legolas";  Role = "qualite/tests";             Reco = "qwen2.5-coder";  Alt = @("deepseek-coder", "codestral") },
  @{ Agent = "Helm";     Role = "prod/ops";                  Reco = "llama3.1";       Alt = @("qwen3", "mistral") },
  @{ Agent = "Loki";     Role = "design/vision";             Reco = "qwen2.5-vl";     Alt = @("llava") },
  @{ Agent = "Nathalie"; Role = "guides/redaction";          Reco = "mistral";        Alt = @("qwen3", "llama3.1") }
)

# Modeles installes sur Ollama.
$installed = @()
$ollamaUp = $false
try {
  $resp = Invoke-WebRequest -Uri ($OllamaUrl.TrimEnd('/') + "/api/tags") -TimeoutSec $TimeoutSec -UseBasicParsing
  $installed = ($resp.Content | ConvertFrom-Json).models | ForEach-Object { $_.name }
  $ollamaUp = $true
} catch {
  $installed = @()
}

function Find-Installed([string]$family) {
  # vrai si un modele installe contient la famille (avant le ':')
  foreach ($m in $installed) {
    if ($m.ToLower().Contains($family.ToLower())) { return $m }
  }
  return $null
}

$rows = @()
foreach ($e in $map) {
  $hit = Find-Installed $e.Reco
  $via = $null
  if (-not $hit) {
    foreach ($a in $e.Alt) { $hit = Find-Installed $a; if ($hit) { $via = $a; break } }
  }
  $status = if ($hit) { if ($via) { "alt ($via)" } else { "dispo" } } else { "a installer" }
  $rows += [PSCustomObject]@{
    agent       = $e.Agent
    role        = $e.Role
    recommande  = $e.Reco
    alternatives = ($e.Alt -join ", ")
    installe    = if ($hit) { $hit } else { "" }
    statut      = $status
  }
}

Write-Host ""
if ($ollamaUp) {
  Write-Host ("=== iakaframe - alternatives agents (Ollama: {0}, {1} modeles) ===" -f $OllamaUrl, $installed.Count) -ForegroundColor Cyan
} else {
  Write-Host ("=== iakaframe - alternatives agents (Ollama INJOIGNABLE: {0}) ===" -f $OllamaUrl) -ForegroundColor Yellow
}
foreach ($r in $rows) {
  $color = switch ($r.statut) { "dispo" { "Green" } "a installer" { "DarkGray" } default { "Yellow" } }
  Write-Host ("  {0,-9} {1,-26} reco: {2,-15} [{3}] {4}" -f $r.agent, $r.role, $r.recommande, $r.statut, $r.installe) -ForegroundColor $color
}
Write-Host ""
$todo = $rows | Where-Object { $_.statut -eq "a installer" }
if ($todo) {
  Write-Host "A installer (gate humain) :" -ForegroundColor Cyan
  foreach ($t in $todo) { Write-Host ("  ollama pull {0}   # {1}" -f $t.recommande, $t.agent) -ForegroundColor DarkGray }
  Write-Host ""
}

if ($Json) {
  $dir = Split-Path -Parent $Json
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $payload = [ordered]@{ generated = (Get-Date -Format "yyyy-MM-dd HH:mm"); ollama = $OllamaUrl; ollama_up = $ollamaUp; agents = $rows }
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Json, ($payload | ConvertTo-Json -Depth 5), $enc)
  Write-Host ("rapport JSON -> {0}" -f $Json) -ForegroundColor Green
}

$rows

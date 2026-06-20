<#
.SYNOPSIS
  Amorce la methode iakaframe dans un projet : copie le kit de demarrage (cible Claude ou Codex).

.DESCRIPTION
  Copie le kit adapte a la cible vers le repertoire :
    - claude : kit/  (CLAUDE.md + .claude/ + specs/)
    - codex  : kit-codex/ (AGENTS.md + specs/)
  Estampille la version iakaframe deployee dans un marqueur .iakaframe.
  Ne JAMAIS ecraser un fichier existant (sauf -Force).

.PARAMETER Path
  Repertoire cible. Defaut : repertoire courant.

.PARAMETER Target
  Incarnation a deployer : claude (defaut) ou codex.

.PARAMETER Force
  Autorise l'ecrasement des fichiers existants.

.EXAMPLE
  powershell C:\work\iakaframe\iakaframe-init.ps1
  powershell C:\work\iakaframe\iakaframe-init.ps1 -Path C:\mon-projet -Target codex
#>
param(
  [string]$Path = (Get-Location).Path,
  [ValidateSet("claude", "codex", "ollama")][string]$Target = "claude",
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$KitName = switch ($Target) { "codex" { "kit-codex" } "ollama" { "kit-ollama" } default { "kit" } }
$ContractFile = if ($Target -eq "claude") { "CLAUDE.md" } else { "AGENTS.md" }
$Kit = Join-Path $ScriptDir $KitName

# Version iakaframe (lue depuis l'etat des lieux de l'installation).
$Version = "inconnue"
$etat = Join-Path $ScriptDir "specs\etat-des-lieux.md"
if (Test-Path $etat) {
  $m = Select-String -Path $etat -Pattern '^\|\s*Version\s*\|\s*(.+?)\s*\|' | Select-Object -First 1
  if ($m) { $Version = $m.Matches[0].Groups[1].Value }
}

if (-not (Test-Path $Kit)) { throw "Kit introuvable : $Kit" }
if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null }

Write-Host ("iakaframe {0} -> deploiement du kit [{1}] dans : {2}" -f $Version, $Target, $Path) -ForegroundColor Cyan

$existing = Join-Path $Path $ContractFile
if ((Test-Path $existing) -and -not $Force) {
  Write-Host ("  ! {0} existe deja : ce projet semble deja initialise." -f $ContractFile) -ForegroundColor Yellow
  Write-Host "    Relancer avec -Force pour ecraser, ou copier manuellement les fichiers manquants." -ForegroundColor Yellow
  return
}

$files = Get-ChildItem -Path $Kit -Recurse -File
$copied = 0
$skipped = 0
foreach ($f in $files) {
  $rel = $f.FullName.Substring($Kit.Length).TrimStart('\')
  # Le README du kit est sa propre doc, pas du scaffolding projet.
  if ($rel -ieq "README.md") { continue }
  $dest = Join-Path $Path $rel
  $destDir = Split-Path $dest -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

  if ((Test-Path $dest) -and -not $Force) {
    Write-Host ("  = {0} (existe, ignore)" -f $rel) -ForegroundColor DarkGray
    $skipped++
  } else {
    Copy-Item -Path $f.FullName -Destination $dest -Force
    Write-Host ("  + {0}" -f $rel) -ForegroundColor Green
    $copied++
  }
}

# Marqueur de version / cible.
$marker = Join-Path $Path ".iakaframe"
$stamp = @(
  "iakaframe=$Version",
  "target=$Target",
  "contract=$ContractFile",
  ("installed=" + (Get-Date -Format "yyyy-MM-dd HH:mm"))
) -join "`r`n"
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($marker, $stamp + "`r`n", $enc)
Write-Host ("  + .iakaframe (version {0}, cible {1})" -f $Version, $Target) -ForegroundColor Green

Write-Host ""
Write-Host ("Termine : {0} copie(s), {1} ignore(s)." -f $copied, $skipped) -ForegroundColor Cyan
Write-Host "Prochaines etapes :" -ForegroundColor Cyan
Write-Host ("  1. Remplir {0} (stack, commandes, backlog)" -f $ContractFile)
Write-Host "  2. Remplir specs/PROJET.md (vision, decisions)"
Write-Host "  3. Pour chaque feature : specs/instructions/<feature>.md AVANT de coder"

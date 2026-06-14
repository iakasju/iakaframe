<#
.SYNOPSIS
  Amorce la methode iakaframe dans un projet : copie le kit de demarrage.

.DESCRIPTION
  Copie CLAUDE.md, .claude/settings.local.json et specs/ (PROJET.md +
  instructions/_TEMPLATE.md) depuis C:\iakaframe\kit vers le repertoire cible.
  Ne JAMAIS ecraser un fichier existant (sauf -Force).

.PARAMETER Path
  Repertoire cible. Defaut : repertoire courant.

.PARAMETER Force
  Autorise l'ecrasement des fichiers existants.

.EXAMPLE
  pwsh C:\iakaframe\iakaframe-init.ps1
  pwsh C:\iakaframe\iakaframe-init.ps1 -Path C:\mon-nouveau-projet
#>
param(
  [string]$Path = (Get-Location).Path,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$Kit = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "kit"

if (-not (Test-Path $Kit)) { throw "Kit introuvable : $Kit" }
if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null }

Write-Host "iakaframe -> deploiement du kit dans : $Path" -ForegroundColor Cyan

$existingClaude = Join-Path $Path "CLAUDE.md"
if ((Test-Path $existingClaude) -and -not $Force) {
  Write-Host "  ! CLAUDE.md existe deja : ce projet semble deja initialise." -ForegroundColor Yellow
  Write-Host "    Relancer avec -Force pour ecraser, ou copier manuellement les fichiers manquants." -ForegroundColor Yellow
  return
}

$files = Get-ChildItem -Path $Kit -Recurse -File
$copied = 0
$skipped = 0
foreach ($f in $files) {
  $rel = $f.FullName.Substring($Kit.Length).TrimStart('\')
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

Write-Host ""
Write-Host ("Termine : {0} copie(s), {1} ignore(s)." -f $copied, $skipped) -ForegroundColor Cyan
Write-Host "Prochaines etapes :" -ForegroundColor Cyan
Write-Host "  1. Remplir CLAUDE.md (stack, commandes, backlog)"
Write-Host "  2. Remplir specs/PROJET.md (vision, decisions)"
Write-Host "  3. Pour chaque feature : specs/instructions/<feature>.md AVANT de coder"

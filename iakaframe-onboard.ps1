<#
.SYNOPSIS
  Lance la methode iakaframe dans un projet EXISTANT (ou neuf) : structure + Forgejo + docs.

.DESCRIPTION
  Orchestrateur. Pour un repertoire de projet deja existant, met en place toute la
  methode en une fois :
    1. Deploie la structure iakaframe (kit)         -> iakaframe-init.ps1
    2. Cree le depot Forgejo et branche le remote     -> iakaframe-forgejo.ps1
    3. Premier commit
    4. Genere l'etat des lieux initial (MD + HTML)    -> iakaframe-snapshot.ps1
    5. Push initial

  Ne JAMAIS ecraser les fichiers existants (sauf -Force sur la structure).
  Token Forgejo lu depuis FORGEJO_TOKEN.

.PARAMETER Path        Racine du projet. Defaut : courant.
.PARAMETER Target      Incarnation : claude (defaut, CLAUDE.md) ou codex (AGENTS.md).
.PARAMETER Repo        Nom du depot Forgejo. Defaut : nom du dossier.
.PARAMETER Description Description ASCII du depot.
.PARAMETER Version     Version initiale pour le premier snapshot. Defaut : v0.1.0.
.PARAMETER SkipForgejo Ne pas creer de depot ni de remote (structure + docs seulement).
.PARAMETER NoPush      Tout faire sauf le push final.
.PARAMETER Force       Autorise l'ecrasement de la structure existante.

.EXAMPLE
  $env:FORGEJO_TOKEN="xxxx"; pwsh C:\iakaframe\iakaframe-onboard.ps1 -Path C:\mon-projet -Description "mon projet"
#>
param(
  [string]$Path = (Get-Location).Path,
  [ValidateSet("claude", "codex")][string]$Target = "claude",
  [string]$Repo = "",
  [string]$Description = "",
  [string]$Version = "v0.1.0",
  [switch]$SkipForgejo,
  [switch]$NoPush,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $dir "iakaframe-common.ps1")
if ([string]::IsNullOrWhiteSpace($Repo)) { $Repo = Split-Path -Leaf $Path }
if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null }

# Routage : si le depot existe deja sur Forgejo ET qu'on a un git local -> c'est un update.
$gitExists = Test-Path (Join-Path $Path ".git")
$repoExists = if ($SkipForgejo) { $null } else { Test-ForgejoRepo -Repo $Repo }
if ($repoExists -eq $true -and $gitExists) {
  Write-Host "Le depot '$Repo' existe deja sur Forgejo (et git local present) -> bascule en 'update'." -ForegroundColor Yellow
  & (Join-Path $dir "iakaframe-update.ps1") -Path $Path
  return
}

Write-Host "==== iakaframe : onboarding de $Path ====" -ForegroundColor Cyan

# 1. Structure
Write-Host ("`n[1/5] Structure de la methode (cible: {0})" -f $Target) -ForegroundColor Cyan
$ContractFile = if ($Target -eq "codex") { "AGENTS.md" } else { "CLAUDE.md" }
$initArgs = @{ Path = $Path; Target = $Target }
if ($Force) { $initArgs.Force = $true }
& (Join-Path $dir "iakaframe-init.ps1") @initArgs

# 2/3/5. Git + Forgejo
if (-not $SkipForgejo) {
  Write-Host "`n[2/5] Depot Forgejo + remote" -ForegroundColor Cyan
  & (Join-Path $dir "iakaframe-forgejo.ps1") -Repo $Repo -Description $Description -Path $Path
} else {
  Write-Host "`n[2/5] Forgejo ignore (-SkipForgejo)" -ForegroundColor DarkGray
  if (-not (Test-Path (Join-Path $Path ".git"))) {
    Push-Location $Path; git init | Out-Null; git symbolic-ref HEAD refs/heads/main 2>$null; Pop-Location
    Write-Host "  + git init local (branche main)." -ForegroundColor Green
  }
}

Write-Host "`n[3/5] Premier commit" -ForegroundColor Cyan
Push-Location $Path
try {
  if (-not (Test-Path (Join-Path $Path ".gitignore"))) {
    "node_modules/`n.env`n.env.local`ndist/`nbuild/`ntarget/" | Set-Content -Path (Join-Path $Path ".gitignore") -Encoding UTF8
  }
  git add -A
  $hasHead = $false; git rev-parse --verify HEAD 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { $hasHead = $true }
  if (git status --porcelain) {
    git commit -m "chore: init iakaframe (structure + methode de travail)" | Out-Null
    Write-Host "  + commit cree." -ForegroundColor Green
  } else {
    Write-Host "  = rien a committer." -ForegroundColor DarkGray
  }
} finally { Pop-Location }

# 4. Snapshot initial (docs MD + HTML)
Write-Host "`n[4/5] Etat des lieux initial (MD + HTML)" -ForegroundColor Cyan
& (Join-Path $dir "iakaframe-snapshot.ps1") -Reason version -Version $Version -Note "onboarding initial" -Path $Path

# Commit des docs generees
Push-Location $Path
try {
  git add -A
  if (git status --porcelain) { git commit -m "docs: etat des lieux initial (iakaframe-snapshot)" | Out-Null; Write-Host "  + docs commitees." -ForegroundColor Green }
} finally { Pop-Location }

# 5. Push
Write-Host "`n[5/5] Push" -ForegroundColor Cyan
if ($NoPush -or $SkipForgejo) {
  Write-Host "  push ignore." -ForegroundColor DarkGray
} else {
  Push-Location $Path
  try { git push -u origin main; Write-Host "  + pousse sur origin/main." -ForegroundColor Green }
  catch { Write-Host ("  ! push echoue : {0}" -f $_.Exception.Message) -ForegroundColor Yellow }
  finally { Pop-Location }
}

Write-Host "`n==== Termine ====" -ForegroundColor Cyan
Write-Host "Prochaines etapes :" -ForegroundColor Cyan
Write-Host ("  1. Remplir {0} (stack, commandes, backlog) et specs/PROJET.md (vision)." -f $ContractFile)
Write-Host "  2. Pour chaque feature : specs/instructions/<feature>.md AVANT de coder."
Write-Host "  3. Relancer iakaframe-snapshot.ps1 a chaque version et a chaque pause/reprise."

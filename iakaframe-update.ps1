<#
.SYNOPSIS
  Commande "update iakaframe" : regenere l'etat des lieux + commit global (+ push).

.DESCRIPTION
  Point de checkpoint d'un projet sous methode iakaframe. En une commande :
    1. Regenere specs/etat-des-lieux.md + .html (iakaframe-snapshot.ps1).
    2. git add -A  (commit GLOBAL : tout l'arbre).
    3. Commit (seulement s'il y a des changements).
    4. Push sur origin (sauf -NoPush).

  A utiliser comme checkpoint regulier, et systematiquement a chaque changement de
  version et a chaque pause / preparation de reprise.

.PARAMETER Path     Racine du projet. Defaut : courant.
.PARAMETER Reason   version | pause | reprise | manual. Defaut : manual.
.PARAMETER Version  Etiquette de version (ex: v0.3.0). Defaut : dernier tag git.
.PARAMETER Note     Courte note ASCII (ce qu'on vient de finir / l'etat).
.PARAMETER Message  Message de commit. Defaut : auto a partir de Reason/Version.
.PARAMETER NoPush   Ne pas pousser.

.EXAMPLE
  pwsh C:\iakaframe\iakaframe-update.ps1
  pwsh C:\iakaframe\iakaframe-update.ps1 -Reason version -Version v0.3.0 -Note "feature X livree"
#>
param(
  [string]$Path = (Get-Location).Path,
  [ValidateSet("version","pause","reprise","manual")]
  [string]$Reason = "manual",
  [string]$Version = "",
  [string]$Note = "",
  [string]$Message = "",
  [string]$Repo = "",
  [switch]$NoPush
)

$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $dir "iakaframe-common.ps1")
if ([string]::IsNullOrWhiteSpace($Repo)) { $Repo = Split-Path -Leaf $Path }

# Routage : si le depot n'existe pas sur Forgejo, ou pas de git local -> c'est un init.
$gitExists = Test-Path (Join-Path $Path ".git")
$repoExists = Test-ForgejoRepo -Repo $Repo
if ($repoExists -eq $false -or -not $gitExists) {
  $why = if (-not $gitExists) { "pas de git local" } else { "absent de Forgejo" }
  Write-Host "Le depot '$Repo' $why -> bascule en 'init' (iakaframe-onboard.ps1)." -ForegroundColor Yellow
  & (Join-Path $dir "iakaframe-onboard.ps1") -Path $Path -Repo $Repo
  return
}

Write-Host "==== update iakaframe : $Path ====" -ForegroundColor Cyan

# 1. Etat des lieux
Write-Host "`n[1/3] Etat des lieux ($Reason)" -ForegroundColor Cyan
$snapArgs = @{ Reason = $Reason; Path = $Path }
if ($Version) { $snapArgs.Version = $Version }
if ($Note)    { $snapArgs.Note = $Note }
& (Join-Path $dir "iakaframe-snapshot.ps1") @snapArgs

# 2/3. Commit global + push
Push-Location $Path
try {
  git add -A
  $changes = git status --porcelain
  if (-not $changes) {
    Write-Host "`n[2/3] Rien a committer (arbre propre)." -ForegroundColor DarkGray
  } else {
    if ([string]::IsNullOrWhiteSpace($Message)) {
      $v = if ($Version) { " $Version" } else { "" }
      $Message = "chore(iakaframe): update etat des lieux + commit global ($Reason$v)"
    }
    git commit -m $Message | Out-Null
    Write-Host "`n[2/3] Commit global cree : $Message" -ForegroundColor Green
  }

  if ($NoPush) {
    Write-Host "[3/3] Push ignore (-NoPush)." -ForegroundColor DarkGray
  } elseif (-not ((git remote) -contains "origin")) {
    Write-Host "[3/3] Pas de remote 'origin' : push ignore." -ForegroundColor DarkGray
  } elseif ($changes) {
    $env:FORGEJO_TOKEN = [Environment]::GetEnvironmentVariable("FORGEJO_TOKEN","User")
    $branch = (git rev-parse --abbrev-ref HEAD).Trim()
    git push origin $branch
    if ($LASTEXITCODE -eq 0) {
      Write-Host "[3/3] Pousse sur origin/$branch." -ForegroundColor Green
    } else {
      Write-Host "[3/3] ECHEC du push sur origin/$branch (code $LASTEXITCODE). Le commit local est conserve ; relancer 'git push origin $branch' quand le remote sera joignable." -ForegroundColor Red
    }
  } else {
    Write-Host "[3/3] Rien de nouveau a pousser." -ForegroundColor DarkGray
  }
} finally {
  Pop-Location
}

Write-Host "`n==== update termine ====" -ForegroundColor Cyan

<#
.SYNOPSIS
  Cree un depot Forgejo (iakabox) et branche le remote git local dessus.

.DESCRIPTION
  Cree le depot via l'API Forgejo (POST /api/v1/user/repos) puis configure
  'origin' avec le token integre dans l'URL (pattern iakabox). Le token est lu
  depuis la variable d'environnement FORGEJO_TOKEN (jamais en dur, jamais commite).

  Forgejo iakabox : http://192.168.2.11:3001 , compte sjupin , auth HTTP+token.
  SSH inutilisable (port 22 = sshd systeme). Description API en ASCII uniquement.

.PARAMETER Repo
  Nom du depot. Defaut : nom du dossier courant.

.PARAMETER Description
  Description ASCII (les caracteres non-ASCII font echouer l'API en 422).

.PARAMETER Private
  Depot prive. Defaut : $true.

.PARAMETER Path
  Repertoire du depot git local. Defaut : courant.

.PARAMETER User
  Compte Forgejo proprietaire. Defaut : sjupin.

.PARAMETER ForgejoUrl
  Base URL Forgejo. Defaut : http://192.168.2.11:3001

.EXAMPLE
  $env:FORGEJO_TOKEN = "xxxx"; pwsh .\iakaframe-forgejo.ps1 -Description "veille immo"
#>
param(
  [string]$Repo = (Split-Path -Leaf (Get-Location).Path),
  [string]$Description = "",
  [bool]$Private = $true,
  [string]$Path = (Get-Location).Path,
  [string]$User = "sjupin",
  [string]$ForgejoUrl = "http://192.168.2.11:3001"
)

$ErrorActionPreference = "Stop"

$token = $env:FORGEJO_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) {
  Write-Host "ERREUR: variable FORGEJO_TOKEN absente." -ForegroundColor Red
  Write-Host "  Forgejo -> Parametres -> Applications -> generer un token" -ForegroundColor Yellow
  Write-Host "  Scopes: write:repository (push) + write:user (creer un depot)." -ForegroundColor Yellow
  Write-Host '  Puis: $env:FORGEJO_TOKEN = "le_token"' -ForegroundColor Yellow
  exit 1
}

# Description ASCII only (sinon HTTP 422 invalid UTF-8)
if ($Description -match '[^\x00-\x7F]') {
  Write-Host "ATTENTION: description non-ASCII detectee -> nettoyage (l'API refuse l'UTF-8)." -ForegroundColor Yellow
  $Description = ($Description -replace '[^\x00-\x7F]', ' ').Trim()
}

Write-Host ("Forgejo: creation du depot {0}/{1} (prive={2})" -f $User, $Repo, $Private) -ForegroundColor Cyan

$body = @{ name = $Repo; private = $Private; auto_init = $false; description = $Description } | ConvertTo-Json -Compress
$headers = @{ Authorization = "token $token"; "Content-Type" = "application/json" }
$api = "$ForgejoUrl/api/v1/user/repos"

try {
  Invoke-RestMethod -Method Post -Uri $api -Headers $headers -Body $body | Out-Null
  Write-Host "  + depot cree." -ForegroundColor Green
} catch {
  $code = $null
  if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  if ($code -eq 409) {
    Write-Host "  = depot deja existant (409) -> on continue." -ForegroundColor DarkGray
  } else {
    Write-Host ("  ! echec API ({0}) : {1}" -f $code, $_.Exception.Message) -ForegroundColor Red
    throw
  }
}

# Configure le remote local avec token integre (pattern iakabox)
$base = $ForgejoUrl -replace '^https?://', ''
$remoteUrl = "http://${User}:${token}@${base}/${User}/${Repo}.git"

Push-Location $Path
try {
  if (-not (Test-Path (Join-Path $Path ".git"))) {
    git init | Out-Null
    git symbolic-ref HEAD refs/heads/main 2>$null
    Write-Host "  + git init (branche main)." -ForegroundColor Green
  }
  $hasOrigin = (git remote) -contains "origin"
  if ($hasOrigin) { git remote set-url origin $remoteUrl } else { git remote add origin $remoteUrl }
  Write-Host ("  + remote 'origin' -> {0}/{1}/{2}.git (token masque)" -f $ForgejoUrl, $User, $Repo) -ForegroundColor Green
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Pret. Le token est dans .git/config local (non commite)." -ForegroundColor Cyan
Write-Host "  git add -A; git commit -m 'chore: init'; git push -u origin main" -ForegroundColor Cyan

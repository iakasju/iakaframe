<#
.SYNOPSIS
  iakaframe - detection des services utiles (git/Forgejo, Ollama, ComfyUI).

.DESCRIPTION
  Sonde une liste d'hotes candidats pour chaque service, renvoie un rapport lisible
  et (option) un services.json consommable par l'onboarding. Agnostique de l'agent IA.
  PowerShell 5.1, ASCII pur (pas de pwsh requis).

.PARAMETER Hosts
  Hotes candidats a sonder (defaut : iakabox + localhost).

.PARAMETER Json
  Chemin d'un fichier JSON ou ecrire le rapport (optionnel).

.PARAMETER TimeoutSec
  Timeout par sonde (defaut 3).

.EXAMPLE
  powershell C:\work\iakaframe\iakaframe-services.ps1
  powershell C:\work\iakaframe\iakaframe-services.ps1 -Json C:\work\mon-projet\specs\services.json
#>
[CmdletBinding()]
param(
  [string[]]$Hosts = @("192.168.2.11", "192.168.2.12", "localhost", "127.0.0.1"),
  [string]$Json,
  [int]$TimeoutSec = 3
)

$ErrorActionPreference = "Stop"

function Test-Port {
  param([string]$ComputerHost, [int]$Port, [int]$TimeoutMs = 1500)
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $iar = $client.BeginConnect($ComputerHost, $Port, $null, $null)
    if ($iar.AsyncWaitHandle.WaitOne($TimeoutMs)) {
      $client.EndConnect($iar); return $true
    }
    return $false
  } catch { return $false } finally { $client.Close() }
}

function Get-Http {
  param([string]$Url, [int]$Sec)
  try {
    return Invoke-WebRequest -Uri $Url -TimeoutSec $Sec -UseBasicParsing
  } catch { return $null }
}

# Definition des services : nom, port, chemin de sonde HTTP, fonction de detail.
$services = @(
  @{ Name = "git (Forgejo)"; Port = 3001; Path = "/api/v1/version";
     Detail = { param($r) try { "v" + ($r.Content | ConvertFrom-Json).version } catch { "" } } },
  @{ Name = "Ollama"; Port = 11434; Path = "/api/tags";
     Detail = { param($r) try { $m = ($r.Content | ConvertFrom-Json).models; "$($m.Count) modeles" } catch { "" } } },
  @{ Name = "ComfyUI"; Port = 8188; Path = "/system_stats";
     Detail = { param($r) "OK" } }
)

$timeoutMs = [Math]::Max(800, $TimeoutSec * 1000)
$results = @()

foreach ($svc in $services) {
  $found = $null
  foreach ($h in $Hosts) {
    if (-not (Test-Port -ComputerHost $h -Port $svc.Port -TimeoutMs $timeoutMs)) { continue }
    $url = "http://{0}:{1}{2}" -f $h, $svc.Port, $svc.Path
    $resp = Get-Http -Url $url -Sec $TimeoutSec
    $detail = ""
    if ($resp) { $detail = & $svc.Detail $resp }
    $found = [ordered]@{
      service   = $svc.Name
      available = $true
      host      = $h
      port      = $svc.Port
      url       = "http://{0}:{1}" -f $h, $svc.Port
      detail    = $detail
    }
    break
  }
  if (-not $found) {
    $found = [ordered]@{ service = $svc.Name; available = $false; host = ""; port = $svc.Port; url = ""; detail = "" }
  }
  $results += [PSCustomObject]$found
}

# Rapport lisible
Write-Host ""
Write-Host "=== iakaframe - services detectes ===" -ForegroundColor Cyan
foreach ($r in $results) {
  $mark = if ($r.available) { "[OK]" } else { "[--]" }
  $color = if ($r.available) { "Green" } else { "DarkGray" }
  $where = if ($r.available) { "$($r.url)  $($r.detail)" } else { "introuvable (port $($r.port))" }
  Write-Host ("  {0} {1,-14} {2}" -f $mark, $r.service, $where) -ForegroundColor $color
}
Write-Host ""

if ($Json) {
  $dir = Split-Path -Parent $Json
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $payload = [ordered]@{
    generated = (Get-Date -Format "yyyy-MM-dd HH:mm")
    services  = $results
  }
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Json, ($payload | ConvertTo-Json -Depth 5), $enc)
  Write-Host "services.json ecrit -> $Json" -ForegroundColor Green
}

# Renvoie les resultats (utilisable par l'onboard)
$results

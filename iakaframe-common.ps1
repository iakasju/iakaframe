<#
  iakaframe-common.ps1 - fonctions partagees (a dot-sourcer).
  . (Join-Path $PSScriptRoot "iakaframe-common.ps1")
#>

function Get-ForgejoToken {
  $t = $env:FORGEJO_TOKEN
  if ([string]::IsNullOrWhiteSpace($t)) { $t = [Environment]::GetEnvironmentVariable("FORGEJO_TOKEN","User") }
  return $t
}

# Retourne $true (existe), $false (n'existe pas / 404), ou $null (inconnu : pas de token, reseau...)
function Test-ForgejoRepo {
  param(
    [Parameter(Mandatory)][string]$Repo,
    [string]$User = "sjupin",
    [string]$ForgejoUrl = "http://192.168.2.11:3001"
  )
  $t = Get-ForgejoToken
  if ([string]::IsNullOrWhiteSpace($t)) { return $null }
  try {
    Invoke-RestMethod -Method Get -Uri "$ForgejoUrl/api/v1/repos/$User/$Repo" `
      -Headers @{ Authorization = "token $t" } -ErrorAction Stop | Out-Null
    return $true
  } catch {
    $code = $null
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    if ($code -eq 404) { return $false }
    return $null
  }
}

<#
.SYNOPSIS
  Gere l'equipe d'agents iakaframe : lister, creer, affecter a un projet, deployer une
  full team. Modele "image / conteneur" : les definitions (ce repo) sont la source unique
  et mutualisee ; chaque projet recoit SA copie scopee (etancheite).

.DESCRIPTION
  Source canonique (cette installation iakaframe) :
    - agents/<agent>.md   : definitions de subagents Claude Code (la "full team").
    - skills/iakaframe-*  : skills-roles chargees par les agents.
    - design-*/           : catalogue de chartes (connu de Loki).

  Cible par defaut : le projet courant (-Project), dans <projet>/.claude/.
  Avec -Global : l'installation utilisateur (~/.claude) - definitions mutualisees.

.PARAMETER Action
  list | create | affect | fullteam | status. Defaut : list.

.PARAMETER Agent
  Nom de l'agent (pour create / affect). Ex : gimli.

.PARAMETER Project
  Racine du projet cible. Defaut : repertoire courant.

.PARAMETER Global
  Cible ~/.claude (mutualise) au lieu du projet.

.PARAMETER Force
  Ecrase une definition deja presente dans la cible.

.EXAMPLE
  pwsh .\iakaframe-agents.ps1 -Action list
  pwsh .\iakaframe-agents.ps1 -Action fullteam -Project C:\work\monprojet
  pwsh .\iakaframe-agents.ps1 -Action affect -Agent gimli -Project C:\work\monprojet
  pwsh .\iakaframe-agents.ps1 -Action create -Agent boromir
#>
param(
  [ValidateSet("list","create","affect","fullteam","status")]
  [string]$Action = "list",
  [string]$Agent = "",
  [string]$Project = (Get-Location).Path,
  [switch]$Global,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$root      = Split-Path -Parent $MyInvocation.MyCommand.Path
$agentsDir = Join-Path $root "agents"
$skillsDir = Join-Path $root "skills"

# Mapping agent -> skill-role (vide = porte par CLAUDE.md, ex. gimli).
$skillOf = @{
  aragorn  = "iakaframe-aragorn"
  gandalf  = "iakaframe-cadrage"
  gimli    = ""
  legolas  = "iakaframe-qualite"
  helm     = "iakaframe-deploiement"
  loki     = "iakaframe-naonedge"
  nathalie = "iakaframe-nathalie"
}

function Get-Target {
  if ($Global) { return (Join-Path $HOME ".claude") }
  return (Join-Path $Project ".claude")
}

function Copy-Tree($src, $dst) {
  if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force | Out-Null }
  Copy-Item -Path (Join-Path $src "*") -Destination $dst -Recurse -Force
}

function Affect-Agent([string]$name) {
  $srcAgent = Join-Path $agentsDir "$name.md"
  if (-not (Test-Path $srcAgent)) { Write-Host "  ! agent inconnu : $name" -ForegroundColor Red; return }
  $target      = Get-Target
  $dstAgentDir = Join-Path $target "agents"
  $dstAgent    = Join-Path $dstAgentDir "$name.md"
  if (-not (Test-Path $dstAgentDir)) { New-Item -ItemType Directory -Path $dstAgentDir -Force | Out-Null }
  if ((Test-Path $dstAgent) -and -not $Force) {
    Write-Host "  = $name (deja present, -Force pour ecraser)" -ForegroundColor DarkGray
  } else {
    Copy-Item -Path $srcAgent -Destination $dstAgent -Force
    Write-Host "  + agent  $name" -ForegroundColor Green
  }
  # Skill-role associee
  $skill = $skillOf[$name]
  if ($skill) {
    $srcSkill = Join-Path $skillsDir $skill
    if (Test-Path $srcSkill) {
      Copy-Tree $srcSkill (Join-Path $target (Join-Path "skills" $skill))
      Write-Host "  + skill  $skill" -ForegroundColor Green
    }
  } elseif ($name -eq "gimli") {
    Write-Host "  i gimli : pas de skill - porte par le CLAUDE.md du projet." -ForegroundColor DarkGray
  }
  # Loki : embarque le catalogue de chartes (design-*/) a la racine du projet.
  if ($name -eq "loki" -and -not $Global) {
    $chartes = Get-ChildItem -Path $root -Directory -Filter "design-*" -ErrorAction SilentlyContinue
    foreach ($c in $chartes) {
      Copy-Tree $c.FullName (Join-Path $Project $c.Name)
      Write-Host "  + charte $($c.Name)" -ForegroundColor Green
    }
  }
}

switch ($Action) {

  "list" {
    Write-Host "Equipe iakaframe - definitions canon ($agentsDir)" -ForegroundColor Cyan
    Get-ChildItem -Path $agentsDir -Filter "*.md" | Where-Object { $_.BaseName -ne "_TEMPLATE" } |
      Sort-Object BaseName | ForEach-Object {
        $n = $_.BaseName
        $s = if ($skillOf[$n]) { $skillOf[$n] } else { "(CLAUDE.md)" }
        Write-Host ("  {0,-9} -> {1}" -f $n, $s)
      }
    Write-Host "`nUsage : -Action fullteam -Project <chemin>  ou  -Action affect -Agent <nom> -Project <chemin>" -ForegroundColor DarkGray
  }

  "create" {
    if (-not $Agent) { throw "Preciser -Agent <nom> a creer." }
    $dst = Join-Path $agentsDir "$Agent.md"
    if ((Test-Path $dst) -and -not $Force) { throw "agents/$Agent.md existe deja (-Force pour ecraser)." }
    Copy-Item -Path (Join-Path $agentsDir "_TEMPLATE.md") -Destination $dst -Force
    Write-Host "Cree agents/$Agent.md depuis le template. A editer : frontmatter (name/description/tools) + corps." -ForegroundColor Green
    Write-Host "Puis, si besoin, ajouter le mapping skill dans iakaframe-agents.ps1 (\$skillOf)." -ForegroundColor DarkGray
  }

  "affect" {
    if (-not $Agent) { throw "Preciser -Agent <nom> a affecter." }
    $where = if ($Global) { "~/.claude (mutualise)" } else { $Project }
    Write-Host "Affectation de '$Agent' -> $where" -ForegroundColor Cyan
    Affect-Agent $Agent
  }

  "fullteam" {
    $where = if ($Global) { "~/.claude (mutualise)" } else { $Project }
    Write-Host "Deploiement de la FULL TEAM iakaframe -> $where" -ForegroundColor Cyan
    Get-ChildItem -Path $agentsDir -Filter "*.md" | Where-Object { $_.BaseName -ne "_TEMPLATE" } |
      Sort-Object BaseName | ForEach-Object { Affect-Agent $_.BaseName }
    Write-Host "Full team deployee." -ForegroundColor Green
  }

  "status" {
    $target = Get-Target
    $dstAgentDir = Join-Path $target "agents"
    Write-Host "Agents affectes dans : $target" -ForegroundColor Cyan
    if (Test-Path $dstAgentDir) {
      Get-ChildItem -Path $dstAgentDir -Filter "*.md" | Sort-Object BaseName |
        ForEach-Object { Write-Host ("  - {0}" -f $_.BaseName) }
    } else {
      Write-Host "  (aucun - lancer -Action fullteam)" -ForegroundColor DarkGray
    }
  }
}

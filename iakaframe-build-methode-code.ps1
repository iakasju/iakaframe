<#
.SYNOPSIS
  Remplit le panneau "Code" de methode-de-travail.html avec le source integral de tous
  les agents (agents/*.md) et skills (skills/iakaframe-*/SKILL.md).

.DESCRIPTION
  Lit chaque fichier, echappe le HTML, et remplace le contenu entre les marqueurs
  <!--CODE_BLOCKS_START--> et <!--CODE_BLOCKS_END--> par une carte par fichier (titre +
  bouton download + <pre>). IDEMPOTENT : re-lancable a volonte quand les agents/skills
  changent. Lecture/ecriture en UTF-8 sans BOM (preserve les accents).
#>
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$html = Join-Path $root "methode-de-travail.html"
$enc  = New-Object System.Text.UTF8Encoding($false)

function ReadU($p) { [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8) }
function Enc([string]$s) {
  if ($null -eq $s) { return "" }
  $s.Replace('&','&amp;').Replace('<','&lt;').Replace('>','&gt;')
}

# Carte de code : {0}=fname {1}=path {2}=id {3}=dlname {4}=contenu echappe
$tpl = @'
<div class="codecard"><div class="codecard-head"><span><span class="fname">{0}</span><span class="fpath">{1}</span></span><button class="dlbtn" onclick="iakaDL('{2}','{3}')">&#x2B07; download</button></div><pre id="{2}" data-path="{1}">{4}</pre></div>
'@

$sb = New-Object System.Text.StringBuilder
$count = 0

[void]$sb.AppendLine('<div class="code-group">agents/ &mdash; definitions de subagents</div>')
Get-ChildItem (Join-Path $root "agents") -Filter *.md | Sort-Object Name | ForEach-Object {
  $rel = "agents/" + $_.Name
  $id  = "code-agent-" + ($_.BaseName -replace '[^a-zA-Z0-9]','-')
  $txt = Enc (ReadU $_.FullName)
  [void]$sb.AppendLine(($tpl -f $_.Name, $rel, $id, $_.Name, $txt))
  $count++
}

[void]$sb.AppendLine('<div class="code-group">skills/ &mdash; savoir-faire (SKILL.md)</div>')
Get-ChildItem (Join-Path $root "skills") -Directory -Filter "iakaframe-*" | Sort-Object Name | ForEach-Object {
  $skf = Join-Path $_.FullName "SKILL.md"
  if (Test-Path $skf) {
    $rel    = "skills/" + $_.Name + "/SKILL.md"
    $id     = "code-skill-" + ($_.Name -replace '[^a-zA-Z0-9]','-')
    $dlname = $_.Name + "-SKILL.md"
    $txt    = Enc (ReadU $skf)
    [void]$sb.AppendLine(($tpl -f $_.Name, $rel, $id, $dlname, $txt))
    $count++
  }
}

$raw = ReadU $html
if ($raw -notmatch '<!--CODE_BLOCKS_START-->') { throw "Marqueurs <!--CODE_BLOCKS_START/END--> introuvables dans $html." }
# Remplace tout entre les deux marqueurs. Evaluateur scriptblock (et non chaine) pour que
# les '$' du code genere ne soient pas pris pour des backreferences regex.
$replacement = "<!--CODE_BLOCKS_START-->`r`n" + $sb.ToString() + "<!--CODE_BLOCKS_END-->"
$raw = [regex]::Replace($raw, '(?s)<!--CODE_BLOCKS_START-->.*?<!--CODE_BLOCKS_END-->', { $replacement })
[System.IO.File]::WriteAllText($html, $raw, $enc)

Write-Host "Panneau Code genere : $count fichiers integres dans methode-de-travail.html" -ForegroundColor Green

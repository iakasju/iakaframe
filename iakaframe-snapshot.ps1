<#
.SYNOPSIS
  Genere/rafraichit l'etat des lieux d'un projet (MD + HTML) a partir des faits git.

.DESCRIPTION
  A lancer A CHAQUE changement de version ET A CHAQUE pause / preparation de reprise.
  Source de verite = specs/.iakaframe-journal.json (append-only). A partir de ce
  journal + des faits git courants, regenere :
    - specs/etat-des-lieux.md   (lisible, pour Cowork/dev)
    - specs/etat-des-lieux.html (page autonome, theme sombre)

  Le script capture les FAITS (branche, version, derniers commits, etat propre/sale,
  nb de fichiers). Le RECIT (ce qui reste a faire, decisions) est a completer par
  Cowork dans le champ -Note ou directement dans specs/PROJET.md.

.PARAMETER Reason
  Motif du snapshot : version | pause | reprise | manual. Defaut : manual.

.PARAMETER Version
  Etiquette de version (ex: v0.3.2). Defaut : dernier tag git, sinon "-".

.PARAMETER Note
  Courte note ASCII associee a l'entree de journal (ce qu'on vient de finir / l'etat).

.PARAMETER Path
  Racine du projet. Defaut : courant.

.EXAMPLE
  pwsh .\iakaframe-snapshot.ps1 -Reason version -Version v0.2.0 -Note "feature search livree"
  pwsh .\iakaframe-snapshot.ps1 -Reason pause -Note "pause: WIP onboarding, reprendre par les tests"
#>
param(
  [ValidateSet("version","pause","reprise","manual")]
  [string]$Reason = "manual",
  [string]$Version = "",
  [string]$Note = "",
  [string]$Path = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
$specs = Join-Path $Path "specs"
if (-not (Test-Path $specs)) { New-Item -ItemType Directory -Path $specs -Force | Out-Null }
$journalFile = Join-Path $specs ".iakaframe-journal.json"

function Git-Try([string]$gitArgs) {
  try { $out = & git -C $Path $gitArgs.Split(' ') 2>$null; if ($LASTEXITCODE -eq 0) { return ($out -join "`n").Trim() } } catch {}
  return ""
}

$isGit = Test-Path (Join-Path $Path ".git")
$branch = if ($isGit) { Git-Try "rev-parse --abbrev-ref HEAD" } else { "-" }
if ([string]::IsNullOrWhiteSpace($Version)) {
  $Version = if ($isGit) { Git-Try "describe --tags --abbrev=0" } else { "" }
  if ([string]::IsNullOrWhiteSpace($Version)) { $Version = "-" }
}
$lastCommit = "-"
if ($isGit) {
  $lc = & git -C $Path log -1 --pretty=format:"%h %s" 2>$null
  if ($LASTEXITCODE -eq 0 -and $lc) { $lastCommit = ($lc -join " ").Trim() }
}
$dirty = if ($isGit) { (Git-Try "status --porcelain") -ne "" } else { $false }
$fileCount = (Get-ChildItem -Path $Path -Recurse -File -Force -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch '\\\.git\\' -and $_.FullName -notmatch '\\node_modules\\' }).Count
$now = (Get-Date).ToString("yyyy-MM-dd HH:mm")
$project = Split-Path -Leaf $Path

# Derniers commits (table)
$recent = @()
if ($isGit) {
  $raw = & git -C $Path log -10 --pretty=format:"%h|%ad|%s" --date=short 2>$null
  foreach ($l in $raw) { if ($l) { $p = $l.Split('|',3); $recent += [pscustomobject]@{ hash=$p[0]; date=$p[1]; subject=$p[2] } } }
}

# Journal append-only.
# Robustesse : on re-extrait recursivement les VRAIES entrees (objet ayant date+reason)
# et on jette tout wrapper parasite {value,Count} qu'une serialisation precedente aurait
# pu introduire (bug historique des lignes "System.Object[]" / journal auto-imbrique).
function Get-JournalEntries($node, $acc) {
  if ($null -eq $node) { return }
  if (($node -is [System.Collections.IEnumerable]) -and ($node -isnot [string])) {
    foreach ($x in $node) { Get-JournalEntries $x $acc }
    return
  }
  $props = @($node.PSObject.Properties.Name)
  if (($props -contains 'date') -and ($props -contains 'reason')) {
    $acc.Add([pscustomobject]@{
      date=$node.date; reason=$node.reason; version=$node.version; branch=$node.branch
      commit=$node.commit; dirty=$node.dirty; files=$node.files; note=$node.note
    }) | Out-Null
    return
  }
  if ($props -contains 'value') { Get-JournalEntries $node.value $acc }  # wrapper -> on descend
}

$entries = [System.Collections.Generic.List[object]]::new()
if (Test-Path $journalFile) {
  try { Get-JournalEntries (Get-Content $journalFile -Raw | ConvertFrom-Json) $entries } catch {}
}
$entries.Add([pscustomobject]@{
  date=$now; reason=$Reason; version=$Version; branch=$branch
  commit=$lastCommit; dirty=$dirty; files=$fileCount; note=$Note
}) | Out-Null
$journal = $entries.ToArray()

# Ecriture : -Depth large (structure plate) + garantie d'un tableau JSON de haut niveau
# (sinon un journal a 1 entree serait serialise en objet seul et re-imbrique au tour suivant).
$jsonOut = ConvertTo-Json -InputObject $journal -Depth 8
if (-not $jsonOut.TrimStart().StartsWith('[')) { $jsonOut = "[$jsonOut]" }
$jsonOut | Set-Content -Path $journalFile -Encoding UTF8

# ---------- Rendu MD ----------
$md = @()
$md += "# Etat des lieux - $project"
$md += ""
$md += "> Genere par iakaframe-snapshot.ps1 le $now (motif: $Reason)."
$md += "> A regenerer a chaque changement de version et a chaque pause/reprise."
$md += ""
$md += "## Etat courant"
$md += ""
$md += "| Champ | Valeur |"
$md += "|---|---|"
$md += "| Version | $Version |"
$md += "| Branche | $branch |"
$md += "| Dernier commit | $lastCommit |"
$md += ("| Arbre | {0} |" -f $(if ($dirty) { "MODIFICATIONS NON COMMITEES" } else { "propre" }))
$md += "| Fichiers (hors .git/node_modules) | $fileCount |"
if ($Note) { $md += "| Note | $Note |" }
$md += ""
if ($recent.Count -gt 0) {
  $md += "## Commits recents"
  $md += ""
  $md += "| Hash | Date | Sujet |"
  $md += "|---|---|---|"
  foreach ($c in $recent) { $md += "| ``$($c.hash)`` | $($c.date) | $($c.subject) |" }
  $md += ""
}
$md += "## Reprise du travail (a completer par Cowork)"
$md += ""
$md += "- **Ce qui vient d'etre fait** : <!-- ... -->"
$md += "- **En cours / a reprendre** : <!-- ... -->"
$md += "- **Prochaine etape concrete** : <!-- premiere action a faire en reprenant -->"
$md += "- **Pieges connus** : <!-- ... -->"
$md += ""
$md += "## Journal (versions & pauses)"
$md += ""
$md += "| Date | Motif | Version | Branche | Note |"
$md += "|---|---|---|---|---|"
foreach ($e in ($journal | Sort-Object { $_.date } -Descending)) {
  $md += ("| {0} | {1} | {2} | {3} | {4} |" -f $e.date, $e.reason, $e.version, $e.branch, ($e.note -replace '\|','/'))
}
$md += ""
($md -join "`n") | Set-Content -Path (Join-Path $specs "etat-des-lieux.md") -Encoding UTF8

# ---------- Rendu HTML ----------
function Enc([string]$s) { if ($null -eq $s) { return "" } $s.Replace('&','&amp;').Replace('<','&lt;').Replace('>','&gt;') }
$rows = ""
foreach ($e in ($journal | Sort-Object { $_.date } -Descending)) {
  $rows += "<tr><td>$(Enc $e.date)</td><td><span class='r r-$($e.reason)'>$(Enc $e.reason)</span></td><td>$(Enc $e.version)</td><td>$(Enc $e.branch)</td><td>$(Enc $e.note)</td></tr>`n"
}
$commitRows = ""
foreach ($c in $recent) { $commitRows += "<tr><td><code>$(Enc $c.hash)</code></td><td>$(Enc $c.date)</td><td>$(Enc $c.subject)</td></tr>`n" }
$dirtyTxt = if ($dirty) { "<span class='bad'>modifications non commitees</span>" } else { "<span class='ok'>propre</span>" }

$html = @"
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Etat des lieux - $(Enc $project)</title>
<style>
:root{--gold:#c8a44e;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Inter,-apple-system,Segoe UI,sans-serif;background:#0a0a0a;color:#f0f0f0;line-height:1.6;padding:2.5rem 1.5rem;max-width:60rem;margin:0 auto;}
h1{font-size:1.9rem;font-weight:800;letter-spacing:-.02em;}
h1 .accent{background:linear-gradient(135deg,#c8a44e,#e8c960);-webkit-background-clip:text;background-clip:text;color:transparent;}
.sub{color:#777;font-size:.85rem;margin:.4rem 0 2rem;}
h2{font-size:1.1rem;font-weight:700;margin:2.2rem 0 .8rem;color:var(--gold);}
table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #2a2a2a;border-radius:10px;overflow:hidden;font-size:.88rem;margin:.5rem 0;}
th{background:#161616;color:#888;text-transform:uppercase;font-size:.7rem;letter-spacing:.06em;padding:.6rem .9rem;text-align:left;}
td{padding:.6rem .9rem;border-top:1px solid #1f1f1f;color:#bbb;}
code{font-family:'SF Mono',Consolas,monospace;background:rgba(200,164,78,.1);color:var(--gold);padding:.1rem .35rem;border-radius:4px;font-size:.82rem;}
.kv{display:grid;grid-template-columns:max-content 1fr;gap:.3rem 1.2rem;font-size:.92rem;background:#141414;border:1px solid #2a2a2a;border-radius:10px;padding:1.1rem 1.3rem;}
.kv .k{color:#888;}
.ok{color:#2ecc71;}.bad{color:#e74c3c;font-weight:600;}
.r{font-size:.7rem;font-weight:600;text-transform:uppercase;padding:.1rem .5rem;border-radius:999px;}
.r-version{background:rgba(46,204,113,.15);color:#2ecc71;}
.r-pause{background:rgba(230,126,34,.15);color:#e67e22;}
.r-reprise{background:rgba(52,152,219,.15);color:#3498db;}
.r-manual{background:rgba(150,150,150,.15);color:#aaa;}
footer{margin-top:3rem;padding-top:1.2rem;border-top:1px solid #1f1f1f;color:#555;font-size:.78rem;}
</style></head><body>
<h1>Etat des lieux - <span class="accent">$(Enc $project)</span></h1>
<div class="sub">Genere le $(Enc $now) - motif : $(Enc $Reason) - a regenerer a chaque version et a chaque pause/reprise.</div>

<h2>Etat courant</h2>
<div class="kv">
  <div class="k">Version</div><div>$(Enc $Version)</div>
  <div class="k">Branche</div><div>$(Enc $branch)</div>
  <div class="k">Dernier commit</div><div><code>$(Enc $lastCommit)</code></div>
  <div class="k">Arbre</div><div>$dirtyTxt</div>
  <div class="k">Fichiers</div><div>$fileCount (hors .git / node_modules)</div>
  $(if ($Note) { "<div class='k'>Note</div><div>$(Enc $Note)</div>" })
</div>

$(if ($commitRows) { "<h2>Commits recents</h2><table><tr><th>Hash</th><th>Date</th><th>Sujet</th></tr>$commitRows</table>" })

<h2>Journal (versions &amp; pauses)</h2>
<table><tr><th>Date</th><th>Motif</th><th>Version</th><th>Branche</th><th>Note</th></tr>
$rows</table>

<footer>iakaframe - etat des lieux automatique. Le recit de reprise est tenu dans specs/etat-des-lieux.md et specs/PROJET.md.</footer>
</body></html>
"@
$html | Set-Content -Path (Join-Path $specs "etat-des-lieux.html") -Encoding UTF8

Write-Host ("Snapshot OK ({0}) -> specs/etat-des-lieux.md + .html" -f $Reason) -ForegroundColor Green
Write-Host ("  version={0} branche={1} fichiers={2} {3}" -f $Version, $branch, $fileCount, $(if($dirty){"[arbre sale]"}else{""})) -ForegroundColor DarkGray

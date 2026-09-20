$ErrorActionPreference = 'Stop'
$reportRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $reportRoot
$reportStage = Join-Path $reportRoot ('build/report-template-' + [guid]::NewGuid().ToString('N'))
$reportOutput = Join-Path $reportRoot 'public/templates/final-report'
New-Item -ItemType Directory -Path $reportStage, $reportOutput -Force | Out-Null
Copy-Item -LiteralPath 'templates/final-report/main.tex','templates/final-report/README.md' -Destination $reportStage
node figures/final-report-assets.mjs $reportStage
if ($LASTEXITCODE -ne 0) { throw 'Shield generation failed.' }
Push-Location -LiteralPath $reportStage
try {
  for ($reportPass = 1; $reportPass -le 2; $reportPass++) {
    pdflatex -no-shell-escape -interaction=nonstopmode -halt-on-error main.tex | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "LaTeX failed; inspect $reportStage/main.log" }
  }
  $reportLog = Get-Content -LiteralPath 'main.log' -Raw
  if ($reportLog -match 'Overfull \\[hv]box') { throw "Overfull box; inspect $reportStage/main.log" }
  $reportInfo = pdfinfo main.pdf
  if ($LASTEXITCODE -ne 0) { throw 'pdfinfo failed.' }
  $reportPageMatch = [regex]::Match(($reportInfo -join "`n"), 'Pages:\s+(\d+)')
  $reportPages = [int]$reportPageMatch.Groups[1].Value
  if ($reportPages -lt 2 -or $reportPages -gt 7) { throw "Unexpected template page count: $reportPages" }
  pdftoppm -f 1 -singlefile -scale-to 1200 -png main.pdf preview | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Preview rendering failed.' }
  Copy-Item -LiteralPath 'main.pdf' -Destination (Join-Path $reportOutput 'final-report.pdf')
  Copy-Item -LiteralPath 'preview.png' -Destination (Join-Path $reportOutput 'preview.png')
  Compress-Archive -LiteralPath 'main.tex','README.md','slop-crest.png','slop-crest.svg','SLOP-BRAND-LICENSE.txt' -DestinationPath (Join-Path $reportOutput 'final-report-latex.zip') -Force
} finally { Pop-Location }
$reportHashes = [ordered]@{}
foreach ($reportFile in @('templates/final-report/main.tex','templates/final-report/README.md','figures/final-report-assets.mjs','scripts/build-final-report-template.ps1','public/templates/final-report/final-report.pdf','public/templates/final-report/preview.png','public/templates/final-report/final-report-latex.zip')) {
  $reportHashes[$reportFile] = (Get-FileHash -LiteralPath $reportFile -Algorithm SHA256).Hash.ToLowerInvariant()
}
@{pages=$reportPages;reportPages=$reportPages-1;hashes=$reportHashes} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $reportOutput 'manifest.json') -Encoding utf8
Write-Output "Compiled $reportPages pages (last page: references). PDF, preview and LaTeX ZIP: $reportOutput"
Write-Output "Compilation log retained in $reportStage"

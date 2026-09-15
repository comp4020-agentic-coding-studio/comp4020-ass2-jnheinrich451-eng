# Read-only preview of the supplied PowerPoint. Never save or close the author's presentation.
$ErrorActionPreference = 'Stop'
$source = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../assets/slide template.pptx')).Path
$destination = Join-Path $PSScriptRoot '../build/ppt-template-reference'
$null = New-Item -ItemType Directory -Force -Path $destination
$destination = (Resolve-Path -LiteralPath $destination).Path
$powerpoint = New-Object -ComObject PowerPoint.Application
$preview = $null
try {
  # ReadOnly, Untitled, WithWindow: open a separate, hidden, read-only presentation.
  $preview = $powerpoint.Presentations.Open($source, -1, -1, 0)
  Write-Output ("Template: {0} slides; {1} x {2} pt" -f $preview.Slides.Count, $preview.PageSetup.SlideWidth, $preview.PageSetup.SlideHeight)
  for ($index=1; $index -le $preview.Slides.Count; $index++) {
    $target = Join-Path $destination "slide-$index.png"
    $preview.Slides.Item($index).Export($target, 'PNG', 1600, 900)
    Write-Output $target
  }
} finally {
  if ($null -ne $preview) { $preview.Close(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($preview) }
  # Do not Quit: PowerPoint may also contain the user's open document.
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($powerpoint)
}

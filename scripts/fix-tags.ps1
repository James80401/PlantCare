Get-ChildItem -Path "$PSScriptRoot\..\apps\web\src" -Recurse -Filter "*.tsx" | ForEach-Object {
  $c = [IO.File]::ReadAllText($_.FullName)
  $c = $c -creplace '</motion>', '</div>'
  $c = $c -creplace '<motion>', '<div>'
  $c = $c -creplace '<motion ', '<div '
  [IO.File]::WriteAllText($_.FullName, $c)
  Write-Host "Fixed $($_.Name)"
}

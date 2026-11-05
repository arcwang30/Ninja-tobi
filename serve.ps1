# 簡易本機伺服器：powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 8080]
# 加 -Lan 可讓同網路的手機／平板連線（需系統管理員權限）
param([int]$Port = 8080, [switch]$Lan)
$root = $PSScriptRoot
$prefix = if ($Lan) { "http://+:$Port/" } else { "http://localhost:$Port/" }
$types = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8';
  '.svg' = 'image/svg+xml'; '.webmanifest' = 'application/manifest+json'; '.png' = 'image/png'; '.json' = 'application/json' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add($prefix); $l.Start()
Write-Host "Serving $root at $prefix"
while ($l.IsListening) {
  $c = $l.GetContext()
  $path = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart('/'))
  if ($path -eq '') { $path = 'index.html' }
  $file = [IO.Path]::GetFullPath((Join-Path $root $path))
  if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($file)
    $ext = [IO.Path]::GetExtension($file)
    $c.Response.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
    $c.Response.Headers.Add('Cache-Control', 'no-cache')
    $c.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}

# 產生 claude.ai Artifact 版頁面：dist/artifact.html
# Artifact 發佈時會自動包上 <!doctype>/<html>/<head>/<body>，所以只取 index.html 的 <body> 內容。
# style.css、game.js 原樣當作附屬檔案一起發佈。
$src = [IO.File]::ReadAllText("$PSScriptRoot\index.html", [Text.Encoding]::UTF8)
$body = [regex]::Match($src, '(?s)<body>(.*)</body>').Groups[1].Value.Trim()
$title = [regex]::Match($src, '<title>.*?</title>').Value   # 從 index.html 取，避免腳本本身的編碼問題
$out = "$title`n<link rel=""stylesheet"" href=""style.css"">`n$body`n"
New-Item -ItemType Directory -Force "$PSScriptRoot\dist" | Out-Null
[IO.File]::WriteAllText("$PSScriptRoot\dist\artifact.html", $out, (New-Object Text.UTF8Encoding $false))
Write-Host "Wrote dist\artifact.html"

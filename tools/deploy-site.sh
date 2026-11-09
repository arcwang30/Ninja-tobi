#!/usr/bin/env bash
# 把 site/ninjatobi/ 發佈到公開網站 https://arcconceptgames.github.io/ninjatobi/(repo:arcconceptgames/arcconceptgames.github.io)
# 網站和其他作品(daioyaki、gangquan 等)共用同一個 repo,所以這裡只複製 ninjatobi/ 資料夾,不會動到網站上的其他檔案(首頁、style.css、lang.js 也不動)
# 用法(Windows 的 Git Bash 或 Mac 的終端機):bash tools/deploy-site.sh "更新隱私權政策"
set -euo pipefail

REPO=https://github.com/arcconceptgames/arcconceptgames.github.io.git
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MSG="${1:-Update ninjatobi pages}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone -q --depth 1 "$REPO" "$TMP/site"
rm -rf "$TMP/site/ninjatobi"
cp -R "$ROOT/site/ninjatobi" "$TMP/site/ninjatobi"

cd "$TMP/site"
git config user.name "$(git -C "$ROOT" config user.name)"
git config user.email "$(git -C "$ROOT" config user.email)"
git add -A
if git diff --cached --quiet; then
  echo "網站沒有變動,不用發佈。"
  exit 0
fi
git commit -q -m "$MSG"
git push -q origin HEAD
echo "已發佈:https://arcconceptgames.github.io/ninjatobi/privacy/ 與 /support/(幾分鐘後生效)"

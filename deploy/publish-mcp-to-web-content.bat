@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."

rem Default: sibling folder sami-web-content (same parent as this repo).
set "TARGET=%~dp0..\..\sami-web-content"
if not "%~1"=="" set "TARGET=%~1"
for %%I in ("%TARGET%") do set "TARGET=%%~fI"

echo MCP publish -^> sami-web-content
echo Target: %TARGET%
echo.

if not exist "%TARGET%\dist\manifest.json" (
  echo ERROR: %TARGET%\dist\manifest.json not found.
  echo Clone sami-web-content branch that includes dist/ (e.g. main^).
  exit /b 1
)

node scripts\publish-mcp-web-content-release.cjs --target "%TARGET%"
if errorlevel 1 exit /b 1

echo.
echo [git] sami-web-content
pushd "%TARGET%"

rem Stage dist to detect changes vs last commit; commit/push only on explicit Y.
git -c core.autocrlf=false add dist
git diff --cached --quiet
if not errorlevel 1 (
  echo No changes in dist. Nothing to publish.
  popd
  goto :done
)

echo.
echo Staged: updates under dist\  ^(MCP merge from gallery^)
echo.
rem Default: no commit/push. Y = commit + push. Timeout 90s = same as N.
choice /C YN /D N /T 90 /M "PUBLISH: run git commit and push to origin/main?  Y/N "
if errorlevel 2 goto :skip_publish

git commit -m "publish: MCP gallery"
if errorlevel 1 (
  echo ERROR: git commit failed.
  git restore --staged dist 2>nul
  if errorlevel 1 git reset HEAD dist 2>nul
  popd
  exit /b 1
)

echo.
echo Pushing to origin main...
git push origin main
if errorlevel 1 (
  echo ERROR: git push failed. Commit is local; fix remote and push manually.
  popd
  exit /b 1
)
echo Push completed.
popd
goto :done

:skip_publish
echo.
echo Skipping commit and push ^(as requested^). dist\ changes are left unstaged for manual review.
git restore --staged dist 2>nul
if errorlevel 1 git reset HEAD dist 2>nul
echo You can: git add dist, git commit, git push
popd

:done
echo.
echo Finished.

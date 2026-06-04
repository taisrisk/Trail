export const windowsCmd = String.raw`@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "TRAIL_REPO=https://github.com/ZroRisc/Trail.git"
set "TRAIL_DIR=%USERPROFILE%\Trail"
set "TRAIL_HOME=%USERPROFILE%\.trail"

echo.
echo === Trail one-click Windows setup ===
echo This installs Git/Node if missing, clones Trail, prepares ~/.trail, and starts the local app.
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo Git not found. Installing Git with winget...
  winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
) else (
  echo Git found.
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Installing Node.js LTS with winget...
  winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
) else (
  echo Node.js found.
)

where git >nul 2>nul || (echo Git install did not finish. Open a new CMD and run this script again. & pause & exit /b 1)
where node >nul 2>nul || (echo Node install did not finish. Open a new CMD and run this script again. & pause & exit /b 1)

if not exist "%TRAIL_HOME%" mkdir "%TRAIL_HOME%"
if not exist "%TRAIL_HOME%\config" mkdir "%TRAIL_HOME%\config"
if not exist "%TRAIL_HOME%\keys" mkdir "%TRAIL_HOME%\keys"
if not exist "%TRAIL_HOME%\vault" mkdir "%TRAIL_HOME%\vault"
if not exist "%TRAIL_HOME%\mail" mkdir "%TRAIL_HOME%\mail"
if not exist "%TRAIL_HOME%\attachments" mkdir "%TRAIL_HOME%\attachments"
if not exist "%TRAIL_HOME%\index" mkdir "%TRAIL_HOME%\index"
if not exist "%TRAIL_HOME%\graph" mkdir "%TRAIL_HOME%\graph"
if not exist "%TRAIL_HOME%\watchers" mkdir "%TRAIL_HOME%\watchers"
if not exist "%TRAIL_HOME%\queues" mkdir "%TRAIL_HOME%\queues"
if not exist "%TRAIL_HOME%\backups" mkdir "%TRAIL_HOME%\backups"

if exist "%TRAIL_DIR%\.git" (
  echo Updating existing Trail checkout...
  cd /d "%TRAIL_DIR%" || exit /b 1
  git pull --ff-only
) else (
  if exist "%TRAIL_DIR%" ren "%TRAIL_DIR%" "Trail-backup-%RANDOM%"
  git clone "%TRAIL_REPO%" "%TRAIL_DIR%"
  cd /d "%TRAIL_DIR%" || exit /b 1
)

call npm install
if errorlevel 1 exit /b 1

call npm run build
if errorlevel 1 exit /b 1

echo.
echo Trail is installed.
echo App: http://localhost:3000
echo Setup dashboard: http://localhost:3000/dashboard
echo Local node home: %TRAIL_HOME%
echo.
echo Starting Trail now...
start "Trail Local Node" cmd /k "cd /d %TRAIL_DIR% && npm run trail:node"
start "Trail Web" cmd /k "cd /d %TRAIL_DIR% && npm run dev"
start "" "http://localhost:3000/install"
endlocal`;

export const macLinux = String.raw`#!/usr/bin/env bash
set -euo pipefail
TRAIL_REPO="https://github.com/ZroRisc/Trail.git"
TRAIL_DIR="$HOME/Trail"
TRAIL_HOME="$HOME/.trail"

command -v git >/dev/null || { echo "Install git first."; exit 1; }
command -v node >/dev/null || { echo "Install Node.js LTS first."; exit 1; }

mkdir -p "$TRAIL_HOME"/{config,keys,vault,mail,attachments,index,graph,watchers,queues,backups}

if [ -d "$TRAIL_DIR/.git" ]; then
  cd "$TRAIL_DIR"
  git pull --ff-only
else
  [ -e "$TRAIL_DIR" ] && mv "$TRAIL_DIR" "$TRAIL_DIR-backup-$(date +%s)"
  git clone "$TRAIL_REPO" "$TRAIL_DIR"
  cd "$TRAIL_DIR"
fi

npm install
npm run build

printf '\nTrail installed.\nApp: http://localhost:3000\nDashboard: http://localhost:3000/dashboard\n\n'
(npm run trail:node &)
npm run dev`;

export const quickStart = String.raw`cd %USERPROFILE%\Trail
npm run dev

:: in another CMD window:
cd %USERPROFILE%\Trail
npm run trail:node`;

export const oneLineWindows = String.raw`curl -L http://localhost:3000/install/trail-install.cmd -o %TEMP%\trail-install.cmd && %TEMP%\trail-install.cmd`;

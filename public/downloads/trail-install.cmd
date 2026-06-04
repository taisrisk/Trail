@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "TRAIL_REPO=https://github.com/taisrisk/Trail.git"
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
if not exist "%TRAIL_HOME%\calendar" mkdir "%TRAIL_HOME%\calendar"
if not exist "%TRAIL_HOME%\orders" mkdir "%TRAIL_HOME%\orders"
if not exist "%TRAIL_HOME%\queues" mkdir "%TRAIL_HOME%\queues"
if not exist "%TRAIL_HOME%\backups" mkdir "%TRAIL_HOME%\backups"
if not exist "%TRAIL_HOME%\logs" mkdir "%TRAIL_HOME%\logs"
if not exist "%TRAIL_HOME%\drafts" mkdir "%TRAIL_HOME%\drafts"
if not exist "%TRAIL_HOME%\contacts" mkdir "%TRAIL_HOME%\contacts"

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
echo Mail workspace: http://localhost:3000/mail
Setup dashboard: http://localhost:3000/dashboard
echo Local node home: %TRAIL_HOME%
echo.
echo Starting Trail now...
start "Trail Local Node" cmd /k "cd /d %TRAIL_DIR% && npm run trail:node"
start "Trail Web" cmd /k "cd /d %TRAIL_DIR% && npm run dev"
start "" "http://localhost:3000/mail"
endlocal

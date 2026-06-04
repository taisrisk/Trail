import Link from "next/link";

import { CopyScriptButton } from "@/components/copy-script-button";
import { Badge, GlassCard, SectionTitle } from "@/components/ui/primitives";

const windowsCmd = String.raw`@echo off
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

const macLinux = String.raw`#!/usr/bin/env bash
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

const quickStart = String.raw`cd %USERPROFILE%\Trail
npm run dev

:: in another CMD window:
cd %USERPROFILE%\Trail
npm run trail:node`;

const setupSteps = [
  "Copy the Windows CMD script.",
  "Open Command Prompt, paste it, and press Enter.",
  "The script installs Git/Node when needed, clones Trail, creates ~/.trail, installs packages, builds, and launches the app.",
  "Open the dashboard, choose Quick Domain / Relay Node / Sovereign MX, then create aliases and watchers.",
];

const createdFolders = ["config", "keys", "vault", "mail", "attachments", "index", "graph", "watchers", "queues", "backups"];

function ScriptPanel({ title, subtitle, script, label }: { title: string; subtitle: string; script: string; label: string }) {
  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/[0.035] p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">{subtitle}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
        </div>
        <CopyScriptButton script={script} label={label} />
      </div>
      <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap bg-[#030806]/90 p-5 font-mono text-xs leading-6 text-emerald-100">
        {script}
      </pre>
    </GlassCard>
  );
}

export const metadata = {
  title: "Install Trail",
  description: "One-copy install scripts for Trail local-first email OS.",
};

export default function InstallPage() {
  return (
    <main className="relative overflow-hidden px-5 py-6 md:px-8">
      <div className="orb left-8 top-20 h-44 w-44 bg-cyan-400/15" />
      <div className="orb right-10 top-24 h-56 w-56 bg-violet-400/15 [animation-delay:1.2s]" />

      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-sm font-black text-slate-950">T</div>
          <div>
            <p className="font-semibold text-white">Trail</p>
            <p className="text-xs text-slate-400">Installer</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex">Dashboard</Link>
          <Badge tone="emerald">one-copy setup</Badge>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-8 pb-14 pt-16 lg:grid-cols-[1fr_.85fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">Paste one script into CMD. Trail handles the rest.</div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-white md:text-7xl">Install the local email OS in one shot.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">This page gives users a copyable setup script that installs prerequisites, clones Trail, creates the local node folders, builds the app, and opens the dashboard.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#windows" className="rounded-full bg-cyan-200 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_40px_rgba(94,234,212,.25)]">Get Windows script</a>
            <a href="#restart" className="rounded-full border border-cyan-300/25 px-6 py-3 font-semibold text-cyan-100 hover:bg-cyan-300/10">Restart commands</a>
            <a href="/dashboard" className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white hover:bg-white/10">Open dashboard</a>
          </div>
        </div>

        <GlassCard className="p-6">
          <SectionTitle align="left" eyebrow="What it sets up" title="App, node, vault, and dashboard" body="The setup script creates a Trail home directory and launches both the web app and standalone local node." />
          <div className="grid grid-cols-2 gap-3">
            {createdFolders.map((folder) => (
              <div key={folder} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                <code className="text-sm text-cyan-100">~/.trail/{folder}</code>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="mx-auto max-w-7xl py-8">
        <GlassCard className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            {setupSteps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 font-semibold text-cyan-100">{index + 1}</div>
                <p className="text-sm leading-6 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section id="windows" className="mx-auto max-w-7xl py-8">
        <ScriptPanel title="Windows CMD installer" subtitle="recommended" script={windowsCmd} label="Copy Windows CMD script" />
      </section>

      <section id="restart" className="mx-auto max-w-7xl py-8">
        <ScriptPanel title="Restart an existing install" subtitle="quick command" script={quickStart} label="Copy restart commands" />
      </section>

      <section className="mx-auto max-w-7xl py-8">
        <ScriptPanel title="macOS / Linux installer" subtitle="optional" script={macLinux} label="Copy shell script" />
      </section>

      <section className="mx-auto max-w-7xl pb-20 pt-8">
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-violet-200">After install</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Finish setup in the control dashboard.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Pick a mail mode, enter your domain, create aliases, and test local AI watchers. The installer prepares the local machine; the dashboard handles personal configuration.</p>
            </div>
            <a href="/dashboard" className="rounded-full bg-cyan-200 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_40px_rgba(94,234,212,.25)]">Open dashboard</a>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}

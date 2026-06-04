import Link from "next/link";

import { CopyScriptButton } from "@/components/copy-script-button";
import { PageShell } from "@/components/single-slab-page";
import { macLinux, oneLineWindows, quickStart, windowsCmd } from "@/lib/install-scripts";

const navItems = [
  { href: "/", label: "Trail" },
  { href: "/pass", label: "Pass" },
  { href: "/ecosystem", label: "Ecosystem" },
  { href: "/dashboard", label: "Control" },
];

const setupSteps = [
  {
    label: "01 / Copy",
    title: "Paste one command into Windows CMD.",
    body: "The fastest path downloads the official Trail installer from this page, saves it into your Temp folder, then runs it. You do not need to manually copy folders around.",
  },
  {
    label: "02 / Prepare",
    title: "The script checks Git, Node, and local folders.",
    body: "It installs missing basics with winget when possible, creates the local Trail home directory, and keeps mail, vault, graph, watcher, queue, and backup data under your user profile.",
  },
  {
    label: "03 / Build",
    title: "Trail is cloned, installed, and built locally.",
    body: "If Trail already exists as a Git checkout, the script updates it. If a non-Git folder is in the way, it gets moved aside instead of being destroyed.",
  },
  {
    label: "04 / Launch",
    title: "The web app and local node open together.",
    body: "After setup, Trail starts the local node and web app in separate command windows, then opens the browser so the dashboard can finish domain, alias, and watcher setup.",
  },
];

const folders = ["config", "keys", "vault", "mail", "attachments", "index", "graph", "watchers", "calendar", "orders", "queues", "backups", "logs", "drafts", "contacts"];

function ScriptBlock({ eyebrow, title, body, script, label, href, download }: { eyebrow: string; title: string; body: string; script: string; label: string; href?: string; download?: string }) {
  return (
    <section className="install-script-block" id={href ? undefined : title.toLowerCase().replaceAll(" ", "-")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {href ? <a className="soft-glass-button ghost" href={href}>{download ?? "Download"}</a> : null}
          <CopyScriptButton script={script} label={label} />
        </div>
      </div>
      <pre className="install-code">{script}</pre>
    </section>
  );
}

export const metadata = {
  title: "Install Trail",
  description: "One-copy install scripts for Trail local-first email OS.",
};

export default function InstallPage() {
  return (
    <PageShell brand="Install" brandHref="/install" navItems={navItems} action={{ href: "/dashboard", label: "Dashboard" }} tone="trail">
      <section className="mx-auto mt-10 flex max-w-6xl justify-center pb-10">
        <div className="single-slab mx-auto w-full max-w-[980px] rounded-[2.25rem] px-7 py-8 md:px-12 md:py-11">
          <div className="slab-topbar flex items-center justify-between pb-9 text-[9px] uppercase tracking-[0.32em] text-white/48">
            <span>trail install</span>
            <span className="hidden sm:inline">windows · local node · dashboard</span>
            <span>05</span>
          </div>

          <div className="grid gap-10 py-8 md:grid-cols-[1.05fr_.95fr] md:items-end md:py-12">
            <div>
              <p className="mb-5 text-[10px] uppercase tracking-[0.42em] text-amber-100/62">One-copy local setup</p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.92] tracking-[-0.08em] text-white md:text-7xl">Install Trail without guessing what to run.</h1>
            </div>
            <div className="space-y-5">
              <p className="max-w-xl text-base leading-8 text-white/66">This page is the clean setup path for the local-first email OS. Copy one Windows command, download the installer, or inspect the full scripts before running them. The installer prepares the app, the local node, and the user-owned storage folders that Trail needs.</p>
              <div className="flex flex-wrap gap-3">
                <a href="#one-line" className="soft-glass-button">Copy Windows command</a>
                <a href="/install/trail-install.cmd" className="soft-glass-button ghost">Download .cmd</a>
                <Link href="/dashboard" className="soft-glass-button ghost">Open dashboard</Link>
              </div>
            </div>
          </div>

          <div className="glass-column mt-2">
            <div className="quiet-coordinate"><p>CMD</p><span>fastest Windows path</span></div>
            <div className="quiet-coordinate"><p>~/.trail</p><span>local data home</span></div>
            <div className="quiet-coordinate"><p>3000</p><span>dashboard port</span></div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-3">
            <div className="quiet-line">
              <span>What this is</span>
              <p>A practical install page, not a random code dump. It tells the user what will happen, where data goes, what the script starts, and how to continue setup afterward.</p>
            </div>
            <div className="quiet-line">
              <span>What it creates</span>
              <p>Trail keeps local working state under your user profile: config, keys, vault, mail, attachments, search index, graph memory, watchers, queues, and backups.</p>
            </div>
            <div className="quiet-line">
              <span>What it does not do</span>
              <p>The installer does not magically configure your domain or read your inbox by itself. It gets the local app ready; the dashboard handles domain, alias, mail-mode, and watcher setup.</p>
            </div>
          </div>

          <section className="mt-12 border-t border-white/10 pt-10">
            <p className="section-kicker">Install flow</p>
            <h2 className="install-section-title">Four clear steps, all inside one local setup path.</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {setupSteps.map((step) => (
                <div className="install-step" key={step.label}>
                  <span>{step.label}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 border-t border-white/10 pt-10">
            <p className="section-kicker">Local folders</p>
            <h2 className="install-section-title">The installer makes a home for the private parts.</h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/66">These folders live under the Trail home directory so the product has an obvious place for config, vault state, mail fixtures, indexes, graph data, watcher rules, queues, and backups.</p>
            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-5">
              {folders.map((folder) => <code className="install-folder" key={folder}>~/.trail/{folder}</code>)}
            </div>
          </section>

          <section className="install-script-block mt-12 border-t border-white/10 pt-10" id="one-line">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Fastest Windows path</p>
                <h2>One line to paste into CMD.</h2>
                <p>Use this when you just want the local install to start. It downloads the Windows installer from the running Trail app and executes it from your Temp folder.</p>
              </div>
              <CopyScriptButton script={oneLineWindows} label="Copy one-line command" />
            </div>
            <pre className="install-code one-line">{oneLineWindows}</pre>
          </section>

          <ScriptBlock
            eyebrow="Recommended"
            title="Windows CMD installer"
            body="This is the full Windows installer. It checks prerequisites, prepares folders, clones or updates Trail, installs packages, builds the app, and starts the web app plus local node."
            script={windowsCmd}
            label="Copy Windows script"
            href="/install/trail-install.cmd"
            download="Download .cmd"
          />

          <ScriptBlock
            eyebrow="Restart"
            title="Restart an existing install"
            body="If Trail is already installed, these commands are the short manual path to restart the app and node from an existing checkout."
            script={quickStart}
            label="Copy restart commands"
          />

          <ScriptBlock
            eyebrow="Optional"
            title="macOS / Linux installer"
            body="The Unix path is here for completeness. The Windows installer is the main path for this machine, but the shell script keeps the project portable."
            script={macLinux}
            label="Copy shell script"
            href="/install/trail-install.sh"
            download="Download .sh"
          />

          <section className="mt-12 border-t border-white/10 pt-10">
            <p className="section-kicker">After install</p>
            <h2 className="install-section-title">Finish setup in the dashboard.</h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/66">Once the app is running, open Control to choose the mail mode, enter the domain, create aliases, test local messages, and define watchers. Install gets the machine ready; Control turns the install into your private email workspace.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/dashboard" className="soft-glass-button">Open dashboard</Link>
              <Link href="/" className="soft-glass-button ghost">Back to Trail</Link>
            </div>
          </section>
        </div>
      </section>
    </PageShell>
  );
}

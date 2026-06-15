import { exec } from "child_process";

// Uses a locally installed cloudflared to start a quick tunnel
// which gives us a random *.trycloudflare.com url that we can use as a disposable incoming webhook route
import { ChildProcess } from "child_process";
export async function startDisposableTunnel(localPort = 8787): Promise<{ url: string, process: ChildProcess }> {
  return new Promise((resolve, reject) => {
    // Assuming cloudflared is installed locally or globally
    const child = exec(`cloudflared tunnel --url http://localhost:${localPort}`);
    let urlResolved = false;

    child.stderr?.on("data", (data) => {
      const match = data.toString().match(/(https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com)/);
      if (match && !urlResolved) {
        urlResolved = true;
        resolve({ url: match[1], process: child });
      }
    });

    child.on("error", (err) => {
      if (!urlResolved) reject(err);
    });

    // Timeout if no URL is returned quickly
    setTimeout(() => {
      if (!urlResolved) {
        child.kill();
        reject(new Error("Failed to get TryCloudflare URL in time."));
      }
    }, 15000);
  });
}

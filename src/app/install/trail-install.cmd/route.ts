import { windowsCmd } from "@/lib/install-scripts";

export function GET() {
  return new Response(windowsCmd, {
    headers: {
      "Content-Type": "application/x-msdos-program; charset=utf-8",
      "Content-Disposition": 'attachment; filename="trail-install.cmd"',
      "Cache-Control": "public, max-age=300",
    },
  });
}

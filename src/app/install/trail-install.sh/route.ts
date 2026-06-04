import { macLinux } from "@/lib/install-scripts";

export function GET() {
  return new Response(macLinux, {
    headers: {
      "Content-Type": "text/x-shellscript; charset=utf-8",
      "Content-Disposition": 'attachment; filename="trail-install.sh"',
      "Cache-Control": "public, max-age=300",
    },
  });
}

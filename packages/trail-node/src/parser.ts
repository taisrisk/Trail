import * as path from "path";
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";

function decodeQuotedPrintable(str: string): string {
  return str
    .replace(/=\r?\n/g, "") // soft line breaks
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function decodeMimeWords(str: string): string {
  // Decode RFC 2047 MIME encoded words like =?UTF-8?B?c29tZXRoaW5n?= or =?UTF-8?Q?something?=
  return str.replace(/=\?([^?]+)\?([QB])\?([^?]*)\?=/gi, (_, charset, encoding, text) => {
    if (encoding.toUpperCase() === "B") {
      try {
        return Buffer.from(text, "base64").toString("utf8");
      } catch {
        return text;
      }
    } else if (encoding.toUpperCase() === "Q") {
      return decodeQuotedPrintable(text.replace(/_/g, " "));
    }
    return text;
  });
}

function cleanEmailHeader(val: string): string {
  const decoded = decodeMimeWords(val);
  const match = decoded.match(/<([^>]+)>/);
  return match ? match[1].trim() : decoded.trim();
}

export interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  body: string;
  date?: string;
}

export function parseEml(raw: string): ParsedEmail {
  const parts = raw.split(/\r?\n\r?\n/);
  const headerSection = parts[0] || "";
  const bodySection = parts.slice(1).join("\n");

  const headers: Record<string, string> = {};
  let currentHeader = "";

  const lines = headerSection.split(/\r?\n/);
  for (const line of lines) {
    if (/^\s/.test(line)) {
      if (currentHeader) {
        headers[currentHeader] += " " + line.trim();
      }
    } else {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        currentHeader = match[1].toLowerCase();
        headers[currentHeader] = match[2].trim();
      }
    }
  }

  let body = bodySection;
  const contentType = headers["content-type"] || "";
  if (contentType.includes("boundary=")) {
    const boundaryMatch = contentType.match(/boundary=["']?([^"';\s]+)["']?/);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const mimeParts = bodySection.split(`--${boundary}`);
      // Locate the text part or the first non-multipart part
      for (const part of mimeParts) {
        if (part.includes("Content-Type: text/plain") || !part.includes("Content-Type:")) {
          const contentParts = part.split(/\r?\n\r?\n/);
          const partBody = contentParts.slice(1).join("\n").trim();
          if (partBody && partBody !== "--") {
            body = partBody;
            break;
          }
        }
      }
    }
  }

  body = body.replace(/--\s*$/, "").trim();

  const transferEncoding = (headers["content-transfer-encoding"] || "").toLowerCase();
  if (transferEncoding === "base64") {
    try {
      body = Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8");
    } catch {}
  } else if (transferEncoding === "quoted-printable") {
    body = decodeQuotedPrintable(body);
  }

  return {
    from: cleanEmailHeader(headers["from"] || "unknown@example.com"),
    to: cleanEmailHeader(headers["to"] || "inbox@yourdomain.com"),
    subject: decodeMimeWords(headers["subject"] || "(no subject)"),
    body: body,
    date: headers["date"]
  };
}

export function parseMbox(raw: string): ParsedEmail[] {
  const messages: string[] = [];
  const lines = raw.split(/\r?\n/);
  let currentMessage: string[] = [];

  for (const line of lines) {
    if (line.startsWith("From ")) {
      if (currentMessage.length > 0) {
        messages.push(currentMessage.join("\n"));
        currentMessage = [];
      }
    } else {
      currentMessage.push(line);
    }
  }
  if (currentMessage.length > 0) {
    messages.push(currentMessage.join("\n"));
  }

  return messages.map(parseEml);
}

export async function parseMaildir(dirPath: string): Promise<ParsedEmail[]> {
  const result: ParsedEmail[] = [];
  const subdirs = ["new", "cur"];
  
  for (const sub of subdirs) {
    const subdirPath = path.join(dirPath, sub);
    if (!existsSync(subdirPath)) continue;
    
    const files = await readdir(subdirPath);
    for (const file of files) {
      const filePath = path.join(subdirPath, file);
      const content = await readFile(filePath, "utf8");
      result.push(parseEml(content));
    }
  }
  
  return result;
}

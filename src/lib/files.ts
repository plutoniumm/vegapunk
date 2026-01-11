import JSZip from "jszip";

export async function read (file: File): Promise<string> {
  const name = file.name.toLowerCase();
  console.log("Reading uploaded file:", name);

  if (name.endsWith(".txt"))
    return await file.text();

  if (name.endsWith(".epub"))
    return await extractEPUB(file);

  throw new Error("Unsupported file. Not .txt/.epub");
}

async function extractEPUB (file: File): Promise<string> {
  let zip = await file.arrayBuffer();
  zip = await JSZip.loadAsync(zip);

  const container = zip.file("META-INF/container.xml");
  if (!container)
    throw new Error("Invalid EPUB: missing container.xml");

  const xml = await container.async("string");
  const root = Attr(xml, "rootfile", "full-path");
  if (!root)
    throw new Error("Invalid EPUB: missing rootfile path");

  const OPF = zip.file(root);
  if (!OPF) throw new Error("Invalid EPUB: missing OPF");
  const opfXml = await OPF.async("string");

  const manifest: Record<string, string> = {};
  for (const { id, href } of Manifest(opfXml)) {
    manifest[id] = href;
  }

  const base = root.split("/").slice(0, -1).join("/");
  const texts: string[] = [];
  for (const id of spineIDs(opfXml)) {
    const href = manifest[id];
    if (!href) continue;

    const cPath = base ? `${base}/${href}` : href;
    const entry = zip.file(cPath);

    if (!entry) continue;
    const xhtml = await entry.async("string");
    texts.push(extractText(xhtml));
  }

  return texts.join("\n\n").trim();
}

interface ManiItem {
  id: string;
  href: string;
}

function Manifest (xml: string): Array<ManiItem> {
  const items: ManiItem[] = [];
  const regex = /<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*>/g;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(xml))) {
    items.push({ id: m[1], href: m[2] });
  };

  return items;
}

function spineIDs (xml: string): string[] {
  const ids: string[] = [];
  const regex = /<itemref[^>]*idref="([^"]+)"[^>]*>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml))) {
    ids.push(m[1]);
  };

  return ids;
}

function Attr (xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"[^>]*>`);
  const m = re.exec(xml);

  return m ? m[1] : null;
}

function extractText (xhtml: string): string {
  let s = xhtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  s = s.replace(/<\s*br\s*\/?>/gi, "\n");
  s = s.replace(/<\s*\/(p|div|h\d|li)\s*>/gi, "\n");

  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  s = s
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return s;
}

export function ETA (current, total) {
  const remaining = total - current;
  const wpm = 300;
  const minutes = Math.ceil(remaining / wpm);

  if (minutes <= 1) return "1 min read";
  if (minutes > 60) {
    const hours = Math.ceil(minutes / 60);

    return hours + " hours read";
  };

  return minutes + " mins read";
}
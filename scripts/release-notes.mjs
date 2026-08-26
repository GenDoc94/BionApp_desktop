import { readFileSync, writeFileSync } from "node:fs";

const version = String(process.argv[2] ?? "")
  .trim()
  .replace(/^v/i, "");
const outFile = process.argv[3] ?? "release-notes.md";
if (!version) {
  console.error("Uso: node scripts/release-notes.mjs <version> [outfile]");
  process.exit(1);
}

const markdown = readFileSync("CHANGELOG.md", "utf8");
const escaped = version.replace(/\./g, "\\.");
const sectionRe = new RegExp(`##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`);
const match = markdown.match(sectionRe);
const body = match ? match[1].trim() : "";

const notes = [
  `# BionApp ${version}`,
  "",
  body || "- Publicación de BionApp Desktop.",
  "",
  "Descarga `BionApp.exe` (Windows x64, portable).",
  "Conserva tu carpeta de datos (`bionapp.sqlite` y `documentos/`) al actualizar.",
  "El ejecutable no está firmado: si SmartScreen avisa, usa *Más información* → *Ejecutar de todas formas*.",
  "",
].join("\n");

writeFileSync(outFile, notes, "utf8");

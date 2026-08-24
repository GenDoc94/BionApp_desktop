import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const API_PREFIX = "/api/documentos";

function documentosDir(root: string) {
  return path.join(root, "documentos");
}

function safeFilename(raw: string): string | null {
  const base = path.basename(decodeURIComponent(raw)).trim();
  if (!base || base === "." || base === ".." || /[<>:"|?*\x00-\x1f]/.test(base)) {
    return null;
  }
  return base;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function contentTypeFor(name: string): string {
  const ext = path.extname(name).toLowerCase();
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".txt": "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}

function createMiddleware(root: string) {
  const dir = documentosDir(root);

  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url ?? "";
    if (!url.startsWith(API_PREFIX)) {
      next();
      return;
    }

    await fsp.mkdir(dir, { recursive: true });

    const method = req.method ?? "GET";
    const rest = url.slice(API_PREFIX.length);

    try {
      if (method === "GET" && (rest === "" || rest === "/")) {
        const entries = await fsp.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(
          entries
            .filter((e) => e.isFile())
            .map(async (e) => {
              const stat = await fsp.stat(path.join(dir, e.name));
              return {
                name: e.name,
                size: stat.size,
                updatedAt: stat.mtime.toISOString(),
              };
            })
        );
        files.sort((a, b) => a.name.localeCompare(b.name, "es"));
        sendJson(res, 200, { files });
        return;
      }

      const downloadMatch = rest.match(/^\/([^?]+)$/);
      if (method === "GET" && downloadMatch) {
        const name = safeFilename(downloadMatch[1]);
        if (!name) {
          sendJson(res, 400, { error: "Nombre de archivo no válido" });
          return;
        }
        const filePath = path.join(dir, name);
        if (!fs.existsSync(filePath)) {
          sendJson(res, 404, { error: "Archivo no encontrado" });
          return;
        }
        const data = await fsp.readFile(filePath);
        res.statusCode = 200;
        res.setHeader("Content-Type", contentTypeFor(name));
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}"`);
        res.end(data);
        return;
      }

      const uploadMatch = rest.match(/^\/([^?]+)$/);
      if (method === "PUT" && uploadMatch) {
        const name = safeFilename(uploadMatch[1]);
        if (!name) {
          sendJson(res, 400, { error: "Nombre de archivo no válido" });
          return;
        }
        const data = await readBody(req);
        if (!data.length) {
          sendJson(res, 400, { error: "Archivo vacío" });
          return;
        }
        await fsp.writeFile(path.join(dir, name), data);
        sendJson(res, 200, { ok: true, name });
        return;
      }

      if (method === "DELETE" && uploadMatch) {
        const name = safeFilename(uploadMatch[1]);
        if (!name) {
          sendJson(res, 400, { error: "Nombre de archivo no válido" });
          return;
        }
        const filePath = path.join(dir, name);
        if (!fs.existsSync(filePath)) {
          sendJson(res, 404, { error: "Archivo no encontrado" });
          return;
        }
        await fsp.unlink(filePath);
        sendJson(res, 200, { ok: true });
        return;
      }

      sendJson(res, 405, { error: "Método no permitido" });
    } catch (err) {
      console.error("[documentos-api]", err);
      sendJson(res, 500, { error: "Error en el servidor de documentos" });
    }
  };
}

export function documentosApiPlugin(): Plugin {
  let root = process.cwd();

  const attach = (server: { middlewares: { use: (fn: ReturnType<typeof createMiddleware>) => void } }) => {
    server.middlewares.use(createMiddleware(root));
  };

  return {
    name: "bionapp-documentos-api",
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      attach(server);
    },
    configurePreviewServer(server) {
      attach(server);
    },
  };
}

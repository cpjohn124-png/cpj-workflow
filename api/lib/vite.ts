import type { Hono } from "hono";

export async function serveStaticFiles(app: Hono) {
  try {
    const { default: viteConfig } = await import("../../vite.config");
    const outDir = viteConfig.build?.outDir || "dist/public";
    app.use("/*", async (c, next) => {
      try {
        const filePath = c.req.path === "/" ? "/index.html" : c.req.path;
        const file = await import("node:fs").then(fs => fs.promises.readFile(`./${outDir}${filePath}`));
        const ext = filePath.split(".").pop();
        const contentType = ext === "js" ? "application/javascript" : ext === "css" ? "text/css" : ext === "html" ? "text/html" : "application/octet-stream";
        return c.new Response(file, { headers: { "Content-Type": contentType } });
      } catch { return next(); }
    });
  } catch { /* vite not available in production */ }
}

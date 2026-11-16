// Usage: node scripts/bridge-stills.mjs <outPrefix> <frame,frame,...> [scale]
import fs from "node:fs";
import path from "node:path";

// Set the temp directory before Remotion loads and initializes its temp paths.
if (process.env.REMOTION_TMP) {
  const temp = path.resolve(process.env.REMOTION_TMP);
  fs.mkdirSync(temp, { recursive: true });
  process.env.TEMP = temp;
  process.env.TMP = temp;
  process.env.TMPDIR = temp;
}
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");

const [prefix, frames, scale = "0.5"] = process.argv.slice(2);
const id = process.env.BRIDGE_COMPOSITION || "BridgeShort";
const browserExecutable = process.env.BRIDGE_BROWSER_EXECUTABLE || undefined;
const chromiumOptions = { gl: "angle" };
const serveUrl = await bundle({
  entryPoint: path.resolve(process.env.BRIDGE_ENTRY || "src/index.ts"),
  publicDir: path.resolve("public"),
});
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
const onBrowserLog = ({ type, text }) => {
  if (type === "error" || type === "warning") console.log(`[${type}]`, text.slice(0, 300));
};

for (const frame of frames.split(",").map(Number)) {
  const startedAt = Date.now();
  await renderStill({
    composition,
    serveUrl,
    frame,
    output: `${prefix}${frame}.jpg`,
    imageFormat: "jpeg",
    jpegQuality: 88,
    scale: Number(scale),
    browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: 180000,
    onBrowserLog,
  });
  console.log("still", frame, ((Date.now() - startedAt) / 1000).toFixed(1) + "s");
}

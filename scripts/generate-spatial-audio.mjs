import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import ts from "typescript";

// Load the pure content catalog without adding a build-time TypeScript runner dependency.
const modules = new Map();
function load(file) {
  const full = path.resolve(file);
  if (modules.has(full)) return modules.get(full);
  const mod = { exports: {} };
  modules.set(full, mod.exports);
  const code = ts.transpileModule(fs.readFileSync(full, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "module", "exports", code)((name) => load(path.resolve(path.dirname(full), `${name}.ts`)), mod, mod.exports);
  return mod.exports;
}
const { spatialJourneyScenes, spatialJourneyIslands } = load("lib/kids/spatial-journey.ts");
const texts = new Set();
for (const scene of spatialJourneyScenes) {
  texts.add(scene.narration.subtitle);
  scene.hintText.forEach((s) => texts.add(s));
  if (scene.interaction.kind === "observe") scene.interaction.steps.forEach((s) => { texts.add(s.prompt); texts.add(s.relation); });
  if (scene.interaction.kind === "guided-build") scene.interaction.steps.forEach((s) => texts.add(s.relation));
}
spatialJourneyIslands.forEach((island) => island.restorationEffects.forEach((e) => texts.add(e.label)));
texts.add("再看看观察板上的形状。");
texts.add("这里多出了一块，看看哪个方向不一样。");
const destination = path.resolve("public/kids/audio/spatial-journey");
fs.mkdirSync(destination, { recursive: true });
const manifest = [];
for (const subtitle of texts) {
  const id = crypto.createHash("sha256").update(subtitle).digest("hex").slice(0, 12);
  const file = path.join(destination, `${id}.mp3`);
  if (!fs.existsSync(file)) execFileSync("python", ["-m", "edge_tts", "--voice", "zh-CN-XiaoxiaoNeural", "--rate=-5%", "--text", subtitle, "--write-media", file], { stdio: "inherit" });
  let durationSeconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file], { encoding: "utf8" }).trim());
  if (durationSeconds < 2) {
    const padded = path.join(destination, `${id}.padded.mp3`);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-af", "apad", "-t", "2.05", padded]);
    fs.renameSync(padded, file);
    durationSeconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file], { encoding: "utf8" }).trim());
  }
  manifest.push({ subtitle, audioSrc: `/kids/audio/spatial-journey/${id}.mp3`, durationSeconds });
  console.log(`${manifest.length}/${texts.size} ${subtitle} ${durationSeconds}s`);
}
fs.writeFileSync("public/kids/audio/spatial-journey-manifest.json", JSON.stringify({ voice: "zh-CN-XiaoxiaoNeural", rate: "-5%", clips: manifest }, null, 2) + "\n", "utf8");

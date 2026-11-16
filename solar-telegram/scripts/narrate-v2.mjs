import {mkdir, readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {env} from "@huggingface/transformers";
import {KokoroTTS} from "kokoro-js";

const requested = new Set(process.argv.slice(2));
const version = requested.delete("--v4") ? "v4" : requested.delete("--v3") ? "v3" : "v2";
const audition = requested.delete("--audition");
const takes = resolve(`out/${version}-takes`);
const dialogue = JSON.parse(await readFile(`src/${version}/dialogue.json`, "utf8"));
const voiceFor = {narrator: version === "v2" ? "af_heart" : "af_bella", boston: "am_michael", portland: "am_puck"};
const alternateReads = {
  surge: [["The signal cuts out. Then the current slams back! Boston jumps, and his chair shoots backward.", 1.12],
    ["The signal cuts out. Then the current SLAMS back! Boston jumps and his chair shoots backward!", 1.22],
    ["The signal cuts out. Then the current slams BACK! Boston jumps! And his chair shoots backward.", 1.18]],
  fire: [["Across the network, sparks leap from the equipment. At one station, the paper catches fire.", 1.11],
    ["Across the network, sparks LEAP from the equipment. At one station the paper catches FIRE!", 1.22],
    ["Across the network, sparks leap from the equipment! At one station, the paper catches fire!", 1.17]],
  cut: [["Cut off your battery!", 1.05], ["Cut OFF your battery!", 1.15], ["Cut off your BATTERY!", 1.11]],
  reply: [["Better than before.", 0.89], ["Better... than before.", 0.97], ["Better than before?", 0.92]],
};

env.cacheDir = resolve("../.tools/kokoro-models");
await mkdir(takes, {recursive: true});
const narrator = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
  device: "cpu",
  dtype: "q8",
});

for (const beat of dialogue) {
  for (const {id, who, speed, text} of beat.lines) {
    if (requested.size && !requested.has(id)) continue;
    if (audition) {
      const reads = alternateReads[id];
      if (!reads) continue;
      for (const [index, [read, rate]] of reads.entries()) {
        const take = await narrator.generate(read, {voice: voiceFor[who], speed: rate});
        await take.save(resolve(takes, `${id}-${index + 1}.wav`));
        console.log(`${id}-${index + 1}: ${(take.audio.length / take.sampling_rate).toFixed(2)}s (${voiceFor[who]})`);
      }
      continue;
    }
    const take = await narrator.generate(text, {voice: voiceFor[who], speed});
    await take.save(resolve(takes, `${id}.wav`));
    console.log(`${id}: ${(take.audio.length / take.sampling_rate).toFixed(2)}s (${voiceFor[who]})`);
  }
}

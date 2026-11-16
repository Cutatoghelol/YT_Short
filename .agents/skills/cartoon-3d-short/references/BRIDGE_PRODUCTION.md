# Bridge production notes

The scene, sound, and QA examples come from [upstream revision e3b817b6](https://github.com/mromidev/claude-animated-shorts/tree/e3b817b6afc6cd413466d43f11ba31209e034bbf) under the [MIT license](../LICENSE). The upstream [reference frames](https://github.com/mromidev/claude-animated-shorts/tree/e3b817b6afc6cd413466d43f11ba31209e034bbf/references/frames) and [contact sheets](https://github.com/mromidev/claude-animated-shorts/tree/e3b817b6afc6cd413466d43f11ba31209e034bbf/references/sheets) are for visual study.

## Set up the project

- Reuse the project's Remotion entry point and matched Remotion package versions. For a new project, set up Remotion and its CLI, `@remotion/three`, Three.js, React Three Fiber, `@react-three/postprocessing`, and `postprocessing`. The batch still helper uses `@remotion/bundler` and `@remotion/renderer`. Audio and QA use Python with NumPy, SciPy, and Pillow, plus `ffmpeg` and `ffprobe` on PATH.
- Copy [the Bridge scene](../templates/bridge/) into the new video's source folder. Register a composition at 1080 × 1920 and 30 fps and set its duration from the new story timeline. Use the [example entry](../templates/sandbox_index_example.tsx) as a registration reference and update its imports and composition ID.
- The Bridge example loads selected [Kenney Nature Kit](https://kenney.nl/assets/nature-kit) and [Fantasy Town Kit](https://kenney.nl/assets/fantasy-town-kit) GLBs from `public/bridge/kenney/`. See the model list and static paths in [world.ts](../templates/bridge/world.ts). Supply the assets the scene uses, including textures referenced by the GLBs, or replace the props and asset paths. The loader skips missing models, so check scenery even when the render succeeds.
- Upstream reports blank frames with `@react-three/postprocessing` 3.0.5 and later in a fresh setup. If a lit test frame is blank, inspect browser errors and asset loads, then test composer passes individually using the template's `post` input props. The report documents a working 3.0.4 setup with a fragment around composer children. Verify peer versions and a representative still before using that combination. [Upstream fix discussion](https://github.com/mromidev/claude-animated-shorts/pull/15)

## Rendering details

- Keep scene lighting on the billboards, with planted feet and contact shadows. The characters carry their own plum outlines in Canvas2D and stay on the `NOINK` layer. Use painted geometry and warm light with cooler shadows. Match fog to the horizon color and cull scenery that blocks sightlines.
- Run the world outline pass on its own before the lens blur passes, then apply bloom, neutral tone mapping, and grading. Scale pixel-sized post parameters with output height relative to 1920 and keep grain off for the template look. Consult [the reports](reports/) for reference measurements and [the scene source](../templates/bridge/) for the Bridge settings.
- Review the hook, a wide and a close-up, daytime and any alternate lighting, and frames around an impact or transition. Check successive frames where camera motion brings a prop or character near the lens.

## Render and validate

Run from the Remotion root. Use the same entry point, registered composition ID, and browser settings for previews and the final render. These PowerShell examples assume `src/index.ts`, a composition called `MyShort`, and in-range frames 45 and 240. Set the temp variables before starting Remotion and choose a project-owned directory on a drive with enough space for repeated bundles of `public/`.

```powershell
$entry = 'src/index.ts'
$composition = 'MyShort'
$env:REMOTION_TMP = Join-Path (Get-Location).Path 'out/remotion-tmp'
New-Item -ItemType Directory -Path $env:REMOTION_TMP -Force | Out-Null
$env:TEMP = $env:TMP = $env:TMPDIR = $env:REMOTION_TMP

# Set BRIDGE_BROWSER_EXECUTABLE to a verified Chrome or Chromium path if needed.
$browserArgs = @()
if ($env:BRIDGE_BROWSER_EXECUTABLE) {
    $browserArgs += "--browser-executable=$env:BRIDGE_BROWSER_EXECUTABLE"
}

npx remotion still $entry $composition out/preview.jpg --frame=45 --gl=angle @browserArgs
```

For batch previews, copy [bridge-stills.mjs](../templates/scripts/bridge-stills.mjs) into the Remotion project's `scripts/` directory so it resolves the project's Node dependencies. The helper reads `BRIDGE_ENTRY`, `BRIDGE_COMPOSITION`, optional `BRIDGE_BROWSER_EXECUTABLE`, and `REMOTION_TMP`. When no browser path is supplied, Remotion selects its browser.

```powershell
$env:BRIDGE_ENTRY = $entry
$env:BRIDGE_COMPOSITION = $composition
node scripts/bridge-stills.mjs out/preview- 45,240 0.5
```

Place the project-specific `audio/` and `voice/` folders next to each other for the [mixer](../templates/audio/mix.py). Use a 48 kHz `voice.wav` and a JSON list of words with `s` and `e` timestamps in seconds for ducking. Update the Bridge-specific duration, music sections, and SFX times before running it. Use a fresh audio cache after narration or timing changes.

Once the stills pass, render at 4/3 scale to reach 1440 × 2560 from the 1080 × 1920 composition. For a composition already at delivery resolution, omit the scale flag.

```powershell
npx remotion render $entry $composition out/picture.mp4 --codec=h264 --crf=16 --scale=1.3333333333333333 --gl=angle @browserArgs
ffmpeg -i out/picture.mp4 -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart out/final.mp4
ffprobe -v error -show_streams -show_format out/final.mp4
```

Copy [short_qa.py](../templates/scripts/short_qa.py) into `scripts/` and run `python scripts/short_qa.py out/final.mp4 out/qa out/shots.json` with the current project's shot bounds and planned cuts or flashes. The [Bridge shot extractor](../templates/scripts/bridge_shots.py) expects the Bridge `story.ts` layout and writes to `out/bridge/shots.json`. Adapt it or supply the JSON directly when the timeline differs. Review flagged frames around intentional transitions and listen for clipped peaks, gaps in narration, or a bed that masks speech.

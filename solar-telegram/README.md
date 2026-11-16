# The Sun Sent a Telegram

A 62-second animated Short about the 1859 Carrington Event. See [the script and historical sources](SCRIPT.md).

## Edit and preview

Run `npm ci` and `npm run dev` from this folder. Open the `SolarTelegram` composition in Studio. The shot boundaries and cameras live in [story.ts](src/story.ts), and [cues.json](src/cues.json) drives both relay animation and sound.

The composition uses the finished mix in Studio. Set `mixReady` to false to preview with narration alone. The project vendors the Bridge templates for painted materials, character cards, ink, and lens blur under [their upstream MIT license](src/bridge/LICENSE).

## V2 recut

Open `SolarTelegramV2` in Studio. The [V2 script and sources](SCRIPT-V2.md) link to the dialogue and voice assignments. Edit the V2 shots and effect cues under `src/v2/`. In Studio, `captions` controls the overlay and `mixReady` switches between the stereo mix and the dry dialogue.

The local V2 voice build uses Kokoro on the CPU and whisper.cpp for alignment. The first synthesis downloads the weights into the workspace tools directory. Run these PowerShell commands from the video project to rebuild the audio after editing the script.

```powershell
$ffmpeg = '../.tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe'
$whisper = '../.tools/whisper-v1.8.3/Release/whisper-cli.exe'
node scripts/narrate-v2.mjs
python scripts/voice-v2.py voice --ffmpeg $ffmpeg
& $whisper -m ../.tools/ggml-base.en.bin -f out/v2-takes/locked.wav -l en -ng -dtw base.en -ojf -of out/v2-takes/aligned
python scripts/voice-v2.py align
python scripts/mix-v2.py --ffmpeg $ffmpeg
```

Review word timings, shots, and cues after any dialogue changes. To export V2, render `SolarTelegramV2` with the same picture settings below, then mux it with `public/voice-v2/mix.wav` into `out/The-Sun-Sent-a-Telegram-V2.mp4`.

## V3 recut

Open `SolarTelegramV3` in Studio. The [history and script](SCRIPT-V3.md), [shot plan](src/v3/story.ts), and [effect cues](src/v3/cues.json) are editable. The aligned words drive the color-coded captions, and the dry dialogue drives the operators' mouth shapes.

Use the same `$ffmpeg` and `$whisper` paths from the V2 section to rebuild the V3 audio.

```powershell
node scripts/narrate-v2.mjs --v3
python scripts/voice-v2.py voice --version v3 --ffmpeg $ffmpeg
& $whisper -m ../.tools/ggml-base.en.bin -f out/v3-takes/locked.wav -l en -ng -dtw base.en -ojf -of out/v3-takes/aligned
python scripts/voice-v2.py align --version v3
python scripts/mix-v2.py --version v3 --ffmpeg $ffmpeg

npx remotion render SolarTelegramV3 out/v3-picture.mp4 --muted --codec=h264 --crf=16 --scale=1.3333333333333333 --gl=angle
& $ffmpeg -i out/v3-picture.mp4 -i public/voice-v3/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart out/The-Sun-Sent-a-Telegram-V3.mp4
```

## V4 recut

Open `SolarTelegramV4` in Studio. The [V4 script and sources](SCRIPT-V4.md) link to the locked speech windows and selected takes. [The shot plan](src/v4/story.ts) and [shared animation and sound cues](src/v4/cues.json) define the edit. With the V2 section’s FFmpeg and whisper.cpp paths set, regenerate the local voice and mix as follows.

```powershell
node scripts/narrate-v2.mjs --v4
node scripts/narrate-v2.mjs --v4 --audition
python scripts/voice-v2.py voice --version v4 --ffmpeg $ffmpeg
& $whisper -m ../.tools/ggml-base.en.bin -f out/v4-takes/locked.wav -l en -ng -dtw base.en -ojf -of out/v4-takes/aligned
python scripts/voice-v2.py align --version v4
python scripts/mix-v2.py --version v4 --ffmpeg $ffmpeg

'{"detail":1.3333333333333333,"captions":true,"mixReady":true}' | Set-Content -Encoding utf8 out/v4-master-props.json
npx remotion render SolarTelegramV4 out/v4-picture.mp4 --muted --props=out/v4-master-props.json --codec=h264 --crf=16 --scale=1.3333333333333333 --gl=angle
& $ffmpeg -i out/v4-picture.mp4 -i public/voice-v4/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart out/The-Sun-Sent-a-Telegram-V4.mp4
```

## Rebuild audio and export

The audio build uses Microsoft Zira Desktop through Windows PowerShell, Python with NumPy, and FFmpeg. The FFmpeg executables for this workspace live in the parent folder's `.tools` directory. In PowerShell, point `$ffmpeg` to that executable or use `'ffmpeg'` if already on PATH.

```powershell
$ffmpeg = '../.tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe'
powershell.exe -NoProfile -File scripts/narrate.ps1
python scripts/audio.py voice --ffmpeg $ffmpeg
python scripts/audio.py mix --ffmpeg $ffmpeg

npx remotion render SolarTelegram out/picture.mp4 --muted --codec=h264 --crf=16 --scale=1.3333333333333333 --gl=angle
& $ffmpeg -i out/picture.mp4 -i public/voice/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -movflags +faststart out/The-Sun-Sent-a-Telegram.mp4
```

If you change the narration, rebuild both audio stages and check the click cues and shot boundaries against the new word timings. The frame QA helper in `scripts/short_qa.py` also needs Pillow and both FFmpeg executables on PATH.

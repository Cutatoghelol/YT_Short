"""Prepare narration and synthesize the score and effects for the locked cut."""

import argparse
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
VOICE = ROOT / "public/voice"
TAKES = ROOT / "out/voice-takes"
RATE = 48_000
SECONDS = 62
WINDOWS = [(0, 4), (4, 14), (14, 26), (26, 44), (44, 56), (56, 62)]


def read_wave(path):
    with wave.open(str(path), "rb") as track:
        assert track.getnchannels() == 1 and track.getsampwidth() == 2, path
        return np.frombuffer(track.readframes(track.getnframes()), dtype="<i2"), track.getframerate()


def save_wave(path, samples):
    pcm = np.int16(np.clip(samples, -1, 1) * 32767)
    with wave.open(str(path), "wb") as track:
        track.setparams((1 if pcm.ndim == 1 else pcm.shape[1], 2, RATE, len(pcm), "NONE", ""))
        track.writeframes(pcm.tobytes())


def shorten_pauses(samples, rate):
    block = rate // 100
    blocks = np.abs(samples[:len(samples) // block * block].astype("int32")).reshape(-1, block)
    active = np.flatnonzero(blocks.max(axis=1) > 180)
    if not len(active):
        raise ValueError("Empty narration take")
    cuts = [(0, max(0, active[0] - 4) * block)]
    for left, right in zip(active[:-1], active[1:]):
        if right - left >= 29:
            keep = 12 if right - left < 85 else 18
            cuts.append(((left + keep // 2) * block, (right - keep // 2) * block))
    cuts.append((min(len(samples), (active[-1] + 9) * block), len(samples)))
    trimmed = np.concatenate([samples[left[1]:right[0]] for left, right in zip(cuts[:-1], cuts[1:])])
    return trimmed, cuts


def make_voice(ffmpeg):
    VOICE.mkdir(parents=True, exist_ok=True)
    narration = np.zeros(SECONDS * RATE)
    words = []
    for start, end in WINDOWS:
        samples, rate = read_wave(TAKES / f"{start}.wav")
        trimmed, cuts = shorten_pauses(samples, rate)
        lead = 0.14 if start == 0 else 0.60 if start == 56 else 0.20
        tail = 0.33 if start < 56 else 0.85
        target = end - start - lead - tail
        tempo = max(0.97, min(1.18, len(trimmed) / rate / target))
        result = subprocess.run(
            [ffmpeg, "-v", "error", "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "pipe:0",
             "-af", f"atempo={tempo:.7f},highpass=f=72", "-ar", str(RATE), "-f", "s16le", "pipe:1"],
            input=trimmed.tobytes(), check=True, capture_output=True,
        )
        signal = np.frombuffer(result.stdout, dtype="<i2").astype(float) / 32768.0
        assert len(signal) / RATE + lead < end - start, (start, len(signal) / RATE)
        offset = round((start + lead) * RATE)
        narration[offset:offset + len(signal)] = signal
        events = []
        for row in (TAKES / f"{start}.tsv").read_text(encoding="utf-8").splitlines():
            t, _, _, word = row.split("\t", 3)
            # Zira's SAPI events use the engine's 16 kHz byte clock. The WAV
            # header reports the 22.05 kHz playback clock.
            raw = float(t) * 16_000
            removed = sum(max(0, min(raw, b) - a) for a, b in cuts)
            mapped = start + lead + (raw - removed) / rate / tempo
            events.append((max(start + lead, mapped), word))
        finish = start + lead + len(signal) / RATE - 0.045
        for i, (t, word) in enumerate(events):
            next_time = events[i + 1][0] if i + 1 < len(events) else finish
            words.append({"word": word, "s": round(t, 3), "e": round(max(t + 0.018, next_time - 0.012), 3)})
        print(f"{start:02d}s: {len(events)} words, {len(signal) / RATE:.2f}s, rate {tempo:.3f}")
    save_wave(VOICE / "voice.wav", narration)
    (VOICE / "words.json").write_text(json.dumps(words, indent=2) + "\n", encoding="utf-8")


def makeup_voice(signal):
    active = signal[np.abs(signal) > 0.009]
    return signal * min(2.5, 0.115 / np.sqrt(np.mean(active ** 2)))


def mix(ffmpeg):
    narration = makeup_voice(read_wave(VOICE / "voice.wav")[0].astype(float) / 32768)
    words = json.loads((VOICE / "words.json").read_text(encoding="utf-8"))
    cues = json.loads((ROOT / "src/cues.json").read_text(encoding="utf-8"))
    rng = np.random.default_rng(1859)
    n = SECONDS * RATE
    music = np.zeros((n, 2))
    effects = np.zeros((n, 2))
    time = np.arange(n) / RATE

    def add(stem, at, values, volume, pan=0):
        first = round(at * RATE)
        values = values[:n - first] * volume
        stem[first:first + len(values), :] += values[:, None] * np.sqrt([(1 - pan) / 2, (1 + pan) / 2])

    def bell(midi, length, decay):
        seconds = np.arange(round(length * RATE)) / RATE
        phase = 2 * np.pi * (440 * 2 ** ((midi - 69) / 12)) * seconds
        overtones = np.sin(phase) + 0.24 * np.sin(2 * phase) + 0.09 * np.sin(3.997 * phase)
        return overtones * (1 - np.exp(-seconds * 220)) * np.exp(-seconds * decay)

    for i, at in enumerate(np.arange(4.3, 57, 0.52)):
        if 20.7 < at < 24.6 or at > 55.7:
            continue
        phrase = i // 8
        chord = [(45, 52, 57, 60), (41, 48, 53, 57), (48, 55, 60, 64), (43, 50, 55, 59)][phrase % 4]
        if i % 2 == 0:
            add(music, at, bell(chord[(i // 2) % 4] + 12, 0.92, 5.5), 0.026, (-1) ** i * 0.35)
        if i % 8 == 0:
            for j, note in enumerate(chord[:3]):
                add(music, at, bell(note, 3.2, 1.9), 0.018, (j - 1) * 0.42)
    for at, note in [(27.2, 45), (28.18, 52), (30.03, 57), (41.65, 64), (43.16, 69)]:
        add(music, at, bell(note, 2.7, 1.6), 0.04, 0.2)

    # Filtered noise and a low motor tone sit beneath the office scenes.
    coarse = rng.normal(0, 0.55, SECONDS * 290)
    room = np.interp(time, np.arange(len(coarse)) / 290, coarse) * 0.0037
    room += 0.0019 * np.sin(2 * np.pi * 83 * time)
    add(effects, 0, room * np.where((time >= 26) & (time < 44), 0.25, 1), 1, -0.1)
    for i, frame in enumerate(cues["clicks"]):
        seconds = np.arange(round(0.073 * RATE)) / RATE
        ring = np.sin(2 * np.pi * 1420 * seconds) + 0.46 * np.sin(2 * np.pi * 2760 * seconds)
        click = (0.46 * ring + 0.55 * rng.normal(0, 0.35, len(seconds))) * np.exp(-seconds * 145)
        volume = 0.34 if frame in cues["accentClicks"] else 0.22
        add(effects, frame / 30, click, volume, (-1 if i % 2 else 1) * 0.22)
    for frame in cues["disconnects"]:
        add(effects, frame / 30, bell(44, 0.16, 25), 0.12, -0.18)
    for at, duration, volume in [(15, 2.2, 0.018), (27.1, 3.5, 0.033), (40.0, 3.7, 0.022)]:
        seconds = np.arange(round(duration * RATE)) / RATE
        envelope = np.sin(np.pi * seconds / duration) ** 2
        flutter = np.sin(2 * np.pi * (51 * seconds + 6 * seconds ** 2))
        add(effects, at, envelope * (flutter * 0.5 + rng.normal(0, 0.35, len(seconds))), volume, 0.16)

    duck = np.ones(n)
    for word in words:
        duck[round(max(0, word["s"] - 0.058) * RATE):round((word["e"] + 0.08) * RATE)] = 0.47
    step = RATE // 100
    envelope = np.minimum.reduceat(duck, np.arange(0, n, step))
    envelope = np.convolve(envelope, np.ones(9) / 9, mode="same")
    music *= np.interp(np.arange(n), np.arange(0, n, step), envelope)[:, None]
    fade = np.minimum(1, np.maximum(0, (SECONDS - time) / 0.095))
    samples = (narration[:, None] * 0.83 + music + effects) * fade[:, None]
    premix = ROOT / "out/premix.wav"
    save_wave(premix, samples)
    result = subprocess.run(
        [ffmpeg, "-v", "info", "-i", str(premix), "-af", "loudnorm=I=-15:TP=-1.5:LRA=8:print_format=json",
         "-f", "null", "-"], capture_output=True, text=True, check=True,
    )
    report = json.loads(result.stderr[result.stderr.rfind("{"):result.stderr.rfind("}") + 1])
    measured = ":".join(f"measured_{name}={report['input_' + name]}" for name in ("i", "tp", "lra", "thresh"))
    subprocess.run(
        [ffmpeg, "-v", "error", "-y", "-i", str(premix), "-af",
         f"loudnorm=I=-15:TP=-1.5:LRA=8:{measured}:offset={report['target_offset']}:linear=true",
         "-ar", str(RATE), "-c:a", "pcm_s16le", str(VOICE / "mix.wav")], check=True,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("stage", choices=["voice", "mix"])
    parser.add_argument("--ffmpeg", default="ffmpeg")
    args = parser.parse_args()
    (make_voice if args.stage == "voice" else mix)(args.ffmpeg)

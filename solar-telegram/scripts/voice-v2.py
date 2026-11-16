"""Assemble the Kokoro takes and align the locked vocal track with whisper.cpp."""

import argparse
import difflib
import json
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RATE = 48_000
WORD = re.compile(r"[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*")


def run_pcm(ffmpeg, args, signal=None):
    values = subprocess.run(
        [ffmpeg, "-v", "error", *args, "-f", "f32le", "pipe:1"],
        input=signal, capture_output=True, check=True,
    ).stdout
    return np.frombuffer(values, dtype="<f4").copy()


def clean_take(signal):
    block = RATE // 100
    scans = signal[:len(signal) // block * block].reshape(-1, block)
    active = np.flatnonzero(np.max(np.abs(scans), axis=1) > 0.010)
    if not len(active):
        raise ValueError("Kokoro returned an empty take")
    begin = max(0, active[0] - 2) * block
    end = min(len(signal), (active[-1] + 4) * block)
    kept = []
    for left, right in zip(active, active[1:]):
        if right - left > 30:
            left_edge = (left + 9) * block
            kept.append(signal[begin:left_edge])
            begin = (right - 9) * block
    kept.append(signal[begin:end])
    result = np.concatenate(kept)
    measured = np.abs(result) > 0.010
    result *= min(2, 0.127 / np.sqrt(np.mean(result[measured] ** 2)))
    return result


def write_wave(path, signal, rate=RATE):
    pcm = np.int16(np.clip(signal, -1, 1) * 32767)
    with wave.open(str(path), "wb") as audio:
        audio.setparams((1 if pcm.ndim == 1 else pcm.shape[1], 2, rate, len(pcm), "NONE", ""))
        audio.writeframes(pcm.tobytes())


def fit_take(ffmpeg, take, size, tempo):
    fitted = run_pcm(
        ffmpeg, ["-f", "f32le", "-ar", str(RATE), "-ac", "1", "-i", "pipe:0", "-af",
                 f"atempo={tempo:.8f},highpass=f=72"], take.tobytes(),
    )
    if abs(len(fitted) - size) > RATE * 0.05:
        fitted = np.interp(np.linspace(0, len(fitted) - 1, size), np.arange(len(fitted)), fitted)
    elif len(fitted) < size:
        fitted = np.pad(fitted, (0, size - len(fitted)))
    else:
        fitted = fitted[:size]
    fade = min(len(fitted) // 3, RATE // 120)
    fitted[:fade] *= np.linspace(0, 1, fade)
    fitted[-fade:] *= np.linspace(1, 0, fade)
    return fitted


def build_voice(ffmpeg, source, public, takes_path):
    public.mkdir(parents=True, exist_ok=True)
    timeline = json.loads((source / "dialogue.json").read_text(encoding="utf-8"))
    master = np.zeros(timeline[-1]["end"] * RATE, dtype=np.float32)
    lines = []
    for beat in timeline:
        takes = [
            clean_take(run_pcm(ffmpeg, ["-i", str(takes_path / f"{line.get('take', line['id'])}.wav"), "-ar", str(RATE), "-ac", "1"]))
            for line in beat["lines"]
        ]
        if "range" in beat["lines"][0]:
            previous = beat["start"]
            for line, take in zip(beat["lines"], takes):
                begin, end = line["range"]
                assert previous <= begin < end <= beat["end"], line["id"]
                start, stop = round(begin * RATE), round(end * RATE)
                tempo = len(take) / (stop - start)
                master[start:stop] = fit_take(ffmpeg, take, stop - start, tempo)
                lines.append({**line, "s": begin, "e": end})
                print(f"{line['id']}: {begin:.3f}–{end:.3f}s, rate {tempo:.3f}×")
                previous = end
            continue
        gaps = [line.get("gap", 0) for line in beat["lines"]]
        lead = 0.085 if beat["start"] else 0.12
        tail = 0.24 if beat["end"] == timeline[-1]["end"] else 0.12
        seconds = beat["end"] - beat["start"] - lead - tail - sum(gaps)
        tempo = sum(len(t) for t in takes) / RATE / seconds
        if not 0.73 <= tempo <= 1.40:
            print(f"Review delivery speed at {beat['start']}s: {tempo:.2f}×")
        cursor = round((beat["start"] + lead) * RATE)
        original_length = sum(len(t) for t in takes)
        target_length = round(seconds * RATE)
        consumed = 0
        for gap, take, line in zip(gaps, takes, beat["lines"]):
            # At most a few samples of rate-conversion drift accumulate between takes.
            size = round((consumed + len(take)) * target_length / original_length) - round(consumed * target_length / original_length)
            consumed += len(take)
            fitted = fit_take(ffmpeg, take, size, tempo)
            cursor += round(gap * RATE)
            start = cursor
            cursor += len(fitted)
            master[start:cursor] = fitted
            lines.append({**line, "s": round(start / RATE, 4), "e": round(cursor / RATE, 4)})
        print(f"{beat['start']:02d}s: {len(takes)} take(s), rate {tempo:.3f}×, speech through {cursor / RATE:.2f}s")
    write_wave(public / "voice.wav", master)
    (public / "lines.json").write_text(json.dumps(lines, indent=2) + "\n", encoding="utf-8")
    subprocess.run(
        [ffmpeg, "-v", "error", "-y", "-i", str(public / "voice.wav"), "-ar", "16000", "-ac", "1", str(takes_path / "locked.wav")],
        check=True,
    )


def transcribed_words(report):
    for segment in report["transcription"]:
        merged = []
        for token in segment["tokens"]:
            raw = token["text"]
            if not raw or raw.startswith("[_") or raw.startswith("[ "):
                continue
            if raw.startswith(" ") or not merged:
                merged.append([raw.strip(), token])
            else:
                merged[-1][0] += raw
        for raw, token in merged:
            key = WORD.search(raw)
            if key:
                dtw = token.get("t_dtw", -1)
                yield {"text": raw, "s": dtw * 0.01 if dtw >= 0 else token["offsets"]["from"] / 1000,
                       "confidence": token.get("p")}


def normalized(token):
    return token.lower().replace("’", "'").strip(".,!?\":;")


def align(report_path, public, with_performance=False):
    report = json.loads(report_path.read_text(encoding="utf-8"))
    observed = list(transcribed_words(report))
    # Whisper writes years as digits. Split this one against the spoken script.
    for i in range(len(observed) - 1, -1, -1):
        if normalized(observed[i]["text"]) == "1859":
            original = observed[i]
            observed[i:i + 1] = [
                {**original, "text": "eighteen"},
                {**original, "text": "fifty-nine", "s": original["s"] + 0.34},
            ]
    lines = json.loads((public / "lines.json").read_text(encoding="utf-8"))
    expected = []
    punctuation = {}
    for line in lines:
        for m in WORD.finditer(line["text"]):
            expected.append((m.group(), line))
            suffix = re.match(r"[.!?,]", line["text"][m.end():])
            if suffix:
                punctuation[len(expected) - 1] = suffix.group()
    engine = difflib.SequenceMatcher(
        None, [normalized(word) for word, _ in expected], [normalized(item["text"]) for item in observed], autojunk=False,
    )
    timing = {}
    for i, j, n in engine.get_matching_blocks():
        for offset in range(n):
            timing[i + offset] = observed[j + offset]

    words = []
    for i, (word, line) in enumerate(expected):
        data = timing.get(i)
        if data is None or not line["s"] - 0.12 <= data["s"] <= line["e"] + 0.08:
            left = i - 1
            while left >= 0 and left not in timing and expected[left][1] == line:
                left -= 1
            right = i + 1
            while right < len(expected) and right not in timing and expected[right][1] == line:
                right += 1
            first = timing[left]["s"] if left >= 0 and left in timing and expected[left][1] == line else line["s"]
            last = timing[right]["s"] if right < len(expected) and right in timing and expected[right][1] == line else line["e"]
            start = first + (last - first) * (i - left) / (right - left)
            print(f"Review alignment: {line['id']} / {word} at {start:.3f}s (interpolated)")
            data = {"s": start, "confidence": None}
        start = min(line["e"] - 0.035, max(line["s"], data["s"]))
        if words and words[-1]["line"] == line["id"]:
            start = max(words[-1]["s"] + 0.028, start)
        words.append({"word": word, "line": line["id"], "speaker": line["who"], "s": round(start, 3),
                      "confidence": data["confidence"], "breakAfter": punctuation.get(i) in (".", "!", "?")})
        if with_performance:
            words[-1]["display"] = word + punctuation.get(i, "")
    for i, word in enumerate(words):
        line = expected[i][1]
        stop = words[i + 1]["s"] if i + 1 < len(words) and words[i + 1]["line"] == word["line"] else line["e"]
        word["e"] = round(max(word["s"] + 0.021, stop), 3)
    for word, (_, line) in zip(words, expected):
        assert line["s"] - 0.001 <= word["s"] < word["e"] <= line["e"] + 0.001, (word, line)
    (public / "words.json").write_text(json.dumps(words, indent=2) + "\n", encoding="utf-8")
    if with_performance:
        write_performance(public, lines, words)
    print(f"{len(timing)} recognizer matches for {len(words)} scripted words.")


def write_performance(public, lines, words):
    with wave.open(str(public / "voice.wav"), "rb") as track:
        signal = np.frombuffer(track.readframes(track.getnframes()), dtype="<i2").astype(float) / 32768
    fps = 30
    step = RATE // fps
    amplitudes = np.sqrt(np.mean(signal.reshape(-1, step) ** 2, axis=1))
    dialogue = {}
    for line in lines:
        if line["who"] == "narrator":
            continue
        start = max(round(line["s"] * fps), round(next(w["s"] for w in words if w["line"] == line["id"]) * fps) - 1)
        end = round(line["e"] * fps)
        peak = float(np.percentile(amplitudes[start:end], 80))
        mouths = [0 if level < max(0.009, peak * 0.15) else 1 if level < peak * 0.66 else 2
                  for level in amplitudes[start:end]]
        dialogue[line["id"]] = {"speaker": line["who"], "start": start, "mouths": mouths}
    (public / "performance.json").write_text(json.dumps(dialogue) + "\n", encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("stage", choices=["voice", "align"])
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--version", default="v2", choices=["v2", "v3", "v4"])
    parser.add_argument("--report", type=Path)
    options = parser.parse_args()
    takes_path = ROOT / f"out/{options.version}-takes"
    public = ROOT / f"public/voice-{options.version}"
    if options.stage == "voice":
        build_voice(options.ffmpeg, ROOT / f"src/{options.version}", public, takes_path)
    else:
        align(options.report or takes_path / "aligned.json", public, options.version != "v2")

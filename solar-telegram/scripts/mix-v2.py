"""Score the locked 58-second cut and render the final stereo master."""

import argparse
import json
import subprocess
from pathlib import Path

import numpy as np

from audio import read_wave, save_wave

ROOT = Path(__file__).resolve().parents[1]
RATE = 48_000
FPS = 30


def make_mix(ffmpeg, version="v2"):
    dramatic = version != "v2"
    suspense_score = version == "v4"
    assets = ROOT / f"public/voice-{version}"
    frames = json.loads((ROOT / f"src/{version}/cues.json").read_text(encoding="utf-8"))
    lines = json.loads((assets / "lines.json").read_text(encoding="utf-8"))
    speech, sample_rate = read_wave(assets / "voice.wav")
    assert sample_rate == RATE and len(speech) == 58 * RATE
    voice = speech.astype(float) / 32768
    n = len(voice)
    clock = np.arange(n) / RATE
    music = np.zeros((n, 2))
    effects = np.zeros_like(music)
    rng = np.random.default_rng(18590902)

    def time(seconds):
        return np.arange(round(RATE * seconds)) / RATE

    def place(stem, at, samples, gain=1, pan=0):
        index = round(at * RATE)
        if not (0 <= index < n):
            return
        data = samples[:n - index] * gain
        stem[index:index + len(data)] += data[:, None] * np.sqrt([(1 - pan) / 2, (1 + pan) / 2])

    def note(hz, duration, style):
        t = time(duration)
        phase = 2 * np.pi * hz * t
        if style == "plucked":
            return (np.sin(phase) + 0.21 * np.sin(2 * phase) + 0.11 * np.sin(3 * phase)) * (1 - np.exp(-170 * t)) * np.exp(-5.7 * t)
        wave = np.sin(phase + 0.12 * np.sin(t * 31)) + 0.32 * np.sin(2 * phase) + 0.08 * np.sin(3 * phase)
        return wave * np.sin(np.pi * t / duration) ** 1.25

    def pitched(midi, duration, style):
        return note(440 * 2 ** ((midi - 69) / 12), duration, style)

    def swell(at, chord, duration, gain):
        for i, midi in enumerate(chord):
            place(music, at + i * 0.029, pitched(midi, duration, "bowed"), gain / (1 + i * 0.24), (i % 3 - 1) * 0.52)

    def impact(at, gain):
        t = time(0.78)
        bottom = np.sin(2 * np.pi * (54 * t + 7.2 * (1-np.exp(-t * 8)) / 8))
        body = np.sin(2 * np.pi * (125 * t - 16 * t ** 2))
        transient = rng.normal(0, 0.31, len(t)) * np.exp(-t * 70)
        harmonics = 0.14 * np.sin(2*np.pi*(232*t-21*t*t)) if suspense_score else 0
        place(effects, at, (bottom*0.65+body*0.32+transient+harmonics)*(1-np.exp(-t*200))*np.exp(-t*9), gain)

    # Pizzicato wire motif, tense bowing through the surge, open voicings once the line works.
    for i, at in enumerate(np.arange(0.64, 8.75 if suspense_score else 28.2, 0.34)):
        if 13.15 <= at <= 13.65:
            continue
        root = [48, 45, 46, 43][i // 12 % 4]
        pattern = [0, 7, 12, 3, 0, 10, 7, 5]
        note_gain = 0.041 if 12 < at < 23 else 0.031
        place(music, at, pitched(root + pattern[i % 8], 0.75, "plucked"), note_gain, (-1) ** i * 0.32)
    for at, chord, duration, gain in [
        (4.7, [45, 52, 57], 3.6, 0.013), (8.8, [43, 50, 56], 3.1, 0.013),
        (12.0, [42, 48, 57], 3.3, 0.031), (15.7, [38, 45, 51, 58], 3.2, 0.029),
        (19.0, [40, 47, 53], 4.0, 0.027), (23.7, [42, 45, 51], 3.2, 0.014),
        (29.38, [48, 55, 60, 64], 3.2, 0.045), (33.2, [45, 52, 60], 3.4, 0.023),
        (36.7, [41, 48, 57, 60], 3.5, 0.021), (40.0, [43, 50, 55], 2.8, 0.026),
        (43.0, [40, 47, 55, 59, 64], 4.6, 0.044), (47.4, [43, 50, 55, 62], 4.4, 0.032),
        (51.5, [48, 55, 60, 64], 4.15, 0.035),
    ]:
        if not suspense_score or at < 8 or at >= 33.2:
            swell(at, chord, duration, gain * (0.65 if suspense_score and 33.2 <= at < 43 else 1))
    motif_start = frames.get("firstReply", 950)/FPS+0.40 if suspense_score else 30.16
    for i, at in enumerate(np.arange(motif_start, 42.0, 0.66 if suspense_score else 0.345)):
        melody = [55, 60, 64, 67, 64, 60, 57, 62]
        place(music, at, pitched(melody[i % 8], 0.66, "plucked"), 0.019 if suspense_score else 0.027, (-1) ** i * 0.27)
    for at, midi in [(43.0, 67), (44.5, 71), (46.7, 74), (52.1, 72), (53.7, 76)]:
        place(music, at, pitched(midi, 2.6, "plucked"), 0.037, 0.32)

    if suspense_score:
        for i, at in enumerate(np.arange(9.0,22.66,0.225)):
            t = time(0.10)
            clock_tick = (0.45*np.sin(2*np.pi*1640*t)+0.22*np.sin(2*np.pi*740*t)+0.13*rng.normal(0,1,len(t))) * np.exp(-t*72)
            place(music,at,clock_tick,0.081 if i%4==0 else 0.056,(-1)**i*0.26)
            if i%2==0:
                t = time(0.22)
                fall = 2*np.pi*(90*t-62*t*t)
                pulse = (np.sin(fall)+0.38*np.sin(2*fall))*(1-np.exp(-t*140))*np.exp(-t*16)
                place(music,at,pulse,0.072+0.027*min(1,(at-9)/4.4))
        swell(9.05,[38,45,51],3.85,0.048)

    if dramatic:
        surge = frames["surge"] / FPS
        reveal = frames["reveal"] / FPS
        reply = frames["reply"] / FPS
        impact(surge, 0.36 if suspense_score else 0.29)
        impact(reveal, 0.32 if suspense_score else 0.26)
        for i, at in enumerate(np.arange(surge+0.17, 22.62, 0.45 if suspense_score else 0.22)):
            root = [43, 44, 41, 46][i // 8 % 4]
            place(music, at, pitched(root + (12 if i%3==2 else 0), 0.34, "bowed"), 0.054 if i%3==0 else 0.027, (-1)**i*0.29)
            if i%4 == 0:
                t = time(0.18)
                drum = np.sin(2*np.pi*(103*t-87*t**2)) * (1-np.exp(-t*140))*np.exp(-t*23)
                place(music,at,drum,0.084)
        for at, notes, length, gain in [
            (surge-0.17,[39,46,51,54],2.45,0.057),
            (17.6,[37,44,50,55],2.2,0.051),
            (20.3,[42,48,54,57],2.3,0.050),
            (reply+0.19,[43,50,55,59,62],2.66,0.061),
            (reveal+0.24,[40,47,55,59,62,67],3.75,0.048),
        ]:
            swell(at,notes,length,gain)
        for f in frames["gasp"]:
            t=time(0.29)
            breath=np.interp(t, np.arange(212)/775, rng.normal(0,0.51,212))
            reed=np.sin(2*np.pi*(268*t+64*t**2))*(0.33+0.21*np.sin(2*np.pi*9*t))
            shape=np.sin(np.pi*t/t[-1])**2 * np.exp(-t*2.1)
            place(effects,f/FPS,(breath*0.55+reed*0.45)*shape,0.139 if suspense_score else 0.094,-0.32)
        for at, duration, gain in [(surge-0.16,1.76,0.043),(16.75,1.52,0.040),(19.13,1.13,0.035)]:
            t=time(duration)
            phase=2*np.pi*(57*t+11*t*t)
            hum=(np.sin(phase)+0.36*np.sin(2*phase)+0.18*np.sin(6*phase))*np.sin(np.pi*t/duration)**2
            place(effects,at,hum,gain,0.17)
        for f, duration in [(frames["surge"],0.82),(frames["reveal"],1.18)]:
            t = time(duration)
            wind = np.interp(t,np.arange(round(duration*860)+2)/860,rng.normal(0,0.48,round(duration*860)+2))
            shape = (t/duration)**1.8
            place(effects,f/FPS-duration,wind*shape*0.85,0.112,-0.22)

    accents = {frames["relay"][0], frames["surge"], frames.get("firstReply", frames["reply"] - 2), frames["relay"][-1]}
    for i, f in enumerate(frames["relay"]):
        t = time(0.096)
        metal = np.sin(2 * np.pi * 1260 * t) + 0.47 * np.sin(2 * np.pi * 2835 * t)
        clack = (0.49 * metal + 0.33 * rng.normal(0, 0.66, len(t))) * np.exp(-121 * t)
        place(effects, f / FPS, clack, 0.43 if f in accents else 0.24, (-1) ** i * 0.28)
    for i, f in enumerate(frames["lead"].values()):
        t = time(0.15)
        snap = np.sin(2 * np.pi * 259 * t) * np.exp(-33 * t)
        snap += rng.normal(0, 0.41, len(t)) * np.exp(-64 * t)
        place(effects, f / FPS, snap, 0.16, (i * 2 - 1) * 0.29)
    for i, f in enumerate(frames["steps"]):
        t = time(0.11)
        footstep = np.sin(2 * np.pi * (120 - 240 * t) * t) * np.exp(-42 * t)
        footstep += 0.6 * rng.normal(0, 0.4, len(t)) * np.exp(-57 * t)
        place(effects, f / FPS, footstep, 0.072, 0.3 * np.sin(i))
    for f in frames["chair"]:
        t = time(0.32)
        scrape = np.sin(2 * np.pi * (460 - t * 370) * t) * 0.29
        scrape += rng.normal(0, 0.32, len(t))
        place(effects, f / FPS, scrape * np.sin(np.pi * t / 0.32) ** 1.6, 0.13, -0.44)
    for f, weight in [(frames["surge"], 0.26), (frames["paperArc"], 0.21), (frames["paperIgnition"], 0.19)]:
        t = time(0.65)
        snap = rng.normal(0, 0.22, len(t)) + 0.45 * np.sin(2 * np.pi * (90 + 48 * t) * t)
        wave = (1 - np.exp(-t * 55)) * np.exp(-t * 8.8)
        place(effects, f / FPS, snap * wave, weight, -0.14)
    for _ in range(78):
        at = (frames["paperIgnition"] + rng.uniform(0, 30)) / FPS
        t = time(0.028)
        place(effects, at, rng.normal(0, 0.42, len(t)) * np.exp(-190 * t), rng.uniform(0.012, 0.075), 0.23)
    for f in frames["whoosh"]:
        t = time(0.35)
        low = np.sin(2 * np.pi * (160 * t - 99 * t ** 2))
        air = np.interp(t, np.arange(120) / 333, rng.normal(0, 0.48, 120))
        place(effects, (f - 5) / FPS, (low * 0.31 + air * 0.52) * np.sin(np.pi * t / 0.35) ** 2, 0.114 if dramatic else 0.081, 0.18)
    room = np.interp(clock, np.arange(58 * 211) / 211, rng.normal(0, 1, 58 * 211)) * 0.0024
    place(effects, 0, room, 1, -0.10)

    duck_times = np.arange(0, n, 480) / RATE
    duck = np.ones(len(duck_times))
    for line in lines:
        mask = (duck_times >= line["s"] - 0.07) & (duck_times <= line["e"] + 0.055)
        duck[mask] = 0.52 if line["who"] == "narrator" else 0.35
    envelope = np.interp(clock, duck_times, np.convolve(duck, np.ones(9) / 9, mode="same"))
    quiet = frames["disconnectCommand"]/FPS-0.23 if dramatic else 28.72
    recover = frames["firstReply"]/FPS+(0.28 if suspense_score else 0.16) if dramatic else 29.36
    suspense = np.clip((quiet - clock) / 0.26, 0, 1) + np.clip((clock - recover) / 0.23, 0, 1)
    music *= (envelope * suspense * np.clip((57.3 - clock) / 0.52, 0, 1))[:, None]
    if suspense_score:
        silent = music[round(quiet * RATE):round(recover * RATE)]
        assert float(np.max(np.abs(silent))) < 0.0001
    final = voice[:, None] * 0.78 + music + effects
    premix = ROOT / f"out/{version}-takes/premix.wav"
    save_wave(premix, final * min(1.0, 0.97 / np.max(np.abs(final))))
    target = "loudnorm=I=-15:TP=-1.55:LRA=8"
    measurement = subprocess.run(
        [ffmpeg, "-v", "info", "-i", str(premix), "-af", target + ":print_format=json", "-f", "null", "-"],
        check=True, capture_output=True, text=True,
    ).stderr
    report = json.loads(measurement[measurement.rfind("{"):measurement.rfind("}") + 1])
    measured = ":".join(f"measured_{key}={report['input_' + key]}" for key in ("i", "tp", "lra", "thresh"))
    subprocess.run(
        [ffmpeg, "-v", "error", "-y", "-i", str(premix), "-af",
         f"{target}:{measured}:offset={report['target_offset']}:linear=true",
         "-ar", str(RATE), "-c:a", "pcm_s16le", str(assets / "mix.wav")],
        check=True,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ffmpeg", default="ffmpeg")
    parser.add_argument("--version", default="v2", choices=["v2", "v3", "v4"])
    options = parser.parse_args()
    make_mix(options.ffmpeg, options.version)

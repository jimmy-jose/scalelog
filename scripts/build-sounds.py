"""Build ScaleLog's original, quiet SFX palette with Python's standard library.

Run: python3 scripts/build-sounds.py
No samples, downloads, runtime synthesis, or third-party dependencies required.
The earlier MP3 assets are preserved; the app uses these PCM WAV replacements.
"""

from array import array
import math
from pathlib import Path
import random
import sys
import wave

RATE = 44100
OUT = Path(__file__).resolve().parents[1] / "assets/audio/designed"
TAU = 2 * math.pi


def note(freq, duration, level=1, material="bell"):
    """Rounded attack, warm fundamental, muted overtones, and a silent release."""
    samples = []
    rng = random.Random(41)
    noise = 0
    for i in range(round(duration * RATE)):
        t = i / RATE
        attack = math.sin(min(1, t / .008) * math.pi / 2) ** 2
        release = math.sin(min(1, (duration - t) / .045) * math.pi / 2) ** 2
        decay = math.exp(-t * (7 if material == "bell" else 22))
        phase = TAU * freq * t
        tone = math.sin(phase) + .18 * math.sin(phase * 2) * math.exp(-t * 18)
        tone += .055 * math.sin(phase * 3) * math.exp(-t * 28)
        if material == "felt":
            noise = .76 * noise + .24 * rng.uniform(-1, 1)
            tone = .75 * tone + .18 * noise * math.exp(-t * 70)
        samples.append(level * tone * attack * release * decay)
    return samples


def cue(name, events, peak_db):
    # Events: offset, frequency, note duration, relative level, material.
    duration = max(start + length for start, _, length, _, _ in events) + .012
    samples = [0.] * math.ceil(duration * RATE)
    for start, frequency, length, level, material in events:
        for i, value in enumerate(note(frequency, length, level, material)):
            samples[round(start * RATE) + i] += value
    gain = 10 ** (peak_db / 20) / max(abs(s) for s in samples)
    pcm = array("h", (round(s * gain * 32767) for s in samples))
    if sys.byteorder != "little":
        pcm.byteswap()
    with wave.open(str(OUT / f"{name}.wav"), "wb") as file:
        file.setparams((1, 2, RATE, len(pcm), "NONE", "not compressed"))
        file.writeframes(pcm.tobytes())
    print(f"{name:24} {len(pcm) / RATE:.3f}s  peak {peak_db:3} dBFS")


def melody(notes, step=.105, length=.24):
    return [(i * step, frequency, length, 1 - i * .08, "bell") for i, frequency in enumerate(notes)]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # A shared D/A tonal family keeps navigation, Byte, and rewards related.
    cue("tap", [(0, 294, .070, 1, "felt")], -16)
    cue("tab-select", [(0, 370, .085, 1, "felt")], -16)
    cue("switch", [(0, 247, .06, 1, "felt"), (.045, 330, .08, .65, "felt")], -15)
    cue("choice-select", [(0, 294, .12, 1, "felt"), (.055, 440, .14, .55, "bell")], -13)
    cue("hint-open", melody([440, 554], .09, .24), -14)
    cue("success", melody([370, 440, 587], .095, .28), -12)
    cue("warning", melody([330, 294], .13, .22), -14)
    cue("incident-warning", melody([294, 294], .18, .20), -13)
    cue("incident-critical", [(0, 220, .22, 1, "felt"), (.23, 220, .24, .85, "felt"),
                              (.23, 294, .24, .18, "bell")], -12)
    cue("node-added", melody([294, 440], .08, .19), -14)
    cue("node-failed", melody([294, 220], .08, .18), -14)
    cue("metric-improved", melody([440, 494], .07, .16), -17)
    cue("metric-worsened", melody([330, 294], .07, .16), -17)
    cue("cash-spent", [(0, 220, .10, 1, "felt"), (.045, 165, .12, .5, "felt")], -17)
    cue("xp", melody([587, 740], .065, .17), -16)
    cue("level-complete", melody([294, 370, 440, 587], .12, .30), -12)
    cue("award-unlock", melody([294, 370, 440, 587, 740], .13, .34), -12)


if __name__ == "__main__":
    main()

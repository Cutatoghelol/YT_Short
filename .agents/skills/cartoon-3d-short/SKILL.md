---
name: cartoon-3d-short
description: Create or revise original 55–70 second vertical cartoon stories with flat 2D characters in painted Three.js environments rendered through Remotion. Use for the Bridge Short style, animated history or science Shorts in this style, or requests to use the cartoon short skill.
---

# Cartoon 3D story shorts

Default to a 55–70 second narrated 9:16 short at 30 fps, with English narration and no on-screen captions or labels. Render a 1440 × 2560 H.264 MP4. Follow the user's requested language, captions, duration, and output format when specified.

## Story and timing

1. Find a surprising, visual cause-and-effect story. Verify the facts and record sources in `SCRIPT.md`. Open on the surprising fact, establish the setting quickly, escalate over a few visual beats, and explain the mechanism with an everyday analogy. End on an ironic payoff or callback. Aim for about 3.7 words per second with a steady narrator and time the script against the actual voice.
2. Record or generate `voice/voice.wav` with an original or authorized voice. Obtain and verify word-level timestamps in `voice/words.json`. Use the same voice and timing files for animation and audio ducking. Align key reactions to the spoken word or up to three frames early.
3. Map narration beats to a frame-based shot plan in `story.ts`. Define shot bounds, camera keys, focus and blur, transitions, and impact cues. Use camera glides and subtle push-ins on holds, sharp establishing views, and selective close-up blur focused on the character's eyes. Stage each shot around what the viewer needs to see.

## Build, review, and deliver

1. Start from the [Bridge scene template](templates/bridge/) and register a dedicated composition. Keep the template's painted surfaces, camera-facing character cards, and separate world ink pass. Create original characters, story, voice, and staging. Use the [Bridge production notes](references/BRIDGE_PRODUCTION.md) for setup, stills, and render commands.
2. Render and inspect a representative still before committing to a full render. Review frames from important beats and both sides of transitions. Check eyes and silhouettes at phone size, foot contact, foreground obstructions, framing, ink, blur, and the readability of key props. Compare against the [written style guide](references/STYLE_BIBLE.md) and [measured reports](references/reports/) as needed.
3. Lock the picture timing before synthesizing sound. Adapt the [audio templates](templates/audio/) to the new shot and cue timings. Build an original score and SFX under the narration, duck the music under speech, and produce a 48 kHz mix that matches the picture duration. Regenerate the mix after timing changes.
4. Render the full picture and mux the finished mix. Run [frame and audio QA](templates/scripts/short_qa.py) for unexpected black, white, frozen, or discontinuous frames and for audio levels. Inspect flagged frames in context, review transitions and narration sync, and verify dimensions, frame rate, duration, and the final audio stream. Deliver the verified MP4 with a workspace file link.

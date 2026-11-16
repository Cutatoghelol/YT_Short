import type {Caption} from "@remotion/captions";
import {useMemo} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import "@fontsource/inter/900.css";
import timings from "../../public/voice-v2/words.json";

type Word = (typeof timings)[number] & {display?: string};
type CaptionWord = Caption & {line: string; speaker: string};

function phraseGroups(timing: readonly Word[]) {
  const groups: CaptionWord[][] = [];
  for (const item of timing) {
    const word: CaptionWord = {
      line: item.line, speaker: item.speaker, text: item.display ?? item.word, startMs: Math.round(item.s * 1000),
      endMs: Math.round(item.e * 1000), timestampMs: null, confidence: item.confidence,
      pageBreakAfter: item.breakAfter,
    };
    const group = groups[groups.length - 1];
    if (!group || group.length === 3 || group[group.length - 1].pageBreakAfter || group[0].line !== word.line ||
        group[0].speaker !== word.speaker || word.startMs - group[0].startMs > 670 ||
        word.text.length + group.map((token) => token.text).join(" ").length > 23) {
      groups.push([word]);
    } else {
      group.push(word);
    }
  }
  return groups;
}

export function Captions({y, timing = timings, speakerColors = false}: {y: number; timing?: readonly Word[]; speakerColors?: boolean}) {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const time = frame / fps * 1000;
  const groups = useMemo(() => phraseGroups(timing), [timing]);
  const group = groups.find((items) => {
    const startFrame = Math.round(items[0].startMs / 1000 * fps);
    const endFrame = Math.round(items[items.length - 1].endMs / 1000 * fps);
    return frame >= startFrame && frame < endFrame;
  });
  if (!group) return null;
  const letters = group.map((word) => word.text.toUpperCase()).join(" ");
  const fontSize = Math.min(77, 725 / [...letters].reduce((sum, char) => sum + ("MW".includes(char) ? 0.90 : "I'".includes(char) ? 0.32 : char === " " ? 0.29 : 0.71), 0));
  const age = frame - Math.round(group[0].startMs * fps / 1000);
  const scale = age < 3 ? [0.93, 1.035, 1.015][age] : 1;
  const speaker = group[0].speaker;
  const color = speakerColors && speaker === "boston" ? "#ffd28a" : speakerColors && speaker === "portland" ? "#b8f5f2" : "#fffdf9";
  return (
    <div style={{
      position: "absolute", left: "48.7%", top: `${y * 100}%`, width: 780, textAlign: "center",
      transform: `translate(-50%, -50%) scale(${scale})`, color, pointerEvents: "none",
      fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize, lineHeight: 1.10,
      whiteSpace: "nowrap", WebkitTextStroke: "9px #16111b", paintOrder: "stroke fill",
      letterSpacing: "-0.025em", textShadow: "0 4px 0 #16111b",
    }}>
      {group.map((word, index) => (
        <span key={word.startMs} style={{opacity: word.startMs > time + 18 ? 0.91 : 1}}>
          {index > 0 ? " " : ""}{word.text.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

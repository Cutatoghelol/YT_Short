import type {OfficeAction} from "../office";
import {ease, type Point} from "../stage";
import cues from "./cues.json";

type Office = "boston" | "portland";
export type Stage = Office | "line" | "paper" | "sun" | "earth" | "ground" | "aurora";
type Move = {from: Point; to: Point; target: Point; lens: number; blur?: number; style?: "orbit" | "rush" | "punch"; captionY?: number};
type Shot = Move & {start: number; stage: Stage};

const terminal: Move = {from: [-2.29, 3.00, 2.26], to: [-1.98, 2.91, 2.09], target: [-1.10, 2.05, 0.47], lens: 34, blur: 7, captionY: 0.775};
const relay: Move = {from: [1.74, 2.53, 3.16], to: [0.57, 2.37, 2.89], target: [0.57, 1.73, 0.25], lens: 26, blur: 7, style: "orbit", captionY: 0.77};
const tap: Move = {from: [2.12, 2.66, 3.4], to: [1.67, 2.44, 3.11], target: [0.72, 1.72, 0.43], lens: 25, blur: 6, captionY: 0.78};
const portrait: Move = {from: [0.98, 2.58, 4.81], to: [0.34, 2.53, 4.36], target: [-0.02, 2.25, -0.32], lens: 30, blur: 5};
const action: Move = {from: [-3.98, 2.58, 3.15], to: [-3.60, 2.49, 2.78], target: [-1.25, 1.57, -0.63], lens: 49, blur: 1, style: "orbit"};
const line: Move = {from: [-2.61, 4.68, 4.83], to: [-0.64, 4.2, 1.89], target: [0.2, 3.17, -3.2], lens: 40, style: "rush"};

export const shots: Shot[] = [
  {start: 0, stage: "boston", ...terminal},
  {start: 27, stage: "portland", ...terminal, from: [-1.72, 2.93, 2.25], to: [-2.04, 2.80, 2.03]},
  {start: 45, stage: "boston", ...relay},
  {start: 90, stage: "line", ...line, from: [3.46, 4.4, 6.68], to: [2.75, 4.02, 4.98], style: "orbit"},
  {start: 132, stage: "boston", ...tap},
  {start: 171, stage: "portland", ...relay, from: [1.90, 2.65, 3.21], to: [1.23, 2.49, 2.91]},
  {start: 211, stage: "portland", ...portrait, from: [-1.82, 2.70, 4.63], to: [-0.82, 2.56, 4.18]},
  {start: 268, stage: "portland", from: [2.17, 3.20, 4.16], to: [0.49, 3.34, -2.29],
    target: [0.54, 3.20, -3.1], lens: 44, blur: 4, style: "rush"},
  {start: 309, stage: "line", ...line, from: [0.54, 3.55, 2.46], to: [0.29, 3.8, -0.35]},
  {start: 360, stage: "boston", ...relay, from: [1.53, 2.68, 3.21], to: [1.10, 2.58, 2.82]},
  {start: 420, stage: "boston", ...action, style: "punch"},
  {start: 492, stage: "paper", from: [2.80, 3.06, 2.35], to: [2.15, 2.69, 2.06],
    target: [1.03, 1.65, -0.20], lens: 30, blur: 5, style: "orbit", captionY: 0.77},
  {start: 550, stage: "paper", from: [1.9, 2.21, 1.80], to: [1.72, 2.16, 1.48],
    target: [1.09, 1.79, -0.22], lens: 27, blur: 7, style: "punch", captionY: 0.77},
  {start: 589, stage: "boston", ...action, from: [-4.15, 2.32, 3.42], to: [-3.91, 2.40, 2.78]},
  {start: 643, stage: "boston", ...portrait, from: [-3.22, 2.51, 3.82], to: [-2.65, 2.47, 3.31], target: [-1.96, 2.19, -0.55], lens: 40},
  {start: 716, stage: "boston", ...tap, from: [1.69, 3.00, 2.88], to: [1.51, 2.59, 2.71], lens: 30},
  {start: 758, stage: "portland", ...terminal},
  {start: 803, stage: "boston", ...terminal, from: [-2.82, 3.10, 2.85], to: [-2.41, 2.98, 2.49], lens: 33},
  {start: 839, stage: "boston", ...tap, from: [2.95, 2.41, 2.95], to: [2.20, 2.39, 2.88]},
  {start: 862, stage: "portland", ...portrait, from: [0.86, 2.57, 4.35], to: [0.54, 2.49, 3.10],
    target: [-0.09, 2.33, -0.52], lens: 31, style: "punch"},
  {start: 908, stage: "boston", ...terminal, from: [-2.6, 3.26, 2.72], to: [-2.15, 3.05, 2.4], lens: 30},
  {start: 967, stage: "boston", ...tap, from: [1.97, 3.10, 2.56], to: [1.64, 2.95, 2.32]},
  {start: 1015, stage: "portland", ...relay, from: [1.19, 2.79, 2.97], to: [1.55, 2.45, 2.70]},
  {start: 1073, stage: "line", ...line, from: [-1.51, 4.10, 2.63], to: [0.08, 3.71, -0.4]},
  {start: 1123, stage: "portland", ...action, from: [-4.01, 2.43, 3.44], to: [-3.61, 2.38, 2.71]},
  {start: 1180, stage: "boston", ...portrait, from: [0.72, 3.32, 5.35], to: [-0.04, 2.98, 4.98], lens: 35},
  {start: 1235, stage: "line", ...line, from: [0.78, 3.73, 2.89], to: [-0.54, 4.65, -0.69],
    target: [0.1, 4.38, -7.01]},
  {start: 1290, stage: "sun", from: [-0.67, 0.32, 7.93], to: [0.51, 0.19, 7.58], target: [0.05, 0.25, 0], lens: 40, style: "orbit"},
  {start: 1343, stage: "earth", from: [0.65, 0.28, 7.32], to: [-0.35, 0.41, 6.95], target: [0, 0.1, 0], lens: 41, style: "orbit"},
  {start: 1417, stage: "ground", from: [2.76, 2.19, 8.94], to: [1.31, 1.81, 8.41],
    target: [0, 0.15, 0.2], lens: 48, style: "orbit", captionY: 0.78},
  {start: 1480, stage: "ground", from: [-1.62, 1.22, 7.02], to: [-0.51, 1.09, 6.4],
    target: [0.13, 0.51, 0.52], lens: 49, style: "rush", captionY: 0.785},
  {start: 1558, stage: "aurora", from: [3.38, 4.75, 7.9], to: [2.45, 4.94, 5.56],
    target: [0.1, 5.46, -10.1], lens: 36, style: "orbit"},
  {start: 1641, stage: "boston", ...terminal, from: [-2.74, 3.18, 2.78], to: [-2.48, 3.04, 2.53],
    target: [-0.50, 1.99, 0.28], lens: 38},
  {start: 1705, stage: "boston", ...relay, from: [1.41, 2.52, 3.44], to: [1.19, 2.43, 3.18], lens: 33},
];

export function shotAt(frame: number) {
  let index = shots.length - 1;
  while (index > 0 && frame < shots[index].start) index--;
  return {shot: shots[index], end: shots[index + 1]?.start ?? 1740};
}

function lerp(a: number, b: number, fraction: number) {
  return a + (b - a) * fraction;
}

export function cameraAt(frame: number) {
  const {shot, end} = shotAt(frame);
  const local = frame - shot.start;
  const elapsed = local / (end - shot.start);
  const t = shot.style === "rush" ? elapsed ** 2.4
    : shot.style === "punch" ? ease((local - (shot.start === 862 ? 9 : 0)) / 17) * 0.8 + elapsed * 0.2
    : elapsed * 0.22 + ease(elapsed) * 0.78;
  const position = shot.from.map((value, i) => lerp(value, shot.to[i], t)) as Point;
  if (shot.style === "orbit") {
    const [cx, , cz] = shot.target;
    const [ax, , az] = shot.from;
    const [bx, , bz] = shot.to;
    const angle = Math.atan2(ax - cx, az - cz);
    const delta = Math.atan2(Math.sin(Math.atan2(bx - cx, bz - cz) - angle), Math.cos(Math.atan2(bx - cx, bz - cz) - angle));
    const radius = lerp(Math.hypot(ax - cx, az - cz), Math.hypot(bx - cx, bz - cz), t);
    position[0] = cx + Math.sin(angle + delta * t) * radius;
    position[2] = cz + Math.cos(angle + delta * t) * radius;
  }
  const shockTime = frame - (shot.stage === "paper" ? cues.paperArc : cues.surge);
  const jolt = shockTime >= 0 && shockTime < 13 ? (1 - shockTime / 13) * Math.cos(shockTime * 2.1) : 0;
  position[0] += jolt * 0.096;
  position[1] += jolt * 0.052;
  return {shot, position, roll: jolt * 0.018};
}

const ramp = (frame: number, a: number, b: number) => ease((frame - a) / (b - a));
const between = (frame: number, a: number, b: number) => frame >= a && frame < b;

export function act(frame: number, office: Office): OfficeAction {
  const boston = office === "boston";
  const contact = cues.lead[office];
  const loose = frame < 90 ? 1 : ramp(frame, contact - 3, contact + 14);
  const reach = ramp(frame, contact - 14, contact - 4) * (1 - ramp(frame, contact + 8, contact + 23));
  const tap = cues.relay.reduce((power, at) => {
    const age = frame - at;
    return age >= 0 && age < 4 ? Math.max(power, 1 - age / 4) : power;
  }, 0);
  const pressing = boston
    ? between(frame, 132, 171) || between(frame, 716, 758) || between(frame, 839, 862) || between(frame, 967, 1015) || between(frame, 1180, 1235)
    : between(frame, 862, 908) || between(frame, 1015, 1073);
  const recoil = boston ? ramp(frame, 433, 448) * (1 - 0.72 * ramp(frame, 452, 483)) : 0;
  const cross = boston
    ? ramp(frame, 587, 646) * (1 - ramp(frame, 680, 724))
    : ramp(frame, 1115, 1151) * (1 - ramp(frame, 1154, 1180));
  const moving = boston ? between(frame, 439, 471) || between(frame, 587, 649) : between(frame, 1115, 1178);
  const surprise = !boston && between(frame, 872, 889);
  let expr: OfficeAction["pose"]["expr"] = "neutral";
  if (between(frame, 332, 719)) expr = "nervous";
  if (recoil > 0.25 || surprise) expr = "shock";
  if (between(frame, 722, 872)) expr = "stern";
  if (frame >= 889) expr = "relief";
  const listening = !boston ? ramp(frame, 860, 870) * (1 - ramp(frame, 882, 894)) : 0;
  const lean = recoil * 20 - listening * 12 + cross * 7 - tap * 2.5;
  const sit = between(frame, 356, 433) && boston;
  return {
    tap, loose, reach, pressing, chair: boston ? ramp(frame, 434, 465) : 0,
    lampPulse: between(frame, 434, 463) ? Math.max(0, Math.sin((frame - 434) * 1.1)) * (463 - frame) / 29 : tap * 0.06,
    pose: {
      x: (boston ? -0.09 : 0.08) - recoil * 1.92 - cross * 2.1 - (reach > 0 ? reach * 0.29 : 0),
      z: -0.58 - recoil * 0.32 + cross * 0.09 + listening * 0.21,
      elevation: sit ? -0.57 : -0.57 * (1 - ramp(frame, 433, 444)) * (boston && frame >= 433 ? 1 : 0),
      lean, mode: sit ? "sit" : moving ? "stroll" : "stand", phase: frame / 18, expr,
    },
  };
}

import {ease, type Point} from "./stage";

export type SetName = "boston" | "portland" | "line" | "sun" | "earth" | "coil" | "aurora";
type Camera = {from: Point; to: Point; look: Point; lens: number; blur?: number};
type Shot = Camera & {start: number; set: SetName};

const hook: Camera = {from: [-2.94, 3.54, 2.67], to: [-2.66, 3.37, 2.40], look: [-0.16, 1.98, 0.30], lens: 38, blur: 6};
const wide: Camera = {from: [0.91, 2.54, 5.18], to: [0.45, 2.45, 4.65], look: [0.03, 2.23, -0.12], lens: 35, blur: 4};
const counter: Camera = {from: [-1.2, 2.67, 5.0], to: [-0.73, 2.61, 4.52], look: [-0.03, 2.20, -0.12], lens: 36, blur: 5};
const key: Camera = {from: [1.85, 2.83, 3.2], to: [1.64, 2.69, 2.85], look: [0.70, 1.76, 0.46], lens: 23, blur: 6};
const exterior: Camera = {from: [2.9, 3.9, 5.1], to: [1.95, 3.6, 2.8], look: [0.0, 2.65, -2.65], lens: 39};
const model: Camera = {from: [0.42, 0.32, 7.5], to: [-0.32, 0.22, 7.1], look: [0.0, -0.01, 0], lens: 34};

export const shots: Shot[] = [
  {start: 0, set: "boston", ...hook},
  {start: 120, set: "boston", ...wide},
  {start: 195, set: "portland", ...counter},
  {start: 243, set: "boston", ...key},
  {start: 312, set: "line", ...exterior},
  {start: 361, set: "portland", ...key},
  {start: 420, set: "portland", ...counter},
  {start: 499, set: "boston", ...wide},
  {start: 580, set: "portland", ...hook},
  {start: 618, set: "boston", ...hook},
  {start: 650, set: "portland", ...counter, from: [-0.4, 2.61, 4.48], to: [-0.22, 2.6, 4.08]},
  {start: 780, set: "sun", ...model, from: [-0.34, 0.18, 7.2], to: [0.4, 0.08, 6.5]},
  {start: 844, set: "earth", ...model},
  {start: 905, set: "coil", ...model, from: [0.91, 1.54, 7.35], to: [0.62, 1.28, 6.92], look: [0, -0.1, 0], lens: 50},
  {start: 1005, set: "coil", ...model, from: [2.70, 1.81, 4.67], to: [2.43, 1.67, 4.42], look: [0.44, -0.04, 0], lens: 36},
  {start: 1044, set: "earth", ...model, from: [-0.18, 0.54, 6.4], to: [0.62, 0.1, 6.08]},
  {start: 1128, set: "line", ...exterior, from: [-2.55, 3.5, 3.7], to: [-1.5, 3.3, 1.75], look: [0, 2.85, -2.5]},
  {start: 1210, set: "aurora", ...exterior, from: [3.45, 4.7, 7.2], to: [2.65, 4.8, 5.5], look: [0, 5.05, -8.0], lens: 40},
  {start: 1320, set: "boston", ...wide, from: [-0.91, 2.57, 4.77], to: [-0.37, 2.55, 4.38]},
  {start: 1395, set: "portland", ...key},
  {start: 1450, set: "portland", ...counter},
  {start: 1550, set: "boston", ...hook, from: [0.03, 3.13, 4.52], to: [0.22, 2.94, 4.25]},
  {start: 1680, set: "boston", ...hook, from: [-2.88, 3.50, 2.65], to: [-2.57, 3.35, 2.37]},
];

export function cameraAt(frame: number) {
  let index = shots.length - 1;
  while (index > 0 && frame < shots[index].start) index--;
  const shot = shots[index];
  const end = shots[index + 1]?.start ?? 1860;
  const t = 0.2 * (frame - shot.start) / (end - shot.start) + 0.8 * ease((frame - shot.start) / (end - shot.start));
  const position = shot.from.map((x, i) => x + t * (shot.to[i] - x)) as Point;
  return {shot, position, progress: t};
}

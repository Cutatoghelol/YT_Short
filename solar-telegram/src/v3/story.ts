import type {OfficeAction} from "../office";
import {contact, rest} from "../office-rig";
import {ease, type Point} from "../stage";
import timings from "../../public/voice-v3/performance.json";
import cues from "./cues.json";

type Office = "boston" | "portland";
export type Stage = Office | "street" | "country" | "paper" | "sun" | "earth" | "ground" | "night";
type Move = {from: Point; to: Point; target: Point; lens: number; blur?: number; style?: "orbit" | "whip" | "hit"; captionY?: number};
export type Shot = Move & {start: number; stage: Stage};

const terminals: Move = {from: [-2.37,3.04,2.71],to: [-1.99,2.8,2.34],target: [-1.04,1.72,0.55],lens: 34,blur: 7,captionY: 0.815};
const sounder: Move = {from: [1.61,2.48,3.01],to: [0.62,2.34,2.72],target: [0.58,1.72,0.25],lens: 26,blur: 6,style: "orbit",captionY: 0.78};
const key: Move = {from: [2.51,2.64,3.37],to: [1.80,2.49,2.89],target: [0.77,1.72,0.53],lens: 28,blur: 7,captionY: 0.785};
const portrait: Move = {from: [0.15,2.71,4.32],to: [-0.28,2.60,3.95],target: [-0.30,2.25,-0.26],lens: 32,blur: 5};
const wide: Move = {from: [-3.71,2.83,4.48],to: [-3.17,2.8,4.13],target: [-0.94,1.63,-0.38],lens: 47,blur: 1,style: "orbit"};
const street: Move = {from: [2.38,8.36,11.15],to: [1.64,5.95,6.63],target: [0,1.92,-12.6],lens: 43,style: "orbit"};
const poles: Move = {from: [2.05,5.83,10.62],to: [-4.6,10.49,15.2],target: [1.41,3.14,-13.7],lens: 37,style: "orbit"};
const paper: Move = {from: [2.40,3.04,3.9],to: [2.02,2.84,3.51],target: [0.80,1.95,-0.20],lens: 38,blur: 4,captionY: 0.78};

export const shots: Shot[] = [
  {start: 0,stage: "boston",...terminals},
  {start: 30,stage: "portland",...terminals,from: [-2.06,3.01,2.77],to: [-1.90,2.82,2.61]},
  {start: 56,stage: "boston",...sounder},
  {start: 90,stage: "street",...street},
  {start: 132,stage: "boston",...key},
  {start: 167,stage: "portland",...sounder,from: [1.97,2.45,3.15],to: [1.14,2.44,2.69]},
  {start: 208,stage: "portland",...portrait,from: [-2.14,2.74,4.69],to: [-1.37,2.66,4.35],target: [0.13,2.15,-0.30]},
  {start: 269,stage: "street",...street,from: [1.55,3.95,4.12],to: [2.25,5.40,-2.62],target: [2.23,3.64,-16.48],style: "whip"},
  {start: 309,stage: "boston",...sounder,from: [2.17,3.26,3.78],to: [1.19,2.55,3.03]},
  {start: 369,stage: "boston",...portrait,from: [0.77,2.58,3.58],to: [0.61,2.53,3.42],target: [0.08,2.12,-0.08],lens: 32},
  {start: 404,stage: "boston",...wide,style: "hit",from: [-3.38,2.88,4.41],to: [-3.10,2.55,3.70]},
  {start: 434,stage: "boston",...wide,from: [-4.29,2.10,0.29],to: [-3.97,1.94,0.62],target: [-0.83,1.38,-0.91],lens: 56,captionY: 0.81},
  {start: 482,stage: "country",...poles},
  {start: 517,stage: "paper",...paper,from: [2.88,3.28,3.41],to: [2.29,2.96,2.76],target: [0.88,1.64,-0.20],lens: 32,style: "orbit"},
  {start: 565,stage: "paper",...paper,from: [1.79,3.13,4.66],to: [1.53,2.87,4.30],target: [0.44,2.14,-0.29],lens: 43,style: "hit"},
  {start: 615,stage: "boston",...wide,from: [-3.78,2.64,4.14],to: [-3.23,2.49,3.69],target: [-1.19,2.06,-0.57],lens: 43},
  {start: 655,stage: "boston",...terminals,from: [-2.58,3.18,3.09],to: [-2.11,2.95,2.72],target: [-0.83,1.99,0.39],lens: 38},
  {start: 692,stage: "boston",...portrait,from: [0.98,2.66,4.02],to: [0.24,2.55,3.54],target: [0.25,2.19,-0.32],lens: 33},
  {start: 738,stage: "portland",...portrait,from: [-0.66,2.65,3.84],to: [-0.33,2.53,3.63],target: [0.01,2.23,-0.35],lens: 32},
  {start: 774,stage: "boston",...terminals,from: [-2.20,2.72,2.36],to: [-1.96,2.84,2.34],target: [-1.06,1.90,0.56],lens: 35},
  {start: 803,stage: "boston",...portrait,from: [0.67,2.68,4.44],to: [0.35,2.56,3.96],target: [0,2.22,-0.28],lens: 34},
  {start: 864,stage: "portland",...terminals,from: [-2.37,3.08,2.73],to: [-2.16,2.96,2.48],target: [-1.15,1.87,0.55]},
  {start: 914,stage: "portland",...portrait,from: [-1.03,2.51,4.02],to: [-0.82,2.49,3.80],target: [-0.62,2.23,-0.34],lens: 32},
  {start: 948,stage: "portland",...sounder,from: [1.46,2.77,3.26],to: [0.69,2.39,2.87]},
  {start: 1002,stage: "portland",...key,from: [2.40,2.87,3.35],to: [2.06,2.74,3.02],target: [0.41,1.79,-0.08],lens: 35},
  {start: 1039,stage: "portland",...portrait,from: [-0.27,2.54,4.06],to: [-0.19,2.45,3.04],target: [-0.04,2.32,-0.37],lens: 32,style: "hit"},
  {start: 1081,stage: "boston",...key,from: [2.44,2.91,3.3],to: [2.07,2.66,3.04]},
  {start: 1119,stage: "boston",...terminals,from: [-2.6,3.13,3.44],to: [-2.28,3.02,3.03],target: [-0.81,1.83,0.54],lens: 39},
  {start: 1157,stage: "portland",...terminals,from: [-2.56,3.28,3.35],to: [-2.26,3.08,2.94],target: [-0.84,1.83,0.54],lens: 36},
  {start: 1193,stage: "boston",...portrait,from: [1.41,3.27,4.98],to: [1.78,3.12,4.33],target: [0.04,1.95,-0.20],lens: 38,style: "orbit"},
  {start: 1241,stage: "portland",...wide,from: [-3.77,3.00,5.40],to: [-3.41,2.78,4.73],target: [-0.53,1.95,-0.23],lens: 43},
  {start: 1290,stage: "sun",from: [-0.99,0.39,7.85],to: [0.68,0.19,7.17],target: [0.09,0.20,0],lens: 44,style: "orbit"},
  {start: 1347,stage: "earth",from: [0.79,0.38,7.32],to: [-0.49,0.15,6.11],target: [0,0.11,0],lens: 42,style: "orbit"},
  {start: 1409,stage: "ground",from: [3.09,2.66,8.94],to: [1.36,1.80,8.04],target: [0,0.28,0.26],lens: 50,style: "orbit",captionY: 0.785},
  {start: 1487,stage: "ground",from: [-1.78,1.30,7.10],to: [-0.55,1.06,6.48],target: [0.12,0.47,0.55],lens: 49,style: "whip",captionY: 0.79},
  {start: 1560,stage: "night",from: [-0.53,2.92,8.18],to: [0.23,3.22,6.85],target: [0,5.84,-13.65],lens: 48,style: "orbit",captionY: 0.695},
  {start: 1640,stage: "boston",...terminals,from: [-2.56,3.31,3.24],to: [-2.42,3.14,2.97],target: [-0.86,1.81,0.62],lens: 37},
  {start: 1672,stage: "portland",...terminals,from: [-2.28,3.10,3.09],to: [-2.10,2.96,2.77],target: [-0.89,1.85,0.63],lens: 36},
  {start: 1711,stage: "boston",...sounder,from: [1.37,2.59,3.51],to: [0.74,2.51,3.03],lens: 32},
];

export function shotAt(frame: number, cuts = shots) {
  let i = cuts.length - 1;
  while (i > 0 && frame < cuts[i].start) i--;
  return {shot: cuts[i], end: cuts[i + 1]?.start ?? 1740};
}

const between = (f: number,a: number,b: number) => f >= a && f < b;
const ramp = (f: number,a: number,b: number) => ease((f-a)/(b-a));
const blend = (a: Point,b: Point,t: number) => a.map((v,i) => v + (b[i]-v)*t) as Point;
const keyUse = {
  boston: [[131,169],[695,733],[806,864],[1074,1116],[1196,1238]],
  portland: [[736,771],[1041,1086],[1245,1281]],
};

export const suspenseLight = (frame: number) => ramp(frame,677,689)*(1-ramp(frame,cues.firstReply,cues.firstReply+9));

export function cameraAt(frame: number, cuts = shots, hitFrame?: number, shakeScale = 1): {shot: Shot; pos: Point; roll: number; target?: Point} {
  const {shot,end} = shotAt(frame,cuts);
  const local = frame-shot.start;
  const duration = end-shot.start;
  const f = local/duration;
  const hit = hitFrame ?? (shot.start === 1039 ? cues.reply-3 : shot.stage === "paper" ? cues.paperIgnition : cues.surge);
  const amount = shot.style === "whip" ? f ** 2.65 : shot.style === "hit" ? f*0.18 + ramp(frame,hit-1,hit+10)*0.82 : ease(f)*0.72+f*0.28;
  const pos = blend(shot.from,shot.to,amount);
  if (shot.style === "orbit") {
    const [cx,,cz] = shot.target;
    const [ax,,az] = shot.from;
    const [bx,,bz] = shot.to;
    const first = Math.atan2(ax-cx,az-cz);
    const delta = Math.atan2(bx-cx,bz-cz)-first;
    const angle = first + Math.atan2(Math.sin(delta),Math.cos(delta))*amount;
    const distance = Math.hypot(ax-cx,az-cz)*(1-amount) + Math.hypot(bx-cx,bz-cz)*amount;
    pos[0] = cx+Math.sin(angle)*distance;
    pos[2] = cz+Math.cos(angle)*distance;
  }
  const since = frame-(shot.stage === "paper" ? cues.paperIgnition : cues.surge);
  const jolt = between(since,0,16) ? (1-since/16)*Math.cos(since*1.7)*shakeScale : 0;
  pos[0] += jolt*0.21;
  pos[1] += jolt*0.12;
  return {shot,pos,roll:jolt*0.028};
}

export type Take = {speaker: string; start: number; mouths: number[]};
const defaultTakes = Object.values(timings);
function mouthFor(frame: number, office: Office, takes: Take[]) {
  const line = takes.find((take) => take.speaker === office && between(frame,take.start,take.start+take.mouths.length));
  return line?.mouths[frame-line.start];
}

function carry(frame: number, at: number) {
  if (frame < 90) return rest;
  const raised: Point = [-0.98,2.24,0.49];
  if (frame < at+9) return blend(contact,raised,ramp(frame,at,at+9));
  return blend(raised,rest,ramp(frame,at+9,at+28));
}

export function act(frame: number, office: Office, incident = false, takes: Take[] = defaultTakes, events = cues): OfficeAction {
  const boston = office === "boston";
  const lift = events.lead[office];
  const lead = incident ? contact : carry(frame,lift);
  const grip = incident ? 0 : ramp(frame,lift-11,lift-2)*(1-ramp(frame,lift+28,lift+38));
  const tap = events.relay.reduce((hit,when) => {
    const delta=frame-when;
    return between(delta,0,5) ? Math.max(hit,1-delta/5) : hit;
  },0);
  const press = incident ? 0 : Math.max(...keyUse[office].map(([start,end]) =>
    ramp(frame,start,start+8)*(1-ramp(frame,end-7,end))));
  const bump = boston ? ramp(frame,408,417)*(1-ramp(frame,424,439)) : 0;
  const back = boston ? ramp(frame,437,465)*(1-ramp(frame,626,665)) : 0;
  const flare = incident ? ramp(frame,587,596)*(1-0.21*ramp(frame,599,620)) : 0;
  const startle = bump+flare;
  const move = boston && (between(frame,437,466) || between(frame,626,667));
  const stride = between(frame,437,466) ? -185 : between(frame,626,667) ? 118 : 0;
  const listen = !boston && !incident ? ramp(frame,910,941)*(1-ramp(frame,951,980)) : 0;
  const leadSide = incident ? 0 : ramp(frame,lift-30,lift-11)*(1-ramp(frame,lift+34,lift+68));
  const idleX = boston ? 0.03 : 0.08;
  const x = incident ? 0.78-0.95*flare : idleX + (0.31-idleX)*press - back*1.84 - bump*0.22 - leadSide*1.14;
  const z = -0.56+0.41*press-startle*0.24+listen*0.14;
  const talk = incident ? undefined : mouthFor(frame,office,takes);
  const anticipation = boston && between(frame,369,408);
  const elevation = -0.44*(anticipation ? 1 : between(frame,408,423) ? 1-ramp(frame,408,423) : 0);
  const pop = Math.sin((frame-408)*1.13)*Math.exp(-Math.max(0,frame-408)*0.065);
  const left: Point = [x-0.44-startle*0.53,1.20+elevation+startle*0.92,z+0.27];
  const right: Point = [x+0.45+startle*0.41,1.22+elevation+startle*0.86,z+0.24+listen*0.22];
  return {
    tap, loose: 0, reach: 0, pressing: false,
    chair: boston ? ramp(frame,432,462) : flare*0.62,
    lampPulse: boston && between(frame,408,440) ? Math.abs(pop)*1.8 : 0,
    pose: {x,z,elevation,lean: -bump*20+back*4-listen*15+flare*17,phase: frame/17,stride: move ? stride : undefined,
      mode: anticipation ? "sit" : move ? "stroll" : "stand", speech: talk,
      look: listen ? 0.84 : leadSide > 0.3 ? -0.86 : undefined,
      expr: startle > 0.33 || between(frame,950,978) && !boston ? "shock" :
        between(frame,1048,1290) ? "relief" : between(frame,734,948) ? "stern" : between(frame,369,685) ? "nervous" : "neutral",
    },
    hands: {
      left: blend(left,[lead[0]-0.08,lead[1]+0.054,lead[2]+0.033],grip),
      right: blend(right,[0.825,1.67-tap*0.091,0.710],press),
      lead, recoil: Math.min(1,startle), mug: boston && between(frame,408,464) ? pop : 0,
    },
  };
}

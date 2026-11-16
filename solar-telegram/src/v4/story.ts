import type {OfficeAction} from "../office";
import {ease} from "../stage";
import {act as baseAction, cameraAt as moveCamera, shotAt as selectShot, shots as baseShots, type Shot} from "../v3/story";
import timings from "../../public/voice-v4/performance.json";
import cues from "./cues.json";

const changes: Record<number, Partial<Shot>> = {
  0: {from: [-2.28,3.53,2.74], to: [-2.02,3.36,2.56], target: [-1.05,1.69,0.53], lens: 36},
  30: {from: [-2.30,3.31,2.78], to: [-2.15,3.12,2.58], lens: 36},
  90: {from: [1.85,6.78,10.8], to: [1.31,5.72,7.7], target: [-0.25,3.02,-22.5]},
  132: {from: [0.91,2.78,4.58], to: [0.75,2.74,4.27], target: [0.36,2.24,-0.12], lens: 39, blur: 2},
  167: {from: [1.90,2.52,3.23], to: [1.15,2.46,2.83]},
  269: {target: [2.00,3.95,-24.50]},
  309: {from: [1.9,2.98,3.61], to: [1.2,2.67,3.12]},
  369: {from: [0.48,2.56,4.14], to: [0.41,2.57,3.90], target: [-0.36,2.25,-1.05]},
  404: {from: [-4.24,2.13,0.80], to: [-4.15,2.06,0.57], target: [-0.96,1.56,-1.28], lens: 55, blur: 0, captionY: 0.84},
  434: {from: [-4.33,2.17,1.38], to: [-4.27,2.11,2.14], target: [-1.63,1.48,-1.42], lens: 61, blur: 0, captionY: 0.84},
  482: {from: [0.25,4.83,10.62], to: [-4.8,8.88,14.5], target: [0.8,3.43,-15.0], lens: 46},
  517: {start: 512, from: [2.23,3.10,3.72], to: [2.04,2.93,3.01], target: [0.87,1.83,-0.41], lens: 37, style: "hit", blur: 2},
  565: {from: [2.17,3.23,4.62], to: [1.91,3.05,4.17], target: [0.40,2.08,-0.83], lens: 50, blur: 1},
  615: {from: [-3.81,2.65,3.64], to: [-3.07,2.62,3.80], target: [-1.75,1.79,-1.10], lens: 51},
  774: {from: [-2.20,3.18,2.56], to: [-1.96,3.08,2.35], target: [-1.06,1.72,0.56], lens: 34},
  864: {from: [-2.37,3.39,2.92], to: [-2.16,3.30,2.64], target: [-1.15,1.71,0.55], lens: 34},
  914: {from: [0.02,2.50,3.99], to: [0.12,2.48,3.20], target: [0.11,2.40,-0.46], lens: 30, blur: 3, captionY: 0.78},
  948: {from: [1.51,2.77,3.53], to: [0.82,2.48,3.07], target: [0.48,1.86,0.26], lens: 32},
  1039: {from: [0.01,2.58,4.12], to: [0.09,2.51,3.64], target: [0.17,2.33,-0.30], lens: 34},
  1560: {from: [-0.68,2.74,8.3], to: [0.10,2.93,7.43], target: [0.03,5.60,-13.0], lens: 52, captionY: 0.69},
  1711: {from: [1.48,2.55,3.40], to: [0.88,2.47,2.98], target: [0.53,1.70,0.31]},
};

const mugInsert: Shot = {start: 471, stage: "boston", from: [2.45,2.79,2.57], to: [2.26,2.65,2.28],
  target: [1.25,1.57,0.62], lens: 27, blur: 4, captionY: 0.82};
export const shots = [...baseShots.map((shot) => ({...shot,...changes[shot.start]})), mugInsert].sort((a,b) => a.start-b.start);
export const shotAt = (frame: number) => selectShot(frame,shots);
const ramp = (frame: number, start: number, end: number) => ease((frame-start)/(end-start));
const arc = (frame: number, start: number, top: number, end: number) => ramp(frame,start,top)*(1-ramp(frame,top,end));
const within = (frame: number,start: number,end: number) => frame >= start && frame < end;

export function cameraAt(frame: number) {
  const {shot} = shotAt(frame);
  const hit = shot.start === 512 ? cues.paperArc : shot.stage === "paper" ? cues.paperIgnition : shot.start === 1039 ? cues.reply : cues.surge;
  const path = moveCamera(frame, shots, hit, shot.start === 404 ? 1.55 : 0.72);
  if (shot.start === 512) {
    const t = Math.max(0,frame-cues.paperArc);
    const jolt = (1-ramp(t,0,8))*Math.sin(2.18*t+1.2)*Number(frame>=cues.paperArc);
    path.pos[0] += 0.14*jolt;
    path.pos[1] -= 0.078*jolt;
    path.roll += jolt*0.022;
  }
  return path;
}

const takes = Object.values(timings);
function recoilAt(frame: number) {
  const lurch = ramp(frame,404,420);
  const retreat = ramp(frame,425,462)*(1-ramp(frame,626,665));
  const kick = arc(frame,432,440,452);
  const chair = ramp(frame,439,461);
  return {lurch,retreat,kick,chair};
}

export function act(frame: number, office: "boston" | "portland", incident = false): OfficeAction {
  const action = baseAction(frame,office,incident,takes,cues);
  const {pose,hands} = action;
  pose.hidden = frame < 90 || within(frame,167,208) || within(frame,471,482) || frame >= 1711;
  if (!hands) return action;

  if (incident) {
    const step = ramp(frame,cues.paperIgnition+1,cues.paperIgnition+21);
    const react = ramp(frame,cues.paperIgnition,cues.paperIgnition+8);
    pose.x = 0.63-1.12*step;
    pose.z = -1.10-0.50*step;
    pose.elevation = 0.075*arc(frame,cues.paperIgnition,cues.paperIgnition+7,cues.paperIgnition+17);
    pose.lean = 20*react-7*step;
    pose.firelight = ramp(frame,cues.paperIgnition,cues.paperIgnition+8)*(0.64+0.12*Math.sin((frame-cues.paperIgnition)*0.72));
    pose.mode = within(frame,cues.paperIgnition+1,cues.paperIgnition+23) ? "stroll" : "stand";
    pose.stride = -90*arc(frame,cues.paperIgnition,cues.paperIgnition+8,cues.paperIgnition+22);
    pose.look = 0.9-0.22*step;
    hands.left = [pose.x-0.53-0.10*react,1.40+1.04*react,pose.z+0.12];
    hands.right = [pose.x+0.47+0.18*react,1.48+0.78*react,pose.z+0.20];
    hands.recoil = react;
    action.chairTravel = [-0.35,0,-1.84];
    return action;
  }

  if (office === "boston" && within(frame,369,665)) {
    const {lurch,retreat,kick,chair} = recoilAt(frame);
    const recovery = ramp(frame,626,665);
    const jump = arc(frame,407,415,429);
    pose.x = -0.28-0.37*lurch-1.68*retreat+0.67*recovery;
    pose.z = -1.21-0.17*lurch-0.10*retreat+0.82*recovery;
    pose.mode = within(frame,425,467) || within(frame,625,665) ? "stroll" : "stand";
    pose.stride = -112*arc(frame,426,443,464)+110*arc(frame,625,642,665);
    pose.kick = kick;
    pose.elevation = 0.15*jump;
    pose.lean = 19*jump-10*retreat;
    pose.look = kick > 0.25 ? 0.92 : 0.45;
    hands.left = [pose.x-0.51-0.23*jump,1.19+0.94*jump+0.32*kick,pose.z+0.08];
    hands.right = [pose.x+0.52+0.21*jump,1.24+0.83*jump+0.21*kick,pose.z+0.09];
    hands.recoil = Math.max(jump,kick);
    hands.mug = Math.sin((frame-408)*1.35)*Math.exp(-Math.max(0,frame-408)*0.041) + 0.88*arc(frame,468,473,481)*Math.sin(frame*1.6);
    action.chair = chair;
  }
  if (office === "boston") {
    const {chair} = recoilAt(frame);
    action.chairTravel = [-0.52+0.65*chair,0,-1.73-0.39*chair];
  }
  if (within(frame,914,948) && office === "portland") {
    const lean = ramp(frame,914,940);
    pose.x = 0.11;
    pose.z = -0.49-0.36*lean;
    pose.lean = -3+2*lean;
    pose.look = 0.36+0.15*lean;
    pose.expr = "nervous";
    hands.left = [-0.32,1.35,pose.z+0.16];
    hands.right = [0.66,1.40,pose.z+0.16];
  }
  if (within(frame,1039,1290)) {
    pose.expr = frame < 1081 ? "shock" : "nervous";
    pose.look = Math.sin((frame-1080)*0.039)*0.47-0.25;
  }
  return action;
}

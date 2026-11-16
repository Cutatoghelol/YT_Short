import * as THREE from "three";
import {ctex, planks, rep} from "./bridge/paint";
import {bodyFront, Pen, type Expr, type Outfit} from "./bridge/toon";
import {NOINK} from "./bridge/ink";
import {basic, box, cylinder, ease, groupAt, matte, tube, type Point} from "./stage";
import {makeArm, makeGroundedLead} from "./office-rig";
import cues from "./cues.json";

const boston: Outfit = {
  skin: "#fac795", jacket: "#b85e49", pants: "#47435c", boots: "#322b3c",
  buttons: "#f2d091", hat: "hair", hair: "#3e2b39",
};
const portland: Outfit = {
  skin: "#d39162", jacket: "#4f9d9b", pants: "#40374b", boots: "#2f2c39",
  buttons: "#fce1a1", hat: "hair", hair: "#272438", moustache: "#282333", build: "stout",
};

type ActorPose = {
  x: number; z: number; elevation?: number; lean: number;
  mode: "stand" | "stroll" | "sit" | "fall"; phase: number; expr: Expr;
  stride?: number; speech?: number; look?: number; kick?: number; hidden?: boolean; firelight?: number;
};

export type OfficeAction = {
  tap: number; loose: number; reach: number; pressing: boolean; chair: number;
  pose: ActorPose; lampPulse?: number; chairTravel?: Point;
  hands?: {left: Point; right: Point; lead: Point; recoil: number; mug: number};
};

function skyline(isBoston: boolean) {
  return ctex(isBoston ? "boston-window" : "portland-window", 640, 720, (g, random) => {
    const sky = g.createLinearGradient(0, 0, 0, 720);
    sky.addColorStop(0, isBoston ? "#2a3e69" : "#172a49");
    sky.addColorStop(0.64, isBoston ? "#9e6886" : "#547c88");
    sky.addColorStop(1, isBoston ? "#f6a998" : "#eca68b");
    g.fillStyle = sky;
    g.fillRect(0, 0, 640, 720);
    for (let i = 0; i < 54; i++) {
      g.fillStyle = i % 6 === 0 ? "#ffd5a5" : "#b0adc9";
      g.globalAlpha = random() * 0.6;
      g.fillRect(random() * 640, 30 + random() * 375, 1 + random() * 4, 1 + random() * 4);
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 15; i++) {
      const x = i * 48 - 32;
      const h = 84 + random() * 124;
      const y = 720 - h;
      g.fillStyle = i % 2 ? "#353754" : "#4d435c";
      g.fillRect(x, y, 50, h);
      g.beginPath();
      g.moveTo(x - 4, y);
      g.lineTo(x + 25, y - 28 - random() * 31);
      g.lineTo(x + 54, y);
      g.fill();
      g.fillRect(x + 31, y - 37, 8, 32);
      g.fillStyle = i % 3 ? "#d89977" : "#ffd292";
      g.fillRect(x + 11, y + 19, 8, 16);
      if (i % 2 === 0) g.fillRect(x + 29, y + 21, 8, 16);
    }
  });
}

function wallPaper(isBoston: boolean) {
  const color = isBoston ? "#7e505b" : "#31576b";
  return ctex(`wallpaper-${color}`, 360, 360, (g, random) => {
    g.fillStyle = color;
    g.fillRect(0, 0, 360, 360);
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = i % 2 ? "#f4bf98" : "#221d37";
      g.globalAlpha = random() * 0.13;
      g.fillRect(random() * 360, random() * 360, random() * 13 + 2, random() * 3 + 1);
    }
    g.globalAlpha = 0.25;
    g.strokeStyle = "#e7b783";
    for (let x = 9; x < 360; x += 45) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 360);
      g.stroke();
    }
  });
}

function makeActor(parent: THREE.Group, isBoston: boolean, articulated: boolean, witness: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 1000;
  const pen = new Pen(canvas.getContext("2d")!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.97, 3.29),
    new THREE.MeshBasicMaterial({map: tex, color: isBoston ? "#ffebd6" : "#e6edff", transparent: true, alphaTest: 0.45}),
  );
  face.layers.set(NOINK);
  face.position.set(isBoston ? -0.09 : 0.08, 1.62, -0.58);
  parent.add(face);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 40),
    new THREE.MeshBasicMaterial({color: "#211a2a", transparent: true, opacity: 0.27, depthWrite: false}));
  shadow.layers.set(NOINK);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1, 0.67, 1);
  shadow.position.set(face.position.x, 0.012, face.position.z + 0.1);
  parent.add(shadow);
  const shoulders = [new THREE.Vector3(), new THREE.Vector3()] as const;
  const cardTint = face.material.color.clone();
  const fireTint = new THREE.Color("#ff9858");
  const anchors = (left: [number, number], right: [number, number]) => {
    for (const [i, point] of [left, right].entries()) {
      shoulders[i].set((point[0] / 600 - 0.5) * 1.97, (0.5 - point[1] / 1000) * 3.29, 0.02);
      face.localToWorld(shoulders[i]);
    }
  };
  const outfit: Outfit = witness ? {...portland, jacket: "#ae8153", hair: "#66433e", moustache: "#5f3935"} : isBoston ? boston : portland;
  let drawn = -1;
  return (frame: number, camera: THREE.PerspectiveCamera, tap: number, pose?: ActorPose) => {
    if (pose) {
      face.position.set(pose.x, 1.62 + (pose.elevation ?? 0), pose.z);
      shadow.position.set(pose.x, 0.012, pose.z + 0.1);
      face.rotation.z = pose.lean * 0.012;
      face.visible = shadow.visible = !pose.hidden;
      face.material.color.copy(cardTint).lerp(fireTint, pose.firelight ?? 0);
    }
    face.rotation.y = 0.25 * Math.atan2(camera.position.x - face.position.x, camera.position.z - face.position.z);
    const cel = Math.floor(frame / (articulated ? 1 : pose ? 2 : 3));
    if (cel === drawn) return shoulders;
    drawn = cel;
    const clock = frame + (isBoston ? 0 : 41);
    const blink = clock % 81 < 5;
    let expr: Expr = "neutral";
    if (frame >= 420 && frame < 650) expr = "nervous";
    if (frame >= 650 && frame < 780) expr = frame < 695 ? "stern" : "shock";
    if (frame >= 1320) expr = "relief";
    pen.g.clearRect(0, 0, 600, 1000);
    bodyFront(pen, outfit, {
      mode: pose?.mode ?? "stand", expr: pose?.expr ?? expr, phase: pose?.phase,
      blink, facing: isBoston ? 1 : -1, seed: isBoston ? 18 : 42,
      look: pose?.look ?? (isBoston ? 0.27 : -0.32), tilt: Math.sin(frame / 36) * 2 - tap * 1.8,
      headTilt: Math.sin(frame / 28) * 2.4 - (expr === "stern" ? 4 : 0),
      light: pose?.firelight ? -0.64 : isBoston ? -0.9 : -2.3,
      speech: pose?.speech, plantedStride: pose?.stride, kick: pose?.kick,
      shoulders: articulated ? anchors : undefined,
    });
    tex.needsUpdate = true;
    return shoulders;
  };
}

export function makeOffice(parent: THREE.Group, isBoston: boolean, staging: "classic" | "story" | "incident" | "kinetic" | "fire" = "classic", expressive = false) {
  const articulated = staging === "kinetic" || staging === "fire";
  const wood = matte(isBoston ? "#97674f" : "#744a45", rep(planks(), 2, 2));
  const dark = matte(isBoston ? "#513747" : "#384256");
  const molding = matte(isBoston ? "#a47562" : "#62918a");
  const brass = matte("#d89945");
  const head = matte("#fee393");
  const metal = matte("#483648");
  const black = matte("#31263a");
  const burgundy = matte("#aa4a43");
  const paper = matte("#f3ce8f");
  const cream = matte("#ffe1a9");
  const wallpaper = matte("#ffffff", wallPaper(isBoston));
  const floor = matte("#997b64", rep(planks(), 3, 2));

  box(parent, floor, [11, 0.18, 12], [0, -0.1, 1]);
  box(parent, wallpaper, [4.6, 4.8, 0.16], [-3.5, 2.4, -2.56]);
  box(parent, wallpaper, [4.6, 4.8, 0.16], [3.5, 2.4, -2.56]);
  box(parent, wallpaper, [2.52, 1.74, 0.16], [0, 0.87, -2.56]);
  box(parent, wallpaper, [2.52, 0.8, 0.16], [0, 4.4, -2.56]);
  box(parent, wallpaper, [0.16, 4.8, 5.5], [-4.8, 2.4, -0.1]);
  box(parent, wallpaper, [0.16, 4.8, 5.5], [4.8, 2.4, -0.1]);
  box(parent, dark, [11.6, 0.78, 0.12], [0, 0.43, -2.44]);
  box(parent, molding, [11.6, 0.1, 0.15], [0, 0.83, -2.4]);

  box(parent, basic("#ffffff", skyline(isBoston)), [2.6, 2.45, 0.06], [0, 2.89, -2.73]);
  for (const x of [-1.23, 0, 1.23]) box(parent, dark, [x ? 0.16 : 0.065, 2.37, 0.17], [x, 2.9, -2.46]);
  for (const y of [1.73, 2.89, 4.07]) box(parent, dark, [2.59, y === 2.89 ? 0.075 : 0.15, 0.2], [0, y, -2.42]);
  box(parent, molding, [2.83, 0.09, 0.35], [0, 1.67, -2.36]);

  const shelfX = isBoston ? -2.22 : 2.27;
  for (const y of [2.38, 3.27]) {
    box(parent, wood, [1.1, 0.09, 0.51], [shelfX, y, -2.23]);
    for (let i = 0; i < 6; i++) {
      const h = 0.25 + (i * 17 % 7) * 0.031;
      const cover = [burgundy, molding, dark, brass][i % 4];
      box(parent, cover, [0.115, h, 0.28], [shelfX - 0.42 + i * 0.15, y + h / 2 + 0.05, -2.20]).rotation.z = i > 3 ? -0.12 : 0;
    }
  }
  const clockX = -shelfX;
  cylinder(parent, dark, 0.33, 0.13, [clockX, 3.14, -2.43], 32).rotation.x = Math.PI / 2;
  cylinder(parent, paper, 0.255, 0.13, [clockX, 3.14, -2.40], 32).rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    box(parent, dark, [0.015, 0.038, 0.009], [clockX + Math.sin(angle) * 0.209, 3.14 + Math.cos(angle) * 0.209, -2.327]).rotation.z = -angle;
  }
  box(parent, dark, [0.025, 0.134, 0.015], [clockX - 0.04, 3.11, -2.311]).rotation.z = -0.9;
  box(parent, dark, [0.017, 0.19, 0.015], [clockX + 0.047, 3.205, -2.310]).rotation.z = -0.55;

  box(parent, wood, [3.93, 0.13, 1.72], [0, 1.36, 0.18]);
  box(parent, dark, [3.94, 0.065, 1.73], [0, 1.31, 0.18]);
  box(parent, molding, [3.9, 0.033, 0.035], [0, 1.37, 1.046]);
  for (const x of [-1.72, 1.72]) {
    for (const z of [-0.44, 0.8]) box(parent, wood, [0.14, 1.28, 0.13], [x, 0.64, z]);
    box(parent, dark, [0.32, 0.22, 1.5], [x, 1.16, 0.17]);
  }
  box(parent, dark, [2.1, 0.025, 1.07], [0.22, 1.436, 0.19]);
  box(parent, paper, [0.52, 0.054, 0.4], [1.06, 1.45, -0.25]).rotation.y = 0.19;
  box(parent, cream, [0.45, 0.014, 0.33], [1.06, 1.486, -0.26]).rotation.y = 0.19;
  for (let i = 0; i < 4; i++) box(parent, molding, [0.29 - i * 0.04, 0.006, 0.008], [1.07, 1.495, -0.37 + i * 0.055]);

  // A shaded desk lamp and painted accents frame the working area.
  const lampX = articulated ? 1.73 : isBoston ? -1.47 : 1.48;
  cylinder(parent, brass, 0.23, 0.07, [lampX, 1.46, -0.23]);
  cylinder(parent, metal, 0.027, 0.64, [lampX, 1.81, -0.23]);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.117, 0.32, 0.30, 20), matte(isBoston ? "#a25d43" : "#477e71"));
  shade.position.set(lampX, 2.15, -0.23);
  parent.add(shade);
  cylinder(parent, basic("#e6af6f"), 0.29, 0.04, [lampX, 2.014, -0.23]);
  cylinder(parent, brass, 0.104, 0.044, [lampX, 2.322, -0.23]);

  const jarX = [-0.88, -0.36];
  for (const [i, x] of jarX.entries()) {
    cylinder(parent, matte(i ? "#7c9d91" : "#6d9f9e"), 0.203, 0.47, [x, 1.70, 0.34], 24);
    cylinder(parent, matte("#436e73"), 0.212, 0.055, [x, 1.463, 0.34], 24);
    cylinder(parent, matte("#91bbaf"), 0.213, 0.06, [x, 1.92, 0.34], 24);
    cylinder(parent, brass, 0.036, 0.14, [x, 2.015, 0.34]);
    cylinder(parent, brass, 0.036, 0.085, [x + 0.098, 1.985, 0.405]);
    box(parent, matte("#a1c8b8"), [0.045, 0.29, 0.023], [x - 0.11, 1.71, 0.51]).rotation.z = -0.072;
    box(parent, matte("#d9b782"), [0.16, 0.093, 0.021], [x + 0.04, 1.655, 0.538]);
  }
  tube(parent, black, [[-0.78, 2.018, 0.405], [-0.67, 2.14, 0.41], [-0.49, 2.11, 0.41], [-0.36, 2.035, 0.34]], 0.026);
  tube(parent, burgundy, [[-0.26, 2.02, 0.407], [-0.10, 1.99, 0.20], [0.23, 1.55, 0.1], [0.36, 1.54, 0.2]], 0.026);
  const lead = groupAt(parent, [0, 0, 0]);
  tube(lead, burgundy, [[-1.36, 1.47, 0.67], [-1.27, 1.62, 0.8], [-1.21, 1.93, 0.72], [-1.09, 2.09, 0.54], [-0.88, 2.085, 0.34]], 0.032);
  cylinder(lead, head, 0.06, 0.062, [-0.88, 2.081, 0.34]);
  lead.visible = !articulated;

  const sounder = groupAt(parent, [0.35, 1.46, 0.17]);
  box(sounder, wood, [0.8, 0.091, 0.47], [0.19, 0.028, 0.015]);
  box(sounder, metal, [0.67, 0.021, 0.38], [0.19, 0.083, 0.015]);
  for (const x of [0.0, 0.32]) {
    cylinder(sounder, burgundy, 0.116, 0.19, [x, 0.201, 0.0]);
    for (const y of [0.109, 0.14, 0.17, 0.199, 0.231, 0.261, 0.296]) {
      cylinder(sounder, brass, 0.121, 0.012, [x, y, 0]);
    }
  }
  box(sounder, brass, [0.085, 0.3, 0.14], [0.49, 0.249, 0.0]);
  cylinder(sounder, head, 0.032, 0.12, [0.49, 0.41, 0.0]);
  const clapper = groupAt(sounder, [0.48, 0.345, 0]);
  box(clapper, head, [0.57, 0.045, 0.09], [-0.21, 0, 0]);
  box(clapper, metal, [0.13, 0.055, 0.115], [-0.46, 0, 0]);
  cylinder(sounder, brass, 0.047, 0.105, [-0.14, 0.135, 0.14]);

  const key = groupAt(parent, [0.62, 1.457, 0.65]);
  box(key, wood, [0.55, 0.053, 0.225], [0.03, 0.021, 0.05]);
  box(key, brass, [0.12, 0.08, 0.13], [-0.13, 0.069, 0.05]);
  const lever = groupAt(key, [-0.13, 0.121, 0.05]);
  box(lever, brass, [0.39, 0.03, 0.065], [0.17, 0, 0]);
  cylinder(lever, black, 0.069, 0.043, [0.34, 0.035, 0]);
  const tapArm = groupAt(parent, [0, 0, 0]);
  const sleeveMaterial = matte(isBoston ? "#9b4d44" : "#428b89");
  const handMaterial = matte(isBoston ? "#ffd3a1" : "#dc9a69");
  const sleeve = cylinder(tapArm, sleeveMaterial, 0.064, 1, [0, 0, 0]);
  sleeve.layers.set(NOINK);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 12), handMaterial);
  hand.scale.set(0.97, 0.62, 1.42);
  hand.layers.set(NOINK);
  tapArm.add(hand);
  const point = new THREE.Vector3();
  const elbow = new THREE.Vector3(0.31, 1.67, 0.51);
  const axis = new THREE.Vector3(0, 1, 0);
  const reaching = groupAt(parent, [0, 0, 0]);
  const otherSleeve = cylinder(reaching, sleeveMaterial, 0.079, 1, [0, 0, 0]);
  const fingers = new THREE.Mesh(new THREE.SphereGeometry(0.097, 18, 12), handMaterial);
  fingers.scale.set(1.07, 0.67, 0.77);
  reaching.add(fingers);
  const shoulder = new THREE.Vector3();
  const actor = staging === "incident" ? undefined : makeActor(parent, isBoston, articulated, staging === "fire");
  const furniture = staging === "classic" ? undefined : addDressing(parent, isBoston, lampX);
  const rigColor = staging === "fire" ? "#ae8153" : isBoston ? "#b55f4c" : "#4c9694";
  const rig = articulated ? {
    left: makeArm(parent, -1, rigColor, isBoston ? "#fac795" : "#d39162", expressive),
    right: makeArm(parent, 1, rigColor, isBoston ? "#fac795" : "#d39162", expressive),
    lead: makeGroundedLead(parent, head, burgundy),
  } : undefined;
  const handTarget = new THREE.Vector3();
  const mug = articulated && isBoston ? groupAt(parent, [1.27, 1.44, 0.63]) : undefined;
  if (mug) {
    const glaze = matte("#bc7a55");
    cylinder(mug, glaze, 0.103, 0.16, [0, 0.082, 0], 20);
    cylinder(mug, matte("#422938"), 0.080, 0.009, [0, 0.165, 0], 20);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.057, 0.018, 8, 20), glaze);
    handle.position.set(0.132, 0.082, 0);
    mug.add(handle);
  }
  const contactFrame = isBoston ? 630 : 591;
  return (frame: number, camera: THREE.PerspectiveCamera, action?: OfficeAction) => {
    const click = action?.tap ?? cues.clicks.reduce((force, when) => {
      const elapsed = frame - when;
      return elapsed >= 0 && elapsed < 5 ? Math.max(force, 1 - elapsed / 5) : force;
    }, 0);
    const disconnect = frame < 120 ? 22 : contactFrame;
    const loose = action?.loose ?? (frame < 120 || frame >= 580 ? ease((frame - disconnect + 12) / 16) : 0);
    lead.position.set((action ? -0.25 : -0.16) * loose, 0.17 * loose, (action ? 0.27 : 0.13) * loose);
    lead.rotation.z = (action ? 0.17 : 0.12) * loose;
    const gesture = action?.reach ?? (ease((frame - disconnect + 22) / 12) * (1 - ease((frame - disconnect - 1) / 14)));
    reaching.visible = !articulated && gesture > 0.0001 && (action !== undefined || frame >= disconnect - 22 && frame <= disconnect + 15);
    if (action) {
      lead.updateMatrix();
      fingers.position.set(-0.88, 2.16, 0.34).applyMatrix4(lead.matrix);
      fingers.position.x -= 0.12 * (1 - gesture);
      fingers.position.y += 0.18 * (1 - gesture);
      fingers.position.z -= 0.33 * (1 - gesture);
    } else {
      fingers.position.set(-0.90 - 0.21 * loose - 0.12 * (1 - gesture),
        2.172 + 0.12 * loose + 0.18 * (1 - gesture), 0.34 + 0.13 * loose - 0.33 * (1 - gesture));
    }
    shoulder.set(action ? action.pose.x - 0.25 : -0.46, 1.69 + gesture * 0.21, action ? action.pose.z + 0.15 : -0.38);
    point.subVectors(fingers.position, shoulder);
    otherSleeve.position.copy(shoulder).addScaledVector(point, 0.5);
    otherSleeve.scale.y = point.length();
    otherSleeve.quaternion.setFromUnitVectors(axis, point.normalize());
    clapper.rotation.z = click * 0.21;
    lever.rotation.z = -click * 0.24;
    const pressing = action?.pressing ?? ((frame >= 240 && frame < 361) || (frame >= 1320 && frame < 1550));
    tapArm.visible = !articulated && pressing;
    hand.position.set(0.82, 1.66 - 0.084 * click, 0.714);
    point.subVectors(hand.position, elbow);
    sleeve.position.copy(elbow).addScaledVector(point, 0.5);
    sleeve.scale.y = point.length();
    sleeve.quaternion.setFromUnitVectors(axis, point.normalize());
    const anchors = actor?.(frame, camera, click, action?.pose);
    if (rig && action?.hands && anchors) {
      rig.lead(handTarget.set(...action.hands.lead));
      rig.left(anchors[0], handTarget.set(...action.hands.left), action.hands.recoil, action.pose.hidden);
      rig.right(anchors[1], handTarget.set(...action.hands.right), action.hands.recoil, action.pose.hidden);
      if (mug) {
        mug.position.x = 1.27 + Math.abs(action.hands.mug) * 0.22;
        mug.rotation.z = action.hands.mug * 0.22;
        mug.position.y = 1.44 + Math.abs(action.hands.mug) * 0.019;
      }
    }
    if (furniture && action) {
      furniture.chair.position.set(...(action.chairTravel ?? [-0.42, 0, -1.21 - action.chair * 0.43]));
      furniture.chair.rotation.y = -0.19 - action.chair * 0.65;
      furniture.chair.rotation.x = -Math.sin(action.chair * Math.PI) * 0.24;
      furniture.lamp.intensity = 5.4 + (action.lampPulse ?? 0) * 4;
    }
  };
}

function addDressing(parent: THREE.Group, isBoston: boolean, lampX: number) {
  const chair = groupAt(parent, [-0.42, 0, -1.21]);
  const timber = matte(isBoston ? "#71464c" : "#595066");
  const edge = matte("#bb7760");
  box(chair, timber, [0.78, 0.13, 0.68], [0, 0.65, 0]);
  for (const x of [-0.31, 0.31]) {
    for (const z of [-0.23, 0.24]) box(chair, timber, [0.083, 0.68, 0.08], [x, 0.34, z]).rotation.z = -x * 0.22;
    box(chair, timber, [0.093, 0.91, 0.095], [x, 1.025, -0.29]).rotation.x = -0.14;
    box(chair, edge, [0.067, 0.31, 0.052], [x * 0.48, 1.13, -0.34]);
  }
  box(chair, timber, [0.77, 0.18, 0.1], [0, 1.40, -0.37]);
  box(chair, edge, [0.72, 0.034, 0.113], [0, 1.49, -0.37]);

  const rug = ctex(isBoston ? "boston-woven-rug" : "portland-woven-rug", 648, 416, (g, r) => {
    g.fillStyle = isBoston ? "#875758" : "#456c70";
    g.fillRect(0, 0, 648, 416);
    for (let x = 5; x < 648; x += 6) {
      g.fillStyle = r() > 0.5 ? "#e3ba8524" : "#271d3323";
      g.fillRect(x, 0, 2, 416);
    }
    g.strokeStyle = "#dcb27c";
    g.lineWidth = 5;
    g.strokeRect(17, 18, 614, 380);
    g.lineWidth = 2;
    g.strokeRect(28, 30, 592, 356);
    for (let i = 0; i < 7; i++) {
      const x = 65 + 86 * i;
      g.fillStyle = i % 2 ? "#e4b482" : "#bc8e81";
      for (const y of [58, 208, 358]) {
        g.beginPath();
        g.moveTo(x, y - 12);
        g.lineTo(x + 23, y);
        g.lineTo(x, y + 12);
        g.lineTo(x - 23, y);
        g.fill();
      }
    }
  });
  box(parent, matte("#ffffff", rug), [4.7, 0.013, 2.47], [-0.47, 0.002, -0.03]);
  const parchment = [matte("#dbae79"), matte("#fedaa0"), matte("#cda286")];
  const cabinetX = isBoston ? -3.19 : 3.2;
  box(parent, timber, [0.91, 1.72, 0.62], [cabinetX, 0.87, -1.96]);
  box(parent, edge, [0.98, 0.082, 0.69], [cabinetX, 1.75, -1.96]);
  for (const y of [0.39, 0.85, 1.31]) {
    box(parent, edge, [0.78, 0.34, 0.044], [cabinetX, y, -1.625]);
    box(parent, matte("#d3a161"), [0.17, 0.028, 0.071], [cabinetX, y, -1.58]);
  }
  for (let i = 0; i < 6; i++) {
    box(parent, parchment[i % 3], [0.43, 0.012, 0.31],
      [cabinetX + 0.03 * Math.sin(i), 1.80 + i * 0.014, -1.91]).rotation.y = Math.sin(i * 2.6) * 0.12;
  }
  const lamp = new THREE.PointLight(isBoston ? "#ffb46a" : "#fce7a5", 5.4, 3.8, 2);
  lamp.position.set(lampX, 1.99, -0.21);
  parent.add(lamp);
  const windowFill = new THREE.PointLight(isBoston ? "#a6a8fb" : "#8dcdec", 2.7, 5.6, 2);
  windowFill.position.set(0, 2.82, -2.15);
  parent.add(windowFill);
  return {chair, lamp};
}

export function skylineRooftop(parent: THREE.Group, near: boolean) {
  const roof = matte(near ? "#55415d" : "#393952");
  const wall = matte(near ? "#7f555d" : "#41425e");
  const glow = basic(near ? "#f1ac69" : "#cca496");
  for (let i = 0; i < 14; i++) {
    const x = (i % 7 - 3) * 1.33 + (!near ? 0.6 : 0);
    const z = -1.4 - Math.floor(i / 7) * 2.5 - (near ? 0 : 6.6);
    const h = 0.75 + ((i * 17) % 8) * 0.19;
    const at: Point = [x, h / 2, z];
    box(parent, wall, [1.05, h, 1.1], at);
    const gable = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.91, 0.56, 4), roof);
    gable.rotation.y = Math.PI / 4;
    gable.position.set(x, h + 0.255, z);
    parent.add(gable);
    box(parent, wall, [0.18, 0.46, 0.2], [x + 0.24, h + 0.45, z - 0.10]);
    const y = h * 0.60;
    for (const offset of [-0.25, 0.25]) {
      box(parent, glow, [0.122, 0.157, 0.012], [x + offset, y, z + 0.555]);
    }
  }
}

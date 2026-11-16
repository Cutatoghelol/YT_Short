import * as THREE from "three";
import {groupAt, matte, type Point, tube} from "./stage";

const up = new THREE.Vector3(0, 1, 0);
const ball = new THREE.SphereGeometry(1, 16, 12);

export function makeArm(parent: THREE.Group, side: number, sleeveColor: string, skinColor: string, expressive = false) {
  const root = groupAt(parent, [0, 0, 0]);
  const cloth = matte(sleeveColor);
  const skin = matte(skinColor);
  const cuff = matte("#e7c5a0");
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.103, 0.15, 1, 14), cloth);
  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.106, 1, 14), cloth);
  const shoulderCap = new THREE.Mesh(ball, cloth);
  const elbowCap = new THREE.Mesh(ball, cloth);
  shoulderCap.scale.setScalar(expressive ? 0.109 : 0.141);
  elbowCap.scale.setScalar(expressive ? 0.091 : 0.105);
  const palm = groupAt(root, [0, 0, 0]);
  const fingers = new THREE.Mesh(ball, skin);
  fingers.scale.set(0.091, 0.105, 0.063);
  const thumb = new THREE.Mesh(ball, skin);
  thumb.scale.set(0.042, 0.067, 0.046);
  thumb.position.set(-0.055 * side, 0.032, 0.034);
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.083, 0.088, 0.064, 14), cuff);
  wrist.position.y = -0.086;
  palm.add(fingers, thumb, wrist);
  root.add(upper, forearm, shoulderCap, elbowCap);
  const direction = new THREE.Vector3();
  const bend = new THREE.Vector3();
  const elbow = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const wristEnd = new THREE.Vector3();
  function segment(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
    mid.subVectors(b, a);
    mesh.scale.y = mid.length() + 0.028;
    mesh.position.copy(a).addScaledVector(mid, 0.5);
    mesh.quaternion.setFromUnitVectors(up, mid.normalize());
  }
  return (shoulder: THREE.Vector3, goal: THREE.Vector3, opened: number, hidden?: boolean) => {
    root.visible = !hidden;
    if (hidden) return;
    direction.subVectors(goal, shoulder);
    const distance = Math.max(0.012, direction.length());
    direction.divideScalar(distance);
    bend.set(0.76 * side, expressive && goal.z > 0.1 ? -0.22 : -0.97, -0.18 + 0.20 * opened);
    bend.addScaledVector(direction, -bend.dot(direction)).normalize();
    const half = distance / 2;
    const bone = Math.max(expressive ? 0.49 : 0.57, half + 0.013);
    elbow.copy(shoulder).addScaledVector(direction, half).addScaledVector(bend, Math.sqrt(bone ** 2 - half ** 2));
    if (expressive && Math.abs(elbow.x) < 2.03 && elbow.z > -0.75 && goal.z > 0.1) {
      elbow.y = Math.max(elbow.y, 1.60);
    }
    shoulderCap.position.copy(shoulder);
    elbowCap.position.copy(elbow);
    aim.subVectors(goal, elbow).normalize();
    wristEnd.copy(goal).addScaledVector(aim, -0.072);
    segment(upper, shoulder, elbow);
    segment(forearm, elbow, wristEnd);
    palm.position.copy(goal);
    palm.quaternion.setFromUnitVectors(up, aim);
    fingers.scale.x = opened > 0.5 ? 0.108 : 0.091;
  };
}

export const contact: Point = [-0.88, 2.083, 0.34];
export const rest: Point = [-1.38, 1.51, 0.73];

export function makeGroundedLead(parent: THREE.Group, brass: THREE.Material, rubber: THREE.Material) {
  const pin = groupAt(parent, contact);
  const terminal = new THREE.Mesh(new THREE.TorusGeometry(0.063, 0.021, 9, 20), brass);
  terminal.rotation.x = Math.PI / 2;
  pin.add(terminal);
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.124, 0.056, 0.048), brass);
  clamp.position.set(-0.105, -0.006, 0);
  pin.add(clamp);
  let cable = tube(parent, rubber, [[-1.72, 1.45, 0.86], [-1.40, 1.63, 0.84], [-1.14, 2.11, 0.54], contact], 0.029, 25);
  const previous = new THREE.Vector3(...contact);
  return (tip: THREE.Vector3) => {
    if (!tip.equals(previous)) {
      previous.copy(tip);
      pin.position.copy(tip);
      pin.rotation.z = Math.min(0.50, (tip.y - rest[1]) * 0.15);
      parent.remove(cable);
      cable.geometry.dispose();
      const arc = Math.max(0.03, (tip.y - 1.48) * 0.49);
      cable = tube(parent, rubber, [[-1.72, 1.45, 0.86], [-1.63, 1.47 + arc, 0.87],
        [(tip.x - 1.63) / 2, tip.y + arc * 0.25, tip.z + 0.18], [tip.x - 0.11, tip.y, tip.z]], 0.029, 25);
    }
  };
}

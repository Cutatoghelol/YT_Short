import * as THREE from "three";

export type Point = [number, number, number];
const block = new THREE.BoxGeometry();

export function box(group: THREE.Object3D, material: THREE.Material, size: Point, at: Point) {
  const mesh = new THREE.Mesh(block, material);
  mesh.scale.set(...size);
  mesh.position.set(...at);
  group.add(mesh);
  return mesh;
}

export function cylinder(group: THREE.Object3D, material: THREE.Material, radius: number, length: number, at: Point, facets = 18) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, facets), material);
  mesh.position.set(...at);
  group.add(mesh);
  return mesh;
}

export function tube(group: THREE.Object3D, material: THREE.Material, points: Point[], radius: number, segments = 36) {
  const spline = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(spline, segments, radius, 6, false), material);
  group.add(mesh);
  return mesh;
}

export function matte(color: string, map?: THREE.Texture) {
  return new THREE.MeshLambertMaterial({color, map: map ?? null});
}

export function basic(color: string, map?: THREE.Texture) {
  return new THREE.MeshBasicMaterial({color, map: map ?? null});
}

export function groupAt(parent: THREE.Object3D, at: Point) {
  const group = new THREE.Group();
  group.position.set(...at);
  parent.add(group);
  return group;
}

export function ease(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

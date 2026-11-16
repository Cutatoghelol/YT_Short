import * as THREE from "three";
import {ctex, rng} from "../bridge/paint";
import {NOINK} from "../bridge/ink";
import {basic, box, cylinder, ease, groupAt, matte, tube, type Point} from "../stage";

function glow(parent: THREE.Group, tint: string, size: number) {
  const map = ctex(`v2-glow-${tint}`, 128, 128, (g) => {
    const falloff = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    falloff.addColorStop(0, `${tint}ff`);
    falloff.addColorStop(0.25, `${tint}72`);
    falloff.addColorStop(1, `${tint}00`);
    g.fillStyle = falloff;
    g.fillRect(0, 0, 128, 128);
  });
  const light = new THREE.Sprite(new THREE.SpriteMaterial({
    map, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  light.layers.set(NOINK);
  light.scale.set(size, size, 1);
  parent.add(light);
  return light;
}

export function makeSparks(parent: THREE.Group, origin: Point, spread: number) {
  const random = rng(491);
  const position = new Float32Array(64 * 3);
  const colors = new Float32Array(position.length);
  const particles = Array.from({length: 64}, (_, i) => ({
    x: (random() - 0.44) * spread, y: (0.4 + random()) * spread, z: (random() - 0.5) * spread,
    delay: (i % 5) * 0.012, life: 0.21 + random() * 0.4,
  }));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.024, vertexColors: true, depthWrite: false, blending: THREE.AdditiveBlending, transparent: true, toneMapped: false,
  }));
  points.frustumCulled = false;
  points.layers.set(NOINK);
  parent.add(points);
  const flare = glow(parent, "#ffa34e", 0.7);
  flare.position.set(...origin);
  return (t: number) => {
    points.visible = t >= 0 && t < 0.72;
    flare.visible = points.visible;
    if (!points.visible) return;
    flare.material.opacity = Math.exp(-t * 13) * (0.7 + 0.3 * Math.cos(57 * t));
    for (const [i, p] of particles.entries()) {
      const age = Math.max(0, t - p.delay);
      const intensity = t >= p.delay ? Math.max(0, 1 - age / p.life) : 0;
      position[i * 3] = origin[0] + p.x * age;
      position[i * 3 + 1] = origin[1] + p.y * age - 2.8 * age * age;
      position[i * 3 + 2] = origin[2] + p.z * age;
      colors[i * 3] = intensity;
      colors[i * 3 + 1] = intensity * 0.63;
      colors[i * 3 + 2] = intensity * 0.23;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  };
}

export function makePaperFire(parent: THREE.Group, spill = false, enhanced = false) {
  const base = groupAt(parent, [1.12, 1.535, -0.25]);
  const ember = glow(base, "#ff923e", 0.91);
  ember.position.y = 0.16;
  const materials = (spill ? ["#d74537", "#f66b33", "#ff942e", "#ffcd59", "#fff0ac"] : ["#e65547", "#ff992e", "#ffdd74"]).map((color) => basic(color));
  const flames = materials.map((material, i) => {
    const outline = new THREE.Shape();
    outline.moveTo(-0.14, 0);
    outline.bezierCurveTo(-0.23, 0.16, -0.10, 0.30, -0.18, 0.43);
    outline.bezierCurveTo(-0.035, 0.36, -0.06, 0.47, 0.035, 0.60);
    outline.bezierCurveTo(0.023, 0.48, 0.19, 0.42, 0.14, 0.24);
    outline.bezierCurveTo(0.12, 0.16, 0.27, 0.12, 0.11, 0);
    outline.lineTo(-0.14, 0);
    material.side = THREE.DoubleSide;
    const tongue = new THREE.Mesh(new THREE.ShapeGeometry(outline, 14), material);
    tongue.position.set(0.028 * i, 0, 0.02 * i);
    if (spill) tongue.rotation.y = (i-1)*0.43;
    tongue.layers.set(NOINK);
    base.add(tongue);
    return tongue;
  });
  const light = new THREE.PointLight("#ff8c39", 1.5, spill ? 5.4 : 1.9, 2);
  light.position.set(0.05, 0.33, 0.14);
  base.add(light);
  const softBounce = enhanced ? new THREE.PointLight("#ffad59",0,4.8,2) : undefined;
  if (softBounce) {
    softBounce.position.set(-0.36,0.23,0.1);
    base.add(softBounce);
  }
  const smoke = Array.from({length: 5}, (_, i) => {
    const puff = glow(base, "#9291a0", 0.21 + i * 0.075);
    puff.material.blending = THREE.NormalBlending;
    return puff;
  });
  const char = spill ? new THREE.Mesh(new THREE.CircleGeometry(0.126, 11), matte("#593036")) : undefined;
  if (char) {
    char.position.set(1.07, 1.501, -0.22);
    char.rotation.x = -Math.PI/2;
    parent.add(char);
  }
  return (seconds: number, camera: THREE.PerspectiveCamera) => {
    base.visible = seconds >= 0;
    if (char) {
      char.visible = seconds > 0.07;
      char.scale.setScalar(ease(seconds*3.5));
    }
    if (!base.visible) return;
    base.rotation.y = Math.atan2(camera.position.x - base.position.x, camera.position.z - base.position.z);
    const grow = ease(seconds * (enhanced ? 6.2 : 3.1));
    for (const [i, flame] of flames.entries()) {
      const flicker = 0.90 + 0.10 * Math.sin(seconds * 23 - i);
      flame.scale.set(grow * (1 - i * (spill ? 0.165 : 0.23)), grow * flicker * (1 - i * (spill ? 0.17 : 0.24)), 1);
      flame.rotation.z = (enhanced ? 0.19 : 0.12) * Math.sin(seconds * 17 + i);
    }
    for (const [i, puff] of smoke.entries()) {
      const t = Math.max(0, seconds - i * 0.1);
      puff.position.set(Math.sin(t * 3 + i) * 0.16, Math.min(1.7, 0.29 + t * 0.7 + i * 0.07), -0.05 - i * 0.021);
      puff.material.opacity = 0.27 * ease(t * 1.8) / (1 + 0.45 * t);
    }
    light.intensity = grow * (spill ? 10.0 + 2.8 * Math.sin(seconds*25) + 1.75*Math.sin(seconds*47) : 2 + 0.38 * Math.sin(seconds * 35));
    if (softBounce) {
      light.intensity *= 1.46;
      softBounce.intensity = grow * (8.4+2.0*Math.sin(seconds*23));
    }
    ember.material.opacity = 0.64 * grow;
  };
}

export function makeGround(parent: THREE.Group, relief = false) {
  const soil = ctex("v2-earth-strata", 768, 384, (g, r) => {
    for (const [i, tint] of ["#d47969", "#975371", "#694e7d", "#414467", "#343654"].entries()) {
      g.fillStyle = tint;
      g.beginPath();
      g.moveTo(0, 384);
      for (let x = 0; x <= 768; x += 8) g.lineTo(x, 19 + i * 73 + Math.sin(x / (69 + i * 11)) * (4 + i * 3));
      g.lineTo(768, 384);
      g.fill();
    }
    for (let i = 0; i < 980; i++) {
      g.fillStyle = i % 2 === 0 ? "#f2be9044" : "#2925423d";
      g.fillRect(r() * 768, r() * 384, 2 + r() * 10, 1 + r() * 3);
    }
  });
  const grass = matte("#737c77");
  const wire = matte("#312546");
  const timber = matte("#ad6762");
  box(parent, matte("#ffffff", soil), [4.7, 1.34, 1.95], [0, -0.66, 0]);
  box(parent, grass, [4.7, 0.10, 1.96], [0, 0.025, 0]);
  if (relief) {
    const rock = matte("#8f7183");
    const stone = new THREE.IcosahedronGeometry(1, 0);
    for (let i=0;i<34;i++) {
      const fragment = new THREE.Mesh(stone, rock);
      fragment.position.set(Math.sin(i*527.3)*2.21,-0.24-(i%8)*0.132,0.997);
      fragment.scale.set(0.04+(i%4)*0.022,0.029+(i%3)*0.019,0.028);
      fragment.rotation.z = i*0.37;
      parent.add(fragment);
    }
    const hills = new THREE.SphereGeometry(1,22,14);
    const foliage = matte("#537b78");
    for (let i=0;i<15;i++) {
      const leaf = new THREE.Mesh(hills,foliage);
      leaf.scale.set(0.29+(i%3)*0.08,0.36+(i%4)*0.14,0.28);
      leaf.position.set((i%8-3.5)*0.57,0.30,-0.65-(i>7 ? 0.30 : 0));
      parent.add(leaf);
    }
    box(parent,matte("#8b6f88"),[5.35,0.13,2.21],[0,-1.39,0]);
    box(parent,matte("#856985"),[10.8,0.12,4.2],[0,-1.57,0.02]);
  }
  for (const x of [-1.70, 0, 1.70]) {
    box(parent, timber, [0.10, 1.62, 0.12], [x, 0.82, 0.34]);
    box(parent, timber, [0.38, 0.08, 0.10], [x, 1.53, 0.34]);
    cylinder(parent, matte("#92afa8"), 0.062, 0.10, [x, 1.63, 0.34]);
  }
  const wirePath: Point[] = [[-2.31, 0.04, 0.35], [-2.14, 1.06, 0.35], [-1.7, 1.67, 0.35],
    [-0.84, 1.54, 0.35], [0, 1.67, 0.35], [0.85, 1.54, 0.35], [1.7, 1.67, 0.35],
    [2.13, 1.06, 0.35], [2.30, 0.04, 0.35]];
  tube(parent, wire, wirePath, 0.023, 67);
  for (const x of [-2.27, 2.27]) {
    cylinder(parent, basic("#f0bf89"), 0.033, 0.48, [x, -0.135, 1.015]).layers.set(NOINK);
  }
  const fieldMaterial = new THREE.MeshBasicMaterial({
    color: "#e8a5bd", transparent: true, opacity: 0.15, depthWrite: false,
  });
  for (let i = 0; i < 6; i++) {
    tube(parent, fieldMaterial, [[-2.34, -0.10 - i * 0.17, 1.015], [-1.30, -0.30 - i * 0.14, 1.015],
      [0.15, -0.33 - i * 0.13, 1.015], [1.25, -0.28 - i * 0.15, 1.015], [2.34, -0.10 - i * 0.17, 1.015]], 0.012)
      .layers.set(NOINK);
  }
  const source = new THREE.CatmullRomCurve3(wirePath.map((p) => new THREE.Vector3(...p)));
  const trackHue = basic("#ffe5a8");
  const alongWire = new THREE.Vector3();
  const axis = new THREE.Vector3(0,1,0);
  const pulses = Array.from({length: 4}, () => {
    if (!relief) return glow(parent, "#fbdb8e", 0.44);
    const dash = cylinder(parent, trackHue, 0.029, 0.27, [0,0,0], 9);
    dash.layers.set(NOINK);
    return dash;
  });
  return (t: number) => {
    fieldMaterial.opacity = 0.2 + Math.exp(-(((t % 1.7) - 0.43) ** 2) / 0.12) * 0.51;
    for (const [i, pulse] of pulses.entries()) {
      const along = (t * 0.74 - i * 0.14) % 1.28;
      pulse.visible = along >= 0 && along < 1;
      if (pulse.visible) {
        pulse.position.copy(source.getPoint(along));
        if (relief) pulse.quaternion.setFromUnitVectors(axis, source.getTangent(along, alongWire).normalize());
      }
    }
  };
}

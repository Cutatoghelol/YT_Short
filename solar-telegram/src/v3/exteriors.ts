import * as THREE from "three";
import {NOINK} from "../bridge/ink";
import {brick, cobble, ctex, grass, rep, rng, roof} from "../bridge/paint";
import {basic, box, cylinder, ease, groupAt, matte, type Point, tube} from "../stage";

function sky(parent: THREE.Group, night: boolean, depth = 44) {
  const map = ctex(night ? "v3-night-sky" : "v3-harbor-sky", 1024, 768, (g, random) => {
    const color = g.createLinearGradient(0, 0, 0, 768);
    color.addColorStop(0, night ? "#161c3b" : "#5088b9");
    color.addColorStop(0.62, night ? "#34365a" : "#b2b7bd");
    color.addColorStop(1, night ? "#7b4764" : "#ffc49c");
    g.fillStyle = color;
    g.fillRect(0, 0, 1024, 768);
    for (let i = 0; i < (night ? 250 : 14); i++) {
      const x = random() * 1024, y = random() * 690;
      g.fillStyle = night ? "#eae1e8" : i % 2 ? "#f8dcb8" : "#a4a6ca";
      g.globalAlpha = night ? 0.12 + random() * 0.47 : 0.09 + random() * 0.15;
      if (night) g.fillRect(x, y, 1 + random() * 3, 1 + random() * 2);
      else {
        g.beginPath();
        g.ellipse(x, y + 60, 42 + random() * 155, 6 + random() * 15, -0.13, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(170, 99), new THREE.MeshBasicMaterial({map, fog: false}));
  backdrop.position.set(0, 22, -depth);
  backdrop.layers.set(NOINK);
  parent.add(backdrop);
}

function addPoles(parent: THREE.Group, planting: Point[]) {
  const wood = matte("#6c483e");
  const ceramic = matte("#b1bfad");
  const cord = matte("#413546");
  for (const [x, h, z] of planting) {
    box(parent, wood, [0.16, h, 0.17], [x, h / 2, z]);
    box(parent, wood, [0.76, 0.107, 0.14], [x, h - 0.23, z]);
    for (const dx of [-0.28, 0.28]) cylinder(parent, ceramic, 0.052, 0.15, [x + dx, h - 0.10, z], 8);
  }
  const cable: Point[] = [];
  for (const [i, [x, h, z]] of planting.entries()) {
    const a = planting[i - 1];
    if (a) cable.push([(a[0] + x) / 2, Math.min(a[1], h) - 0.45, (a[2] + z) / 2]);
    cable.push([x - 0.28, h - 0.02, z]);
  }
  tube(parent, cord, cable, 0.018, 92);
  tube(parent, cord, cable.map(([x,y,z]) => [x + 0.54,y - 0.05,z + 0.05]), 0.017, 92);
  return cable;
}

function house(parent: THREE.Group, x: number, z: number, index: number, night: boolean) {
  const y = 2.4 + (index * 13 % 7) * 0.30;
  const width = 2.85;
  const stone = matte(night ? "#665071" : ["#bd7465", "#ad8170", "#dba586"][index % 3], brick());
  const frame = matte(night ? "#332741" : "#65495a");
  const eaves = matte(night ? "#5f567c" : "#d8a286");
  const light = basic(night ? "#f5ad65" : "#a7aebc");
  box(parent, stone, [width, y, 2.8], [x, y / 2, z]);
  box(parent, eaves, [width + 0.13, 0.09, 2.9], [x, y - 0.07, z]);
  const gable = new THREE.Mesh(new THREE.CylinderGeometry(0, width * 0.79, 0.86, 4), matte(night ? "#524661" : "#70516b", roof("#81586b")));
  gable.position.set(x, y + 0.41, z);
  gable.rotation.y = Math.PI / 4;
  parent.add(gable);
  box(parent, stone, [0.33, 0.65, 0.39], [x + 0.61, y + 0.63, z - 0.36]);
  box(parent, frame, [0.43, 0.09, 0.49], [x + 0.61, y + 0.98, z - 0.36]);
  for (const dx of [-0.72, 0.73]) {
    box(parent, frame, [0.57, 0.77, 0.045], [x + dx, y * 0.72, z + 1.425]);
    box(parent, light, [0.47, 0.65, 0.04], [x + dx, y * 0.72, z + 1.448]);
    box(parent, frame, [0.043, 0.70, 0.043], [x + dx, y * 0.72, z + 1.475]);
    box(parent, eaves, [0.61, 0.07, 0.12], [x + dx, y * 0.72 - 0.39, z + 1.453]);
  }
  box(parent, frame, [0.65, 1.36, 0.055], [x, 0.68, z + 1.426]);
  const side = Math.sign(x);
  box(parent, light, [0.036, 0.67, 0.49], [x - side * 1.43, y * 0.68, z + 0.41]);
}

function citizen(parent: THREE.Group, position: Point, index: number, lookingUp: boolean) {
  const figure = groupAt(parent, position);
  const coat = matte(["#465576", "#804c58", "#645c63", "#4a6c7d", "#906165"][index % 5]);
  const hair = matte("#3d304d");
  const skin = matte(["#bb7d62", "#e6ac7b", "#ad745c"][index % 3]);
  const height = 1.29 + (index * 7 % 9) / 32;
  const skirt = !(index % 4);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, skirt ? 0.41 : 0.29, 0.72, 10), coat);
  trunk.position.set(0, height - 0.60, 0);
  figure.add(trunk);
  for (const side of [-1, 1]) {
    cylinder(figure, hair, 0.064, 0.43, [side * 0.11, 0.26, 0]);
    box(figure, hair, [0.18, 0.10, 0.25], [side * 0.11, 0.05, -0.045]);
    const arm = cylinder(figure, coat, 0.079, 0.49, [side * 0.30, height - 0.59, 0.01]);
    arm.rotation.z = side * 0.22;
  }
  const neck = groupAt(figure, [0, height - 0.23, 0]);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.233, 16, 12), skin);
  head.scale.set(1.09, 1, 0.91);
  neck.add(head);
  box(neck, skin, [0.092, 0.072, 0.10], [0.02, -0.044, -0.203]);
  cylinder(neck, hair, skirt ? 0.27 : 0.26, 0.055, [0, 0.159, -0.028], 18);
  cylinder(neck, hair, skirt ? 0.19 : 0.206, skirt ? 0.17 : 0.244, [0, 0.253, 0.014], 18);
  figure.rotation.y = Math.sin(index * 5.1) * 0.46;
  return (seconds: number) => {
    neck.rotation.x = lookingUp ? 0.26 + 0.31 * ease(seconds * 1.2 + index * 0.032) : 0.035;
    neck.rotation.y = Math.sin(seconds * 1.35 + index) * 0.16;
    figure.rotation.z = 0.029 * Math.sin(seconds * 1.23 + index);
    if (!lookingUp) figure.position.x = position[0] + Math.sin(seconds * 0.26 + index) * 0.32;
  };
}

type StreetDetail = {
  addHorizon: (parent: THREE.Group, town: boolean, night: boolean) => void;
  makePedestrian: typeof citizen;
};

export function makeStreet(parent: THREE.Group, night: boolean, detail?: StreetDetail) {
  sky(parent, night, detail ? 91 : 44);
  box(parent, matte(night ? "#777084" : "#ac9b88", rep(cobble(), 3.8, detail ? 13 : 10)),
    [24, 0.16, detail ? 99 : 71], [0, -0.09, detail ? -25 : -14]);
  detail?.addHorizon(parent,true,night);
  for (const side of [-1, 1]) {
    box(parent, matte(night ? "#8d6f7b" : "#c9b09a"), [1.39, 0.14, 45], [3.72 * side, 0.006, -11]);
    for (let i = 0; i < 9; i++) {
      house(parent, side * (5.31 + 0.14 * (i % 3)), 5.62 - i * 3.43, i + (side > 0 ? 5 : 0), night);
    }
  }
  addPoles(parent, [[2.48,4.72,5.5],[2.48,4.6,-3.8],[2.48,4.54,-13.3],[2.48,4.47,-23.2],[2.48,4.38,-33]]);
  const random = rng(86);
  const people = Array.from({length: night ? 20 : 12}, (_, i) => {
    const scattered: Point = [(random() - 0.5) * 6.35, 0, 3.7 - random() * (night ? 10.6 : 17)];
    const position: Point = night && detail && i < 2 ? i===0 ? [-1.14,0,2.02] : [1.10,0,-2.68] : scattered;
    if (night && detail && i>1 && position[0]>0.57 && position[0]<2.35 && position[2]>-3.2) position[2]-=3.7;
    return (detail?.makePedestrian ?? citizen)(parent,position,i,night);
  });
  const curtain = night ? makeCurtains(parent,Boolean(detail)) : undefined;
  const ambient = night ? new THREE.PointLight("#86ffd2", 26, 15, 2) : undefined;
  if (ambient) {
    ambient.position.set(-3.7, 7.7, -3.3);
    parent.add(ambient);
  }
  return (seconds: number) => {
    for (const person of people) person(seconds);
    curtain?.(seconds);
    if (ambient) ambient.intensity = 25 + 4 * Math.sin(seconds * 1.6);
  };
}

type CountryDetail = Pick<StreetDetail,"addHorizon"> & {
  makePoleFlashes: (parent: THREE.Group, poles: Point[]) => (seconds: number) => void;
};

export function makeCountryLine(parent: THREE.Group, detail?: CountryDetail) {
  sky(parent, false, detail ? 91 : 44);
  const field = matte("#a1a986", rep(grass(), 8, 13));
  box(parent, field, [75, 0.14, 98], [0, -0.08, -25]);
  box(parent, matte("#c5aa88"), [2.5, 0.02, 65], [-1.6, 0.008, -21]);
  const mist = matte("#7e92a1");
  const hills = new THREE.SphereGeometry(1, 22, 14);
  detail?.addHorizon(parent,false,false);
  for (let i = 0; i < (detail ? 0 : 14); i++) {
    const ridge = new THREE.Mesh(hills, mist);
    ridge.scale.set(4.6 + i % 4, 1.55 + (i * 5 % 8) * 0.17, 5.8);
    ridge.position.set(-28 + i * 4.5, 0.0, -32 - (i * 7 % 8));
    parent.add(ridge);
  }
  const posts = Array.from({length: 9}, (_, i): Point => [1.26 + i * 0.13, 4.80 - 0.054 * i, 8.4 - i * 5.36]);
  addPoles(parent, posts);
  const orchard = matte(detail ? "#516e56" : "#587f79");
  const bole = matte("#775653");
  const random = rng(1859);
  for (let i = 0; i < 22; i++) {
    const x = (i % 2 === 0 ? -1 : 1) * (6 + random() * 10);
    const z = -4 - random() * 36;
    cylinder(parent, bole, 0.14, 1.6, [x, 0.8, z], 8);
    const crown = new THREE.Mesh(detail ? new THREE.ConeGeometry(0.94,2.45,7) : hills, orchard);
    crown.position.set(x, 1.94, z);
    crown.scale.set(0.74, 1.22 + random() * 0.32, 0.81);
    parent.add(crown);
  }
  if (detail) return detail.makePoleFlashes(parent,posts);
  const flash = new THREE.MeshBasicMaterial({color: "#ffe4aa", transparent: true, depthWrite: false, toneMapped: false});
  for (const [x,h,z] of posts.slice(1, 6)) {
    tube(parent, flash, [[x - 0.28,h,z],[x - 0.47,h + 0.14,z],[x - 0.56,h + 0.06,z],[x - 0.68,h + 0.20,z]], 0.015, 8).layers.set(NOINK);
  }
  return (seconds: number) => { flash.opacity = (0.5 + 0.5 * Math.cos(seconds * 22)) ** 5 * 0.79; };
}

function makeCurtains(parent: THREE.Group, fullDetail: boolean) {
  const curtains: THREE.ShaderMaterial[] = [];
  for (let i = 0; i < 3; i++) {
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
      uniforms: {clock: {value: 0}, layer: {value: i}, crisp: {value: Number(fullDetail)}},
      vertexShader: `
        uniform float clock, layer;
        varying vec2 tex;
        void main() {
          tex = uv;
          vec3 p = position;
          p.y += 2.1*sin(uv.x*5.15 + layer*.7 + clock*.36)
             + .58*sin(uv.x*13.1 + layer - clock*.29);
          p.z += 2.35*sin(uv.x*6.8 + layer + clock*.2);
          gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.);
        }`,
      fragmentShader: `
        uniform float clock, layer, crisp;
        varying vec2 tex;
        void main() {
          float u=tex.x, v=tex.y;
          float fold=.66+.19*sin(u*150.+sin(u*21.+clock*.7)*2. + layer)
             +.14*sin(u*285.+layer + clock*.45);
          float lower=smoothstep(.04,.13,v);
          float strand=exp(-5.8*v)*lower*fold;
          float phase = u*118. + 2.2*sin(u*17.2 + clock*.38) + layer*1.74;
          float filaments = pow(.5+.5*cos(phase),4.5);
          float vertical = .86+.14*sin(v*16.5-clock*1.25+sin(u*12.2));
          float curtain = smoothstep(.038,.09,v)*exp(-4.6*v)*(.41+.96*filaments)*vertical;
          strand = mix(strand,curtain,crisp);
          float edge=smoothstep(0.,.10,u)*(1.-smoothstep(.89,1.,u));
          vec3 jade=mix(vec3(.18,.65,.65),vec3(.51,1.,.73),fold);
          vec3 rose=vec3(.79,.18,.50);
          vec3 tone=mix(jade,rose,smoothstep(.18,.64,v));
          gl_FragColor=vec4(tone,edge*strand*(1.4-layer*.21));
        }`,
    });
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(32 + i * 5, fullDetail ? 7.4 : 5.6, 150, 34), material);
    ribbon.position.set(-1.7, (fullDetail ? 9.75 : 9.54) + i * 0.99, -18.7 - i * 3.4);
    ribbon.layers.set(NOINK);
    parent.add(ribbon);
    curtains.push(material);
  }
  return (seconds: number) => { for (const item of curtains) item.uniforms.clock.value = seconds; };
}

export function addSpaceDepth(parent: THREE.Group, hot: boolean) {
  const random = rng(hot ? 8119 : 8193);
  const flecks = new Float32Array(570 * 3);
  for (let i=0; i<flecks.length; i+=3) {
    flecks[i] = (random() - 0.5) * 36;
    flecks[i+1] = (random() - 0.5) * 29;
    flecks[i+2] = -6 - random() * 14;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.BufferAttribute(flecks,3));
  const stars = new THREE.Points(geometry,new THREE.PointsMaterial({
    color: hot ? "#ffc1a0" : "#a5d2ea", size: 0.033, fog: false, transparent: true, opacity: 0.66,
  }));
  stars.layers.set(NOINK);
  parent.add(stars);
}

import * as THREE from "three";
import {ctex, rng} from "./bridge/paint";
import {NOINK} from "./bridge/ink";
import {skylineRooftop} from "./office";
import {basic, box, cylinder, ease, groupAt, matte, tube, type Point} from "./stage";

function sparkle(parent: THREE.Group, color: string, radius: number) {
  const halo = ctex(`halo-${color}`, 128, 128, (g) => {
    const glow = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, color + "ff");
    glow.addColorStop(0.22, color + "7a");
    glow.addColorStop(0.6, color + "2b");
    glow.addColorStop(1, color + "00");
    g.fillStyle = glow;
    g.fillRect(0, 0, 128, 128);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: halo, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  sprite.scale.set(radius, radius, 1);
  sprite.layers.set(NOINK);
  parent.add(sprite);
  return sprite;
}

function starlight(parent: THREE.Group, lower: number) {
  const random = rng(9151);
  for (const [size, count, color] of [[0.025, 195, "#a0acd1"], [0.051, 42, "#e7d0aa"]] as const) {
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      coords[i * 3] = (random() - 0.5) * 43;
      coords[i * 3 + 1] = lower + random() * 25;
      coords[i * 3 + 2] = -13 - random() * 9;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(coords, 3));
    const stars = new THREE.Points(geo, new THREE.PointsMaterial({color, size, opacity: 0.8, transparent: true}));
    stars.layers.set(NOINK);
    parent.add(stars);
  }
}

export function makeLine(parent: THREE.Group) {
  const timber = matte("#704d51");
  const ochre = matte("#92605e");
  const wire = matte("#30263c");
  const porcelain = matte("#8ca6a3");
  box(parent, matte("#3a3b5a"), [22, 0.14, 32], [0, -0.12, -9]);
  skylineRooftop(parent, true);
  skylineRooftop(parent, false);
  starlight(parent, 3.4);
  const points: Point[] = [[-6.2, 3.58, 1.4], [-3.1, 3.17, -0.7], [0.0, 3.58, -2.8], [2.75, 3.14, -5.9], [5.9, 3.58, -8.1]];
  tube(parent, wire, points, 0.044);
  tube(parent, wire, points.map(([x, y, z]) => [x, y - 0.15, z - 0.27]), 0.022);
  for (const [x, y, z] of points.filter((_, i) => i % 2 === 0)) {
    box(parent, timber, [0.19, y - 0.06, 0.23], [x, (y - 0.06) / 2, z]);
    box(parent, ochre, [0.80, 0.13, 0.14], [x, y - 0.28, z]);
    for (const dx of [-0.29, 0, 0.29]) {
      cylinder(parent, porcelain, 0.092, 0.13, [x + dx, y - 0.16, z]);
      cylinder(parent, porcelain, 0.065, 0.095, [x + dx, y - 0.066, z]);
    }
  }
  const path = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const pulses = [sparkle(parent, "#bcecf1", 0.42), sparkle(parent, "#f9bf81", 0.29), sparkle(parent, "#f9bf81", 0.24)];
  return (frame: number) => {
    const run = frame < 420 ? frame - 311 : frame - 1127;
    for (const [i, pulse] of pulses.entries()) {
      const t = (run - i * 9) / 36;
      pulse.visible = t >= 0 && t <= 1;
      if (pulse.visible) pulse.position.copy(path.getPoint(Math.min(1, t)));
    }
  };
}

function sunSurface() {
  return ctex("sun-painted", 1024, 512, (g, random) => {
    g.fillStyle = "#b5504a";
    g.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 88; i++) {
      const x = random() * 1024;
      const y = random() * 512;
      const r = 38 + random() * 104;
      const fire = g.createRadialGradient(x, y, 2, x, y, r);
      fire.addColorStop(0, i % 4 ? "#ffcf69cc" : "#ff744aee");
      fire.addColorStop(1, "#f9913d00");
      g.fillStyle = fire;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    for (let i = 0; i < 2400; i++) {
      g.globalAlpha = 0.07 + random() * 0.36;
      g.strokeStyle = ["#fff3ad", "#ffdf83", "#c96746", "#8a485b"][i % 4];
      const x = random() * 1024;
      const y = random() * 512;
      const t = 1 + random() * 15;
      g.beginPath();
      g.moveTo(x, y);
      g.bezierCurveTo(x + t, y - t, x + t * 2.5, y + t * 0.5, x + t * 1.6, y + t);
      g.stroke();
    }
    g.globalAlpha = 1;
  });
}

export function makeSun(parent: THREE.Group) {
  starlight(parent, -13);
  const halo = sparkle(parent, "#e65d69", 5.5);
  halo.position.set(-0.02, 0.45, -0.4);
  const light = sparkle(parent, "#ffb875", 4.1);
  light.position.set(-0.05, 0.48, -0.14);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.42, 60, 38),
    new THREE.MeshBasicMaterial({map: sunSurface(), toneMapped: false}));
  sun.position.set(-0.08, 0.47, 0);
  sun.rotation.z = -0.36;
  parent.add(sun);
  const hot = new THREE.MeshBasicMaterial({color: "#ffcc84", transparent: true, opacity: 0.78});
  const fires = groupAt(parent, [-0.08, 0.47, 0]);
  for (let i = 0; i < 9; i++) {
    const theta = 0.33 + i * 0.061;
    const points: Point[] = [];
    for (let j = 0; j <= 18; j++) {
      const t = j / 18;
      const angle = theta + t * (1.08 + i * 0.021);
      const range = 1.295 + (0.38 + 0.06 * i) * Math.sin(Math.PI * t);
      points.push([range * Math.cos(angle), range * Math.sin(angle), 0.17 + 0.45 * t]);
    }
    tube(fires, hot, points, 0.012 + (i % 3) * 0.005, 28).layers.set(NOINK);
  }
  const outflow = sparkle(parent, "#ffc771", 1.15);
  return (frame: number) => {
    const t = ease((frame - 784) / 57);
    sun.rotation.y = -0.36 + (frame - 780) * 0.007;
    fires.scale.setScalar(1 + t * 0.06);
    fires.rotation.z = -0.28 + t * 0.26;
    outflow.position.set(1.10 + t * 1.15, 1.53 - t * 0.86, 0.6);
    outflow.material.opacity = 0.5 + t * 0.4;
  };
}

const continents: [number, number][][] = [
  [[-164, 59], [-151, 69], [-130, 71], [-115, 74], [-92, 74], [-76, 70], [-58, 56], [-60, 48], [-70, 43], [-77, 38], [-83, 26], [-91, 29], [-98, 24], [-90, 17], [-82, 9], [-91, 14], [-107, 23], [-116, 32], [-126, 48], [-141, 57]],
  [[-80, 10], [-73, 10], [-65, 7], [-53, 4], [-37, -6], [-44, -22], [-52, -30], [-60, -38], [-68, -55], [-76, -51], [-73, -36], [-71, -22], [-79, -8]],
  [[-55, 60], [-66, 73], [-59, 81], [-33, 83], [-22, 76], [-28, 65], [-43, 58]],
  [[-10, 34], [-17, 26], [-16, 15], [-9, 5], [9, 4], [15, -8], [12, -19], [24, -34], [34, -31], [43, -13], [51, 12], [44, 10], [33, 27], [30, 34], [14, 37]],
  [[-9, 44], [-5, 48], [6, 52], [10, 57], [13, 69], [25, 72], [48, 69], [75, 73], [114, 74], [148, 70], [174, 62], [162, 56], [147, 47], [132, 42], [122, 25], [111, 19], [105, 5], [97, 8], [87, 22], [80, 9], [72, 19], [65, 24], [53, 26], [49, 15], [41, 15], [34, 31], [25, 41], [14, 41], [7, 43], [-3, 38]],
  [[113, -24], [125, -16], [137, -14], [143, -16], [153, -26], [149, -37], [133, -35], [118, -34]],
];

function earthSurface() {
  return ctex("earth-painted", 1152, 576, (g, random) => {
    const ocean = g.createLinearGradient(0, 0, 0, 576);
    ocean.addColorStop(0, "#5c8bbe");
    ocean.addColorStop(0.45, "#3068a6");
    ocean.addColorStop(0.8, "#24728f");
    ocean.addColorStop(1, "#80a7c8");
    g.fillStyle = ocean;
    g.fillRect(0, 0, 1152, 576);
    continents.forEach((land, i) => {
      g.beginPath();
      land.forEach(([lon, lat], j) => {
        const x = (lon + 180) * 3.2;
        const y = (90 - lat) * 3.2;
        if (j === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      });
      g.closePath();
      g.fillStyle = i === 2 ? "#c9dfd6" : "#8eae87";
      g.fill();
      g.lineWidth = 5;
      g.strokeStyle = "#6f9cac";
      g.stroke();
      g.save();
      g.clip();
      for (let j = 0; j < 300; j++) {
        g.globalAlpha = 0.14 + random() * 0.35;
        g.fillStyle = ["#d7bd87", "#478f79", "#a8bd8a"][j % 3];
        g.beginPath();
        g.ellipse(random() * 1152, random() * 576, 10 + random() * 56, 2 + random() * 11, j % 7, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    });
    for (let i = 0; i < 100; i++) {
      g.fillStyle = "#e3eef1";
      g.globalAlpha = 0.035 + random() * 0.31;
      g.beginPath();
      g.ellipse(random() * 1152, random() * 576, random() * 49 + 2, random() * 6 + 0.9, random() * 0.4, 0, 2 * Math.PI);
      g.fill();
    }
    g.globalAlpha = 1;
  });
}

export function makeEarth(parent: THREE.Group) {
  starlight(parent, -12);
  const aqua = sparkle(parent, "#448fe9", 4.91);
  aqua.position.set(0.12, 0.1, -0.27);
  const planet = groupAt(parent, [0, 0.11, 0]);
  planet.rotation.z = 0.18;
  const world = new THREE.Mesh(new THREE.SphereGeometry(1.23, 64, 42),
    new THREE.MeshStandardMaterial({map: earthSurface(), roughness: 0.98, emissive: "#1d3b58", emissiveIntensity: 0.32}));
  planet.add(world);
  const field = groupAt(parent, [0, 0.1, 0]);
  const fieldMaterial = new THREE.MeshBasicMaterial({color: "#77e8ec", transparent: true, opacity: 0.57, depthWrite: false});
  for (let i = 0; i < 7; i++) {
    const span = 1.42 + i * 0.24;
    for (const side of [-1, 1]) {
      const points: Point[] = [];
      for (let j = 0; j <= 32; j++) {
        const t = j / 32 * Math.PI;
        points.push([side * span * Math.sin(t) ** 1.3, Math.cos(t) * 1.12, -0.26 + 0.21 * i + 0.25 * Math.sin(t)]);
      }
      tube(field, fieldMaterial, points, 0.009, 32).layers.set(NOINK);
    }
  }
  const flicker = sparkle(parent, "#6bd6db", 0.73);
  return (frame: number) => {
    const t = frame - 844;
    world.rotation.y = -0.34 + t * 0.009;
    field.rotation.z = 0.13 + Math.sin(t * 0.12) * 0.065;
    field.scale.x = 1 + 0.1 * Math.sin(t * 0.11);
    fieldMaterial.opacity = 0.40 + 0.23 * (0.5 + 0.5 * Math.sin(t * 0.155));
    flicker.position.set(0.11, 1.31, 0.32);
    flicker.material.opacity = 0.45 + Math.sin(t * 0.081) * 0.3;
  };
}

export function makeCoil(parent: THREE.Group) {
  const indigo = matte("#333656");
  const copper = matte("#e7a05c");
  const copperDark = matte("#9a574b");
  const navy = matte("#455b8c");
  const red = matte("#cb544c");
  const white = basic("#f4d9a9");
  const base = groupAt(parent, [0, -0.66, 0]);
  box(base, matte("#55557b"), [3.44, 0.16, 1.43], [0, 0, 0]);
  box(base, indigo, [3.49, 0.075, 1.47], [0, -0.093, 0]);

  const coil = groupAt(base, [-0.18, 0.59, 0.04]);
  for (const x of [-0.34, 0.34]) {
    box(coil, indigo, [0.10, 0.52, 0.43], [x, -0.30, 0]);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.055, 10, 42), copperDark);
    rim.rotation.y = Math.PI / 2;
    rim.position.x = x;
    coil.add(rim);
  }
  const windings: Point[] = [];
  for (let i = 0; i <= 144; i++) {
    const fraction = i / 144;
    const a = fraction * Math.PI * 2 * 8.0;
    windings.push([-0.35 + fraction * 0.70, 0.337 * Math.cos(a), 0.337 * Math.sin(a)]);
  }
  tube(coil, copper, windings, 0.025, 150);

  const magnet = groupAt(base, [-1.17, 0.61, 0.04]);
  box(magnet, navy, [0.39, 0.23, 0.24], [-0.20, 0, 0]);
  box(magnet, red, [0.39, 0.23, 0.24], [0.19, 0, 0]);
  box(magnet, matte("#f19b79"), [0.355, 0.028, 0.03], [0.20, 0.119, 0.086]);

  const meter = groupAt(base, [0.98, 0.54, -0.03]);
  box(meter, indigo, [0.69, 0.64, 0.31], [0, 0, 0]);
  box(meter, white, [0.61, 0.49, 0.027], [0, 0.047, 0.163]);
  for (let i = 0; i < 9; i++) {
    const a = (i - 4) * 0.248;
    box(meter, indigo, [0.013, i === 4 ? 0.057 : 0.038, 0.012], [Math.sin(a) * 0.245, Math.cos(a) * 0.245 - 0.112, 0.183]).rotation.z = -a;
  }
  const pin = groupAt(meter, [0, -0.113, 0.199]);
  box(pin, red, [0.017, 0.276, 0.013], [0, 0.112, 0]);
  cylinder(meter, copper, 0.025, 0.027, [0, -0.114, 0.192]).rotation.x = Math.PI / 2;
  tube(base, navy, [[-0.47, 0.31, 0.06], [-0.41, 0.14, 0.49], [0.32, 0.13, 0.64], [0.76, 0.27, 0.21]], 0.022);
  tube(base, red, [[0.22, 0.35, 0.08], [0.44, 0.17, -0.45], [0.98, 0.14, -0.47], [1.19, 0.3, -0.05]], 0.022);
  return (frame: number) => {
    const first = (frame - 1008) / 23;
    const second = (frame - 1034) / 19;
    magnet.position.x = -1.17 + 0.48 * ease(first) - 0.36 * ease(second);
    const wave = (x: number) => x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0;
    pin.rotation.z = -0.80 * wave(first) + 0.52 * wave(second);
  };
}

export function makeAurora(parent: THREE.Group) {
  box(parent, matte("#3b3958"), [26, 0.14, 24], [0, -0.12, -5]);
  skylineRooftop(parent, true);
  skylineRooftop(parent, false);
  starlight(parent, 2.2);
  const veils: THREE.ShaderMaterial[] = [];
  for (let i = 0; i < 4; i++) {
    const width = 17.7 + i * 2.4;
    const geo = new THREE.PlaneGeometry(width, 3.8, 100, 20);
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
      uniforms: {time: {value: 0}, offset: {value: i}, alpha: {value: 0.59 - i * 0.08}},
      vertexShader: `
        uniform float time, offset;
        varying vec2 coord;
        void main() {
          coord = uv;
          vec3 p = position;
          p.z += 1.65 * sin(uv.x * 4.8 + offset + time * .32);
          p.y += 1.29 * sin(uv.x * 4.7 + .5 * offset + time * .36)
            + .32 * sin(uv.x * 10.2 + offset - time * .42);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
        }
      `,
      fragmentShader: `
        uniform float time, offset, alpha;
        varying vec2 coord;
        void main() {
          float x = coord.x;
          float y = coord.y;
          float edge = smoothstep(0., .15, x) * (1. - smoothstep(.8, 1., x));
          float threads = .48 + .23 * sin(103. * x + sin(22. * x + time * .3) + offset)
            + .2 * sin(205. * x + time * .86);
          float body = exp(-4.5 * y) * smoothstep(0., .135, y);
          vec3 low = mix(vec3(.30, .91, .74), vec3(.66, .92, .82), .2 * offset);
          vec3 high = mix(vec3(.51, .22, .57), vec3(.96, .29, .43), .52 + .42 * sin(4. * x + offset));
          gl_FragColor = vec4(mix(low, high, smoothstep(.10, .8, y)),
            alpha * edge * body * (.46 + .72 * threads));
        }
      `,
      blending: THREE.AdditiveBlending,
    });
    const ribbon = new THREE.Mesh(geo, material);
    ribbon.position.set(0, 5.25 + i * 1.04, -13 - i * 2.07);
    ribbon.layers.set(NOINK);
    parent.add(ribbon);
    veils.push(material);
  }
  return (frame: number) => {
    for (const veil of veils) veil.uniforms.time.value = (frame - 1210) / 30;
  };
}


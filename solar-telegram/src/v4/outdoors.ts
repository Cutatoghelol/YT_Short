import * as THREE from "three";
import {rng} from "../bridge/paint";
import {box, cylinder, ease, groupAt, matte, type Point, tube} from "../stage";
import {NOINK} from "../bridge/ink";

export function addHorizon(parent: THREE.Group, town: boolean, night = false) {
  const color = night ? ["#545171", "#645c7c", "#716883"] : ["#6f828b", "#87959f", "#9ea6aa"];
  const random = rng(town ? 1451 : 3012);
  for (const [i, tint] of color.entries()) {
    const z = -43-i*13;
    const material = new THREE.MeshBasicMaterial({color: tint, fog: false});
    const shape = new THREE.Shape();
    shape.moveTo(-61,-3);
    for (let x=-61;x<=61;x+=2) {
      const height = 1.2+i*0.8+Math.sin(x*0.19+i*2.1)*0.68+Math.cos(x*0.44)*0.31;
      shape.lineTo(x,height+(town ? (x%6===0 ? 0.75 : 0) : 1.5+Math.cos(x*0.12)*0.76));
    }
    shape.lineTo(61,-3);
    const ridge = new THREE.Mesh(new THREE.ShapeGeometry(shape),material);
    ridge.position.set(0,0,z);
    ridge.layers.set(NOINK);
    parent.add(ridge);
    for (let j=0;j<32;j++) {
      const x = j*3.7-56+(random()-0.5)*2.4;
      const height = 1.65+random()*2.3+i*0.47;
      const width = 1.5+random()*1.2;
      if (town && j%6!==0) {
        box(parent,material,[width,height,0.9],[x,height*0.5,z+0.7]);
        const roof = new THREE.Mesh(new THREE.CylinderGeometry(0,width*0.71,0.66,4),material);
        roof.position.set(x,height+0.28,z+0.7);
        roof.rotation.y=Math.PI/4;
        roof.layers.set(NOINK);
        parent.add(roof);
        if (j%4===0) box(parent,material,[0.18,0.86,0.17],[x+0.2,height+0.48,z+0.7]);
      } else {
        const crown = new THREE.Mesh(new THREE.ConeGeometry(width*0.57,height,6),material);
        crown.position.set(x,0.60+height*0.5,z+0.7);
        crown.layers.set(NOINK);
        parent.add(crown);
      }
    }
  }
}

function hat(parent: THREE.Group,index: number,tint: THREE.Material) {
  if (index%5===3) {
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.238,14,10),tint);
    hood.scale.set(1,0.94,0.98);
    hood.position.set(0,0.021,0.067);
    parent.add(hood);
  } else {
    const brim = index%5===0 ? 0.305 : index%5===1 ? 0.263 : 0.224;
    cylinder(parent,tint,brim,0.046,[0,0.163,-0.028],18);
    const crown = cylinder(parent,tint,brim*0.74,index%5===0 ? 0.29 : 0.135,[0,index%5===0 ? 0.317 : 0.242,0],18);
    crown.scale.z=0.90;
  }
}

export function makePedestrian(parent: THREE.Group, position: Point, index: number, night: boolean) {
  const root=groupAt(parent,position);
  const coat=matte(["#99534d","#3d6875","#736287","#ad8258","#516054","#694b65","#53738f"][index%7]);
  const trim=matte(["#e1a56e","#b6b1a1","#86474d","#9396a1"][index%4]);
  const pants=matte(["#3b364b","#4c3a43","#3d4147"][index%3]);
  const skin=matte(["#b77354","#e2aa7a","#b9856e","#865446"][index%4]);
  const headwear=matte(["#513b43","#9d6344","#323650","#7c5264","#53606a"][index%5]);
  const tall=[1.13,0.96,1.02,0.89,1.18,0.95,0.79][index%7];
  const skirt=index%5===3 || index%7===6;
  root.scale.set(index%3===0 ? 1.12 : 1,tall,tall);
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.241,skirt ? 0.41 : 0.28,skirt ? 0.81 : 0.67,10),coat);
  torso.position.y=skirt ? 0.74 : 0.88;
  root.add(torso);
  cylinder(root,trim,0.212,0.112,[0,1.217,0],12);
  if (index%4===0) box(root,trim,[0.16,0.36,0.04],[-0.093,1.12,0.232]).rotation.z=0.14;
  const arms = [-1,1].map((side) => {
    const shoulder=groupAt(root,[side*0.26,1.133,0]);
    cylinder(shoulder,coat,0.078,0.34,[0,-0.17,0],10);
    const wrist=groupAt(shoulder,[0,-0.32,0]);
    cylinder(wrist,coat,0.062,0.24,[0,-0.12,0],10);
    cylinder(wrist,skin,0.053,0.11,[0,-0.255,0],8);
    return {shoulder,wrist,side};
  });
  const legs=[-1,1].map((side) => {
    const hip=groupAt(root,[side*0.114,0.575,0]);
    cylinder(hip,pants,0.077,0.502,[0,-0.256,0],9);
    box(hip,pants,[0.168,0.102,0.267],[0,-0.518,-0.063]);
    return hip;
  });
  const neck=groupAt(root,[0,1.365,0]);
  const face=new THREE.Mesh(new THREE.SphereGeometry(0.206,16,12),skin);
  face.scale.set(1.04,1.02,0.93);
  neck.add(face);
  box(neck,skin,[0.073,0.08,0.092],[0,-0.037,-0.175]);
  const crown=groupAt(neck,[0,0,0]);
  hat(crown,index,headwear);
  const looseHat = night && index===1 ? groupAt(parent,position) : undefined;
  if (looseHat) hat(looseHat,index,headwear);
  const hatStart=1.22;
  const stance=(index%4-1.5)*0.16;
  return (seconds: number) => {
    const step=seconds*(index%3===0 ? 6.6 : 5.4)+index*2.1;
    const pointing = night && index===0 ? ease((seconds-0.37)/0.6) : 0;
    const drop = looseHat ? Math.max(0,seconds-hatStart) : 0;
    const turn = night ? ease((seconds-index%5*0.10)/0.82) : 0;
    root.position.z=position[2]+(night ? 0 : (index%3===0 ? 0.66 : -0.56)*seconds);
    root.position.x=position[0]+(night ? 0 : Math.sin(step*0.18)*0.13);
    root.position.y=night ? 0 : (1-Math.abs(Math.sin(step)))*0.035;
    root.rotation.y=night ? stance+0.12*Math.sin(seconds*1.3+index) : (index%3===0 ? Math.PI : 0)+stance;
    neck.rotation.x=0.02+turn*(0.33+(index%4)*0.08);
    neck.rotation.y=0.13*Math.sin(seconds*1.53+index)+0.20*pointing;
    const stride=night ? 0 : Math.sin(step)*0.48;
    legs[0].rotation.x=stride;
    legs[1].rotation.x=-stride;
    for (const {shoulder,wrist,side} of arms) {
      shoulder.rotation.z=side*(0.14+0.11*Math.sin(step*0.23));
      shoulder.rotation.x=side*stride*0.70+(side===1 ? 2.43*pointing : 0);
      wrist.rotation.x=side===1 ? 0.23*pointing : 0;
    }
    if (looseHat) {
      crown.visible = seconds < hatStart;
      looseHat.visible = !crown.visible;
      looseHat.position.set(position[0]+Math.min(0.53,drop*0.58),Math.max(0.05,1.41*tall-3.92*drop**2),position[2]+Math.min(0.35,drop*0.43));
      looseHat.rotation.set(Math.min(Math.PI*0.4,drop*2.9),stance,Math.min(1.5,drop*2.3));
    }
  };
}

export function makePoleFlashes(parent: THREE.Group, poles: Point[]) {
  const flashes = poles.slice(0,6).map(([x,y,z],index) => {
    const spark = new THREE.MeshBasicMaterial({color: index%2 ? "#fff0b3" : "#fff8de",transparent:true,depthWrite:false,toneMapped:false});
    const glow = new THREE.MeshBasicMaterial({color:"#ffad63",transparent:true,depthWrite:false,toneMapped:false});
    const center=x-0.28;
    const points: Point[]=[[center,y-0.005,z],[center-0.12,y+0.13,z-0.13],
      [center-0.29,y+0.055,z-0.18],[center-0.40,y+0.25,z-0.22],[center-0.56,y+0.20,z-0.39]];
    const core=tube(parent,spark,points,0.030,14);
    const halo=tube(parent,glow,points,0.071,14);
    core.layers.set(NOINK);
    halo.layers.set(NOINK);
    return {spark,glow,core,halo,offset:0.06+index*0.118};
  });
  return (seconds: number) => {
    for (const {spark,glow,core,halo,offset} of flashes) {
      const t=seconds-offset;
      const strike=t>=0 && t<0.18 ? Math.exp(-t*14) : 0;
      core.visible=halo.visible=strike>0;
      spark.opacity=strike;
      glow.opacity=strike*0.28;
    }
  };
}

import {useEffect, useLayoutEffect, useMemo} from "react";
import {useThree} from "@react-three/fiber";
import {EffectComposer} from "@react-three/postprocessing";
import {Audio} from "@remotion/media";
import {ThreeCanvas} from "@remotion/three";
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import * as THREE from "three";
import {InkPass} from "../bridge/ink";
import {LensBlur} from "../bridge/lensblur";
import {makeEarth, makeSun} from "../exterior";
import {makeOffice} from "../office";
import {Captions} from "../v2/Captions";
import {makeGround, makePaperFire, makeSparks} from "../v2/illustrations";
import words from "../../public/voice-v3/words.json";
import {addSpaceDepth, makeCountryLine, makeStreet} from "./exteriors";
import {act, cameraAt, shotAt, suspenseLight, type Stage} from "./story";
import {ease} from "../stage";
import cues from "./cues.json";

type Set = {root: THREE.Group; update: (frame: number, camera: THREE.PerspectiveCamera) => void};
export type TelegramProps = {detail: number; captions: boolean; mixReady: boolean};
type Edition = {
  actions: Pick<typeof import("./story"), "act" | "cameraAt" | "shotAt">;
  events: typeof cues;
  captions: typeof words;
  audio: string;
  street?: Parameters<typeof makeStreet>[2];
  country?: Parameters<typeof makeCountryLine>[1];
};
const v3: Edition = {actions: {act,cameraAt,shotAt}, events:cues, captions:words, audio:"voice-v3"};

function createStages(edition: Edition) {
  const {actions,events} = edition;
  const expressive = Boolean(edition.street);
  const make: Record<Stage, (root: THREE.Group) => Set["update"]> = {
    boston: (root) => {
      const office = makeOffice(root,true,"kinetic",expressive);
      const arc = makeSparks(root,[0.58,1.86,0.23],0.78);
      const spill = new THREE.PointLight("#ff7d36",0,4.0,2);
      spill.position.set(0.55,1.87,0.30);
      root.add(spill);
      return (frame,camera) => {
        office(frame,camera,actions.act(frame,"boston"));
        const elapsed=(frame-events.surge)/30;
        arc(elapsed);
        spill.intensity=elapsed>=0 && elapsed<0.8 ? 11*Math.exp(-elapsed*6)*(0.82+Math.sin(elapsed*36)*0.18) : 0;
      };
    },
    portland: (root) => {
      const office=makeOffice(root,false,"kinetic",expressive);
      return (frame,camera) => office(frame,camera,actions.act(frame,"portland"));
    },
    paper: (root) => {
      const office=makeOffice(root,false,"fire",expressive);
      const arc=makeSparks(root,[0.79,1.77,-0.15],0.9);
      const flames=makePaperFire(root,true,expressive);
      return (frame,camera) => {
        office(frame,camera,actions.act(frame,"portland",true));
        arc((frame-(frame>=events.paperIgnition ? events.paperIgnition : events.paperArc))/30);
        flames((frame-events.paperIgnition)/30,camera);
      };
    },
    street: (root) => {
      const update=makeStreet(root,false,edition.street);
      return (frame) => update(frame/30);
    },
    country: (root) => {
      const update=makeCountryLine(root,edition.country);
      return (frame) => update((frame-482)/30);
    },
    sun: (root) => {
      addSpaceDepth(root,true);
      const update=makeSun(root);
      return (frame) => update(780+frame-events.reveal);
    },
    earth: (root) => {
      addSpaceDepth(root,false);
      const update=makeEarth(root);
      return (frame) => update(844+frame-1347);
    },
    ground: (root) => {
      const underlay = new THREE.Mesh(new THREE.PlaneGeometry(36,24),
        new THREE.MeshBasicMaterial({color:"#36375a"}));
      underlay.position.set(0,2.3,-7.0);
      root.add(underlay);
      const update=makeGround(root,true);
      return (frame) => update((frame-1409)/30);
    },
    night: (root) => {
      const update=makeStreet(root,true,edition.street);
      return (frame) => update((frame-1560)/30);
    },
  };
  return new Map<Stage,Set>(Object.entries(make).map(([name,factory]) => {
    const root=new THREE.Group();
    return [name as Stage,{root,update:factory(root)}];
  }));
}

function World({edition}: {edition: Edition}) {
  const frame=useCurrentFrame();
  const {camera,scene}=useThree();
  const view=camera as THREE.PerspectiveCamera;
  const stages=useMemo(() => createStages(edition),[edition]);
  const ink=useMemo(() => new InkPass(scene,view,{
    color:"#28192e",widthNear:3.18,widthFar:2.13,strength:0.94,creaseScale:0.64,
  }),[scene,view]);
  const lens=useMemo(() => new LensBlur({maxCoC:13,nearScale:0.32}),[]);
  useEffect(() => () => {
    ink.dispose();
    lens.pre.dispose();
    lens.main.dispose();
  },[ink,lens]);
  const {shot,pos,roll,target=shot.target}=edition.actions.cameraAt(frame);
  const active=stages.get(shot.stage)!;
  const office=shot.stage==="boston" || shot.stage==="portland" || shot.stage==="paper";
  const expressive=Boolean(edition.street);
  const danger=expressive ? ease((frame-286)/104)*(1-ease((frame-956)/180)) : 0;
  const dark=expressive ? Math.max(danger*0.78,suspenseLight(frame)) : suspenseLight(frame);
  const space=shot.stage==="sun" || shot.stage==="earth";
  const night=shot.stage==="night";
  useLayoutEffect(() => {
    view.position.set(...pos);
    view.fov=shot.lens;
    view.lookAt(...target);
    view.rotateZ(roll);
    view.updateProjectionMatrix();
    view.updateMatrixWorld(true);
    lens.focus=view.position.distanceTo(new THREE.Vector3(...target));
    lens.cInf=shot.blur ?? 0;
    active.update(frame,view);
  },[active,frame,lens,pos,roll,shot,target,view]);
  const ambientColor=new THREE.Color(shot.stage==="boston" ? expressive ? "#f4bf86" : "#efd0ae" : "#c7d7fa")
    .lerp(new THREE.Color(expressive ? "#afb0f3" : "#c7d7fa"),dark);
  const keyColor=new THREE.Color(night ? "#adc7fa" : expressive ? "#ffd18d" : "#ffdda4")
    .lerp(new THREE.Color(expressive ? "#809af4" : "#adc7fa"),dark);
  const background=office ? "#261b38" : space ? "#12152e" : "#353950";
  return (
    <>
      <color attach="background" args={[background]} />
      {!space && <fog attach="fog" args={[office ? "#514362" : night ? "#726888" : expressive ? "#a5abb0" : "#bd9c9e",office ? 6.4 : 12,office ? 14 : expressive ? 70 : 56]} />}
      <ambientLight intensity={office ? 1.11-dark*0.33 : night ? 0.77 : 1.44} color={ambientColor} />
      <directionalLight position={[3.5,6.0,3.9]} intensity={office ? 1.94-dark*0.8 : night ? 0.71 : 2.10} color={keyColor} />
      <directionalLight position={[-2.8,4.2,-3.7]} intensity={night ? 1.05 : 0.91} color={night ? "#a7e3cb" : "#9eb7ff"} />
      <primitive object={active.root} dispose={null} />
      <EffectComposer multisampling={0}>
        <>
          <primitive object={ink} dispose={null} />
          {office && <primitive object={lens.pre} dispose={null} />}
          {office && <primitive object={lens.main} dispose={null} />}
        </>
      </EffectComposer>
    </>
  );
}

export const TelegramEdition: React.FC<TelegramProps & {edition: Edition}> = ({detail,captions,mixReady,edition}) => {
  const {width,height,fps}=useVideoConfig();
  const frame=useCurrentFrame();
  const {shot}=edition.actions.shotAt(frame);
  return (
    <AbsoluteFill style={{background:"#261b38"}}>
      <ThreeCanvas width={width} height={height} dpr={detail}
        gl={{antialias:false,stencil:false,alpha:false,powerPreference:"high-performance"}}
        camera={{fov:34,near:0.08,far:edition.street ? 140 : 100}}>
        <World edition={edition} />
      </ThreeCanvas>
      <AbsoluteFill style={{pointerEvents:"none",
        background:"radial-gradient(ellipse at 48% 41%, transparent 39%, rgba(19,12,29,0.34) 100%)"}} />
      {captions && <Captions y={shot.captionY ?? 0.744} timing={edition.captions} speakerColors />}
      <Audio premountFor={fps} src={staticFile(`${edition.audio}/${mixReady ? "mix.wav" : "voice.wav"}`)} />
    </AbsoluteFill>
  );
};

export const SolarTelegramV3: React.FC<TelegramProps> = (props) => <TelegramEdition {...props} edition={v3} />;

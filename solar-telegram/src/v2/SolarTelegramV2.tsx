import {useLayoutEffect, useMemo} from "react";
import {useThree} from "@react-three/fiber";
import {EffectComposer} from "@react-three/postprocessing";
import {Audio} from "@remotion/media";
import {ThreeCanvas} from "@remotion/three";
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import * as THREE from "three";
import {InkPass} from "../bridge/ink";
import {LensBlur} from "../bridge/lensblur";
import {makeOffice} from "../office";
import {makeAurora, makeEarth, makeLine, makeSun} from "../exterior";
import {Captions} from "./Captions";
import {makeGround, makePaperFire, makeSparks} from "./illustrations";
import {act, cameraAt, shotAt, type Stage} from "./story";
import cues from "./cues.json";

type Set = {root: THREE.Group; update: (frame: number, camera: THREE.PerspectiveCamera) => void};
type Props = {detail: number; captions: boolean; mixReady: boolean};

function createSets() {
  const factories: Record<Stage, (root: THREE.Group) => Set["update"]> = {
    boston: (root) => {
      const office = makeOffice(root, true, "story");
      const crack = makeSparks(root, [0.58, 1.86, 0.23], 0.67);
      return (frame, camera) => {
        office(frame, camera, act(frame, "boston"));
        crack((frame - cues.surge) / 30);
      };
    },
    portland: (root) => {
      const office = makeOffice(root, false, "story");
      return (frame, camera) => office(frame, camera, act(frame, "portland"));
    },
    paper: (root) => {
      const office = makeOffice(root, false, "incident");
      const crack = makeSparks(root, [0.79, 1.77, -0.15], 0.9);
      const fire = makePaperFire(root);
      return (frame, camera) => {
        office(frame, camera, act(frame, "portland"));
        crack((frame - (frame >= cues.paperIgnition ? cues.paperIgnition : cues.paperArc)) / 30);
        fire((frame - cues.paperIgnition) / 30, camera);
      };
    },
    line: (root) => {
      const update = makeLine(root);
      return (frame) => update(311 + frame - shotAt(frame).shot.start);
    },
    sun: (root) => {
      const update = makeSun(root);
      return (frame) => update(780 + frame - cues.reveal);
    },
    earth: (root) => {
      const update = makeEarth(root);
      return (frame) => update(844 + frame - 1343);
    },
    ground: (root) => {
      const update = makeGround(root);
      return (frame) => update((frame - 1417) / 30);
    },
    aurora: (root) => {
      const update = makeAurora(root);
      return (frame) => update(1210 + frame - 1558);
    },
  };
  return new Map<Stage, Set>(Object.entries(factories).map(([name, factory]) => {
    const root = new THREE.Group();
    return [name as Stage, {root, update: factory(root)}];
  }));
}

function World() {
  const frame = useCurrentFrame();
  const {camera, scene} = useThree();
  const lensCamera = camera as THREE.PerspectiveCamera;
  const stages = useMemo(createSets, []);
  const ink = useMemo(() => new InkPass(scene, lensCamera, {
    color: "#21172c", widthNear: 3.25, widthFar: 2.1, strength: 0.94, creaseScale: 0.67,
  }), [scene, lensCamera]);
  const lens = useMemo(() => new LensBlur({maxCoC: 13, nearScale: 0.30}), []);
  const {shot, position, roll} = cameraAt(frame);
  const active = stages.get(shot.stage)!;
  const office = shot.stage === "boston" || shot.stage === "portland" || shot.stage === "paper";
  const warm = shot.stage === "boston";
  const space = shot.stage === "sun" || shot.stage === "earth";
  useLayoutEffect(() => {
    lensCamera.position.set(...position);
    lensCamera.fov = shot.lens;
    lensCamera.lookAt(...shot.target);
    lensCamera.rotateZ(roll);
    lensCamera.updateProjectionMatrix();
    lensCamera.updateMatrixWorld(true);
    lens.focus = lensCamera.position.distanceTo(new THREE.Vector3(...shot.target));
    lens.cInf = shot.blur ?? 0;
    active.update(frame, lensCamera);
  }, [active, frame, lens, lensCamera, position, roll, shot]);
  return (
    <>
      <color attach="background" args={[office ? "#251a32" : space ? "#13132c" : "#1d2241"]} />
      {office && <fog attach="fog" args={[warm ? "#493047" : "#253651", 5.8, 14]} />}
      <ambientLight intensity={office ? 0.98 : 1.2} color={warm ? "#dfc4d1" : "#c3d5ff"} />
      <directionalLight position={[3, 5.4, 3.9]} intensity={office ? 1.40 : 2.24} color="#ffe0ae" />
      <directionalLight position={[-2.4, 3.4, -3.7]} intensity={1.0} color="#bbc8ff" />
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

export const SolarTelegramV2: React.FC<Props> = ({detail, captions, mixReady}) => {
  const {width, height, fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const {shot} = shotAt(frame);
  return (
    <AbsoluteFill style={{background: "#251a32"}}>
      <ThreeCanvas width={width} height={height} dpr={detail}
        gl={{antialias: false, stencil: false, alpha: false, powerPreference: "high-performance"}}
        camera={{fov: 34, near: 0.09, far: 90}}>
        <World />
      </ThreeCanvas>
      <AbsoluteFill style={{
        pointerEvents: "none",
        background: "radial-gradient(ellipse at 48% 42%, transparent 35%, rgba(18,12,29,0.39) 100%)",
      }} />
      {captions && <Captions y={shot.captionY ?? 0.745} />}
      <Audio premountFor={fps} src={staticFile(mixReady ? "voice-v2/mix.wav" : "voice-v2/voice.wav")} />
    </AbsoluteFill>
  );
};

import {useEffect, useLayoutEffect, useMemo} from "react";
import {Audio} from "@remotion/media";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {EffectComposer} from "@react-three/postprocessing";
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import * as THREE from "three";
import {InkPass} from "./bridge/ink";
import {LensBlur} from "./bridge/lensblur";
import {makeOffice} from "./office";
import {makeAurora, makeCoil, makeEarth, makeLine, makeSun} from "./exterior";
import {cameraAt, type SetName} from "./story";

type Props = { mixReady: boolean; detail: number };
type Set = {
  root: THREE.Group;
  update: (frame: number, camera: THREE.PerspectiveCamera) => void;
};

function World() {
  const frame = useCurrentFrame();
  const {camera, scene} = useThree();
  const perspective = camera as THREE.PerspectiveCamera;
  const sets = useMemo(() => {
    const factories: Record<SetName, (root: THREE.Group) => Set["update"]> = {
      boston: (root) => makeOffice(root, true),
      portland: (root) => makeOffice(root, false),
      line: makeLine, sun: makeSun, earth: makeEarth, coil: makeCoil, aurora: makeAurora,
    };
    return new Map(Object.entries(factories).map(([name, create]) => {
      const root = new THREE.Group();
      return [name as SetName, {root, update: create(root)}];
    }));
  }, []);
  const ink = useMemo(() => new InkPass(scene, perspective, {
    color: "#251b32", widthNear: 3.1, widthFar: 2.2, strength: 0.91, creaseScale: 0.68,
  }), [scene, perspective]);
  const lens = useMemo(() => new LensBlur({maxCoC: 13, nearScale: 0.3}), []);

  useEffect(() => () => {
    ink.dispose();
    lens.pre.dispose();
    lens.main.dispose();
  }, [ink, lens]);

  const {shot, position} = cameraAt(frame);
  const active = sets.get(shot.set)!;
  const isOffice = shot.set === "boston" || shot.set === "portland";
  useLayoutEffect(() => {
    perspective.position.set(...position);
    perspective.fov = shot.lens;
    perspective.lookAt(...shot.look);
    perspective.updateProjectionMatrix();
    perspective.updateMatrixWorld(true);
    lens.focus = perspective.position.distanceTo(new THREE.Vector3(...shot.look));
    lens.cInf = shot.blur ?? 0;
    active.update(frame, perspective);
  }, [active, frame, lens, perspective, position, shot]);

  const warm = shot.set !== "portland";
  return (
    <>
      <color attach="background" args={[isOffice ? "#29213b" : "#151730"]} />
      <ambientLight intensity={1.28} color={warm ? "#dfcad6" : "#c5d7ff"} />
      <directionalLight position={[3.2, 5.0, 3.0]} intensity={2.02} color="#ffe1ac" />
      <directionalLight position={[-2.6, 2.5, -3]} intensity={0.69} color="#adc9ff" />
      <primitive object={active.root} dispose={null} />
      <EffectComposer multisampling={0}>
        <>
          <primitive object={ink} dispose={null} />
          {isOffice && <primitive object={lens.pre} dispose={null} />}
          {isOffice && <primitive object={lens.main} dispose={null} />}
        </>
      </EffectComposer>
    </>
  );
}

export const SolarTelegram: React.FC<Props> = ({mixReady, detail}) => {
  const {width, height, fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: "#19172e"}}>
      <ThreeCanvas width={width} height={height} dpr={detail}
        gl={{antialias: false, stencil: false, alpha: false, powerPreference: "high-performance"}}
        camera={{fov: 34, near: 0.09, far: 90}}
      >
        <World />
      </ThreeCanvas>
      <Audio premountFor={fps} src={staticFile(mixReady ? "voice/mix.wav" : "voice/voice.wav")} />
    </AbsoluteFill>
  );
};

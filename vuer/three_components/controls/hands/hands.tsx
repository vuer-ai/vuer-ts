import { MutableRefObject, useCallback, useContext, useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import throttle from "lodash.throttle";
import { useController, useXR, XRController } from '@react-three/xr';

import { VuerProps } from "../../../interfaces";
import { SocketContext, SocketContextType } from "../../../html_components/contexts/websocket";
import { Group } from "three";


type Chirality = "left" | "right" | "gaze";
type XRControllerEventTypes = "select" | "selectStart" | "selectEnd" | "squeeze" | "squeezeStart" | "squeezeEnd";
type EventType = XRControllerEventTypes;


const HAND_MODEL_JOINT_KEYS = [
  "wrist", "thumb-metacarpal", "thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip",
  "index-finger-metacarpal", "index-finger-phalanx-proximal", "index-finger-phalanx-intermediate",
  "index-finger-phalanx-distal", "index-finger-tip", "middle-finger-metacarpal",
  "middle-finger-phalanx-proximal", "middle-finger-phalanx-intermediate", "middle-finger-phalanx-distal",
  "middle-finger-tip", "ring-finger-metacarpal", "ring-finger-phalanx-proximal",
  "ring-finger-phalanx-intermediate", "ring-finger-phalanx-distal", "ring-finger-tip",
  "pinky-finger-metacarpal", "pinky-finger-phalanx-proximal", "pinky-finger-phalanx-intermediate",
  "pinky-finger-phalanx-distal", "pinky-finger-tip",
];


function getPoses(hand): number[][] {
  if (!hand?.joints) return [];
  return HAND_MODEL_JOINT_KEYS.map(k => hand.joints[k]?.position?.toArray());
}

function getPositionRotation(hand): Record<"position" | "rotation", number[]>[] {
  if (!hand?.joints) return [];
  return HAND_MODEL_JOINT_KEYS.map(k => ({
    position: hand.joints[k]?.position?.toArray(),
    rotation: hand.joints[k]?.rotation?.toArray(),
  }));
}

type HandsProps = VuerProps<{
  fps?: number,
  eventTypes?: EventType[],
  left?: boolean,
  right?: boolean,
  stream?: boolean,
}>

/**
 * Hands component
 *
 * This component is an event listener for the hands. This is separate from the
 * hands component in the @react-three/xr package. This component is used to send
 * messages to the server when the hands are moved or when the hands are used to
 * interact with the scene.
 * */
function Hands({
  _key,
  children,
  fps = 30,
  eventTypes = [],
  left: useLeft,
  right: useRight,
  stream = false,
  ..._
}: HandsProps): JSX.Element {

  const { sendMsg } = useContext(SocketContext) as SocketContextType;
  const { isPresenting, referenceSpace } = useXR() as {
    isPresenting: boolean, referenceSpace: XRReferenceSpace
  };

  const leftHandRef = useRef() as MutableRefObject<Group>;
  const rightHandRef = useRef() as MutableRefObject<Group>;

  /* these are the two hands*/
  const left = useController("left");
  const right = useController("right");
  /* this is the gaze controller -- where you look at. */
  const gaze = useController("none");

  const ctrlMap = { left, right, gaze };

  const onFrame = useCallback(throttle((): void => {
    const poseData = {
      keys: HAND_MODEL_JOINT_KEYS,
    } as Record<"keys" | "leftHand" | "rightHand" | "leftState" | "rightState", object | number[][]>;
    // these two are exclusive
    if (!useRight) {
      poseData.leftHand = getPoses(left?.hand)
      poseData.leftState = left?.hand?.inputState
    }
    if (!useLeft) {
      poseData.rightHand = getPoses(right?.hand)
      poseData.rightState = right?.hand?.inputState
    }

    sendMsg({
      etype: "HAND_MOVE",
      key: "hands",
      value: poseData,
    });
  }, 1000 / fps, { leading: true, trailing: true }), [
    fps, sendMsg, isPresenting, left, right, gaze, useLeft, useRight ]);

  useFrame(function (state) {
    // render hand components
    if (!isPresenting) return;

    const leftJoints = left?.hand?.joints as unknown[]
    const rightJoints = right?.hand?.joints as unknown[];

    const leftVisual = leftHandRef.current as Group;
    const rightVisual = rightHandRef.current as Group;

    const leftVisible = !useRight && !!left?.hand.visible;
    const rightVisible = !useLeft && !!right?.hand.visible

    if (leftVisual) leftVisual.visible = leftVisible;
    if (rightVisual) rightVisual.visible = rightVisible;
    if (!left?.hand.visible && !right?.hand.visible) return;

    return HAND_MODEL_JOINT_KEYS.forEach((k, i) => {
      if (leftJoints && leftVisual) {
        leftVisual.children[i].position.copy(
          leftJoints[k]?.position
        );
        leftVisual.children[i].rotation.copy(
          leftJoints[k]?.rotation
        );
      }
      if (rightJoints && rightVisual) {
        rightVisual.children[i].position.copy(
          rightJoints[k]?.position
        );
        rightVisual.children[i].rotation.copy(
          rightJoints[k]?.rotation
        );
      }
    });
    if (!stream) return;
    onFrame()
  })

  useLayoutEffect(() => {

    if (!isPresenting) return;

    const dispose = [];

    for (const etype of eventTypes) {
      const [ eKey, cKey ] = etype.split("@") as [ XRControllerEventTypes, Chirality ];

      const controller: XRController = ctrlMap[cKey];

      const listener = throttle((e: XRInputSourceEvent): void => {
        const frame = e.frame;
        const space = controller.inputSource?.targetRaySpace || controller.inputSource?.gripSpace;
        const pose = frame.getPose(space, referenceSpace);
        sendMsg({
          etype: "HAND_" + eKey.toUpperCase(),
          key: cKey,
          value: { eKey, pose },
        });
      }, 1000 / fps, { leading: true, trailing: true });

      // @ts-ignore: this is a valid event type
      controller.addEventListener(eType, listener);
      // @ts-ignore: this is a valid event type
      dispose.push(() => controller.removeEventListener(eType, listener));

    }

    return () => {
      dispose.forEach(d => d());
    }
  }, [ isPresenting, fps, sendMsg, left, right, gaze ])

  // if (!left && !right) return <DreiHands/>;
  if (!left && !right) return null;
  return <group>
    {useRight ? null
      : <group ref={leftHandRef}>
        {HAND_MODEL_JOINT_KEYS.map((jointName, i) =>
          <mesh key={jointName}>
            <boxGeometry args={[ 0.01, 0.01, 0.01 ]}/>
            <meshStandardMaterial attach="material" color="#ff4444" roughness={0.1}/>
          </mesh>
        )}
      </group>
    }
    {useLeft ? null
      : <group ref={rightHandRef}>
        {HAND_MODEL_JOINT_KEYS.map((jointName, i) =>
          <mesh key={jointName}>
            <boxGeometry args={[ 0.01, 0.01, 0.01 ]}/>
            <meshStandardMaterial attach="material" color="#23aaff" roughness={0.1}/>
          </mesh>
        )}
      </group>
    }
  </group>
  // you can add custom GLB models to the hands
  // return <BareHands key={key} {...rest} />;
}

export { Hands }
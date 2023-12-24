import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import {
  ACESFilmicToneMapping,
  CineonToneMapping,
  CustomToneMapping,
  LinearToneMapping,
  NoToneMapping,
  ReinhardToneMapping,
  Texture,
  TextureLoader
} from 'three';
import { useControls } from "leva";


const TONE_MAPPING_OPTIONS = {
  None: NoToneMapping,
  Linear: LinearToneMapping,
  Reinhard: ReinhardToneMapping,
  Cineon: CineonToneMapping,
  ACESFilmic: ACESFilmicToneMapping,
  Custom: CustomToneMapping
};

interface BackgroundImageParams {
  src: string | BlobPart | undefined | null;
}

export function SceneBackground({ src }: BackgroundImageParams) {
  const { scene, gl } = useThree();
  const loader: TextureLoader = useMemo(() => new TextureLoader(), []);
  const [ rgbTexture, setRGB ] = useState<Texture | undefined>();

  const is_empty = typeof src === 'string' && src?.length === 0;

  const {
    backgroundIntensity, backgroundBlurriness, toneMappingExposure, toneMapping,
  } = useControls("Tone Mapping", {
    backgroundIntensity: -0.5,
    backgroundBlurriness: 0.0,
    toneMappingExposure: 1.0,
    toneMapping: { value: "None", options: Object.keys(TONE_MAPPING_OPTIONS) }
  })

  useEffect(() => {
    if (!src || is_empty) return setRGB(undefined);
    if (typeof src === 'string') loader.load(src, setRGB);
    else {
      const blob: ImageBitmapSource = new Blob([ src ] as BlobPart[], { type: 'image' });
      const texture = new Texture();
      createImageBitmap(blob, { imageOrientation: 'flipY' }).then((imageBitmap) => {
        texture.image = imageBitmap;
        texture.needsUpdate = true;
        setRGB(texture);
      });
    }
  }, [ src ]);

  useEffect(() => {
    scene.backgroundIntensity = backgroundIntensity;
    scene.backgroundBlurriness = backgroundBlurriness;
  }, [ backgroundIntensity, backgroundBlurriness ])

  useEffect(() => {
    gl.toneMappingExposure = toneMappingExposure;
  }, [ toneMappingExposure ])

  useEffect(() => {
    gl.toneMapping = TONE_MAPPING_OPTIONS[toneMapping];
  }, [ toneMapping ])

  useEffect(() => {
    if (!rgbTexture) return;
    scene.background = rgbTexture;
  }, [ rgbTexture, rgbTexture?.needsUpdate ]);

  return null;
}

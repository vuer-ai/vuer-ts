import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { Texture, TextureLoader } from 'three';

interface BackgroundImageParams {
  src: string | BlobPart | undefined | null;
}

export function SceneBackground({ src }: BackgroundImageParams) {
  const { scene } = useThree();
  const loader: TextureLoader = useMemo(() => new TextureLoader(), []);
  const [ rgbTexture, setRGB ] = useState<Texture | undefined>();

  const is_empty = typeof src === 'string' && src?.length === 0;

  useEffect(() => {
    if (!src || is_empty) setRGB(undefined);
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
    if (!rgbTexture) return;
    scene.background = rgbTexture;
  }, [ rgbTexture, rgbTexture?.needsUpdate ]);

  return null;
}

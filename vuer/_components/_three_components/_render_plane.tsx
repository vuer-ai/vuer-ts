import {useEffect, useRef, useState} from "react";
import {useFrame, useThree} from "@react-three/fiber";
import {
    LinearFilter,
    Mesh,
    MeshBasicMaterial,
    NearestFilter,
    OrthographicCamera,
    PerspectiveCamera,
    Texture,
    TextureLoader,
    Vector3,
} from "three";
import {Plane} from "@react-three/drei";

function interpolateTexture(texture: Texture, interpolate: boolean) {
    if (!texture) return;
    if (interpolate) {
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
    } else {
        texture.minFilter = NearestFilter;
        texture.magFilter = NearestFilter;
    }
}

type RenderPlaneProps = {
    src?: string | Blob;
    alphaSrc?: string | Blob;
    distanceToCamera?: number;
    interpolate?: boolean;
    // useAlpha?: boolean;
    opacity?: number;
};

export function RenderPlane(
    {
        src,
        alphaSrc,
        distanceToCamera = 10,
        interpolate = false,
        // useAlpha = null,
        opacity = 1.0,
    }: RenderPlaneProps
) {
    const planeRef = useRef<Mesh>(null);
    const matRef = useRef<MeshBasicMaterial>(null);

    const {camera}: { camera: PerspectiveCamera | OrthographicCamera } = useThree();

    useFrame(() => {
        if (!planeRef.current) return;
        // if (!src || !depthSrc) return;
        if (!src) return;
        const plane = planeRef.current;
        // note: only works with perspective camera
        let h: number;
        let w: number;
        if (camera.type === "PerspectiveCamera") {
            const c = camera as PerspectiveCamera;
            h = 2 * Math.tan((c.fov / 360) * Math.PI) * distanceToCamera;
            w = c.aspect * h;
            plane.scale.set(w, h, 1);
        } else if (camera.type === "OrthographicCamera") {
            // handle Orthographic Camera
            const c = camera as OrthographicCamera;
            h = (c.top - c.bottom) / camera.zoom;
            w = (c.right - c.left) / camera.zoom;
            plane.scale.set(w, h, 1);
        } else {
            console.warn("Unsupported camera type", camera.type);
        }
        const dirVec = new Vector3(0, 0, -1)
            .applyEuler(camera.rotation)
            .normalize();
        plane.position
            .copy(camera.position)
            .addScaledVector(dirVec, distanceToCamera);
        plane.lookAt(camera.position);
    });

    const [rgbTexture, setRGB] = useState<Texture>();
    const [alphaTexture, setAlpha] = useState<Texture>();

    useEffect(() => {
        if (!src) {
            setRGB(undefined);
        } else if (typeof src === "string") {
            const loader = new TextureLoader();
            loader.load(src, setRGB);
        } else {
            const rgbSrc: ImageBitmapSource = src
            const texture = new Texture();
            createImageBitmap(rgbSrc, {imageOrientation: "flipY"}).then((imageBitmap) => {
                texture.image = imageBitmap;
                texture.needsUpdate = true;
                if (matRef.current) matRef.current.needsUpdate = true
                setRGB(texture);
            });
        }
    }, [src]);

    useEffect(() => {
        if (!alphaSrc) {
            setAlpha(undefined);
        } else if (typeof alphaSrc === "string") {
            const loader = new TextureLoader();
            loader.load(alphaSrc, setRGB);
        } else {
            const aSrc: ImageBitmapSource = alphaSrc
            const texture = new Texture();
            createImageBitmap(aSrc, {imageOrientation: "flipY"}).then((imageBitmap) => {
                texture.image = imageBitmap;
                texture.needsUpdate = true
                if (matRef.current) matRef.current.needsUpdate = true
                setAlpha(texture);
            });
        }
    }, [alphaSrc]);

    useEffect(() => {
        if (!!rgbTexture) interpolateTexture(rgbTexture, interpolate);
        if (!!alphaTexture) interpolateTexture(alphaTexture, interpolate);
    }, [rgbTexture, alphaTexture, interpolate]);

    const image: HTMLImageElement = rgbTexture?.image;

    return (
        <Plane
            ref={planeRef}
            args={[1, 1, image?.width, image?.height]}
            scale={[1, 1, 1]}
            // frustrumCulled={false}
        >
            <meshBasicMaterial
                ref={matRef}
                attach="material"
                map={rgbTexture}
                alphaMap={alphaTexture}
                transparent
                opacity={opacity}
            />
        </Plane>
    );
}

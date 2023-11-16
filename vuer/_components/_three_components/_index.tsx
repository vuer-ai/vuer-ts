import ThreeScene from "./_scene";
import {PropsWithChildren} from "react";

type SceneProps = PropsWithChildren<{
    _key: string,
    [key: string]: any
}>;

export function Scene({_key, ...rest}: SceneProps) {
    return <ThreeScene {...rest} />;
}

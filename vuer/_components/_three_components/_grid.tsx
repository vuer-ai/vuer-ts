import {useMemo} from "react";
import queryString from "query-string";
import {document} from "../../_lib/_browser-monads";
import {Grid as DreiGrid} from "@react-three/drei";
import {useControls} from "leva";
import {useThree} from "@react-three/fiber";

type GridQueries = {
    grid?: string;
};

export function Grid({far = null, levaPrefix = "Scene."}) {
    const q = useMemo<GridQueries>(
        () => queryString.parse(document.location.search),
        []
    );
    const {camera} = useThree();

    const {showGrid, yOffset, fadeDistance, ...config} = useControls(
        `${levaPrefix}Grid Plane`,
        {
            showGrid: {
                value: q.grid ? q.grid?.toLowerCase() === "true" : true,
                label: "Show Grid",
            },
            yOffset: 0,
            cellSize: 0.2,
            cellThickness: 0.6,
            cellColor: "#6f6f6f",
            sectionSize: 1.0,
            sectionThickness: 1.5,
            sectionColor: "#23aaff",
            fadeDistance: far || 10,
            fadeStrength: 1,
            followCamera: true,
            infiniteGrid: true,
        },
        {collapsed: true},
        [far, camera?.far]
    );
    if (showGrid) {
        return (
            <DreiGrid
                position={[0, yOffset, 0]}
                args={[10, 10]}
                fadeDistance={Math.min(camera?.far || 5, fadeDistance)}
                {...config}
            />
        );
    } else {
        return null;
    }
}

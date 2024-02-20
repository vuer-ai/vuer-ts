import { Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene } from "three";
import { useMemo } from "react";

const useDepthRender = () => {
  const [ postScene, postMaterial, postCamera ] = useMemo(() => {
    const pcam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pmat = new MeshBasicMaterial();

    // setup the scene for rendering the post FX
    const postPlane = new PlaneGeometry(2, 2);
    const postQuad = new Mesh(postPlane, pmat);
    const pscn = new Scene();
    pscn.add(postQuad);

    return [ pscn, pmat, pcam ];

  }, [])

  // depthTexture contains the relevant info
  async function renderFn({ renderer, near, far, texture }) {
    renderer.render(postScene, postCamera);
  }

  return renderFn;

}

export { useDepthRender };
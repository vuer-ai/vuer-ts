import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial } from "three";
import { useMemo } from "react";

const useDepthRender = () => {
  const [ postScene, postMaterial, postCamera ] = useMemo(() => {
    const pcam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pmat = new ShaderMaterial({
      vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
      fragmentShader: `
    #include <packing>
    
      varying vec2 vUv;
      uniform sampler2D tDepth;
      uniform float cameraNear;
      uniform float cameraFar;


      float readDepth( sampler2D depthSampler, vec2 coord ) {
        float fragCoordZ = texture2D( depthSampler, coord ).x;
        float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
        return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
      }

      void main() {
        float depth = readDepth( tDepth, vUv );

        gl_FragColor.rgb = 1.0 - vec3( depth );
        gl_FragColor.a = 1.0;
      }
    `,
      uniforms: {
        cameraNear: { value: 0.1 },
        cameraFar: { value: 100 },
        tDiffuse: { value: null },
        tDepth: { value: null }
      }
    });

    // setup the scene for rendering the post FX
    const postPlane = new PlaneGeometry(2, 2);
    const postQuad = new Mesh(postPlane, pmat);
    const pscn = new Scene();
    pscn.add(postQuad);

    return [ pscn, pmat, pcam ];

  }, [])

  // depthTexture contains the relevant info
  async function renderFn({ renderer, near, far, depthTexture }) {
    postMaterial.uniforms.tDepth.value = depthTexture;
    postMaterial.uniforms.cameraNear.value = near
    postMaterial.uniforms.cameraFar.value = far

    renderer.render(postScene, postCamera);
  }

  return renderFn;

}

export { useDepthRender };
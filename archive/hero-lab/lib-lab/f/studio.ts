import * as THREE from "three";

/* A small photographic studio, rendered once into a PMREM environment:
   a cool horizon gradient, one large overhead softbox, a long key strip
   to the left, a narrow rim strip behind, and a low fill card in front.
   The strips are what run along the pillars and chamfers as the die
   turns. No HDR photo, nothing to download. */
export function studioScene() {
  const scene = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const sky = new THREE.Mesh(
    keep(new THREE.SphereGeometry(20, 48, 24)),
    keep(
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {},
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: `varying vec3 vP;
          void main(){
            float y = vP.y;
            vec3 top = vec3(0.62, 0.66, 0.74);
            vec3 hor = vec3(0.42, 0.46, 0.54);
            vec3 low = vec3(0.66, 0.69, 0.75);
            vec3 c = y > 0.0 ? mix(hor, top, smoothstep(0.0, 0.7, y)) : mix(hor, low, smoothstep(0.0, 0.35, -y));
            gl_FragColor = vec4(c, 1.0);
          }`,
      })
    )
  );
  scene.add(sky);

  const box = (w: number, h: number, intensity: number, pos: [number, number, number], tint = 0xffffff) => {
    const m = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(intensity), side: THREE.DoubleSide }));
    const mesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(w, h)), m);
    mesh.position.set(...pos);
    mesh.lookAt(0, 0.5, 0);
    scene.add(mesh);
    return mesh;
  };
  // Fill: overhead softbox and a low card in front.
  box(8, 5, 2.2, [0, 9, 1]);
  box(10, 1.6, 1.4, [0, 1.0, 9]);
  // Two long thin strip lights, running through the horizon so that the
  // downward reflections off vertical cylinders (the camera looks down
  // 22°) land on them: a crisp vertical streak on every polished part.
  const strip = (az: number, w: number, intensity: number, tint = 0xffffff) => {
    const r = 8.5;
    const m = box(w, 18, intensity, [Math.sin(az) * r, 0.5, Math.cos(az) * r], tint);
    m.lookAt(0, 0.5, 0);
  };
  strip(-0.62, 0.55, 12);
  // A dark flag behind the camera: the band down the middle of every
  // polished cylinder. Mid-dark (about L* 30 once reflected) and feathered
  // at both edges, so the streak and the band roll into each other.
  {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 4;
    const g = c.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 256, 0);
    gr.addColorStop(0, "rgba(255,255,255,0)");
    gr.addColorStop(0.35, "rgba(255,255,255,1)");
    gr.addColorStop(0.65, "rgba(255,255,255,1)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 4);
    const t = keep(new THREE.CanvasTexture(c));
    const m = keep(new THREE.MeshBasicMaterial({ color: 0x7f8899, alphaMap: t, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    const flag = new THREE.Mesh(keep(new THREE.PlaneGeometry(4.2, 18)), m);
    flag.position.set(0.6, 0.5, 8.4);
    flag.lookAt(0, 0.5, 0);
    scene.add(flag);
  }
  strip(2.3, 0.4, 7, 0xe4ecff);
  // The sweep for the navy top: a broad softbox behind, graded from bright
  // above to nothing below, at the height the top face reflects toward
  // (about 15–35° up). Across the face the reflected angle changes by a few
  // degrees, which is enough to run a light-to-dark band through it.
  {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const g = c.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#ffffff");
    gr.addColorStop(0.45, "#ffffff");
    gr.addColorStop(1, "#000000");
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const t = keep(new THREE.CanvasTexture(c));
    const m = keep(new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1, 1, 1).multiplyScalar(1.3), side: THREE.DoubleSide }));
    const mesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(10, 5.5)), m);
    mesh.position.set(0, 4.0, -9);
    mesh.lookAt(0, 4.0, 0);
    scene.add(mesh);
  }

  return {
    scene,
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}

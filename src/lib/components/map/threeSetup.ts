import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, controls;

function initThree(containerEl, width, height) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);

  camera.position.set(0, 0, 600);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  containerEl.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;

  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = Math.PI / 2.5;

  controls.target.set(0, 0, 0);
  controls.update();

  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(1, 1, 2);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  animate();
}
function animate() {
  if (!controls || !renderer || !scene || !camera) {
    return;
  }
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function destroyThree() {
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement?.remove();
  }

  scene = undefined;
  camera = undefined;
  renderer = undefined;
  controls = undefined;
}

export { initThree, scene, destroyThree };

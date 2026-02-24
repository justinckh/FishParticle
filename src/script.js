import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import GUI from "lil-gui";
import gsap from "gsap";
import particlesVertexShader from "./shaders/particles/vertex_1.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";

import {
  startRecording,
  stopRecording,
  getIsRecording,
  getRecordingTime,
} from "./recording.js";
import { gui, initializeGUI, setSelectedFishByIndex } from "./GUI.js";

const debugObject = {};
debugObject.transparentBG = debugObject.transparentBG || 1;

var stats = new Stats();
document.body.appendChild(stats.dom);

const canvas = document.querySelector("canvas.webgl");

const scene = new THREE.Scene();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const sizes = {
  width: 3840,
  height: 2160,

  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  2000
);
camera.position.set(0, 0, 8 * 2);
camera.position.set(71.2, -3.2, 74.46);
scene.add(camera);
camera.aspect = 3820 / 2160;
camera.updateProjectionMatrix();
const controls = new OrbitControls(camera, canvas);

controls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: false,
  powerPreference: "high-performance",
  preserveDrawingBuffer: false,
});

renderer.setSize(sizes.width / 2, sizes.height / 2);
renderer.setPixelRatio(sizes.pixelRatio);
renderer.setClearAlpha(0);

canvas.style.width = "100%";
canvas.style.height = "100%";

debugObject.clearColor = "#ffffff";

let particles = null;
let clock = new THREE.Clock();
let rows = 70;
let columns = 70;
let threshold = 100.0;

const fishModels = [];
let currentFishIndex = 0;

const loadFishModel = async (path) => {
  try {
    const gltf = await gltfLoader.loadAsync(path);
    const positions = gltf.scene.children.map(
      (child) => child.geometry.attributes.position
    );
    return positions;
  } catch (error) {
    return null;
  }
};

const loadAllFishModels = async () => {
  const fishPaths = [
    "./fish1.glb",
    "./fish2.2.glb",
    "./fish3.glb",
    "./fish4.glb",
    "./fish5.glb",
    "./fish6.2.glb",
  ];

  const loadPromises = fishPaths.map((path) => loadFishModel(path));
  const loadedFishModels = await Promise.all(loadPromises);

  loadedFishModels.forEach((model) => {
    if (model) {
      fishModels.push(model);
    }
  });
};

function reduceMesh(position, newRows, newColumns, threshold = 1.0) {
  const oldCount = position.count;
  const oldRows = Math.ceil(Math.sqrt(oldCount));
  const oldColumns = oldRows;

  const positions = [];

  for (let i = 0; i <= newRows; i++) {
    const rowFraction = i / newRows;
    const oldI = rowFraction * (oldRows - 1);

    for (let j = 0; j <= newColumns; j++) {
      const columnFraction = j / newColumns;
      const oldJ = columnFraction * (oldColumns - 1);

      const oldIndex = Math.floor(oldI) * oldColumns + Math.floor(oldJ);
      const nextRow = Math.min(Math.ceil(oldI), oldRows - 1);
      const nextColumn = Math.min(Math.ceil(oldJ), oldColumns - 1);

      const y1 = position.getY(oldIndex);
      const y2 = position.getY(nextRow * oldColumns + Math.floor(oldJ));
      const y3 = position.getY(Math.floor(oldI) * oldColumns + nextColumn);
      const y4 = position.getY(nextRow * oldColumns + nextColumn);

      const fractI = oldI - Math.floor(oldI);
      const fractJ = oldJ - Math.floor(oldJ);

      let y;
      if (
        Math.abs(y1 - y2) > threshold ||
        Math.abs(y1 - y3) > threshold ||
        Math.abs(y2 - y4) > threshold ||
        Math.abs(y3 - y4) > threshold
      ) {
        y = y1;
      } else {
        y =
          y1 * (1 - fractI) * (1 - fractJ) +
          y2 * fractI * (1 - fractJ) +
          y3 * (1 - fractI) * fractJ +
          y4 * fractI * fractJ;
      }

      positions.push(
        -25 + (50 / newColumns) * j,
        y,
        -25 + (50 / newRows) * i
      );
    }
  }

  position.array = new Float32Array(positions);
  position.count = positions.length / 3;
  position.needsUpdate = true;
}

function flipZ(position) {
  const count = position.count;

  for (let i = 0; i < count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    position.setXYZ(i, x, y, -z);
  }

  position.needsUpdate = true;
}

function flipX(position) {
  const count = position.count;

  for (let i = 0; i < count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);

    position.setXYZ(i, -x, y, z);
  }

  position.needsUpdate = true;
}

const rearrangePositions = (position) => {
  const count = position.count;
  const rows = Math.ceil(Math.sqrt(count));
  const cols = rows;

  let index = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (index >= count) break;

      const x = -25 + (50 / (cols - 1)) * j;
      const z = -25 + (50 / (rows - 1)) * i;
      const y = position.getY(index) / 2;

      position.setXYZ(index, x, y, z);
      index++;
    }
  }
  position.needsUpdate = true;
};

function captureThreeJS() {
  renderer.setClearAlpha(debugObject.transparentBG === 1 ? 0 : 1);

  renderer.render(scene, camera);

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const sanitizedFileName = debugObject.outputFileName.replace(
      /[^a-z0-9_\-]/gi,
      "_"
    );
    a.download = `${sanitizedFileName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

const initializeApplication = () => {
  if (fishModels.length === 0) {
    return;
  }

  particles = {};

  particles.isMirrored = false;

  const initialPositions = fishModels[0];

  particles.geometry = new THREE.BufferGeometry();
  particles.geometry.setIndex(null);

  initialPositions.forEach((position) => {
    reduceMesh(position, rows, columns, threshold);
    rearrangePositions(position);
  });

  const mergedPositions = [];
  initialPositions.forEach((position) => {
    for (let i = 0; i < position.count; i++) {
      mergedPositions.push(
        position.getX(i),
        position.getY(i),
        position.getZ(i)
      );
    }
  });

  const mergedPositionsAttribute = new THREE.Float32BufferAttribute(
    mergedPositions,
    3
  );
  particles.geometry.setAttribute("position", mergedPositionsAttribute);

  particles.colorA = "#b72924";
  particles.colorB = "#3e24c2";
  particles.colorC = "#0092ff";

  particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms: {
      uTime: { value: 0.0 },
      uSize: { value: 0.6 },
      uColorA: { value: new THREE.Color(particles.colorA) },
      uColorB: { value: new THREE.Color(particles.colorB) },
      uColorC: { value: new THREE.Color(particles.colorC) },
      uColorDensity: { value: 0.05 },
      uSpeed: { value: 1.15 },
      uBlurr: { value: 0.2 },
      uResolution: {
        value: new THREE.Vector2(
          sizes.width * sizes.pixelRatio,
          sizes.height * sizes.pixelRatio
        ),
      },
    },
    transparent: true,
    depthWrite: false,
  });

  particles.points = new THREE.Points(particles.geometry, particles.material);
  process(100);
  scene.add(particles.points);

  particles.isMirrored = false;

  const fishNames = ["Fish1", "Fish2", "Fish3", "Fish4", "Fish5", "Fish6"];

  const saveConfiguration = () => {
    const configuration = {
      backgroundColour: debugObject.clearColor,
      backgroundTransparency: debugObject.transparentBG,
      primaryColour: particles.colorA,
      secondaryColour: particles.colorB,

      gridSize: debugObject.gridSize,
      colourDensity: particles.material.uniforms.uColorDensity.value,
      particleSize: particles.material.uniforms.uSize.value,
      speed: particles.material.uniforms.uSpeed.value,
      clarity: particles.material.uniforms.uBlurr.value,
      rotateX: particles.points.rotation.x,
      rotateY: particles.points.rotation.y,
      rotateZ: particles.points.rotation.z,
      positionX: particles.points.position.x,
      positionY: particles.points.position.y,
      positionZ: particles.points.position.z,
      fishModel: currentFishIndex,
      cameraRotationX: camera.rotation.x,
      cameraRotationY: camera.rotation.y,
      cameraRotationZ: camera.rotation.z,
      cameraPositionX: camera.position.x,
      cameraPositionY: camera.position.y,
      cameraPositionZ: camera.position.z,
      isMirrored: particles.isMirrored,
      isCameraMirrored: debugObject.isCameraMirrored,
      outputName: debugObject.outputFileName,
    };
    const fishName = fishNames[currentFishIndex];
    const filename = `${fishName}_Settings.json`;
    const configString = JSON.stringify(configuration);
    const blob = new Blob([configString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadConfiguration = async (url) => {
    try {
      let configuration;

      if (url) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch configuration file: ${url}`);
        }
        configuration = await response.json();
      } else {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.click();

        configuration = await new Promise((resolve, reject) => {
          input.onchange = async (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                resolve(JSON.parse(e.target.result));
              } catch (err) {
                reject(err);
              }
            };
            reader.onerror = reject;
            reader.readAsText(file);
          };
          input.onerror = reject;
        });
      }

      debugObject.clearColor = configuration.backgroundColour;

      if (configuration.backgroundTransparency) {
        renderer.setClearColor(new THREE.Color(debugObject.clearColor), 0);
      } else {
        renderer.setClearColor(new THREE.Color(debugObject.clearColor), 1);
      }
      if (configuration.backgroundTransparency) {
        debugObject.setTransparent();
      } else {
        debugObject.setOpaque();
      }

      particles.colorA = configuration.primaryColour;
      particles.material.uniforms.uColorA.value.set(particles.colorA);
      particles.colorB = configuration.secondaryColour;
      particles.material.uniforms.uColorB.value.set(particles.colorB);

      particles.material.uniforms.uColorDensity.value =
        configuration.colourDensity;
      particles.material.uniforms.uSize.value = configuration.particleSize;

      particles.material.uniforms.uSpeed.value = configuration.speed;
      particles.material.uniforms.uBlurr.value = configuration.clarity;

      particles.points.rotation.x = configuration.rotateX;
      particles.points.rotation.y = configuration.rotateY;
      particles.points.rotation.z = configuration.rotateZ;

      particles.points.position.set(
        configuration.positionX,
        configuration.positionY,
        configuration.positionZ
      );

      currentFishIndex = configuration.fishModel;
      changeToNewFish(fishModels[currentFishIndex], currentFishIndex);

      setSelectedFishByIndex(currentFishIndex, configuration.outputName);

      debugObject.gridSize = configuration.gridSize;
      process(debugObject.gridSize);

      camera.rotation.x = configuration.cameraRotationX;
      camera.rotation.y = configuration.cameraRotationY;
      camera.rotation.z = configuration.cameraRotationZ;

      camera.position.x = configuration.cameraPositionX;
      camera.position.y = configuration.cameraPositionY;
      camera.position.z = configuration.cameraPositionZ;

      if (configuration.isMirrored) {
        flipZ(particles.geometry.attributes.position);
        particles.isMirrored = true;
      } else {
        particles.isMirrored = false;
      }

      if (configuration.isCameraMirrored) {
        camera.scale.x = -1;
        debugObject.isCameraMirrored = true;
      } else {
        camera.scale.x = 1;
        debugObject.isCameraMirrored = false;
      }

      camera.updateProjectionMatrix();
    } catch (error) {
      alert(`Failed to load configuration: ${error.message}`);
    }
  };

  initializeGUI(
    gui,
    renderer,
    scene,
    particles,
    debugObject,
    camera,
    fishModels,
    currentFishIndex,
    changeToNewFish,
    captureThreeJS,
    saveConfiguration,
    loadConfiguration,
    process,
    clock,
    isPaused,
    pausedTime,
    flipX
  );

  scene.add(particles.points);
};

const changeToNewFish = (positions, index) => {
  positions.forEach((position) => {
    reduceMesh(position, rows, columns, threshold);
    const newPositionAttribute = new THREE.BufferAttribute(
      position.array,
      position.itemSize
    );
    if (!hasArrange[index]) {
      rearrangePositions(newPositionAttribute);
      hasArrange[index] = 1;
    }
    currentFishIndex = index;

    particles.geometry.setAttribute("position", newPositionAttribute);
  });
};

const hasArrange = [1, 0, 0, 0, 0, 0];

const process = (input) => {
  const rowsInput = input;
  const columnsInput = rowsInput;
  const position = particles.geometry.attributes.position;
  if (position) {
    reduceMesh(position, rowsInput, columnsInput, threshold);

    const newPositionAttribute = new THREE.BufferAttribute(
      position.array,
      position.itemSize
    );
    particles.geometry.setAttribute("position", newPositionAttribute);
    position.needsUpdate = true;
  }
};

const loadAndInitialize = async () => {
  try {
    await loadAllFishModels();
    initializeApplication();
  } catch (error) {
  }
};

loadAndInitialize();

let isPaused = false;
let pausedTime = 0;

const tick = () => {
  stats.begin();

  const width = renderer.domElement.width;
  const height = renderer.domElement.height;

  if (!isPaused) {
    const elapsedTime = (clock.getElapsedTime() - pausedTime) / 3.14;

    renderer.render(scene, camera);

    let delta = clock.getDelta() * 300;
    if (particles) {
      particles.material.uniforms.uTime.value =
        (clock.getElapsedTime() - pausedTime) *
        particles.material.uniforms.uSpeed.value;
    }
    if (getIsRecording()) {
      debugObject.recordingTime = `${getRecordingTime()} s`;
    } else {
      debugObject.recordingTime = "0.0 s";
    }
  } else {
    renderer.render(scene, camera);
  }

  stats.end();

  window.requestAnimationFrame(tick);
};

tick();

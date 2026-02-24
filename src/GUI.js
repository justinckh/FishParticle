import * as THREE from "three";
import GUI from "lil-gui";
import { startRecording, stopRecording, setVideoBitrate } from "./recording.js";

export const gui = new GUI({ width: 400 });

export function setSelectedFishByIndex(index, name) {
  fishButtons.forEach((btn, idx) => {
    if (idx === index) {
      btn.domElement.classList.add("selected");
      if (name) {
        btn.name(name);
      }
    } else {
      btn.domElement.classList.remove("selected");
    }
  });
}
let fishButtons = [];

export function initializeGUI(
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
  flipX,
) {
  debugObject.controllers = {};
  debugObject.gridSize = 100;

  const resolutionControls = {
    setHD: () => {
      setResolution(1920, 1080);
      hdBtn.disable();
      _4kBtn.enable();
    },

    set4k: () => {
      setResolution(3840, 2160);
      _4kBtn.disable();
      hdBtn.enable();
    },
  };

  function setResolution(width, height) {
    renderer.setSize(width / 2, height / 2, false);
    renderer.setPixelRatio(2);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  debugObject.recordingTime = "0.0 s";
  debugObject.isCameraMirrored = false;

  gui
    .addColor(debugObject, "clearColor")
    .listen()
    .onChange(() => {
      renderer.setClearColor(debugObject.clearColor);
      if (bgControls.setOpaque) {
        bgControls.setOpaque();
      }
    })
    .name("Background Colour");
  renderer.setClearColor(debugObject.clearColor);

  gui
    .addColor(particles, "colorA")
    .listen()
    .name("Primary Colour")
    .onChange(() => {
      particles.material.uniforms.uColorA.value.set(particles.colorA);
    });

  gui
    .addColor(particles, "colorB")
    .listen()
    .name("Secondary Colour")
    .onChange(() => {
      particles.material.uniforms.uColorB.value.set(particles.colorB);
    });

  gui
    .add(debugObject, "gridSize", 50, 200, 1)
    .listen()
    .name("Grid Size")
    .onChange((value) => {
      process(value);
    })
    .step(20);

  gui
    .add(particles.material.uniforms.uColorDensity, "value")
    .min(0)
    .max(3)
    .step(0.01)
    .name("Colour Density")
    .listen();

  gui
    .add(particles.material.uniforms.uSize, "value")
    .min(0)
    .max(3)
    .step(0.01)
    .name("Particle Size")
    .listen();

  gui
    .add(particles.material.uniforms.uSpeed, "value")
    .min(0)
    .max(3)
    .step(0.01)
    .name("Speed")
    .listen();

  gui
    .add(particles.material.uniforms.uBlurr, "value")
    .listen()
    .min(0.01)
    .max(2.0)
    .step(0.01)
    .name("Clarity");

  gui
    .add(particles.points.rotation, "x", 0, 2 * Math.PI)
    .name("Rotate X")
    .listen()
    .setValue(Math.PI);

  gui
    .add(particles.points.rotation, "z", 0, 2 * Math.PI)
    .name("Rotate Z")
    .listen()
    .setValue(Math.PI);

  const flipControls = {
    flipX: () => {
      if (
        particles &&
        particles.geometry &&
        particles.geometry.attributes.position
      ) {
        flipX(particles.geometry.attributes.position);
        particles.isMirrored = !particles.isMirrored;
        particles.geometry.attributes.position.needsUpdate = true;
        if (particles.isMirrored == true) {
          particles.points.rotation.y += Math.PI / 2;
        } else {
          particles.points.rotation.y -= Math.PI / 2;
        }
      }
    },
  };

  const flipBtn = gui.add(flipControls, "flipX").name("Flip Model");

  const flipBtnElem = flipBtn.domElement;

  flipBtnElem.style.display = "inline-block";
  flipBtnElem.style.width = "50%";

  const mirrorControls = {
    mirrorScene: () => {
      debugObject.isCameraMirrored = !debugObject.isCameraMirrored;
      camera.scale.x *= -1;
      camera.updateProjectionMatrix();
    },
  };

  const horizontalBtm = gui
    .add(mirrorControls, "mirrorScene")
    .name("Horizontal Mirror");

  const horizontalBtmElem = horizontalBtm.domElement;

  horizontalBtmElem.style.display = "inline-block";
  horizontalBtmElem.style.width = "50%";

  const fish1 = gui
    .add(
      {
        loadFish1: () => {
          loadConfiguration("./fish_config/Fish1_Settings.json");
        },
      },
      "loadFish1",
    )
    .name("Fish 1");
  const fish1Elem = fish1.domElement;

  const fish2 = gui
    .add(
      {
        loadFish2: () => {
          loadConfiguration("./fish_config/Fish2_Settings.json");
        },
      },
      "loadFish2",
    )
    .name("Fish 2");
  const fish2Elem = fish2.domElement;
  const fish3 = gui
    .add(
      {
        loadFish3: () => {
          loadConfiguration("./fish_config/Fish3_Settings.json");
        },
      },
      "loadFish3",
    )
    .name("Fish 3");
  const fish3Elem = fish3.domElement;

  fish1.domElement.classList.add("load-fish-button");
  fish1Elem.style.display = "inline-block";
  fish2Elem.style.display = "inline-block";
  fish3Elem.style.display = "inline-block";
  fish1Elem.style.width = "33%";
  fish2Elem.style.width = "33%";
  fish3Elem.style.width = "33%";

  const fish4 = gui
    .add(
      {
        loadFish4: () => {
          loadConfiguration("./fish_config/Fish4_Settings.json");
        },
      },
      "loadFish4",
    )
    .name("Fish 4");

  const fist4Elem = fish4.domElement;

  const fish5 = gui
    .add(
      {
        loadFish5: () => {
          loadConfiguration("./fish_config/Fish5_Settings.json");
        },
      },
      "loadFish5",
    )
    .name("Fish 5");

  const fish5Elem = fish5.domElement;

  const fish6 = gui
    .add(
      {
        loadFish6: () => {
          loadConfiguration("./fish_config/Fish6_Settings.json");
        },
      },
      "loadFish6",
    )
    .name("Fish 6");

  const fish6Elem = fish6.domElement;

  fishButtons = [fish1, fish2, fish3, fish4, fish5, fish6];

  function setSelectedFish(selectedButton) {
    fishButtons.forEach((btn) => {
      btn.enable();
    });
    selectedButton.disable();
  }

  async function loadConfigurationsInOrder() {
    await loadConfiguration("./fish_config/Fish2_Settings.json");
    await loadConfiguration("./fish_config/Fish3_Settings.json");
    await loadConfiguration("./fish_config/Fish4_Settings.json");
    await loadConfiguration("./fish_config/Fish5_Settings.json");
    await loadConfiguration("./fish_config/Fish6_Settings.json");
    await loadConfiguration("./fish_config/Fish1_Settings.json");
  }

  fish4.domElement.classList.add("load-fish-button");
  fish5.domElement.classList.add("load-fish-button");
  fish6.domElement.classList.add("load-fish-button");
  fist4Elem.style.display = "inline-block";
  fish5Elem.style.display = "inline-block";
  fish6Elem.style.display = "inline-block";
  fist4Elem.style.width = "33%";
  fish5Elem.style.width = "33%";
  fish6Elem.style.width = "33%";

  const saveConfig = gui
    .add({ saveConfiguration }, "saveConfiguration")
    .name("Save Setting");

  const saveConfigElem = saveConfig.domElement;

  const loadConfig = gui
    .add({ loadConfiguration }, "loadConfiguration")
    .name("Load Setting");

  const loadConfigElem = loadConfig.domElement;

  saveConfigElem.style.display = "inline-block";
  loadConfigElem.style.display = "inline-block";
  saveConfigElem.style.width = "50%";
  loadConfigElem.style.width = "50%";

  const pauseBtn = gui
    .add(
      {
        togglePause: () => {
          isPaused = !isPaused;
          if (isPaused) {
            pausedTime = clock.getElapsedTime();
            clock.stop();
          } else {
            clock.start();
            pausedTime = clock.getElapsedTime() - pausedTime;
          }
        },
      },
      "togglePause",
    )
    .name("Pause/Resume Time");

  const pauseBtnElem = pauseBtn.domElement;

  const captureBtn = gui
    .add({ captureThreeJS: captureThreeJS }, "captureThreeJS")
    .name("Capture Image (PNG)");

  const captureBtnElem = captureBtn.domElement;

  pauseBtnElem.style.display = "inline-block";
  captureBtnElem.style.display = "inline-block";
  pauseBtnElem.style.width = "50%";
  captureBtnElem.style.width = "50%";

  debugObject.outputFileName = "output";
  gui.add(debugObject, "outputFileName").name("Output File Name");

  gui.add(debugObject, "recordingTime").name("Recording Time (s)").listen();

  const startBtn = gui
    .add(
      {
        startRecording: () =>
          startRecording(
            renderer,
            scene,
            camera,
            startBtn,
            stopBtn,
            debugObject.transparentBG,
          ),
      },
      "startRecording",
    )
    .name("Start Recording")
    .onChange(() =>
      startRecording(
        renderer,
        scene,
        camera,
        startBtn,
        stopBtn,
        debugObject.transparentBG,
      ),
    );

  const stopBtn = gui
    .add(
      {
        stopRecording: () =>
          stopRecording(
            renderer,
            startBtn,
            stopBtn,
            debugObject.outputFileName,
          ),
      },
      "stopRecording",
    )
    .name("Stop Recording")
    .disable();

  const vidDiv = document.createElement("div");
  vidDiv.innerText = "Video Capture";
  vidDiv.style.display = "inline-block";
  vidDiv.style.width = "45%";
  vidDiv.style.textAlign = "start";
  vidDiv.style.paddingLeft = "5px";

  const parentElem = startBtn.domElement.parentElement;
  parentElem.insertBefore(vidDiv, startBtn.domElement);

  const startButtonElem = startBtn.domElement;
  startButtonElem.classList.add("record");
  const stopButtonElem = stopBtn.domElement;
  stopButtonElem.classList.add("record");
  startButtonElem.style.display = "inline-block";
  stopButtonElem.style.display = "inline-block";
  startButtonElem.style.width = "27.5%";
  stopButtonElem.style.width = "27.5%";

  const hdBtn = gui.add(resolutionControls, "setHD").name("HD Resolution");
  const _4kBtn = gui.add(resolutionControls, "set4k").name("4K Resolution");
  const resDiv = document.createElement("div");
  resDiv.innerText = "Set Resolution";
  resDiv.style.display = "inline-block";
  resDiv.style.width = "45%";
  resDiv.style.textAlign = "start";
  resDiv.style.paddingLeft = "5px";

  const parentElem2 = hdBtn.domElement.parentElement;
  parentElem2.insertBefore(resDiv, hdBtn.domElement);

  const hdButtonElem = hdBtn.domElement;
  const _4kButtonElem = _4kBtn.domElement;
  hdButtonElem.style.display = "inline-block";
  _4kButtonElem.style.display = "inline-block";
  hdButtonElem.style.width = "27.5%";
  _4kButtonElem.style.width = "27.5%";
  resolutionControls.set4k();

  debugObject.transparentBG = debugObject.transparentBG || 1;
  const bgControls = {
    setTransparent: () => {
      debugObject.transparentBG = 1;
      renderer.setClearAlpha(0);
      transparentBtn.disable();
      opaqueBtn.enable();
    },
    setOpaque: () => {
      debugObject.transparentBG = 0;
      renderer.setClearAlpha(1);
      opaqueBtn.disable();
      transparentBtn.enable();
    },
  };

  debugObject.setTransparent = bgControls.setTransparent;
  debugObject.setOpaque = bgControls.setOpaque;

  const transparentBtn = gui
    .add(bgControls, "setTransparent")
    .name("Transparent");

  const opaqueBtn = gui.add(bgControls, "setOpaque").name("Opaque");

  if (debugObject.transparentBG === 1) {
    transparentBtn.disable();
    opaqueBtn.enable();
  } else {
    opaqueBtn.disable();
    transparentBtn.enable();
  }

  const transDiv = document.createElement("div");
  transDiv.innerText = "Set Transparent Background";
  transDiv.style.display = "inline-block";
  transDiv.style.width = "45%";
  transDiv.style.textAlign = "start";
  transDiv.style.paddingLeft = "5px";

  const parentElem3 = transparentBtn.domElement.parentElement;
  parentElem2.insertBefore(transDiv, transparentBtn.domElement);

  const transButtonElem = transparentBtn.domElement;
  const opqButtonElem = opaqueBtn.domElement;
  transButtonElem.style.display = "inline-block";
  opqButtonElem.style.display = "inline-block";
  transButtonElem.style.width = "27.5%";
  opqButtonElem.style.width = "27.5%";

  gui.close();
}

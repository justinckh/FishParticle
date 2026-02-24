import * as THREE from "three";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

let isRecording = false;
let mediaRecorder;
let recordedChunks = [];
let stream;
let recordingCanvas;
let recordingContext;
let recordingRenderer;
let recordingScene;
let recordingCamera;
let videoBlob;
let desiredOutputFormat = "webm";
let recordingStartTimestamp = 0;
let currentVideoBitrate = 5000000;
let isCanvasFlipped = false;

export const setVideoBitrate = (bitrateMbps) => {
  currentVideoBitrate = bitrateMbps * 1000000;
};

export const getIsRecording = () => isRecording;

export const getRecordingTime = () => {
  if (isRecording && recordingStartTimestamp) {
    const elapsedTime = (Date.now() - recordingStartTimestamp) / 1000;
    const adjustedTime = Math.max(elapsedTime - 1, 0);
    return adjustedTime.toFixed(1);
  }
  return "0.0";
};
export const startRecording = async (
  renderer,
  scene,
  camera,
  startBtn,
  stopBtn,
  transparency
) => {
  if (isRecording) return;

  isRecording = true;
  recordedChunks = [];

  recordingStartTimestamp = Date.now();

  if (transparency == 1) {
    renderer.setClearAlpha(0);
  } else {
    renderer.setClearAlpha(1);
  }

  stream = renderer.domElement.captureStream(60);

  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm; codecs=vp9",
    videoBitsPerSecond: currentVideoBitrate,
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    const videoBlob = new Blob(recordedChunks, { type: "video/webm" });

    const fileName = mediaRecorder.fileName || "output";
    const sanitizedFileName = fileName.replace(/[^a-z0-9_\-]/gi, "_");

    const webmFileName = `${sanitizedFileName}.webm`;
    downloadVideo(videoBlob, webmFileName);
  };

  mediaRecorder.start();

  startBtn.disable();
  stopBtn.enable();
};

export const stopRecording = async (renderer, startBtn, stopBtn, fileName) => {
  if (!isRecording) return;

  isRecording = false;

  if (mediaRecorder) {
    mediaRecorder.fileName = fileName;
    mediaRecorder.stop();
  }

  recordingStartTimestamp = 0;

  stream.getTracks().forEach((track) => track.stop());

  startBtn.enable();
  stopBtn.disable();
};

function downloadVideo(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}

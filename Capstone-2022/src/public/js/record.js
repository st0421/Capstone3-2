const a1 = new Audio("../public/audio/1.mp3");
const a2 = new Audio("../public/audio/2.mp3");
const a3 = new Audio("../public/audio/3.mp3");

const q1 = document.getElementById("q1");
const q2 = document.getElementById("q2");
const q3 = document.getElementById("q3");

let stream;
let recorder;
let videoFile;

const handleDownload = () => {
  const a = document.createElement("a");
  a.href = videoFile;
  a.download = "Record.webm";
  document.body.appendChild(a);
  a.click();
};

const handleStop = () => {
  q1.innerText = "Save";
  q1.removeEventListener("click", handleStop);
  q1.addEventListener("click", handleDownload);
  recorder.stop();
};

const handleStart = () => {
  a1.play();
  q1.innerText = "Stop Recording";
  q1.removeEventListener("click", handleStart);
  q1.addEventListener("click", handleStop);

  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  recorder.ondataavailable = (event) => {
    videoFile = URL.createObjectURL(event.data);
  };
  recorder.start();
};

const init = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
};

init();

q1.addEventListener("click", handleStart);
q2.addEventListener("click", () => a2.play());
q3.addEventListener("click", () => a3.play());

const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const header = document.querySelector("header");
const table = document.querySelector("table");
const shot = document.getElementById("shot");
const canvasOutput = document.getElementById("canvasOutput");
const canvasOutputCtx = canvasOutput.getContext("2d");
const next = document.getElementById("next");
const submit = document.getElementById("submit");
const cam = document.getElementById("cam");

call.hidden = true;
table.hidden = true;
canvasOutput.hidden = false;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
// let myDataChannel;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label == camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: {
      deviceId: { exact: deviceId },
    },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);
shot.addEventListener("click", () => {
  
  
  opencvIsReady();
  //canvasOutput.getContext("2d").drawImage(myFace, 0, 0, canvasOutput.width, canvasOutput.height);

  // let imgUrl = canvasOutput.toDataURL("image/jpeg");
  // console.log(imgUrl);
});
next.addEventListener("click", () => {
  table.hidden = false;
  canvasOutput.hidden = false;
  cam.hidden = true;
  submit.hidden = true;
});

// Join a room

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const myNum = call.querySelector("h2");

async function initCall() {
  header.hidden = true;
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  myNum.innerText = `수험번호 : ${roomName}`;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket

socket.on("welcome", async () => {
  // myDataChannel = myPeerConnection.createDataChannel("chat");
  // myDataChannel.addEventListener("message", (event) => {
  //   console.log(event.data);
  // });
  // console.log("made data channel");
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
  // myPeerConnection.addEventListener("datachannel", (event) => {
  //   myDataChannel = event.channel;
  //   myDataChannel.addEventListener("message", (event) => {
  //     console.log(event.data);
  //   });
  // });
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

// RTC
function facecap(){
  
  videoWidth = 400//myFace.videoWidth
  videoHeight = 320//myFace.videoHeight
  myFace.setAttribute("width", videoWidth);
  myFace.setAttribute("height", videoHeight);

  canvasOutput.width = videoWidth;
  canvasOutput.height = videoHeight;


  canvasInput = document.createElement('canvas'); //canvas대신 canvasInput.
  canvasInput.width = videoWidth;
  canvasInput.height = videoHeight;
  canvasInputCtx = canvasInput.getContext('2d');

  canvasBuffer = document.createElement('canvas');
  canvasBuffer.width = videoWidth;
  canvasBuffer.height = videoHeight;
  canvasBufferCtx = canvasBuffer.getContext('2d');

  srcMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4);
  grayMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC1);
  
  faceClassifier = new cv.CascadeClassifier();
  faceClassifier.load('haarcascade_frontalface_default.xml');

  canvasInputCtx.drawImage(myFace, 0, 0, videoWidth, videoHeight);
  let imageData = canvasInputCtx.getImageData(0, 0, videoWidth, videoHeight);
  srcMat.data.set(imageData.data);
  cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);
  let faces = [];
  let faceVect = new cv.RectVector();
  let faceMat = new cv.Mat();
  cv.pyrDown(grayMat, faceMat);
  cv.pyrDown(faceMat, faceMat);
  let size = faceMat.size();
  faceClassifier.detectMultiScale(faceMat, faceVect);
  for (let i = 0; i < faceVect.size(); i++) {
    let face = faceVect.get(i);
    faces.push(new cv.Rect(face.x, face.y, face.width, face.height));
  }
  canvasOutputCtx.drawImage(canvasInput, 0, 0, videoWidth, videoHeight);
  drawResults(canvasOutputCtx, faces, 'red', size);
  // 그려진 영역만 crop해서 저장하려면 그냥 strokeRect로 그림을 그릴게아니라 strokeRect의 인자를 가지고 이미지 crop해서 저장해야함. 저것만 따오면 됨. rect.x*xRatio, rect.y*yRatio, rect.width*xRatio, rect.height*yRatio 이 좌표 rectangle 저장.
}

function drawResults(ctx, results, color, size) {
  for (let i = 0; i < results.length; ++i) {
    let rect = results[i];
    let xRatio = videoWidth/size.width;
    let yRatio = videoHeight/size.height;
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.strokeRect(rect.x*xRatio, rect.y*yRatio, rect.width*xRatio, rect.height*yRatio);
  }
}

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleTrack);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  socket.emit("ice", data.candidate, roomName);
}

function handleTrack(data) {
  console.log("handle Track");
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.streams[0];
}

function opencvIsReady() {

  facecap();
  
}
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwG9eFb9ZQvUB-Cz-IEayE9SLqmU0fS5pQ-FQRHKdvWTzxddQ-6arYBcBdl7QG_TVGr/exec";

const $ = (id) => document.getElementById(id);
const screens = ["welcomeScreen", "cameraScreen", "previewScreen", "thanksScreen"];
const video = $("video");
const canvas = $("canvas");
const ctx = canvas.getContext("2d");
let stream = null;
let facingMode = "environment";
let imageData = "";
let originalImageData = "";
let frameEnabled = false;
const coupleImg = new Image();
coupleImg.src = "couple.png";

function show(id){ screens.forEach(s => $(s).classList.toggle("hidden", s !== id)); }
function status(msg){ $("status").textContent = msg || ""; }
function stopCamera(){ if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } }

async function startCamera(){
  show("cameraScreen");
  try{
    stopCamera();
    stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode }, audio:false });
    video.srcObject = stream;
    await video.play();
  }catch(e){
    alert("Camera could not open. Please use Choose / Take Photo instead. Error: " + e.name);
    show("welcomeScreen");
  }
}
async function switchCamera(){ facingMode = facingMode === "environment" ? "user" : "environment"; await startCamera(); }
function countdownThenCapture(){
  let n=3; const cd=$("countdown"); cd.classList.remove("hidden"); cd.textContent=n;
  const timer=setInterval(()=>{ n--; if(n>0){cd.textContent=n}else{clearInterval(timer);cd.classList.add("hidden");captureFromVideo();}},800);
}
function captureFromVideo(){
  canvas.width = video.videoWidth || 1200;
  canvas.height = video.videoHeight || 1600;
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  originalImageData = canvas.toDataURL("image/jpeg", .9);
  imageData = originalImageData;
  frameEnabled = false;
  $("frameBtn").textContent = "🌿 Frame: OFF";
  stopCamera(); show("previewScreen"); status("Preview ready.");
}
function loadFile(file){
  const reader = new FileReader();
  reader.onload = (e)=>{
    const img = new Image();
    img.onload = ()=>{
      const max = 1600;
      let w=img.width,h=img.height;
      if(Math.max(w,h)>max){ const r=max/Math.max(w,h); w=Math.round(w*r); h=Math.round(h*r); }
      canvas.width=w; canvas.height=h; ctx.drawImage(img,0,0,w,h);
      originalImageData = canvas.toDataURL("image/jpeg", .9);
      imageData = originalImageData;
      frameEnabled = false;
      $("frameBtn").textContent = "🌿 Frame: OFF";
      show("previewScreen"); status("Preview ready.");
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function toggleFrame(){
  if(!originalImageData) return;

  frameEnabled = !frameEnabled;

  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if(frameEnabled){
      if (coupleImg.complete) {
        drawBottomFrame();
      } else {
        coupleImg.onload = () => drawBottomFrame();
      }
      $("frameBtn").textContent = "🌿 Frame: ON";
      status("Small bottom frame added.");
    } else {
      $("frameBtn").textContent = "🌿 Frame: OFF";
      status("Frame removed.");
    }

    imageData = canvas.toDataURL("image/jpeg", .9);
  };

  img.src = originalImageData;
}
function drawBottomFrame(){
  const w = canvas.width;
  const h = canvas.height;

  const frameHeight = Math.round(h * 0.16);
  const y = h - frameHeight;

  ctx.save();

  // Cream bottom frame
  ctx.fillStyle = "rgba(255, 250, 242, 0.92)";
  ctx.fillRect(0, y, w, frameHeight);

  // Champagne gold top line
  ctx.fillStyle = "#d7c59a";
  ctx.fillRect(0, y, w, Math.max(3, Math.round(h * 0.003)));

  // Couple image on the left
  if (coupleImg.complete) {
    const imgH = frameHeight * 1.15;
    const imgW = imgH * (coupleImg.width / coupleImg.height);
    const imgX = w * 0.04;
    const imgY = y + frameHeight - imgH + h * 0.005;

    ctx.drawImage(coupleImg, imgX, imgY, imgW, imgH);
  }

  // Text area
  ctx.textAlign = "center";

  ctx.fillStyle = "#556b4f";
  ctx.font = `${Math.round(w * 0.045)}px Georgia`;
  ctx.fillText("#TheseBootzAreMadeForDelna", w * 0.58, y + frameHeight * 0.43);

  ctx.fillStyle = "#9b7c3e";
  ctx.font = `${Math.round(w * 0.023)}px Georgia`;
  ctx.fillText("July 16, 2026 ♡", w * 0.58, y + frameHeight * 0.68);

  ctx.restore();
}
function downloadPhotoToDevice(){
  if(!imageData) return;

  const name = ($("guestName").value || "Guest")
    .replace(/[^\w\s-]/g, "")
    .trim() || "Guest";

  const link = document.createElement("a");
  link.href = imageData;
  link.download = `Bootz-Delna-Wedding-${name}.jpg`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
async function uploadPhoto(){
  if(!imageData){ status("Please take or choose a photo first."); return; }
  if(APPS_SCRIPT_URL.includes("PASTE_YOUR")){ status("Set APPS_SCRIPT_URL in script.js first."); return; }
  $("uploadBtn").disabled=true; status("Uploading...");
  try{
    const payload = { image:imageData, name:$("guestName").value || "Guest" };
    const res = await fetch(APPS_SCRIPT_URL, { method:"POST", body:JSON.stringify(payload), headers:{"Content-Type":"text/plain;charset=utf-8"} });
    const out = await res.json();
    if(!out.success) throw new Error(out.message || "Upload failed");

        downloadPhotoToDevice();

        $("uploadBtn").disabled = false;
        show("thanksScreen");
  }catch(e){
    $("uploadBtn").disabled=false; status("Upload failed: " + e.message);
  }
}
function reset(){
  imageData="";
  originalImageData="";
  frameEnabled=false;
  $("frameBtn").textContent = "🌿 Frame: OFF";
  $("guestName").value="";
  status("");
  show("welcomeScreen");
}

$("startBtn").onclick=startCamera;
$("switchBtn").onclick=switchCamera;
$("captureBtn").onclick=countdownThenCapture;
$("backBtn").onclick=()=>{stopCamera();show("welcomeScreen")};
$("uploadFileBtn").onclick=()=>$("fileInput").click();
$("fileInput").onchange=(e)=>{ const f=e.target.files[0]; if(f) loadFile(f); e.target.value=""; };
$("frameBtn").onclick=toggleFrame;
$("uploadBtn").onclick=uploadPhoto;
$("retakeBtn").onclick=reset;
$("againBtn").onclick=reset;

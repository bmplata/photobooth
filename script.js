// Paste your deployed Google Apps Script Web App URL here.
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwG9eFb9ZQvUB-Cz-IEayE9SLqmU0fS5pQ-FQRHKdvWTzxddQ-6arYBcBdl7QG_TVGr/exec";

const $ = (id) => document.getElementById(id);
const screens = ["welcomeScreen", "cameraScreen", "previewScreen", "thanksScreen"];
const video = $("video");
const canvas = $("canvas");
const ctx = canvas.getContext("2d");
let stream = null;
let facingMode = "environment";
let imageData = "";
let frameAdded = false;

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
  imageData = canvas.toDataURL("image/jpeg", .9);
  frameAdded=false; stopCamera(); show("previewScreen"); status("Preview ready.");
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
      imageData=canvas.toDataURL("image/jpeg",.9); frameAdded=false; show("previewScreen"); status("Preview ready.");
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}
function addFrame(){
  if(frameAdded) return;
  const w=canvas.width,h=canvas.height;
  ctx.save();
  ctx.lineWidth=Math.max(16,Math.round(w*.025)); ctx.strokeStyle="#6f7f5f"; ctx.strokeRect(24,24,w-48,h-48);
  ctx.lineWidth=Math.max(8,Math.round(w*.012)); ctx.strokeStyle="#d7c59a"; ctx.strokeRect(55,55,w-110,h-110);
  ctx.fillStyle="rgba(255,250,242,.88)"; ctx.fillRect(0,h-160,w,160);
  ctx.fillStyle="#556b4f"; ctx.textAlign="center";
  ctx.font=`${Math.round(w*.07)}px Georgia`; ctx.fillText("Bootz & Delna",w/2,h-96);
  ctx.font=`${Math.round(w*.032)}px Georgia`; ctx.fillText("July 16, 2026 · Oriental Mindoro",w/2,h-52);
  ctx.fillStyle="#b39654"; ctx.font=`${Math.round(w*.035)}px Georgia`; ctx.fillText("♡",w/2,h-24);
  ctx.restore();
  imageData=canvas.toDataURL("image/jpeg",.9); frameAdded=true; status("Wedding frame added.");
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
    $("uploadBtn").disabled=false; show("thanksScreen");
  }catch(e){
    $("uploadBtn").disabled=false; status("Upload failed: " + e.message);
  }
}
function reset(){ imageData=""; frameAdded=false; $("guestName").value=""; status(""); show("welcomeScreen"); }

$("startBtn").onclick=startCamera;
$("switchBtn").onclick=switchCamera;
$("captureBtn").onclick=countdownThenCapture;
$("backBtn").onclick=()=>{stopCamera();show("welcomeScreen")};
$("uploadFileBtn").onclick=()=>$("fileInput").click();
$("fileInput").onchange=(e)=>{ const f=e.target.files[0]; if(f) loadFile(f); e.target.value=""; };
$("frameBtn").onclick=addFrame;
$("uploadBtn").onclick=uploadPhoto;
$("retakeBtn").onclick=reset;
$("againBtn").onclick=reset;

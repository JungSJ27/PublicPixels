// Pixel intro navigation
const playBtn = document.getElementById("btn-play");
const archiveBtn = document.getElementById("btn-archive");

if(playBtn){
  playBtn.addEventListener("click", ()=>{
    // 기존 three.js world start trigger 연결 자리
    document.getElementById("pixel-intro-ui").style.display = "none";
  });
}

if(archiveBtn){
  archiveBtn.addEventListener("click", ()=>{
    location.href = "/archive/";
  });
}

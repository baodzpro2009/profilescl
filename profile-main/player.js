// ===== PLAYLIST =====
const playlist = [
  {name:"Bài 1", url:"https://files.catbox.moe/343g0o.mp4"},
  {name:"Bài 2", url:"https://files.catbox.moe/i6lum4.mp4"},
  {name:"Bài 3", url:"https://files.catbox.moe/qoc2wv.mp4"},
  {name:"Bài 4", url:"https://files.catbox.moe/plsvn1.mp4"}
];

// ===== ELEMENTS =====
const video = document.getElementById("audio"); // video ẩn
const title = document.getElementById("title");
const bar = document.getElementById("bar");
const cur = document.getElementById("current");
const dur = document.getElementById("duration");
const pp = document.getElementById("pp");

let index = 0, playing = false;

// ===== LOAD SONG =====
function loadSong(i){
  video.src = playlist[i].url;
  title.innerText = "🎧 " + playlist[i].name;
  video.load();
}

// ===== PLAY / PAUSE =====
function togglePlay(){
  if(!playing){
    video.play().then(()=>{
      playing = true;
      pp.className = "fas fa-pause";
    }).catch(err=>{
      console.log("Play bị chặn: ", err);
    });
  } else {
    video.pause();
    playing = false;
    pp.className = "fas fa-play";
  }
}

// ===== NEXT / PREV =====
function nextSong(){
  index = (index+1)%playlist.length;
  loadSong(index);
  video.play().then(()=>{ playing=true; pp.className="fas fa-pause"; }).catch(()=>{});
}
function prevSong(){
  index = (index-1+playlist.length)%playlist.length;
  loadSong(index);
  video.play().then(()=>{ playing=true; pp.className="fas fa-pause"; }).catch(()=>{});
}

// ===== TIME UPDATE =====
video.addEventListener("timeupdate", ()=>{
  if(video.duration){
    const p = (video.currentTime/video.duration)*100;
    bar.style.width = p+"%";
    cur.innerText = format(video.currentTime);
    dur.innerText = format(video.duration);
  }
});

// ===== UPDATE DURATION KHI METADATA LOAD =====
video.addEventListener("loadedmetadata", ()=>{
  dur.innerText = format(video.duration);
});

// ===== SEEK =====
function seek(e){
  const rect = e.currentTarget.getBoundingClientRect();
  video.currentTime = ((e.clientX - rect.left)/rect.width)*video.duration;
}

// ===== AUTO NEXT =====
video.addEventListener("ended", nextSong);

// ===== FORMAT TIME =====
function format(t){
  if(isNaN(t)) return "0:00";
  const m = Math.floor(t/60);
  const s = Math.floor(t%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

// ===== DRAG PLAYER =====
const player = document.querySelector(".spotify");
let isDragging = false, offsetX = 0, offsetY = 0;

player.addEventListener("mousedown", startDrag);
player.addEventListener("touchstart", startDrag, {passive:false});
document.addEventListener("mousemove", drag);
document.addEventListener("touchmove", drag, {passive:false});
document.addEventListener("mouseup", stopDrag);
document.addEventListener("touchend", stopDrag);

function startDrag(e){
  if(e.target.closest(".controls")) return;
  e.preventDefault();
  isDragging = true;
  const rect = player.getBoundingClientRect();
  offsetX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  offsetY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  player.style.transform = "none";
}

function drag(e){
  if(!isDragging) return;
  e.preventDefault();
  let x = (e.touches ? e.touches[0].clientX : e.clientX) - offsetX;
  let y = (e.touches ? e.touches[0].clientY : e.clientY) - offsetY;

  // Giới hạn kéo trong màn hình
  x = Math.max(0, Math.min(window.innerWidth - player.offsetWidth, x));
  y = Math.max(0, Math.min(window.innerHeight - player.offsetHeight, y));

  player.style.left = x + "px";
  player.style.top = y + "px";
}

function stopDrag(){ isDragging=false; }
// ===== SCL SEARCH FIX =====
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("sclKeyword");
  const btn = document.getElementById("sclSearchBtn");
  const results = document.getElementById("sclResults");

  // click nút
  btn.onclick = searchSCL;

  // enter để tìm
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchSCL();
  });

  async function searchSCL(){
    const keyword = input.value.trim();
    if(!keyword) return alert("Nhập tên bài!");

    results.innerHTML = "⏳ Đang tìm...";

    try {
      const res = await fetch(`http://localhost:3000/search?q=${encodeURIComponent(keyword)}`);
      const data = await res.json();

      if(!data.length){
        results.innerHTML = "❌ Không tìm thấy!";
        return;
      }

      results.innerHTML = "";

      data.forEach(track => {
        const div = document.createElement("div");
        div.className = "scl-item";

        div.innerHTML = `
          <div class="scl-info">
            <div class="scl-title">${track.title}</div>
            <div class="scl-artist">👤 ${track.user}</div>
          </div>
        `;

        // click phát nhạc
        div.onclick = () => {
          video.src = `http://localhost:3000/stream?url=${encodeURIComponent(track.url || track.stream)}`;
          title.innerText = "🎧 " + track.title;

          video.play();
          playing = true;
          pp.className = "fas fa-pause";
        };

        results.appendChild(div);
      });

    } catch (err){
      results.innerHTML = "❌ Không kết nối server!";
      console.log(err);
    }
  }
});
// ===== INIT =====
loadSong(index);
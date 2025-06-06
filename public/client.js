const socket = io();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const tile = 32;
let blocks = {}; // key: "x,y" -> type
let players = {};
let projectiles = [];
let localId = null;
let camera = {x:0, y:0};
let keys = {};
let mouse = {x:0,y:0,button:false};
let joined = false;

function key(e){ keys[e.key] = e.type==='keydown'; }
window.addEventListener('keydown', key);
window.addEventListener('keyup', key);
canvas.addEventListener('contextmenu', e=>e.preventDefault());
canvas.addEventListener('mousedown', e=>{ if(e.button===2){ removeBlock(); } mouse.button=true; });
canvas.addEventListener('mouseup', ()=>{mouse.button=false;});
canvas.addEventListener('mousemove', e=>{
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left + camera.x;
  mouse.y = e.clientY - rect.top + camera.y;
});

function joinGame(){
  if(joined) return;
  const name = document.getElementById('username').value || 'Player';
  socket.emit('new-player', name);
  joined = true;
  document.getElementById('ui').style.display='none';
}

document.getElementById('join').onclick = joinGame;

socket.on('currentState', state => {
  players = state.players;
  blocks = state.blocks;
  localId = socket.id;
  if(!players[localId]) players[localId]={x:100,y:100,username:'',color:'red'};
});

socket.on('playerJoined', p=>{ players[p.id]=p; });
socket.on('playerMoved', p=>{ if(players[p.id]) players[p.id]=p; });
socket.on('playerDisconnect', id=>{ delete players[id]; });
socket.on('blockUpdate', b=>{ blocks[b.key]=b.type; });
socket.on('blockRemove', key=>{ delete blocks[key]; });
socket.on('newProjectile', p=>{ projectiles.push(p); });
socket.on('playerRespawn', p=>{ players[p.id]=p; });

function placeBlock(type){
  const x = Math.floor(mouse.x / tile);
  const y = Math.floor(mouse.y / tile);
  const key = x+','+y;
  blocks[key]=type;
  socket.emit('placeBlock', {key,type});
}
function removeBlock(){
  const x = Math.floor(mouse.x / tile);
  const y = Math.floor(mouse.y / tile);
  const key = x+','+y;
  delete blocks[key];
  socket.emit('removeBlock', key);
}
function shoot(){
  const p = players[localId];
  const angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);
  const speed = 5;
  const proj = {x:p.x,y:p.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,owner:localId};
  projectiles.push(proj);
  socket.emit('shoot', proj);
}

function tick(){
  if(!localId) return requestAnimationFrame(tick);
  const p = players[localId];
  if(!p) return requestAnimationFrame(tick);
  // movement
  if(keys['ArrowLeft']) p.x -= 2;
  if(keys['ArrowRight']) p.x += 2;
  if(keys['ArrowUp']) p.y -= 2;
  if(keys['ArrowDown']) p.y += 2;
  if(keys['b']||keys['B']){ placeBlock(1); keys['b']=keys['B']=false; }
  if(keys['r']||keys['R']){ placeBlock(2); keys['r']=keys['R']=false; }
  if(keys['q']||keys['Q']){ shoot(); keys['q']=keys['Q']=false; }

  socket.emit('move',{x:p.x,y:p.y});

  camera.x += (p.x - camera.x - canvas.width/2)/10;
  camera.y += (p.y - camera.y - canvas.height/2)/10;

  updateProjectiles();
  draw();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function updateProjectiles(){
  projectiles.forEach(pr=>{pr.x+=pr.vx;pr.y+=pr.vy;});
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // blocks
  for(const key in blocks){
    const [bx,by] = key.split(',').map(Number);
    const type = blocks[key];
    if(type===1) ctx.fillStyle='brown';
    else if(type===2) ctx.fillStyle='green';
    ctx.fillRect(bx*tile - camera.x, by*tile - camera.y, tile, tile);
  }

  // projectiles
  ctx.fillStyle='yellow';
  projectiles.forEach(pr=>{
    ctx.beginPath();
    ctx.arc(pr.x - camera.x, pr.y - camera.y, 5, 0, Math.PI*2);
    ctx.fill();
  });

  // players
  for(const id in players){
    const pl = players[id];
    ctx.fillStyle=pl.color;
    ctx.fillRect(pl.x - 16 - camera.x, pl.y - 16 - camera.y, 32, 32);
    if(pl.username==='Fleekshots'){
      ctx.fillStyle='black';
      ctx.fillRect(pl.x - 10 - camera.x, pl.y - 20 - camera.y, 20, 5);
    }
    ctx.fillStyle='white';
    ctx.textAlign='center';
    ctx.fillText(pl.username, pl.x - camera.x, pl.y - 20 - camera.y);
  }
}

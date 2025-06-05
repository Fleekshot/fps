import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let objects = []; // collidable objects
let bullets = [];

// UI references
const healthValue = document.getElementById('health-value');
const ammoValue = document.getElementById('ammo-value');
const scoreValue = document.getElementById('score-value');
let health = 100;
let ammo = 50;
let score = 0;

function createCheckerTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  for (let y = 0; y < size; y += 8) {
    for (let x = 0; x < size; x += 8) {
      ctx.fillStyle = ((x + y) / 8) % 2 ? "#777" : "#555";
      ctx.fillRect(x, y, 8, 8);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createStripeTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#600";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#400";
  for (let x = 0; x < size; x += 8) {
    ctx.fillRect(x, 0, 4, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}


// initialization after the page loads
init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
  scene = new THREE.Scene();

  // simple lighting
  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(1, 1, 1);
  scene.add(light);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new PointerLockControls(camera, document.body);

  const overlay = document.getElementById('overlay');
  const startButton = document.getElementById('startButton');
  startButton.addEventListener('click', function () {
    controls.lock();
  });

  controls.addEventListener('lock', function () {
    overlay.style.display = 'none';
  });
  controls.addEventListener('unlock', function () {
    overlay.style.display = 'flex';
  });
  scene.add(controls.getObject());

  const onKeyDown = function (event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;
      case 'Space':
        if (canJump === true) velocity.y += 350;
        canJump = false;
        break;
      case 'Mouse1':
        shoot();
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousedown', function(event){
    if(event.button === 0) shoot();
  });

  // floor
  const floorGeometry = new THREE.PlaneGeometry(200, 200, 10, 10);
  floorGeometry.rotateX(-Math.PI / 2);
  const floorMaterial = new THREE.MeshLambertMaterial({ map: createCheckerTexture() });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  scene.add(floor);

  // walls
  const wallMaterial = new THREE.MeshLambertMaterial({ map: createStripeTexture() });
  const wallGeometry = new THREE.BoxGeometry(200, 50, 1);

  const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall1.position.set(0, 25, -100);
  scene.add(wall1);
  objects.push(wall1);

  const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall2.position.set(0, 25, 100);
  scene.add(wall2);
  objects.push(wall2);

  // side walls
  const sideGeometry = new THREE.BoxGeometry(1, 50, 200);

  const wall3 = new THREE.Mesh(sideGeometry, wallMaterial);
  wall3.position.set(-100, 25, 0);
  scene.add(wall3);
  objects.push(wall3);

  const wall4 = new THREE.Mesh(sideGeometry, wallMaterial);
  wall4.position.set(100, 25, 0);
  scene.add(wall4);
  objects.push(wall4);

  // spawn some enemies
  spawnEnemy(new THREE.Vector3(0, 5, -50));
  spawnEnemy(new THREE.Vector3(50, 5, -20));
  spawnEnemy(new THREE.Vector3(-50, 5, -30));
  spawnPickup("health", new THREE.Vector3(20, 2, 0));
  spawnPickup("ammo", new THREE.Vector3(-20, 2, 0));

  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function shoot() {
  if (ammo <= 0) return;
  ammo--;
  ammoValue.textContent = ammo;

  const bulletGeometry = new THREE.SphereGeometry(0.5, 8, 8);
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

  const { x, y, z } = controls.getObject().position;
  bullet.position.set(x, y, z);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  bullet.userData.velocity = dir.clone().multiplyScalar(400);
  bullets.push(bullet);
  scene.add(bullet);
}

class Enemy {
  constructor(position) {
    const geometry = new THREE.BoxGeometry(5, 10, 5);
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    scene.add(this.mesh);
    this.alive = true;
    this.speed = 40;
  }

  update(delta) {
    if (!this.alive) return;
    const playerPos = controls.getObject().position;
    const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
    const dist = dir.length();

    if (dist < 2) {
      // damage player
      health -= 10 * delta;
      if (health < 0) health = 0;
      healthValue.textContent = Math.floor(health);
    }

    dir.normalize();
    this.mesh.position.add(dir.multiplyScalar(delta * this.speed));
  }

  kill() {
    this.alive = false;
    scene.remove(this.mesh);
    score += 100;
    scoreValue.textContent = score;
  }
}

const pickups = [];
class Pickup {
  constructor(type, position) {
    this.type = type;
    const geometry = new THREE.BoxGeometry(4,4,4);
    const color = type === "health" ? 0x00ff00 : 0x0000ff;
    const material = new THREE.MeshLambertMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    scene.add(this.mesh);
  }
  collect() {
    scene.remove(this.mesh);
  }
}
function spawnPickup(type, pos){
  const p = new Pickup(type, pos);
  pickups.push(p);
}

const enemies = [];
function spawnEnemy(pos) {
  const e = new Enemy(pos);
  enemies.push(e);
}

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize(); // this ensures consistent movements in all directions

  if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
  if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);
  controls.getObject().position.y += velocity.y * delta; // new behavior

  if (controls.getObject().position.y < 10) {
    velocity.y = 0;
    controls.getObject().position.y = 10;
    canJump = true;
  }

  // update bullets
  bullets.forEach((b, index) => {
    b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
    // check collisions with enemies
    enemies.forEach(enemy => {
      if (enemy.alive && b.position.distanceTo(enemy.mesh.position) < 5) {
        enemy.kill();
        scene.remove(b);
        bullets.splice(index, 1);
      }
    });
    // remove bullets after some time or distance
    if (b.position.length() > 200) {
      scene.remove(b);
      bullets.splice(index, 1);
    }
  });

  // check pickups
  pickups.forEach((p, idx) => {
    if (controls.getObject().position.distanceTo(p.mesh.position) < 5) {
      if (p.type === "health") {
        health = Math.min(100, health + 25);
        healthValue.textContent = Math.floor(health);
      } else {
        ammo += 10;
        ammoValue.textContent = ammo;
      }
      p.collect();
      pickups.splice(idx,1);
    }
  });
  // update enemies
  enemies.forEach(enemy => enemy.update(delta));

  prevTime = time;
  renderer.render(scene, camera);
}

# FPS Prototype Project

This repository contains example Unity scripts and setup instructions for creating a small first-person shooter prototype. It includes modular components for player movement, weapon handling, and basic environment setup.

## Getting Started
1. Create a new **Unity** project using the Built-in Render Pipeline or URP.
2. Copy the `Assets` directory from this repository into your new project.
3. Add placeholder models and textures for the player weapon and environment objects (e.g., crates, barrels, fences). Any free high-quality assets from the Unity Asset Store will work.
4. Open the scene provided or create a new one with simple level geometry: floors, walls, and obstacles that match your chosen theme (military base, urban warzone, or sci-fi facility).
5. Attach the scripts in `Assets/Scripts` to appropriate GameObjects as described below.

## Scripts Overview
* **PlayerMovement.cs** – Handles walking, running, jumping, and mouse-look using Unity's `CharacterController` component.
* **WeaponController.cs** – Manages firing input, ammo count, reloading, muzzle flash, and gunshot audio.
* **BulletImpact.cs** – Processes hit detection via raycasts, spawns hit particles or decals, and applies damage to targets.

These scripts are written in a modular way so that additional features, such as enemy AI, UI elements, or multiplayer functionality, can be incorporated later.

## Usage
1. Create an empty GameObject named `Player` and add a `CharacterController` component.
2. Add a child `Camera` object to handle first-person view.
3. Attach `PlayerMovement` to the `Player` object and configure movement speeds and jump force in the Inspector.
4. Create a weapon prefab (e.g., pistol or rifle) and position it as a child of the Camera to appear in first person.
5. Attach `WeaponController` to the weapon prefab. Assign muzzle-flash particles, firing sounds, and bullet impact effects.
6. Place some simple target objects in the environment and give them colliders and tag them as "Target" for damage testing.
7. Play the scene to test smooth movement, firing, and basic hit reactions.

This setup provides a solid foundation for a first-person shooter prototype. You can expand on it by adding UI for health and ammo, enemy AI, additional weapon types, or networked multiplayer components.

## Scene Setup
1. Create a new scene and add a few static meshes to represent floors, walls, and obstacles. Unity's built-in primitives (cubes, planes) work well for early testing.
2. Place crates, barrels, or other decorative objects around the map to add depth. These can be simple placeholder models.
3. Add light sources (directional or point lights) to illuminate the scene, and assign a skybox or interior lighting depending on your chosen theme.
4. Add an `Audio Source` to the scene for ambient sound loops that match your environment (e.g., outdoor wind, machinery hum, or sci-fi ambiance).
5. Optionally bake lighting to achieve smoother shadows and performance in static areas.

By following these steps and using the included scripts, you will have a basic FPS sandbox environment ready for further expansion.

## Web Version
A simple browser-based demo is provided in `index.html`. Open this file in any modern WebGL-enabled browser. Use `WASD` to move, the mouse to look around, and click to shoot.
Reload with `R` when you run out of ammo. Targets are red cubes that can be destroyed.
For the pointer lock controls to work correctly, you may need to serve the file via a local web server (e.g., `npx serve`).

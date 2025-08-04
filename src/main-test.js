console.log('Loading test main.js...');

import * as THREE from 'three';

console.log('THREE.js loaded:', THREE);

// Simple test - create a basic scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });

renderer.setSize(window.innerWidth, window.innerHeight);

// Create a simple cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

console.log('Basic scene created, starting render loop...');

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

window.addEventListener('load', () => {
    console.log('Window loaded, starting animation...');
    animate();
});

console.log('Test main.js loaded successfully');
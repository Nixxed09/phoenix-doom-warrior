// Script to generate PWA icons
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const sizes = [48, 72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(process.cwd(), 'public');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate icon for each size
sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(0, 0, size, size);
  
  // Draw doom-style icon
  ctx.fillStyle = '#FFD700';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('D', size / 2, size / 2);
  
  // Add some detail
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  
  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, `icon-${size}.png`), buffer);
  console.log(`Generated icon-${size}.png`);
});

// Generate additional icons for close/check actions
const actionIcons = [
  { name: 'icon-check.png', symbol: '✓', color: '#00FF00' },
  { name: 'icon-close.png', symbol: '✕', color: '#FF0000' }
];

actionIcons.forEach(({ name, symbol, color }) => {
  const canvas = createCanvas(96, 96);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 96, 96);
  
  ctx.fillStyle = color;
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, 48, 48);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, name), buffer);
  console.log(`Generated ${name}`);
});

// Generate screenshots placeholder
const screenshotSizes = [
  { width: 1920, height: 1080, name: 'screenshot-1.png' },
  { width: 1920, height: 1080, name: 'screenshot-2.png' }
];

screenshotSizes.forEach(({ width, height, name }) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Dark background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  
  // Add some game-like elements
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(0, height - 200, width, 200);
  
  // HUD mockup
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px monospace';
  ctx.fillText('HEALTH: 100', 50, height - 100);
  ctx.fillText('AMMO: 50', 400, height - 100);
  ctx.fillText('ARMOR: 50', 700, height - 100);
  
  // Game title
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FF0000';
  ctx.fillText('PHOENIX DOOM WARRIOR', width / 2, height / 2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, name), buffer);
  console.log(`Generated ${name}`);
});

console.log('Icon generation complete!');
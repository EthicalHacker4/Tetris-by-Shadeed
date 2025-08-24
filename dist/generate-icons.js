// This is a placeholder for the icon generation script
// You can replace these with your actual game icons
// For now, we'll create simple placeholder icons

const fs = require('fs');
const { createCanvas } = require('canvas');

// Create 192x192 icon
const size192 = 192;
const canvas192 = createCanvas(size192, size192);
const ctx192 = canvas192.getContext('2d');

// Draw a simple Tetris block
ctx192.fillStyle = '#FF5252';
ctx192.fillRect(0, 0, size192, size192);
ctx192.fillStyle = '#FFFFFF';
ctx192.font = 'bold 100px Arial';
ctx192.textAlign = 'center';
ctx192.textBaseline = 'middle';
ctx192.fillText('T', size192 / 2, size192 / 2);

// Save the icon
const buffer192 = canvas192.toBuffer('image/png');
fs.writeFileSync('public/icon-192x192.png', buffer192);

// Create 512x512 icon
const size512 = 512;
const canvas512 = createCanvas(size512, size512);
const ctx512 = canvas512.getContext('2d');

// Draw a simple Tetris block
ctx512.fillStyle = '#FF5252';
ctx512.fillRect(0, 0, size512, size512);
ctx512.fillStyle = '#FFFFFF';
ctx512.font = 'bold 270px Arial';
ctx512.textAlign = 'center';
ctx512.textBaseline = 'middle';
ctx512.fillText('T', size512 / 2, size512 / 2);

// Save the icon
const buffer512 = canvas512.toBuffer('image/png');
fs.writeFileSync('public/icon-512x512.png', buffer512);

console.log('Icons generated successfully!');

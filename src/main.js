// Akira Shemansky
// Created: May 2024
// Phaser: 3.70.0
//
// Game 2b - Gallery Shooter
//
// Gallery shooter for CMPM 120
// 
// Art & sound assets from Kenny Assets:
// https://kenney.nl/assets/pixel-shmup
// https://kenney.nl/assets/tiny-ski
// https://kenney.nl/assets/impact-sounds

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    fps: {
        forceSetTimeOut: true,
        target: 30
    },
    width: 1248,
    height: 720,
    scene: [Title, Level]
}

const game = new Phaser.Game(config);
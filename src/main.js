import './style.css';
import PowerPointScene from './scenes/PowerPointScene';
import ClassroomScene from './scenes/ClassroomScene';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#ecf0f1',
    parent: 'game-container',
    scene: [PowerPointScene, ClassroomScene]
};

const game = new Phaser.Game(config);
window.phaserGameInstance = game;

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

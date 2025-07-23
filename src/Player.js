import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Sprite {
    static registerAnimations(scene) {
        if (scene.anims.exists('walk-down')) return;
        scene.anims.create({
            key: 'walk-down',
            frames: scene.anims.generateFrameNumbers('player', { frames: [2, 3] }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: 'walk-up',
            frames: scene.anims.generateFrameNumbers('player', { frames: [6, 7] }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: 'walk-left',
            frames: scene.anims.generateFrameNumbers('player', { frames: [10, 11] }),
            frameRate: 8,
            repeat: -1
        });
        scene.anims.create({
            key: 'walk-right',
            frames: scene.anims.generateFrameNumbers('player', { frames: [14, 15] }),
            frameRate: 8,
            repeat: -1
        });
    }

    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        this.setScale(2.5);
        this.lastDirection = 'down';
        Player.registerAnimations(scene);
        this.speechBubble = null;
        this.speechBubbleTimer = null;
    }

    walkRight() {
        this.lastDirection = 'right';
        this.play('walk-right', true);
    }

    walkLeft() {
        this.lastDirection = 'left';
        this.play('walk-left', true);
    }

    walkUp() {
        this.lastDirection = 'up';
        this.play('walk-up', true);
    }

    walkDown() {
        this.lastDirection = 'down';
        this.play('walk-down', true);
    }

    stopAndFaceDown() {
        this.anims.stop();
        switch (this.lastDirection) {
            case 'left':
                this.setFrame(8);
                break;
            case 'right':
                this.setFrame(12);
                break;
            case 'up':
                this.setFrame(4);
                break;
            default:
                this.setFrame(0);
        }
    }

    static registerSpeechBubbles(scene, player, messages = null) {
        const defaultMessages = [
            'Hello Everyone!',
            'Welcome!',
            "Let's get started!",
            'Any questions?',
            'Nope! I am a asset from the Sprout Lands asset pack on itch.io.',
            'Butts'
        ];
        const msgArr = messages || defaultMessages;
        // Remove any previous listeners (optional, for robustness)
        if (!scene._playerSpeechKeys) scene._playerSpeechKeys = [];
        scene._playerSpeechKeys.forEach(key => key.off('down'));
        scene._playerSpeechKeys = [];
        // Use correct Phaser KeyCodes for number keys
        const keyNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'];
        keyNames.forEach((keyName, idx) => {
            const key = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[keyName]);
            key.on('down', () => {
                if (player && player.showSpeechBubble) {
                    player.showSpeechBubble(idx + 1, msgArr);
                }
            });
            scene._playerSpeechKeys.push(key);
        });
    }

    showSpeechBubble(num, messages = null) {
        // Remove old bubble if exists
        if (this.speechBubble) { this.speechBubble.destroy(); this.speechBubble = null; }
        if (this.speechBubbleTimer) { this.speechBubbleTimer.remove(false); this.speechBubbleTimer = null; }
        const defaultMessages = [
            'Hello Everyone!',
            'Welcome!',
            "Let's get started!",
            'Any questions?',
            'Nope! I am a asset from the Sprout Lands asset pack on itch.io.',
            'Butts'
        ];
        const msgArr = messages || defaultMessages;
        const text = msgArr[num - 1] || '';
        const bubbleWidth = 320, bubbleHeight = 80;
        const bubble = this.scene.add.graphics();
        bubble.fillStyle(0xffffff, 1);
        bubble.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, 16);
        bubble.lineStyle(2, 0x222222, 1);
        bubble.strokeRoundedRect(0, 0, bubbleWidth, bubbleHeight, 16);
        bubble.fillTriangle(
            bubbleWidth / 2 - 10, bubbleHeight,
            bubbleWidth / 2 + 10, bubbleHeight,
            bubbleWidth / 2, bubbleHeight + 16
        );
        const bubbleText = this.scene.add.text(bubbleWidth / 2, bubbleHeight / 2, text, {
            fontSize: '18px', color: '#222', fontFamily: 'Arial',
            wordWrap: { width: bubbleWidth - 30 }
        }).setOrigin(0.5);
        // Position the speech bubble relative to the player
        this.speechBubble = this.scene.add.container(this.x - bubbleWidth / 2, this.y - bubbleHeight - 30, [bubble, bubbleText]).setDepth(10);
        this.speechBubbleTimer = this.scene.time.delayedCall(2000, () => {
            if (this.speechBubble) { this.speechBubble.destroy(); this.speechBubble = null; }
        });
    }
}

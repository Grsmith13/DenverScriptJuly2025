import Phaser from 'phaser';
import Player from '../Player';

export default class PowerPointScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PowerPointScene' });
        this.player = null;
        this.cursors = null;
        this.characterAppeared = false;
        this.speechBubble = null;
        this.speechBubbleTimer = null;
        this.playerWalkingIn = false;
    }

    preload() {
        this.load.image('slide1', 'assets/Slide1.jpg');
        this.load.spritesheet('player', 'assets/Basic_Character_Spritesheet.png', {
            frameWidth: 48,
            frameHeight: 48
        });
    }

    create() {
        this.bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'slide1')
            .setDisplaySize(this.scale.width, this.scale.height)
            .setDepth(-1);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.characterAppeared) {
                this.summonCharacter();
            }
        });
        this.scale.on('resize', this.resize, this);
    }

    resize(gameSize) {
        if (this.bg) {
            this.bg.setPosition(gameSize.width / 2, gameSize.height / 2);
            this.bg.setDisplaySize(gameSize.width, gameSize.height);
        }
    }

    summonCharacter() {
        if (this.characterAppeared) return;
        this.characterAppeared = true;
        this.playerWalkingIn = true;
        if (this.player) this.player.destroy();
        this.player = new Player(this, -50, this.scale.height / 2);
        this.player.walkRight();
        // Register number key speech bubbles for this player
        Player.registerSpeechBubbles(this, this.player);
        this.tweens.add({
            targets: this.player,
            x: this.scale.width / 2,
            duration: 3500,
            ease: 'Sine.easeOut',
            onUpdate: () => {
                if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'walk-right') {
                    this.player.walkRight();
                }
            },
            onComplete: () => {
                this.player.x = this.scale.width / 2;
                this.player.stopAndFaceDown();
                this.playerWalkingIn = false;
            }
        });
    }

    showSpeechBubble(num) {
        if (!this.player) return;
        if (this.speechBubble) this.speechBubble.destroy();
        if (this.speechBubbleTimer) this.speechBubbleTimer.remove(false);
        const messages = [
            'Hello!',
            'Welcome!',
            'Let\'s get started!',
            'Any questions?',
            'Thank you!'
        ];
        const text = messages[num - 1] || '';
        const bubbleWidth = 160, bubbleHeight = 50;
        const bubble = this.add.graphics();
        bubble.fillStyle(0xffffff, 1);
        bubble.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, 16);
        bubble.lineStyle(2, 0x222222, 1);
        bubble.strokeRoundedRect(0, 0, bubbleWidth, bubbleHeight, 16);
        bubble.fillTriangle(
            bubbleWidth / 2 - 10, bubbleHeight,
            bubbleWidth / 2 + 10, bubbleHeight,
            bubbleWidth / 2, bubbleHeight + 16
        );
        const bubbleText = this.add.text(bubbleWidth / 2, bubbleHeight / 2, text, {
            fontSize: '18px', color: '#222', fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.speechBubble = this.add.container(this.player.x, this.player.y - 60, [bubble, bubbleText]).setDepth(10);
        this.speechBubbleTimer = this.time.delayedCall(2000, () => {
            if (this.speechBubble) this.speechBubble.destroy();
        });
    }

    update() {
        if (this.player && this.characterAppeared && !this.playerWalkingIn) {
            const speed = 3;
            let moving = false;
            if (this.cursors.left.isDown) {
                this.player.x -= speed;
                this.player.walkLeft();
                moving = true;
                if (this.player.x <= 10) {
                    this.scene.start('ClassroomScene');
                }
            } else if (this.cursors.right.isDown) {
                this.player.x = Math.min(this.player.x + speed, this.scale.width - 10);
                this.player.walkRight();
                moving = true;
            }
            if (this.cursors.up.isDown) {
                this.player.y = Math.max(this.player.y - speed, 30);
                this.player.walkUp();
                moving = true;
            } else if (this.cursors.down.isDown) {
                this.player.y = Math.min(this.player.y + speed, this.scale.height - 30);
                this.player.walkDown();
                moving = true;
            }
            if (!moving) {
                this.player.stopAndFaceDown();
            }
        }
        if (this.speechBubble && this.player) {
            this.speechBubble.x = this.player.x;
            this.speechBubble.y = this.player.y - 60;
        }
    }
}

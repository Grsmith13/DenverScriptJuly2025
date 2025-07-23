import Phaser from 'phaser';
import Player from '../Player';

export default class ClassroomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClassroomScene' });
        this.player = null;
        this.cursors = null;
        this.whiteboard = null;
        this.whiteboardFullscreen = false;
        this.currentSlide = 0;
        this.slideTexts = [];
        this.slideBgImage = null;
    }

    preload() {
        // Preload all slide backgrounds (now 1 through 7)
        for (let i = 1; i <= 7; i++) {
            this.load.image(`slidebg${i}`, `assets/Slide${i}.jpg`);
        }
        // Preload chair image with correct path and key
        this.load.image('chair', 'assets/Sprite-audience.png');
        // Preload Code talent banner with correct path
        this.load.image('banner', 'assets/CodeTalent_banner.png');
        // Preload player spritesheet for Homestuck event
        this.load.spritesheet('player', 'assets/Basic_Character_Spritesheet.png', {
            frameWidth: 48,
            frameHeight: 48
        });
    }

    create() {
        // Simulate gray wood floor (bottom 2/3 of screen)
        const floorY = this.scale.height * 0.33;
        const floorHeight = this.scale.height * 0.67;
        const floor = this.add.graphics();
        // Draw planks as alternating gray rectangles
        const plankCount = 12;
        const plankH = floorHeight / plankCount;
        for (let i = 0; i < plankCount; i++) {
            const color = (i % 2 === 0) ? 0x888888 : 0xA0A0A0;
            floor.fillStyle(color, 1);
            floor.fillRect(0, floorY + i * plankH, this.scale.width, plankH);
        }
        // Simulate white brick wall (top 1/3 of screen)
        const wall = this.add.graphics();
        wall.fillStyle(0xffffff, 1);
        wall.fillRect(0, 0, this.scale.width, floorY);
        // Draw brick lines
        const brickH = 22, brickW = 80;
        for (let y = 0; y < floorY; y += brickH) {
            wall.lineStyle(1, 0xe0e0e0, 1);
            wall.beginPath();
            wall.moveTo(0, y);
            wall.lineTo(this.scale.width, y);
            wall.strokePath();
            // Staggered vertical lines for bricks
            for (let x = (y / brickH) % 2 === 0 ? 0 : brickW / 2; x < this.scale.width; x += brickW) {
                wall.beginPath();
                wall.moveTo(x, y);
                wall.lineTo(x, y + brickH);
                wall.strokePath();
            }
        }
        // Centralized classroom layout: whiteboard behind teacher, smaller seats
        const centerX = this.scale.width * 0.5;
        const centerY = this.scale.height * 0.5;
        // Whiteboard (centered at top, behind teacher, bigger)
        this.whiteboard = this.add.container(centerX, centerY - this.scale.height * 0.22);
        this.slideBgImage = this.add.image(0, 0, 'slidebg1')
            .setDisplaySize(this.scale.width * 0.45, this.scale.height * 0.36)
            .setOrigin(0.5);
        const boardFrame = this.add.rectangle(0, 0, this.scale.width * 0.45, this.scale.height * 0.36)
            .setStrokeStyle(6, 0x424242)
            .setFillStyle();
        this.whiteboard.add([this.slideBgImage, boardFrame]);
        this.createSlideContent();
        boardFrame.setInteractive();
        boardFrame.on('pointerdown', () => {
            this.toggleWhiteboard();
        });
        // Speaker desk (make it look more like a desk: add legs and a top)
        const deskX = centerX;
        const deskY = centerY - this.scale.height * 0.01;
        const deskW = this.scale.width * 0.10;
        const deskH = this.scale.height * 0.04;
        // Desk top
        const deskTop = this.add.rectangle(deskX, deskY - deskH * 0.2, deskW, deskH * 0.4, 0xA67C52).setDepth(1);
        // Desk body
        const deskBody = this.add.rectangle(deskX, deskY + deskH * 0.15, deskW * 0.92, deskH * 0.8, 0x795548).setDepth(1);
        // Desk legs
        const legW = deskW * 0.12;
        const legH = deskH * 0.7;
        this.add.rectangle(deskX - deskW * 0.35, deskY + deskH * 0.6, legW, legH, 0x4E342E).setDepth(1);
        this.add.rectangle(deskX + deskW * 0.35, deskY + deskH * 0.6, legW, legH, 0x4E342E).setDepth(1);
        // Teacher (player) in front of desk
        this.player = new Player(this, centerX, centerY + this.scale.height * 0.03);
        Player.registerSpeechBubbles(this, this.player);
        // Move audience farther away from the desk
        const audienceStartY = centerY + this.scale.height * 0.13; // was 0.04, now farther down
        const chairW = this.scale.width * 0.045;
        const chairH = this.scale.height * 0.05;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const x = centerX - this.scale.width * 0.13 + col * this.scale.width * 0.09;
                const y = audienceStartY + row * this.scale.height * 0.09;
                this.add.image(x, y, 'chair').setDisplaySize(chairW, chairH).setOrigin(0.5);
            }
        }
        // Add Code talent banner at the top, smaller and to the right
        const banner = this.add.image(
            this.scale.width * 0.87, // move to the right
            this.scale.height * 0.16, // a bit lower for balance
            'banner'
        )
            .setDisplaySize(this.scale.width * 0.25, this.scale.height * 0.08)
            .setOrigin(0.5);    
        this.cursors = this.input.keyboard.createCursorKeys();
        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setLerp(0.1, 0.1);
        this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.nineKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NINE);  // Adds the 9 key to activate the Homestuck event
        this.nineEventStarted = false;
        this.homestuckActive = false;
        this.playerWalkingIn = false;
        this.nineKey.on('down', () => {
            if (!this.nineEventStarted) {
                this.nineEventStarted = true;
                this.time.delayedCall(9000, () => this.startHomestuckEvent());
            }
        });
        this.qKey.on('down', () => {
            this.previousSlide();
        });
        this.eKey.on('down', () => {
            this.nextSlide();
        });
    }

    createSlideContent() {
        // Only update the background image for this slide (slide index + 1)
        if (this.slideBgImage) {
            this.slideBgImage.setTexture(`slidebg${this.currentSlide + 1}`);
        }
        // Remove any text or other content from the whiteboard
        if (this.slideTexts.length) {
            this.slideTexts.forEach(t => t.destroy());
            this.slideTexts = [];
        }
        // Optionally, remove slideHint and slideCounter if you want a pure image
        if (this.slideHint) { this.slideHint.destroy(); this.slideHint = null; }
        if (this.slideCounter) { this.slideCounter.destroy(); this.slideCounter = null; }
    }

    toggleWhiteboard() {
        // Store original values on first toggle
        if (!this._whiteboardOriginal) {
            this._whiteboardOriginal = {
                scaleX: 1,
                scaleY: 1,
                x: this.scale.width * 0.5,
                y: this.scale.height * 0.5 - this.scale.height * 0.22,
                imgW: this.slideBgImage.displayWidth,
                imgH: this.slideBgImage.displayHeight,
                frameW: this.whiteboard.list[1].width,
                frameH: this.whiteboard.list[1].height
            };
        }
        const orig = this._whiteboardOriginal;
        const boardFrame = this.whiteboard.list[1];
        if (!this.whiteboardFullscreen) {
            this.whiteboard.setDepth(1000); // Bring whiteboard to front
            this.tweens.add({
                targets: this.whiteboard,
                scaleX: 1,
                scaleY: 1,
                x: this.scale.width / 2,
                y: this.scale.height / 2,
                duration: 300,
                ease: 'Power2',
                onUpdate: () => {
                    this.slideBgImage.setDisplaySize(this.scale.width, this.scale.height);
                    boardFrame.width = this.scale.width;
                    boardFrame.height = this.scale.height;
                },
                onComplete: () => {
                    this.slideBgImage.setDisplaySize(this.scale.width, this.scale.height);
                    boardFrame.width = this.scale.width;
                    boardFrame.height = this.scale.height;
                    boardFrame.visible = false;
                    boardFrame.disableInteractive();
                    this.whiteboard.setInteractive(new Phaser.Geom.Rectangle(-this.scale.width/2, -this.scale.height/2, this.scale.width, this.scale.height), Phaser.Geom.Rectangle.Contains);
                    this.whiteboard.once('pointerdown', () => this.toggleWhiteboard());
                }
            });
            boardFrame.visible = false;
            boardFrame.disableInteractive();
            this.whiteboardFullscreen = true;
        } else {
            this.tweens.add({
                targets: this.whiteboard,
                scaleX: orig.scaleX,
                scaleY: orig.scaleY,
                x: orig.x,
                y: orig.y,
                duration: 300,
                ease: 'Power2',
                onUpdate: () => {
                    this.slideBgImage.setDisplaySize(orig.imgW, orig.imgH);
                    boardFrame.width = orig.frameW;
                    boardFrame.height = orig.frameH;
                },
                onComplete: () => {
                    this.whiteboard.setDepth(0); // Reset depth
                    this.slideBgImage.setDisplaySize(orig.imgW, orig.imgH);
                    boardFrame.width = orig.frameW;
                    boardFrame.height = orig.frameH;
                    boardFrame.visible = true;
                    boardFrame.setInteractive();
                    this.whiteboard.disableInteractive();
                }
            });
            boardFrame.visible = true;
            boardFrame.setInteractive();
            this.whiteboard.disableInteractive();
            this.whiteboardFullscreen = false;
        }
    }

    previousSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.createSlideContent();
        }
    }

    nextSlide() {
        if (this.currentSlide < 6) { // 0-based, so 6 = slide 7
            this.currentSlide++;
            this.createSlideContent();
        }
    }

    // Add PowerPoint-style Homestuck event to ClassroomScene
    startHomestuckEvent() {
        if (!this.player) return;
        this.homestuckActive = true;
        this.showHomestuckSpeech();
        this.nineKey.once('down', () => {
            this.homestuckActive = false;
            if (this.player) this.player.stopAndFaceDown();
            if (this.speechBubble) this.speechBubble.destroy();
        });
        this.time.delayedCall(6000, () => this.showHomestuckSpeech2());
        this.time.delayedCall(12000, () => this.showHomestuckSpeech3());
         this.time.delayedCall(18000, () => this.showHomestuckSpeech4());
    }

    showHomestuckSpeech() {
        this._showHomestuckBubble('Hi everyone! while Gage is getting a drink I will be filling in for him.');
    }

    showHomestuckSpeech2() {
        this._showHomestuckBubble('To me the magic of game development is how you can do so much with so little.'); 
    }
    showHomestuckSpeech3() {
        this._showHomestuckBubble('For instance, it could be something so simple as a little script that talks while you get a drink.'); 
    }

       showHomestuckSpeech4() {
        this._showHomestuckBubble('No problem!'); 
        // Destroy the bubble after 2 seconds
        this.time.delayedCall(2000, () => {
            if (this.speechBubble) this.speechBubble.destroy();
            this.speechBubble = null;
        });
    }
    _showHomestuckBubble(text) {
        if (this.speechBubble) this.speechBubble.destroy();
        if (this.speechBubbleTimer) this.speechBubbleTimer.remove(false);
        const bubbleWidth = 420, bubbleHeight = 70;
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
            fontSize: '18px', color: '#222', fontFamily: 'Arial', wordWrap: { width: bubbleWidth - 30 }
        }).setOrigin(0.5);
        // Add the bubble to the scene, not to the player
        this.speechBubble = this.add.container(0, 0, [bubble, bubbleText]);
        this.speechBubble.setSize(bubbleWidth, bubbleHeight + 16);
        this.speechBubble.setDepth(10);
        this.speechBubbleWidth = bubbleWidth;
        this.speechBubbleHeight = bubbleHeight + 16;
        // Position will be updated in update()
    }

    update() {
        if (this.player) {
            const speed = 3;
            let moving = false;
            if (this.cursors.left.isDown) {
                this.player.x = Math.max(this.player.x - speed, 20);
                this.player.walkLeft();
                moving = true;
            } else if (this.cursors.right.isDown) {
                this.player.x = Math.min(this.player.x + speed, this.scale.width - 20);
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
            // If Homestuck speech bubble is active, keep it above the player, centered
            if (this.speechBubble && this.homestuckActive) {
                this.speechBubble.x = this.player.x - (this.speechBubbleWidth / 2);
                // Lower the bubble closer to the player's head
                this.speechBubble.y = this.player.y - this.player.displayHeight / 2 - this.speechBubbleHeight + 30;
            }
        }
        // No need to manually update speechBubble.x/y if attached to player
    }
}

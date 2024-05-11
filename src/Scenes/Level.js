class Level extends Phaser.Scene {
    constructor() {
        super("level");

        this.my = {sprites: {}, text: {}};

        this.my.sprites.playerBullets = [];
        this.my.sprites.enemyBullets = [];
        this.maxBullets = 10;
        this.bulletCooldown = 5;
        this.bulletCooldownCounter = 0;

        this.lives = 3;
        this.score = 0;
        this.wave = 0;

        this.waveConfig = [ // config for each wave; provides x,y coordinates for each ship
            {enemyStrong: [
                [900, 360],
                [900, 260],
                [900, 460],
                [1000, 160],
                [1000, 560]
            ], enemyFast: [
                [1100, 310],
                [1100, 410]
            ]},
            {enemyStrong: 6, enemyFast: 4}
        ];

        this.playerSpeed = 10;
        this.bulletSpeed = 12;
    }

    preload() {}

    create() {
        let my = this.my;

        my.sprites.background = this.add.sprite(game.config.width/2, game.config.height/2, "tiles", "sky.png",);
        my.sprites.background.scale = 80;

        // create UI
        my.text.lives = this.add.bitmapText(0, game.config.height, "tinyText", "RRR", 48).setOrigin(0, 1);
        my.text.score = this.add.bitmapText(0, 0, "pixelNums", String(this.score).padStart(7, "0"), 48);
        my.text.wave = this.add.bitmapText(game.config.width, 0, "tinyText", "wave " + this.wave, 48).setOrigin(1, 0)

        // create player
        my.sprites.player = this.add.sprite(100, game.config.height/2, "ships", "red_small.png");
        my.sprites.player.scale = 3;
        my.sprites.player.angle = 90;

        // create enemy groups
        my.sprites.enemyStrongGroup = this.add.group({
            defaultKey: "ships",
            defaultFrame: "blue_medium.png",
            maxSize: 10,
            createMultipleCallback: function(enemies) {
                for (let enemy of enemies) {
                    enemy.scale = 3;
                    enemy.angle = -90;
                    enemy.hp = 2;
                }
            }
        })
        my.sprites.enemyFastGroup = this.add.group({
            defaultKey: "ships",
            defaultFrame: "grayC_small.png",
            maxSize: 10,
            createMultipleCallback: function(enemies) {
                for (let enemy of enemies) {
                    enemy.scale = 3;
                    enemy.angle = -90;
                    enemy.hp = 1;
                }
            }
        })

        // create enemies
        my.sprites.enemyStrongGroup.createMultiple({
            active: false,
            visible: false,
            key: my.sprites.enemyStrongGroup.defaultKey,
            frame: my.sprites.enemyStrongGroup.defaultFrame,
            repeat: my.sprites.enemyStrongGroup.maxSize-1
        })
        my.sprites.enemyFastGroup.createMultiple({
            active: false,
            visible: false,
            key: my.sprites.enemyFastGroup.defaultKey,
            frame: my.sprites.enemyFastGroup.defaultFrame,
            repeat: my.sprites.enemyFastGroup.maxSize-1
        })

        // create bullets for player & enemies
        for (let i=0; i<this.maxBullets; i++) {
            my.sprites.playerBullets.push(this.add.sprite(-100, -100, "tiles", "bullet.png"));
            my.sprites.playerBullets[i].scale = 3;
            my.sprites.playerBullets[i].angle = 90;
            my.sprites.playerBullets[i].visible = false;

            my.sprites.enemyBullets.push(this.add.sprite(-100, -100, "tiles", "bullet.png"));
            my.sprites.enemyBullets[i].scale = 3;
            my.sprites.enemyBullets[i].angle = -90;
            my.sprites.enemyBullets[i].visible = false;
        } // TODO: convert bullets from arrays to Phaser groups

        // create animations
        this.anims.create({
            key: "explosion",
            frames: [
                {key: "tiles", frame: "explosion1.png"},
                {key: "tiles", frame: "explosion2.png"},
                {key: "tiles", frame: "explosion3.png"},
                {key: "tiles", frame: "dust.png"}
            ],
            frameRate: 12,
            hideOnComplete: true
        })
        this.anims.create({
            key: "shortExplosion",
            frames: [
                {key: "tiles", frame: "explosion3.png"},
                {key: "tiles", frame: "dust.png"}
            ],
            frameRate: 12,
            hideOnComplete: true
        })

        // create key objects
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        let my = this.my;
        if (this.bulletCooldownCounter > 0) this.bulletCooldownCounter--;

        // begin next wave if there are no active enemies
        if (my.sprites.enemyStrongGroup.countActive() + my.sprites.enemyFastGroup.countActive() == 0) {
            this.initWave(this.wave + 1);
        }

        // move up
        if (this.keyW.isDown) {
            if (my.sprites.player.y > 96) my.sprites.player.y -= this.playerSpeed;
        }

        // move down
        if (this.keyS.isDown) {
            if (my.sprites.player.y < game.config.height-96) my.sprites.player.y += this.playerSpeed;
        }

        // fire bullet
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            if (this.bulletCooldownCounter <= 0) {
                for(let bullet of my.sprites.playerBullets) {
                    if (!bullet.visible) {
                        bullet.x = my.sprites.player.x + (bullet.displayWidth/2);
                        bullet.y = my.sprites.player.y;
                        bullet.visible = true;
                        this.bulletCooldownCounter = this.bulletCooldown;
                        break;
                    }
                }
            }
        }

        // enemy movement
        // TODO

        // player bullet movement & collision
        for (let bullet of my.sprites.playerBullets) {
            if (bullet.visible) {
                bullet.x += this.bulletSpeed;

                for (let enemy of my.sprites.enemyStrongGroup.getMatching("active", true)) {
                    if (this.collides(bullet, enemy)) {
                        enemy.hp--;
                        this.score += 25;
                        this.updateText();

                        if (enemy.hp <= 0) {
                            enemy.active = false;
                            enemy.visible = false;
                            enemy.hp = 2;
                        }
                    }
                }
            }

            // deactivate offscreen bullets for reuse
            if (bullet.x > (game.config.width + (bullet.displayWidth/2))) {
                bullet.visible = false;
            }
        }

        // enemy bullet movement & collision
        for (let bullet of my.sprites.enemyBullets) {
            if (bullet.visible) {
                bullet.x -= this.bulletSpeed;
            }

            // deactivate offscreen bullets for reuse
            if (bullet.x < (bullet.displayWidth/2)) {
                bullet.visible = false;
            }
        }

        // background movement
        // TODO
    }

    // center-radius AABB collision check, modified from Jim Whitehead's function in https://github.com/JimWhiteheadUCSC/BulletTime
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/4 + b.displayWidth/4)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/4 + b.displayHeight/4)) return false;
        return true;
    }

    updateText() {
        let text = this.my.text;

        text.lives.setText("R".repeat(this.lives));
        text.score.setText(String(this.score).padStart(7, "0"));
    }

    // initializes enemies for the next wave
    initWave(wave) {
        let spr = this.my.sprites;
        const fig = this.waveConfig[wave-1];

        // activate enemies and arrange them as specified in the wave config
        for (let i=0; i<fig.enemyStrong.length; i++) {
            let enemy = spr.enemyStrongGroup.getFirstDead();
            if (enemy == null) break;

            enemy.active = true;
            enemy.visible = true;
            enemy.x = fig.enemyStrong[i][0];
            enemy.y = fig.enemyStrong[i][1];
        }
        for (let i=0; i<fig.enemyFast.length; i++) {
            let enemy = spr.enemyFastGroup.getFirstDead();
            if (enemy == null) break;

            enemy.active = true;
            enemy.visible = true;
            enemy.x = fig.enemyFast[i][0];
            enemy.y = fig.enemyFast[i][1];
        }

        this.my.text.wave.setText("wave: " + wave);
    }
}
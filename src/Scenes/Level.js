class Level extends Phaser.Scene {
    constructor() {
        super("level");

        this.my = {sprites: {}, text: {}};

        this.playerCooldown = 5;
        this.playerCooldownCounter = 0;

        this.lives = 3;
        this.score = 0;
        this.wave = 1;

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
            ], shotCooldown: {
                strong: 60,
                fast: 30
            }},
            {enemyStrong: [
                [900, 360],
                [900, 260],
                [900, 460],
                [1000, 160],
                [1000, 560]
            ], enemyFast: [
                [1100, 310],
                [1100, 410]
            ], shotCooldown: {
                strong: 60,
                fast: 30
            }}
        ];
        this.shotCooldownCounter = {strong: -1, fast: -1}; // cooldown conter for enemy bullets

        this.playerSpeed = 10;
        this.bulletSpeed = 12;
        this.enemyVelocity = {strong: 5, fast: 12};

        this.pauseCounter = -1;
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

        // create bullet groups for player & enemies
        my.sprites.playerBulletGroup = this.add.group({
            defaultKey: "tiles",
            defaultFrame: "bullet.png",
            maxSize: 10,
            createMultipleCallback: function(bullets) {
                for (let bullet of bullets) {
                    bullet.scale = 3;
                    bullet.angle = 90;
                }
            }
        })
        my.sprites.enemyBulletGroup = this.add.group({
            defaultKey: "tiles",
            defaultFrame: "bullet.png",
            maxSize: 10,
            createMultipleCallback: function(bullets) {
                for (let bullet of bullets) {
                    bullet.scale = 3;
                    bullet.angle = -90;
                }
            }
        })

        // create bullets
        my.sprites.playerBulletGroup.createMultiple({
            active: false,
            visible: false,
            key: my.sprites.playerBulletGroup.defaultKey,
            frame: my.sprites.playerBulletGroup.defaultFrame,
            repeat: my.sprites.playerBulletGroup.maxSize-1
        })
        my.sprites.enemyBulletGroup.createMultiple({
            active: false,
            visible: false,
            key: my.sprites.enemyBulletGroup.defaultKey,
            frame: my.sprites.enemyBulletGroup.defaultFrame,
            repeat: my.sprites.enemyBulletGroup.maxSize-1
        })

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
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

        // begin initial wave
        this.initWave(this.wave);
    }

    update() {
        let my = this.my;

        // decrement counters
        if (this.playerCooldownCounter > 0) this.playerCooldownCounter--;
        if (this.shotCooldownCounter.strong > 0) this.shotCooldownCounter.strong--;
        if (this.shotCooldownCounter.fast > 0) this.shotCooldownCounter.fast--;
        if (this.pauseCounter > 0) this.pauseCounter--;

        // keep game paused between waves
        if (my.sprites.enemyStrongGroup.countActive() + my.sprites.enemyFastGroup.countActive() == 0 || !my.sprites.player.visible) {
            this.pauseCounter++;
        }

        // move up
        if (this.keyW.isDown) {
            if (my.sprites.player.y > 96 && this.pauseCounter <= 0) my.sprites.player.y -= this.playerSpeed;
        }

        // move down
        if (this.keyS.isDown) {
            if (my.sprites.player.y < game.config.height-96 && this.pauseCounter <= 0) my.sprites.player.y += this.playerSpeed;
        }

        // fire bullet
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            if (this.playerCooldownCounter <= 0 && this.pauseCounter <= 0) {
                let bullet = my.sprites.playerBulletGroup.getFirstDead();

                if (bullet != null) { // derived from https://github.com/JimWhiteheadUCSC/BulletTime
                    bullet.x = my.sprites.player.x + (bullet.displayWidth/2);
                    bullet.y = my.sprites.player.y;
                    bullet.active = true;
                    bullet.setTexture(my.sprites.playerBulletGroup.defaultKey, my.sprites.playerBulletGroup.defaultFrame);
                    bullet.visible = true;
                    this.playerCooldownCounter = this.playerCooldown;
                }
            }
        }

        // enemy movement
        if (this.pauseCounter <= 0) my.sprites.enemyStrongGroup.incY(this.enemyVelocity.strong);
        if (this.pauseCounter <= 0) my.sprites.enemyFastGroup.incY(this.enemyVelocity.fast);

        for (let enemy of my.sprites.enemyStrongGroup.getMatching("active", true)) {
            if (enemy.y <= 96 || enemy.y >= this.game.config.height-96) {
                this.enemyVelocity.strong *= -1;
                break;
            }
        }
        for (let enemy of my.sprites.enemyFastGroup.getMatching("active", true)) {
            if (enemy.y <= 96 || enemy.y >= this.game.config.height-96) {
                this.enemyVelocity.fast *= -1;
                break;
            }
        }

        // enemy attacks
        if (this.shotCooldownCounter.strong == 0 && this.pauseCounter <= 0) {
            this.shotCooldownCounter.strong = this.waveConfig[this.wave-1].shotCooldown.strong;
            let enemyList = my.sprites.enemyStrongGroup.getMatching("active", true);
            let pick = Math.floor(Math.random() * enemyList.length);

            let bullet = my.sprites.enemyBulletGroup.getFirstDead();

            if (bullet != null) { // derived from https://github.com/JimWhiteheadUCSC/BulletTime
                bullet.x = enemyList[pick].x + (bullet.displayWidth/2);
                bullet.y = enemyList[pick].y;
                bullet.active = true;
                bullet.visible = true;
            }
        }
        if (this.shotCooldownCounter.fast == 0 && this.pauseCounter <= 0) {
            this.shotCooldownCounter.fast = this.waveConfig[this.wave-1].shotCooldown.fast;
            let enemyList = my.sprites.enemyFastGroup.getMatching("active", true);
            let pick = Math.floor(Math.random() * enemyList.length);

            let bullet = my.sprites.enemyBulletGroup.getFirstDead();

            if (bullet != null) { // derived from https://github.com/JimWhiteheadUCSC/BulletTime
                bullet.x = enemyList[pick].x + (bullet.displayWidth/2);
                bullet.y = enemyList[pick].y;
                bullet.active = true;
                bullet.visible = true;
            }
        }

        // player bullet movement & collision
        for (let bullet of my.sprites.playerBulletGroup.getMatching("active", true)) {
            bullet.x += this.bulletSpeed;
            // against strong enemies
            for (let enemy of my.sprites.enemyStrongGroup.getMatching("active", true)) {
                if (this.collides(bullet, enemy)) {
                    bullet.active = false;
                    bullet.visible = false;
                    this.hitEnemy(enemy, 2);
                }
            }
            // against fast enemies
            for (let enemy of my.sprites.enemyFastGroup.getMatching("active", true)) {
                if (this.collides(bullet, enemy)) {
                    bullet.active = false;
                    bullet.visible = false;
                    this.hitEnemy(enemy, 1);
                }
            }
        }

        // enemy bullet movement & collision
        for (let bullet of my.sprites.enemyBulletGroup.getMatching("active", true)) {
            bullet.x -= this.bulletSpeed;

            if (bullet.x < 120) {
                if (this.collides(bullet, my.sprites.player)) {
                    bullet.active = false;
                    bullet.visible = false;

                    this.score -= 2;
                    this.lives -= 1;
                    if (this.score < 0) {
                        this.score = 0;
                    }
                    this.updateText();
                    if (this.lives <= 0) {
                        this.playerDeath(my.sprites.player);
                    }
                }
            }
        }

        // remove bullets if offscreen
        for (let bullet of my.sprites.playerBulletGroup.getChildren()) {
            if (bullet.x > (game.config.width + (bullet.displayWidth/2))) {
                bullet.active = false;
                bullet.visible = false;
            }
        }
        for (let bullet of my.sprites.enemyBulletGroup.getChildren()) {
            if (bullet.x < (-bullet.displayWidth/2)) {
                bullet.active = false;
                bullet.visible = false;
            }
        }

        // background movement
        // TODO

        // keep game paused if player is dead & handle game over controls
        if (!my.sprites.player.visible) {
            this.pauseCounter++;

            if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
                this.restartGame();
            }
            if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
                this.lives = 3;
                this.score = 0;
                this.wave = 1;
                this.pauseCounter = -1;
                this.scene.start("titleScreen");
            }
        }

        // keep game paused if player has won
        if (this.wave > this.waveConfig.length) {
            this.pauseCounter++;

            if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
                this.restartGame(true);
            }
            if (Phaser.Input.Keyboard.JustDown(this.keyQ)) {
                this.lives = 3;
                this.score = 0;
                this.wave = 1;
                this.pauseCounter = -1;
                this.scene.start("titleScreen");
            }
        }
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
            enemy.setTexture(this.my.sprites.enemyStrongGroup.defaultKey, this.my.sprites.enemyStrongGroup.defaultFrame);
            enemy.x = fig.enemyStrong[i][0];
            enemy.y = fig.enemyStrong[i][1];
        }
        for (let i=0; i<fig.enemyFast.length; i++) {
            let enemy = spr.enemyFastGroup.getFirstDead();
            if (enemy == null) break;

            enemy.active = true;
            enemy.visible = true;
            enemy.setTexture(this.my.sprites.enemyFastGroup.defaultKey, this.my.sprites.enemyFastGroup.defaultFrame);
            enemy.x = fig.enemyFast[i][0];
            enemy.y = fig.enemyFast[i][1];
        }

        this.shotCooldownCounter.strong = fig.shotCooldown.strong;
        this.shotCooldownCounter.fast = fig.shotCooldown.fast;
        this.enemyVelocity.strong = 5;
        this.enemyVelocity.fast = 12;
        this.my.text.wave.setText("wave: " + wave);
    }

    hitEnemy(enemy, maxHP) {
        let spr = this.my.sprites;

        enemy.hp--;
        this.score += 25;
        this.updateText();

        if (enemy.hp <= 0) {
            enemy.play("explosion");
            enemy.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                enemy.active = false;
                enemy.hp = maxHP;

                // if there are no active enemies, move to next wave
                if (spr.enemyStrongGroup.countActive() + spr.enemyFastGroup.countActive() == 0) {
                    this.wave++;

                    if (this.wave > this.waveConfig.length) { // if no more waves, win game
                        this.winGame();
                    } else {
                        // destroy bullets
                        for (let bullet of spr.playerBulletGroup.getMatching("active", true)) {
                            bullet.play("shortExplosion");
                            bullet.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                                bullet.active = false;
                            });
                        }
                        this.initWave(this.wave);
                    }
                }
            });
        }

        // set counters to pre-wave state
        if (this.my.sprites.enemyStrongGroup.countActive() + this.my.sprites.enemyFastGroup.countActive() == 0) {
            this.shotCooldownCounter.strong = -1;
            this.shotCooldownCounter.fast = -1;
            this.pauseCounter = 30;

            // destroy bullets
            for (let bullet of this.my.sprites.playerBulletGroup.getMatching("active", true)) {
                bullet.play("shortExplosion");
                bullet.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                    bullet.active = false;
                });
            }
            for (let bullet of this.my.sprites.enemyBulletGroup.getMatching("active", true)) {
                bullet.play("shortExplosion");
                bullet.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                    bullet.active = false;
                });
            }
        }
    }

    playerDeath(player) {
        this.pauseCounter = 60;
        for (let bullet of this.my.sprites.playerBulletGroup.getMatching("active", true)) {
            bullet.play("shortExplosion");
            bullet.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                bullet.active = false;
            });
        }
        for (let bullet of this.my.sprites.enemyBulletGroup.getMatching("active", true)) {
            bullet.play("shortExplosion");
            bullet.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                bullet.active = false;
            });
        }
        player.play("explosion");
        player.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.my.text.wave.setText("game over");
            this.my.text.lives.setText("B r: restart B q: quit B");
        });
    }

    restartGame(ngPlus=false) {
        let my = this.my;

        // reset variables
        if (!ngPlus) {
            this.lives = 3;
            this.score = 0;
        }
        this.wave = 1;

        // clear enemies for recreation
        for (let enemy of my.sprites.enemyStrongGroup.getMatching("active", true)) {
            enemy.play("shortExplosion");
            enemy.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                enemy.active = false;
                enemy.destroy();
            });
        }
        for (let enemy of my.sprites.enemyFastGroup.getMatching("active", true)) {
            enemy.play("shortExplosion");
            enemy.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                enemy.active = false;
                enemy.destroy();
            });
        }
        my.sprites.enemyStrongGroup.clear()
        my.sprites.enemyFastGroup.clear()
        my.sprites.playerBulletGroup.clear()
        my.sprites.enemyBulletGroup.clear()

        // recreate enemies
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
        // recreate bullets
        my.sprites.playerBulletGroup.createMultiple({
            active: false,
            visible: false,
            key: my.sprites.playerBulletGroup.defaultKey,
            frame: my.sprites.playerBulletGroup.defaultFrame,
            repeat: my.sprites.playerBulletGroup.maxSize-1
        })
        my.sprites.enemyBulletGroup.createMultiple({
            active: false,
            visible: false,
            key: my.sprites.enemyBulletGroup.defaultKey,
            frame: my.sprites.enemyBulletGroup.defaultFrame,
            repeat: my.sprites.enemyBulletGroup.maxSize-1
        })

        // set up player
        my.sprites.player.destroy();
        my.sprites.player = this.add.sprite(100, game.config.height/2, "ships", "red_small.png");
        my.sprites.player.scale = 3;
        my.sprites.player.angle = 90;

        // set up text & enemies
        this.updateText();
        this.initWave(1);

        this.pauseCounter = -1; // unpause
    }

    winGame() {
        this.pauseCounter = 30;
        for (let bullet of this.my.sprites.playerBulletGroup.getMatching("active", true)) {
            bullet.play("shortExplosion");
            bullet.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                bullet.active = false;
            });
        }
        for (let bullet of this.my.sprites.enemyBulletGroup.getMatching("active", true)) {
            bullet.play("shortExplosion");
            bullet.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                bullet.active = false;
            });
        }
        this.my.text.wave.setText("you win!");
        this.my.text.lives.setText("R q: quit R r: new game+ R");
    }
}
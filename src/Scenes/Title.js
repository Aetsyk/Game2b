class Title extends Phaser.Scene {
    constructor() {
        super("titleScreen");

        this.my = {text: {}};

        this.keyZ = null;
    }

    preload() {
        this.load.setPath("./assets/");

        this.load.bitmapFont("tinyText", "tinyski_bitmap.png", "tinyski_bitmap.xml");
        this.load.bitmapFont("pixelNums", "pixelshmup_bitmap.png", "pixelshmup_bitmap.xml");

        this.load.atlasXML("ships", "pixelshmup_ships.png", "pixelshmup_ships.xml");
        this.load.atlasXML("tiles", "pixelshmup_tiles.png", "pixelshmup_tiles.xml");
    }

    create() {
        let txt = this.my.text;

        txt.title = this.add.bitmapText(624, 300, "tinyText", "R game B", 48).setOrigin(0.5);
        txt.title = this.add.bitmapText(624, 500, "tinyText", "press spacebar to start", 48).setOrigin(0.5);

        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            this.scene.start("level");
        }
    }
}
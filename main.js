const canvasDiv = document.getElementById('canvas-div')

let config = {
    type: Phaser.AUTO,
    width: canvasDiv.offsetWidth,
    height: canvasDiv.offsetHeight,
    parent: 'canvas-div',
    transparent: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 1100},
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}
//hello

let game = new Phaser.Game(config);

function preload() {
    this.load.spritesheet('playerSpriteSheet', 'assets/player_sprite_sheet.png', {frameWidth: 40, frameHeight: 37});
    this.load.spritesheet('platformSpriteSheet', 'assets/platform_sprite_sheet.png', {frameWidth: 60, frameHeight: 10});
}

let player;
let platforms;

function create() {
    platforms = this.physics.add.staticGroup();
    player = this.physics.add.sprite(100, 450, 'playerSpriteSheet');
    player.setBounce(0);
    player.setCollideWorldBounds(true);

    this.anims.create({
        key: 'breathe',
        frames: this.anims.generateFrameNumbers('playerSpriteSheet', {start: 0, end: 3}),
        frameRate: 5,
    });
    this.anims.create({
        key: 'move_right',
        frames: this.anims.generateFrameNumbers('playerSpriteSheet', {start: 6, end: 9}),
        frameRate: 5,
    });
    this.anims.create({
        key: 'jump_straight',
        frames: [{key: 'playerSpriteSheet', frame: 5}],
        frameRate: 10
    });
    this.anims.create({
        key: 'jump_right',
        frames: [{key: 'playerSpriteSheet', frame: 4}],
        frameRate: 10
    })
    this.anims.create({
        key: 'platform',
        frames: this.anims.generateFrameNumbers('platformSpriteSheet', {start: 0, end: 3}),
        framerate: 5,
    })
    this.physics.add.collider(player, platforms);
}

function animate(type) {
    switch (type) {
        case 'move_right':
            player.flipX = false
            player.anims.play('move_right', true)
            break
        case 'move_left':
            player.flipX = true
            player.anims.play('move_right', true)
            break
        case 'breathe':
            player.flipX = false
            player.anims.play('breathe', true)
            break
        case 'jump_straight':
            player.flipX = false
            player.anims.play('jump_straight')
            break
        case 'jump_right':
            player.flipX = false
            player.anims.play('jump_right')
            break
        case 'jump_left':
            player.flipX = true
            player.anims.play('jump_right')
            break
    }
}

function movementHandler() {
    if (keys.a) {
        moveLeft()
        isGrounded ? animate('move_left') : animate('jump_left')
    } else if (keys.d) {
        moveRight()
        isGrounded ? animate('move_right') : animate('jump_right')
    } else if (isGrounded && !keys.a && !keys.d) {
        player.setVelocityX(0)
        animate('breathe')
    } else if (!isGrounded && player.body.velocity.x === 0) {
        animate('jump_straight')
    } else if (!isGrounded && !keys.a && !keys.d) {
        player.setVelocityX(0)
    }
    if (keys.w && isGrounded) {
        jump()
    }

}

function jump() {
    player.setVelocityY(-500);
}

function moveLeft() {
    player.flipX = true
    player.setVelocityX(Math.min(0, player.body.velocity.x))
    const increment = isGrounded ? 30 : 20
    const maxVel = isGrounded ? 300 : 200
    const vel = Math.max(player.body.velocity.x - increment, -maxVel)
    player.setVelocityX(vel);
}

function moveRight() {
    player.setVelocityX(Math.max(0, player.body.velocity.x))
    const increment = isGrounded ? 30 : 20
    const maxVel = isGrounded ? 300 : 200
    const vel = Math.min(player.body.velocity.x + increment, maxVel)
    player.setVelocityX(vel);
}

let isGrounded

function checkIfGrounded() {
    isGrounded = player.body.blocked.down
}

let platformSprites = [];
let canPlatform = true;
function buildPlatform() {
    if (canPlatform) {
        const platform = platforms.create(player.x, player.y + 30, 'platformSpriteSheet')
        platformSprites.push(platform)
        platform.anims.play('platform')
        canPlatform = false
        setTimeout(() => {
            canPlatform = true
        }, 300)
    }
}

function destroyPlatforms() {
    platformSprites.forEach((platform) => platform.destroy())
}

function platformHandler() {
    if (keys.q) {
        buildPlatform()
    }
    if (keys.r) {
        destroyPlatforms()
    }
}

function update() {
    platformHandler()
    movementHandler()
    checkIfGrounded()
}

let keys = {}
window.addEventListener("keydown", function (event) {
    keys[event.key] = true;
});
window.addEventListener("keyup", function (event) {
    keys[event.key] = false;
});
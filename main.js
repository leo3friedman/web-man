let isCLicking = false;
let canvasDiv
let scrollDiv
let anchors
let fullDims

window.onload = function () {
    fullDims = fullDocumentHeight()
    anchors = document.querySelectorAll('a[href]')
    const divC = document.createElement('div')
    document.body.appendChild(divC)
    divC.id = 'canvas-div'
    canvasDiv = document.getElementById('canvas-div')
    canvasDiv.style.height = fullDims.height + 'px'
    canvasDiv.style.width = fullDims.width + 'px'
    const divScroll = document.createElement('div')
    document.body.appendChild(divScroll)
    divScroll.id = 'scroll-div'
    scrollDiv = document.getElementById('scroll-div')
    const config = {
        type: Phaser.AUTO,
        width: fullDims.width,
        // width: canvasDiv.offsetWidth,
        height: fullDims.height,
        // height: canvasDiv.offsetHeight,
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
    let game = new Phaser.Game(config);
}

function preload() {
    this.load.spritesheet('playerSpriteSheet', chrome.runtime.getURL('assets/player_sprite_sheet_2.png'), {
        frameWidth: 40,
        frameHeight: 37
    });
    // this.load.spritesheet('playerSpriteSheet', 'assets/player_sprite_sheet_2.png', {frameWidth: 40, frameHeight: 37});
    this.load.spritesheet('platformSpriteSheet', chrome.runtime.getURL('assets/platform_sprite_sheet.png'), {
        frameWidth: 60,
        frameHeight: 10
    });
    // this.load.spritesheet('platformSpriteSheet', 'assets/platform_sprite_sheet.png', {frameWidth: 60, frameHeight: 10});
}

let player;
let platforms;
let body
let anchorBodies = []

function fullDocumentHeight() {
    return {
        height: Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        ), width: Math.max(
            document.body.scrollWidth, document.documentElement.scrollWidth,
            document.body.offsetWidth, document.documentElement.offsetWidth,
            document.body.clientWidth, document.documentElement.clientWidth)
    }
}

function create() {
    platforms = this.physics.add.staticGroup();
    player = this.physics.add.sprite(100, 450, 'playerSpriteSheet');
    player.setBounce(0);
    player.setCollideWorldBounds(true);
    player.body.checkCollision.up = false
    console.log(player)


    this.anims.create({
        key: 'breathe',
        frames: this.anims.generateFrameNumbers('playerSpriteSheet', {start: 0, end: 3}),
        frameRate: 5,
    });
    this.anims.create({
        key: 'move_right',
        frames: this.anims.generateFrameNumbers('playerSpriteSheet', {start: 6, end: 9}),
        frameRate: 6,
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
        key: 'click',
        frames: this.anims.generateFrameNumbers('playerSpriteSheet', {start: 10, end: 14}),
        frameRate: 6,
    })
    this.anims.create({
        key: 'platform',
        frames: this.anims.generateFrameNumbers('platformSpriteSheet', {start: 0, end: 3}),
        framerate: 5,
    })

    this.physics.add.collider(player, platforms);
    buildPlatform()

    anchors.forEach((element) => {
        const dim = element.getBoundingClientRect()
        body = this.add.rectangle(dim.x + dim.width / 2 + window.scrollX, dim.y + window.scrollY, dim.width, 1, 0x6666ff)
        // body = this.add.rectangle(dim.x + dim.width / 2, dim.y + dim.height / 2 +window.scrollY, dim.width, dim.height, 0x6666ff)
        // body.setVisible(false)
        this.physics.add.staticGroup(body)
        this.physics.add.collider(player, body)
        body.domElement = element
        anchorBodies.push(body)
    })
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
        case 'click':
            player.flipX = false
            player.anims.play('click')
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
    } else if (isGrounded && !keys.a && !keys.d && !isCLicking) {
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
    if (keys.s && isGrounded) {
        moveDown()
    }
    if (keys.Control && keys.f) {
        scrollToPlayer()
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

function moveDown() {
    player.setPosition(player.x, player.y + 5)
}

let isGrounded

function checkIfGrounded() {
    isGrounded = player.body.blocked.down
}

let platformSprites = [];
let canPlatform = true;

function buildPlatform() {
    if (canPlatform && !isGrounded) {
        let platformOffset = player.body.velocity.y > 0 ? 50 : 20
        const platform = platforms.create(player.x, player.y + platformOffset, 'platformSpriteSheet')
        platformSprites.push(platform)
        platform.anims.play('platform')
        canPlatform = false
        setTimeout(() => {
            canPlatform = true
        }, 300)
    }
}

function scrollToPlayer() {
    window.scrollTo(scrollDiv)
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

function checkOverlap(objA, objB) {
    const boundsA = objA.getBounds();
    const boundsB = objB.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
}

function anchorClickHandler() {

    const anchorCollided = anchorBodies.find((anchorBody) => {
        return checkOverlap(player, anchorBody)
    })
    if (keys.Enter && anchorCollided) {
        isCLicking = true;
        animate('click')
        anchorCollided.domElement.click()
    }
}

function clampScrollDivToPlayer() {
    scrollDiv.top = player.y + player.height / 2
    scrollDiv.left = player.x - player.width / 2
}

function update() {
    clampScrollDivToPlayer()
    anchorClickHandler()
    platformHandler()
    movementHandler()
    checkIfGrounded()
}

let keys = {}
window.addEventListener("keydown", function (event) {
    keys[event.key] = true;
    console.log(event.key)
});
window.addEventListener("keyup", function (event) {
    keys[event.key] = false;
});
window.addEventListener('resize', function (event) {
    location.reload()
})
// window.addEventListener('scroll', updateAnchorBodiesPosition)
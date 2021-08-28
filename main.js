let isCLicking = false;
let canvasDiv
let scrollDiv
let anchorsInView = []
let numJumps = 0;
let player;
let platforms;
let body
let anchorBodies = []
let canJump = true
let isGrounded
let platformSprites = [];
let canPlatform = true;
let keys = {}
let game

// TODO: is there a better way to detect that we're in a chrome extension
function isInExtension() { return chrome && chrome.runtime && chrome.runtime.getURL }

function resolveUrl(url) {
  return isInExtension() ? chrome.runtime.getURL(url) : url
}

function preload() {
    // TODO: test that this still works in the chrome extension
    this.load.spritesheet('playerSpriteSheet', resolveUrl('assets/player_sprite_sheet_2.png'), {
        frameWidth: 40,
        frameHeight: 37
    });
    this.load.spritesheet('platformSpriteSheet', resolveUrl('assets/platform_sprite_sheet.png'), {
        frameWidth: 60,
        frameHeight: 10
    });
}

function create() {
        platforms = this.physics.add.staticGroup();
        player = this.physics.add.sprite(100, 450, 'playerSpriteSheet');
        player.setBounce(0);
        player.setCollideWorldBounds(true);
        player.body.checkCollision.up = false
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

    // anchors.forEach((element) => {
    //     const dim = element.getBoundingClientRect()
    //     body = this.add.rectangle(dim.x + dim.width / 2 + window.scrollX, dim.y + window.scrollY, dim.width, 1, 0x6666ff)
    //     body.setVisible(false)
    //     this.physics.add.staticGroup(body)
    //     this.physics.add.collider(player, body)
    //     body.domElement = element
    //     anchorBodies.push(body)
    // })
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
    if (keys.w && numJumps < 1) {
        jump()
    }
    if (keys.s && isGrounded) {
        moveDown()
    }
    if (keys.Control && keys.f) {
        console.log('scrolling')
        scrollToPlayer()
    }
}

function jump() {
    if (canJump) {
        player.setVelocityY(-500);
        canJump = false
        numJumps += 1;
        // console.log(numJumps)
        setTimeout(() => {
            canJump = true
        }, 300)
    }
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

function checkIfGrounded() {
    isGrounded = player.body.blocked.down
    if (isGrounded) {
        numJumps = 0
    }
}

function buildPlatform() {
    if (canPlatform && !isGrounded) {
        let platformOffset = player.body.velocity.y > 0 ? 50 : 20
        const platform = platforms.create(player.x, player.y + platformOffset, 'platformSpriteSheet')
        platform.startingX = platform.x
        platform.startingY = platform.y
        platform.startingScrollY = window.scrollY
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
        isCLicking = false;
    }
}

function clampScrollDivToPlayer() {
    scrollDiv.style.top = player.y - player.height / 2 + 'px'
    scrollDiv.style.left = player.x - player.width / 2 + 'px'
}

function scrollToPlayer() {
    window.scrollTo(scrollDiv)
}

// function rebuildAnchorBodies() {
//     anchors = []
//     anchors = document.querySelectorAll('a[href]')
//     isFirstTimeCallingCreateFunction = false
//     create()
// }

function fullDocumentDims() {
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
function distance(x1,y1,x2,y2){
    return Math.sqrt(Math.pow((x2-x1),2) + Math.pow((y2-y1),2))
}
function anchorCenter(anchor){
    let center = {};
    const dim = anchor.getBoundingClientRect()
    center.x = dim.left + dim.width / 2
    center.y = dim.top + dim.height / 2
    return center
}
function buildAnchorBody(anchor, scene){
    const included = (element) => element.domElement === anchor;
    if(!anchorBodies.some(included)){
        const dim = anchor.getBoundingClientRect()
        const body = scene.add.rectangle(dim.x + dim.width/2, dim.y + dim.height/2, dim.width, dim.height, 0x6666ff)
        // const body = scene.add.rectangle(dim.x + dim.width/2 + window.scrollX, dim.y + dim.height/2 - window.scrollY, dim.width, dim.height, 0x6666ff)
        body.domElement = anchor
        body.startingX = body.x
        body.startingY = body.y
        body.startingScrollY = window.scrollY
        anchorBodies.push(body)
        //     body.setVisible(false)
        scene.physics.add.staticGroup(body)
        scene.physics.add.collider(player, body)
    }
}
function deleteAnchorBody(anchor){
    const included = (element) => element.domElement === anchor;
    if(anchorBodies.some(included)){
        anchorBodies.forEach((anchorBody)=>{
            if(anchorBody.domElement === anchor){
                anchorBody.destroy()
                const index = anchorBodies.indexOf(anchorBody);
                anchorBodies.splice(index, 1)
            }
        })
    }
}
function isInRange(anchor, player){
    const aCenter = anchorCenter(anchor)
    return distance(aCenter.x, aCenter.y, player.x, player.y) < 200
}
function update() {
    clampScrollDivToPlayer()
    anchorClickHandler()
    platformHandler()
    movementHandler()
    checkIfGrounded()

    const scene = this
    anchorsInView.forEach((anchor)=>{
        if(isInRange(anchor, player)) {
            buildAnchorBody(anchor, scene)
        }else{
            deleteAnchorBody(anchor);
        }
    })
}

function findAnchors(){
   const windowTop = window.scrollY;
   const windowBottom = canvasDiv.offsetHeight + window.scrollY;
   document.querySelectorAll('a[href]').forEach((anchor)=>{
       if(anchor.getBoundingClientRect().top >= windowTop && anchor.getBoundingClientRect().top <= windowBottom){
           anchorsInView.push(anchor)
       }
   })
}

window.onload = function () {
    // const fullDims = fullDocumentDims()
    // anchors = document.querySelectorAll('a[href]')
    // canvasDiv.style.height = fullDims.height + 'px'
    // canvasDiv.style.width = fullDims.width + 'px'
    canvasDiv = document.createElement('div')
    canvasDiv.id = 'canvas-div'
    document.body.appendChild(canvasDiv)

    scrollDiv = document.createElement('div')
    scrollDiv.id = 'scroll-div'
    canvasDiv.appendChild(scrollDiv)

    findAnchors()

    const config = {
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
    game = new Phaser.Game(config);
}

window.onunload = function (){
    game.destroy(true,true)
}

window.addEventListener("keydown", function (event) {
    keys[event.key] = true;
    // console.log(event.key)
});
window.addEventListener("keyup", function (event) {
    keys[event.key] = false;
});
window.addEventListener("scroll", function (event) {
    // canvasDiv.style.top = window.scrollY + 'px'
    // platforms.children.entries.forEach((platform)=>{
    //     platform.setPosition(platform.startingX, platform.startingY - window.scrollY)
    // })

    platformSprites.forEach((platform)=>{
        if(platform && platform.body){
            platform.setPosition(platform.startingX, platform.startingY - (window.scrollY - platform.startingScrollY))
            platform.body.y = (platform.startingY - (window.scrollY - platform.startingScrollY))
        }
    })
    anchorBodies.forEach((anchorBody)=>{
        if(anchorBody && anchorBody.body){
            anchorBody.setPosition(anchorBody.startingX, anchorBody.startingY - (window.scrollY- anchorBody.startingScrollY))
            anchorBody.body.y = (anchorBody.startingY - (window.scrollY-anchorBody.startingScrollY))
        }
    })
    anchorsInView = []
    findAnchors()
});
// window.addEventListener('resize', function (event) {
//     rebuildAnchorBodies()
// })


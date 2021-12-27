let isCLicking = false;
let canvasDiv
let scrollDiv
let anchorsInView = []
let buttonsInView = []
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
let bodySize;
let canClick = true;

//TODO: Add "sleep mode"
const defaultSettings = {
     sleepMode : false
}


// TODO: is there a better way to detect that we're in a chrome extension
function isInExtension() {
    return chrome && chrome.runtime && chrome.runtime.getURL
}

function resolveUrl(url) {
    return isInExtension() ? chrome.runtime.getURL(url) : url
}

function preload() {
    // TODO: test that this still works in the chrome extension
    this.load.spritesheet('playerSpriteSheet', resolveUrl('assets/player_sprite_sheet.png'), {
        frameWidth: 80,
        frameHeight: 74
    });

    this.load.spritesheet('platformSpriteSheet', resolveUrl('assets/platform_sprite_sheet.png'), {
        frameWidth: 120,
        frameHeight: 20
    });

    this.load.spritesheet('startingPlatformSpriteSheet', resolveUrl('assets/starting_platform.png'), {
        frameWidth: 318,
        frameHeight: 234
    })
}

function create() {
    platforms = this.physics.add.staticGroup();
    buildStartingPlatform()
    player = this.physics.add.sprite(window.innerWidth * 2 - 400, 180, 'playerSpriteSheet');
    player.setDepth(999);
    player.setBounce(0);
    player.setCollideWorldBounds(true);
    player.body.checkCollision.up = false
    player.body.checkCollision.right = false
    player.body.checkCollision.left = false
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

const jumpVelocity = -750
const groundedXYSpeed = 50
const groundedMaxXYSpeed = 600
const airXYSpeed = 35
const airMaxXYSpeed = 400

function jump() {
    if (canJump) {
        player.setVelocityY(jumpVelocity);
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
    const increment = isGrounded ? groundedXYSpeed : airXYSpeed
    const maxVel = isGrounded ? groundedMaxXYSpeed : airMaxXYSpeed
    const vel = Math.max(player.body.velocity.x - increment, -maxVel)
    player.setVelocityX(vel);
}

function moveRight() {
    player.setVelocityX(Math.max(0, player.body.velocity.x))
    const increment = isGrounded ? groundedXYSpeed : airXYSpeed
    const maxVel = isGrounded ? groundedMaxXYSpeed : airMaxXYSpeed
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
        player.startingX = player.x
        player.startingY = player.y
        player.startingScrollY = window.scrollY
        player.startingScrollX = window.scrollX
    }
}

const removeDist = 20;
function buildPlatform() {
    //TODO: why is isGrounded true when recreating game (Starting platform doesn't form)
    if (canPlatform && !isGrounded) {
        let platformOffset = player.body.velocity.y > 0 ? 100 : 60
        const platform = platforms.create(player.x, player.y + platformOffset, 'platformSpriteSheet')
        platform.setSize(120 - removeDist, 10).setOffset(removeDist/2, 10);
        platform.startingX = platform.x
        platform.startingY = platform.y
        platform.startingScrollY = window.scrollY
        platform.startingScrollX = window.scrollX
        platformSprites.push(platform)
        platform.anims.play('platform')
        canPlatform = false
        setTimeout(() => {
            canPlatform = true
        }, 300)
    }
}

function buildStartingPlatform(){
    const platform = platforms.create(window.innerWidth * 2 - 318, 117, 'startingPlatformSpriteSheet')
    platform.setSize(318-removeDist, 10).setOffset(removeDist/2, 224);
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
    if (keys.Enter && anchorCollided && canClick) {
        canClick = false;
        isCLicking = true;
        animate('click')
        anchorCollided.domElement.click()
        isCLicking = false;
        console.log(anchorBodies)
        setTimeout(() => {
            canClick = true
        }, 300)
    }
}

function clampScrollDivToPlayer() {
    scrollDiv.style.top = player.y - player.height / 2 + 'px'
    scrollDiv.style.left = player.x - player.width / 2 + 'px'
}

function scrollToPlayer() {
    window.scrollTo(scrollDiv)
}

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

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2))
}

function anchorCenter(anchor) {
    let center = {};
    const dim = anchor.getBoundingClientRect()
    center.x = dim.left + dim.width / 2
    center.y = dim.top + dim.height / 2
    return center
}

function buildAnchorBody(anchor, scene) {
    const included = (element) => element.domElement === anchor;
    if (!anchorBodies.some(included)) {
        const dim = anchor.getBoundingClientRect()
        const body = scene.add.rectangle((dim.x + dim.width / 2 ) * window.devicePixelRatio, (dim.y + dim.height / 2) * window.devicePixelRatio, dim.width * window.devicePixelRatio, dim.height * window.devicePixelRatio, 0x6666ff)
        body.domElement = anchor
        body.startingX = body.x
        body.startingY = body.y
        body.startingScrollY = window.scrollY
        body.startingScrollX = window.scrollX
        body.alpha = .3
        anchorBodies.push(body)
        //     body.setVisible(false)
        scene.physics.add.staticGroup(body)
        scene.physics.add.collider(player, body)
    }
}

function deleteAnchorBody(anchor) {
    const included = (element) => element.domElement === anchor;
    if (anchorBodies.some(included)) {
        anchorBodies.forEach((anchorBody) => {
            if (anchorBody.domElement === anchor) {
                anchorBody.destroy()
                const index = anchorBodies.indexOf(anchorBody);
                anchorBodies.splice(index, 1)
            }
        })
    }
}

//TODO: check if border is in range, not center
function isInRange(anchor, player) {
    // return Math.sqrt(anchor.getBoundingClientRect().top - player.y) < 200
    const aCenter = anchorCenter(anchor)
    const elementDims = anchor.getBoundingClientRect()
    const centerTopDist = distance(aCenter.x, aCenter.y - elementDims.height/2, player.x, player.y)
    const rightTopDist = distance(aCenter.x+elementDims.width/2, aCenter.y - elementDims.height/2, player.x / window.devicePixelRatio, player.y / window.devicePixelRatio)
    const leftTopDist = distance(aCenter.x-elementDims.width/2, aCenter.y - elementDims.height/2, player.x / window.devicePixelRatio, player.y / window.devicePixelRatio)
    return (Math.min(centerTopDist, rightTopDist, leftTopDist) < 200)
    // return distance(aCenter.x, aCenter.y, player.x, player.y) < 200
}

function checkIfBodySizeChanges() {
    const currentHeight = fullDocumentDims().height
    const currentWidth = fullDocumentDims().width
    if (currentHeight !== bodySize.height || currentWidth !== bodySize.width) {
        bodySize.width = currentWidth
        bodySize.height = currentHeight
        anchorsInView = []
        findAnchors()
        deleteOldAnchorBodies()
    }
}


function isOld(anchorBody) {
    let isOld = true;
    anchorsInView.forEach((anchor) => {
        if (anchorBody.domElement === anchor) {
            isOld = false;
        }
    })
    return isOld
}

function deleteOldAnchorBodies() {
    const oldAnchorBodies = anchorBodies.filter(isOld)
    oldAnchorBodies.forEach((anchorBody) => {
        anchorBody.destroy()
        const index = anchorBodies.indexOf(anchorBody);
        anchorBodies.splice(index, 1)
    })
}

function update() {
    clampScrollDivToPlayer()
    anchorClickHandler()
    platformHandler()
    movementHandler()
    checkIfGrounded()
    // checkIfBodySizeChanges()

    const scene = this
    anchorsInView.forEach((anchor) => {
        if (isInRange(anchor, player)) {
            buildAnchorBody(anchor, scene)
        } else {
            deleteAnchorBody(anchor);
        }
    })
    window.WWWW.anchorBodies = anchorBodies;
    //Just a key to press to check/test any behavior
    if (keys.z) {
        // console.log("now: " + player.body.y)
        // console.log(anchorBodies)
        // console.log(game.config)
        // const a = document.querySelector('[href="/search?biw=1562&bih=888&q=google.com+search&sa=X&ved=2ahUKEwjOgYLG3u3yAhUoHTQIHS8FBJ4Q1QIwDHoECBEQAQ"]')
        // isVisible(a)
        // anchorsInView = []
        // findAnchors()
        // deleteOldAnchorBodies()
        // console.log(anchorsInView)
    }
}




// function isVisible(element) {
//     if (!element.offsetParent) {
//         return true
//     }
//     return element.offsetTop - element.offsetParent.scrollTop > 0 && element.offsetTop - element.offsetParent.scrollTop < element.offsetParent.clientHeight
// }
// anchorsInView = Array.from(document.querySelectorAll('a[href]')).filter(isVisible)
// buttonsInView = Array.from(document.querySelectorAll('[role="button"]')).filter(isVisible)


function combineArrays(arrayA, arrayB) {
    let fullArray = arrayA
    arrayB.forEach((el) => {
        fullArray.push(el)
    })
    return fullArray
}

function isVisible(element){
    // const pos = element.getBoundingClientRect()
    let center = anchorCenter(element)
    // const elementsAtPos = document.elementsFromPoint(pos.x, pos.y)
    const elementsAtPos = document.elementsFromPoint(center.x, center.y)
    const anchorChecking = element
    return elementsAtPos.some((el)=>{
        return el === anchorChecking
    })
}

function findAnchors() {
    anchorsInView = Array.from(document.querySelectorAll('a[href]')).filter(isVisible)
    buttonsInView = Array.from(document.querySelectorAll('[role="button"]')).filter(isVisible)
    //TODO: make a "clickables" array instead of "anchorsInView"
    anchorsInView = combineArrays(anchorsInView, buttonsInView)
}

//TODO: Smooth out shift/scroll
function shiftBody(body) {
    if (body && body.body) {
        body.setPosition(body.startingX - (window.scrollX - body.startingScrollX) * window.devicePixelRatio, body.startingY - (window.scrollY - body.startingScrollY) * window.devicePixelRatio)
        body.body.y = (body.startingY - (window.scrollY - body.startingScrollY) * window.devicePixelRatio - body.height / 2)
        body.body.x = (body.startingX - (window.scrollX - body.startingScrollX) * window.devicePixelRatio - body.width / 2)
    }
}

function clickEvent(){
    //TODO: change from delay to 'when the page changes'
    setTimeout(()=>{
        console.log('clicked')
        anchorsInView = []
        findAnchors()
        deleteOldAnchorBodies()}, 1000)
}

function main(){
    //TODO: Listen for storage change (sleepMode) and if so, run main
    chrome.storage.sync.get({sleepMode: false}, function (result) {
        if(!result.sleepMode){
            window.WWWW = {};
            // window.onload = function () {
                bodySize = fullDocumentDims()
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
                    antialias: true,
                    physics: {
                        default: 'arcade',
                        arcade: {
                            gravity: {y: 1500},
                            debug: false
                        }
                    },
                    // FROM: https://supernapie.com/blog/support-retina-with-phaser-3/
                    // TODO: handle resize
                    scale: {
                        mode: Phaser.Scale.NONE, // we will resize the game with our own code (see Boot.js)
                        width: window.innerWidth * window.devicePixelRatio, // set game width by multiplying window width with devicePixelRatio
                        height: window.innerHeight * window.devicePixelRatio, // set game height by multiplying window height with devicePixelRatio
                        zoom: 1 / window.devicePixelRatio // Set the zoom to the inverse of the devicePixelRatio
                    },
                    scene: {
                        preload: preload,
                        create: create,
                        update: update
                    },
                    audio: {
                        noAudio: true
                    }
                }
                game = new Phaser.Game(config);
                window.WWWW.game = game
            // }

            window.onunload = function () {
                    console.log("unloaded");
                    if(typeof game != "undefined"){
                        game.destroy(true, false)
                    }
            }

            window.addEventListener("keydown", function (event) {
                keys[event.key] = true;
            });

            window.addEventListener("keyup", function (event) {
                keys[event.key] = false;
            });

            window.addEventListener("scroll", function (event) {
                platformSprites.forEach((platform) => {
                    shiftBody(platform)
                })
                anchorBodies.forEach((anchorBody) => {
                    shiftBody(anchorBody)
                })
                if (isGrounded) {
                    shiftBody(player)
                }
                anchorsInView = []
                findAnchors()
            });

            window.addEventListener('resize', function (event) {
                //TODO: On resize adjust game canvas dims
                anchorsInView = []
                findAnchors()
                const newHeight = window.innerHeight
                const newWidth = window.innerWidth
                if(canvasDiv){
                    canvasDiv.style.height = newHeight + 'px'
                    canvasDiv.style.width = newWidth + 'px'
                }
            })

            window.addEventListener('click', clickEvent);

        } else {
            console.log("sleeping");
            typeof game != "undefined" ? game.destroy(true, false) : console.log("game not created yet")

        }
    })
}

chrome.storage.onChanged.addListener(function (changes, areaName) {
    main();
});

window.onload = () => {
    console.log("loaded");
    main();
}


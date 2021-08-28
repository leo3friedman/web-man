const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'canvas-div',
    scene: {
        create: create,
        update: update,
    },
    // audio: {
    //     noAudio: true
    // }
};

const game = new Phaser.Game(config);

let player
function create ()
{
    player = this.add.rectangle(50, 50, 20, 20, 0x6666ff)
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
let anchorBodies = []
function buildAnchorBody(anchor, scene){
    const included = (element) => element.domElement === anchor;
        if(!anchorBodies.some(included)){
            const dim = anchor.getBoundingClientRect()
            const body = scene.add.rectangle(dim.x + dim.width/2 + window.scrollX, dim.y + dim.height/2+ window.scrollY, dim.width, dim.height, 0x6666ff)
            body.domElement = anchor
            anchorBodies.push(body)
            console.log('body added')
        }

    //     body.setVisible(false)
    //     this.physics.add.staticGroup(body)
    //     this.physics.add.collider(player, body)

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
    return distance(aCenter.x, aCenter.y, player.x, player.y) < 75
}

function update ()
{
    const scene = this
    move()
    anchors.forEach((anchor)=>{
        if(isInRange(anchor, player)) {
            buildAnchorBody(anchor, scene)
        }else{
            deleteAnchorBody(anchor)
        }
    })
}

function move(){
    if(keys.a){
        player.setPosition(player.x - 3, player.y)
    }if(keys.d){
        player.setPosition(player.x +3, player.y)
    }if(keys.w){
        player.setPosition(player.x , player.y-3)
    }if(keys.s){
        player.setPosition(player.x, player.y + 3)
    }
}
let keys={}
window.addEventListener("keydown", function (event) {
    keys[event.key] = true;
});
window.addEventListener("keyup", function (event) {
    keys[event.key] = false;
});

let anchors = [];

window.onload = function(){
    anchors = document.querySelectorAll('a[href]')

}
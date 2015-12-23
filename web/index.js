'use strict';

var myFirebaseRef = new Firebase("https://firefighters.firebaseio.com/");


const tileSize = 128;

var viewPort = {
    dc: 0, dr: 0
};
let playerElement = undefined;
let fireElement = undefined;
let objects = [];

prepareFireElement().then(preparePlayerElement).then(prepareLogin);


function preparePlayerElement() {
    return window.fetch('assets/pcman.svg').then((r) => r.text()).then((t) => {
        var svg = document.createElement('svg');
        svg.innerHTML = t;
        playerElement = svg;
    });
}
function prepareFireElement() {
    fireElement = document.createElement('img');
    fireElement.setAttribute('src','assets/fire.gif');
    return new Promise((r) => r());
}

function prepareLogin() {
    document.querySelector('#login button').addEventListener('click', login);
    document.querySelector('#login input').addEventListener('keyup', (e) => e.keyCode==13?login():false);
    document.querySelector('#login input').focus();

}
function login() {
    var name = document.querySelector('#login input').value;
    document.body.classList.remove('notLogged');
    document.getElementById('login').classList.add('hidden');
    start(name);
}

let player;
function start(name) {
    document.addEventListener('keydown', keyUp);
    var objectsRef = myFirebaseRef.child("objects");

    var me = objectsRef.push();
    me.set({name:name,c:0,r:0,type:'player'});
    window.addEventListener('unload', function() {
        me.set(null);
    });

    objectsRef.on("child_added", function(snapshot) {
        var newObject = snapshot.val();
        var key = snapshot.key();
        if (key==me.key()) {
            player = new MainPlayer(newObject.name);
            player.setPosition = function(c,r) {
                me.update({c:c,r:r});
                MainPlayer.prototype.setPosition.call(player,c,r);
            }
        } else {
            var p = newObject.type=='player'?new Player(newObject.name):new GameObject(fireElement);
            p.key = key;
            p.type = newObject.type;
            p.setPosition(newObject.c,newObject.r);
        }
        updateStatus();
    });
    objectsRef.on("child_changed", function(snapshot) {
        let key = snapshot.key();
        if (key == me.key()) {
            player.score = snapshot.val().score;
        }
        var o = objects.find((o) => o.key == key);
        if (o!=null) {
            let val = snapshot.val();
            if (val.s) o.s = val.s;
            if (val.score) o.score = val.score;
            o.setPosition(val.c,val.r);
        }
        updateStatus();
    });
    objectsRef.on('child_removed', function(snapshot) {
        let key = snapshot.key();
        let idx = objects.findIndex((o)=> o.key==key);
        if (idx>=0) {
            objects[idx].dispose();
            objects.splice(idx,1);
        }
        updateStatus();
    });


}
function keyUp(e) {
    switch(e.keyCode) {
        case 37: player.setPosition(player.c-1,player.r);break;
        case 38: player.setPosition(player.c,player.r-1);break;
        case 40: player.setPosition(player.c,player.r+1);break;
        case 39: player.setPosition(player.c+1,player.r);break;
    }
}
window.addEventListener('resize', () =>  objects.forEach((o) => o.updateStyle()));

function GameObject(element) {
    if (!element) throw new Error("Can't construct object without element");
    this.element = element.cloneNode(true);
    this.element.classList.add('gameObject');
    document.body.appendChild(this.element);
    this.setPosition(0, 0);
    objects.push(this);
}

GameObject.prototype.dispose = function() {
    this.element.parentNode.removeChild(this.element);
};


GameObject.prototype.setPosition = function (c, r) {
    this.c = c;this.r = r;
    this.updateStyle();
};
GameObject.prototype.updateStyle = function () {
    let cx = (window.innerWidth>>1) - tileSize/2;
    let cy = (window.innerHeight>>1) - tileSize/2;
    var tx = (this.c+viewPort.dc)*tileSize+cx;
    var ty = (this.r+viewPort.dr)*tileSize+cy;
    if (this.s) { this.element.style.opacity = this.s/3;}
    this.element.style.transform = `translate(${tx}px, ${ty}px) scale(${this.s?this.s/3:1})`;
};

function Player(title) {
    this.name = title;
    GameObject.call(this,playerElement);
    const width = 110;
    var textNode = this.element.querySelector('.title');
    textNode.textContent=title;
    var bb = textNode.getBBox();
    var widthTransform = width / bb.width;
    textNode.setAttribute("transform", "matrix("+widthTransform+", 0, 0, 1, 0,0)");

}
Player.prototype = Object.create(GameObject.prototype);
Player.prototype.constructor = GameObject;

function MainPlayer(title) {
    Player.call(this,title);
    this.element.classList.add('main');
    this.score = 0;
}
MainPlayer.prototype = Object.create(Player.prototype);
MainPlayer.prototype.constructor = Player;

MainPlayer.prototype.updateStyle = function () {
    Player.prototype.updateStyle.call(this);
    var oh = viewPort.dc+viewPort.dr;
    if ( (this.c+viewPort.dc)*tileSize>window.innerWidth>>1) viewPort.dc-=4;
    if ( (this.c+viewPort.dc)*tileSize<-window.innerWidth>>1) viewPort.dc+=4;
    if ( (this.r+viewPort.dr)*tileSize>window.innerHeight>>1) viewPort.dr-=3;
    if ( (this.r+viewPort.dr)*tileSize<-window.innerHeight>>1) viewPort.dr+=3;
    if (viewPort.dc+viewPort.dr != oh) {
        objects.forEach((o) => o.updateStyle());
    }
    updateStatus();
};

function updateStatus() {
    if (!player) return;
    document.getElementById('status').innerText =
        `Player name ${player.name}. Position: ${player.c}x${player.r}. Fires: ${objects.filter((o) => o.type == 'fire').length}. Score:${player.score}`;
}
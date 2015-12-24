'use strict';

const tileSize = 128;

var viewPort = {
    dc: 0, dr: 0
};
var playerElement = undefined;
var fireElement = undefined;
var objects = [];

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

var player;
function start(name) {
    player = new Player(name);
    for (var i=0;i<40;i++) {
        var o = new GameObject(fireElement);
        o.setPosition((Math.random()*20-10)|0,(Math.random()*20-10)|0);
    }
    document.addEventListener('keyup', keyUp);
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

GameObject.prototype.setPosition = function (c, r) {
    this.c = c;this.r = r;
    this.updateStyle();
};
GameObject.prototype.updateStyle = function () {
    var cx = (window.innerWidth>>1) - tileSize/2;
    var cy = (window.innerHeight>>1) - tileSize/2;
    var tx = (this.c+viewPort.dc)*tileSize+cx;
    var ty = (this.r+viewPort.dr)*tileSize+cy;
    this.element.style.transform = `translate(${tx}px, ${ty}px`;
};

function Player(title) {
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

Player.prototype.updateStyle = function () {
    GameObject.prototype.updateStyle.call(this);
    var oh = viewPort.dc+viewPort.dr;
    if ( (this.c+viewPort.dc)*tileSize>window.innerWidth>>1) viewPort.dc-=4;
    if ( (this.c+viewPort.dc)*tileSize<-window.innerWidth>>1) viewPort.dc+=4;
    if ( (this.r+viewPort.dr)*tileSize>window.innerHeight>>1) viewPort.dr-=3;
    if ( (this.r+viewPort.dr)*tileSize<-window.innerHeight>>1) viewPort.dr+=3;
    if (viewPort.dc+viewPort.dr != oh) {
        objects.forEach((o) => o.updateStyle());
    }
};


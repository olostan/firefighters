'use strict';
var Firebase = require("firebase");

var myFirebaseRef = new Firebase("https://firefighters.firebaseio.com/");

var objectsRef = myFirebaseRef.child("objects");

let objects = [];


objectsRef.on("child_added", function(snapshot) {
    var newObject = snapshot.val();
    newObject.key = snapshot.key();
    objects.push(newObject);
});
objectsRef.on("child_removed", function(snapshot) {
    var key = snapshot.key();
    let idx = objects.findIndex((o)=> o.key==key);
    if (idx>=0) {
        objects.splice(idx,1);
    }
});
objectsRef.on("child_changed", function(snapshot) {
    let key = snapshot.key();
    var o = objects.find((o) => o.key == key);
    if (o!=null) {
        let val = snapshot.val();
        o.c = val.c;
        o.r = val.r;
    }
});
objectsRef.once('value', function() {
    console.log("Server started");
    tick();
    setInterval(tick,1000);
});

function newFire() {
    var fire = {c:Math.random()*20-10|0,r:Math.random()*20-10|0,type:'fire',s:3};
    var f = objectsRef.push();
    f.set(fire);
    fire.key = f.key();
}


function tick() {
    var fires = objects.filter((o)=>o.type=='fire');
    if (fires.length<10 && Math.random()>0.9) newFire();
    fires.forEach(fireTick);
}
function fireTick(fire) {
    var neibors = playerNear(fire.c,fire.r);
    if (neibors.length>=2) {
        fire.s--;
        if (fire.s<= 0) {
            myFirebaseRef.child("objects/" + fire.key).set(null);
            neibors.forEach((p) => objectsRef.child(p.key).update({score:p.score = p.score?p.score+1:1}));
        }
        else myFirebaseRef.child("objects/" + fire.key).update({s:fire.s});
    }
}
function playerNear(c,r) {
    return objects.filter((o) => o.type=='player' && o.c>=c-1 && o.c<=c+1 && o.r>=r-1 && o.r<=r+1);
}

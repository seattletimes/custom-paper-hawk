// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

var qsa = s => Array.prototype.slice.call(document.querySelectorAll(s));

var Hammer = require("hammerjs");

var face = document.querySelector("canvas.face");
var faceContext = face.getContext("2d");

var cat = new Image();
cat.src = "./assets/grump.jpg";
console.log(cat);

var pos = {
  x: face.width / 2,
  y: face.height / 2,
  dx: 0,
  dy: 0,
  scale: 1,
  pinch: 1,
  width: 1,
  height: 1
};

var mc = new Hammer(face);
//enable all panning, pinch gestures
mc.get("pan").set({ direction: Hammer.DIRECTION_ALL });
mc.get('pinch').set({ enable: true });

mc.on("pan pinch", function(e) {
  e.preventDefault();
  pos.dx = e.deltaX;
  pos.dy = e.deltaY;
  pos.pinch = e.scale;
  drawFace();
});

mc.on("panend", function(e) {
  pos.x += pos.dx;
  pos.y += pos.dy;
  pos.dx = 0;
  pos.dy = 0;
});

mc.on("pinchend", function() {
  pos.scale *= pos.pinch;
  pos.pinch = 1;
});

faceContext.arc(face.width / 2, face.height / 2, face.width / 3, 0, Math.PI * 2);
// faceContext.fill();
faceContext.clip();

var drawFace = function() {
  var {x, dx, y, dy, scale, pinch, width, height} = pos;
  width = width * pinch * scale;
  height = height * pinch * scale;
  x = x + dx - width / 2;
  y = y + dy - height / 2;
  faceContext.clearRect(0, 0, face.width, face.height);
  faceContext.drawImage(cat, x, y, width, height);
}

cat.onload = function() {
  pos.width = cat.width;
  pos.height = cat.height;
  drawFace();
}

var onZoom = function(e) {
  var el = e.target;
  if (el.classList.contains("in")) {
    pos.scale *= 1.1;
  } else {
    pos.scale *= .9;
  }
  drawFace();
};

qsa(".zoom").forEach(el => el.addEventListener("click", onZoom));

face.addEventListener("wheel", function(e) {
  if (e.deltaY > 0) {
    pos.scale *= 1.1;
  } else {
    pos.scale *= .9;
  }
  drawFace();
})
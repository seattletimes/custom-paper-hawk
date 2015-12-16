// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

/*
Rendering plan for printable paper hawk:
- get face zone from the SVG, create a clip path for it
- is it possible to reference a canvas image from SVG?
- Add the ability to change the face fill to different colors
- On print, render the SVG to a big canvas and then dump to data URI for downloading?
- 
*/

var qsa = s => Array.prototype.slice.call(document.querySelectorAll(s));
var $ = require("./savage");
var SVGCamera = require("./camera");
var Hammer = require("hammerjs/hammer.min");
var SelfieCamera = require("./selfie");

var svgCam = new SVGCamera(document.querySelector("svg"));
var selfie = new SelfieCamera();

var faceCanvas = document.querySelector("canvas.face");
var faceContext = faceCanvas.getContext("2d");

var portrait = new Image();
portrait.src = "./assets/grump.jpg";

var pos = {
  x: faceCanvas.width / 2,
  y: faceCanvas.height / 2,
  dx: 0,
  dy: 0,
  scale: 1,
  pinch: 1,
  width: 1,
  height: 1
};

var mc = new Hammer(faceCanvas);
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

var drawFace = function() {
  var {x, dx, y, dy, scale, pinch, width, height} = pos;
  width = width * pinch * scale;
  height = height * pinch * scale;
  x = x + dx - width / 2;
  y = y + dy - height / 2;
  faceContext.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  faceContext.drawImage(portrait, x, y, width, height);
}

portrait.onload = function() {
  pos.width = portrait.width;
  pos.height = portrait.height;
  drawFace();
}

var onWheelZoom = function(e) {
  var el = e.target;
  if (el.classList.contains("in")) {
    pos.scale *= 1.1;
  } else {
    pos.scale *= .9;
  }
  drawFace();
};

qsa(".zoom").forEach(el => el.addEventListener("click", onWheelZoom));

faceCanvas.addEventListener("wheel", function(e) {
  e.preventDefault();
  if (e.deltaY < 0) {
    pos.scale *= 1.1;
  } else {
    pos.scale *= .9;
  }
  drawFace();
});

var fileInput = document.querySelector("#upload-image");
fileInput.addEventListener("change", function(e) {
  var reader = new FileReader();
  reader.addEventListener("load", function() {
    portrait.src = reader.result;
    portrait.onload = drawFace;
  });
  reader.readAsDataURL(fileInput.files[0]);
});

var onResize = function() {
  var faceBounds = document.querySelector("#face .st61").getBoundingClientRect();
  var containerBounds = document.querySelector(".canvas-inner").getBoundingClientRect();
  faceCanvas.style.width = faceBounds.width / containerBounds.width * 100 + "%";
  faceCanvas.style.height = faceBounds.height / containerBounds.height * 100 + "%";
  faceCanvas.style.left = (faceBounds.left - containerBounds.left) / containerBounds.width * 100 + "%";
  faceCanvas.style.top = (faceBounds.top - containerBounds.top) / containerBounds.height * 100 + "%";
  faceCanvas.width = faceCanvas.offsetWidth;
  faceCanvas.height = faceCanvas.offsetHeight;
  faceContext.arc(faceCanvas.width / 2, faceCanvas.height / 2, faceCanvas.width / 2, 0, Math.PI * 2);
  faceContext.clip();
  pos.x = faceCanvas.width / 2;
  pos.y = faceCanvas.height / 2;
  drawFace();
};

window.addEventListener("resize", onResize);
onResize();

document.querySelector(".take-selfie").addEventListener("click", function() {
  selfie.open(function(image) {
    portrait = image;
    pos.width = portrait.width;
    pos.height = portrait.height;
    pos.x = 0;
    pos.y = 0;
    drawFace();
  })
});

var onSkinChange = function() {
  console.log(this);
  var shade = this.getAttribute("data-shade");
  $("#face rect, #face path, #face polygon").style({
    fill: shade
  });
};

qsa(".skin-tones .skin").forEach(el => el.addEventListener("click", onSkinChange));
// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

var qsa = s => Array.prototype.slice.call(document.querySelectorAll(s));
var $ = require("./savage");
var SVGCamera = require("./camera");
var Hammer = require("hammerjs/hammer.min");
var SelfieCamera = require("./selfie");

var svgCam = new SVGCamera(document.querySelector("svg"));
var selfie = new SelfieCamera();

var faceCanvas = document.querySelector("canvas.face");
var faceContext = faceCanvas.getContext("2d");

var mug = new Image();
mug.src = "./assets/grump.jpg";

// Rendering for the mug
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

var facePath = document.querySelector("#face .st61");
var svgContainer = document.querySelector(".canvas-inner");

var positionFaceCanvas = function() {
  var faceBounds = facePath.getBoundingClientRect();
  var containerBounds = svgContainer.getBoundingClientRect();
  faceCanvas.style.width = faceBounds.width / containerBounds.width * 100 + "%";
  faceCanvas.style.height = faceBounds.height / containerBounds.height * 100 + "%";
  faceCanvas.style.left = (faceBounds.left - containerBounds.left) / containerBounds.width * 100 + "%";
  faceCanvas.style.top = (faceBounds.top - containerBounds.top) / containerBounds.height * 100 + "%";
  faceCanvas.width = faceCanvas.offsetWidth;
  faceCanvas.height = faceCanvas.offsetHeight;
  faceContext.arc(faceCanvas.width / 2, faceCanvas.height / 2, faceCanvas.width / 2, 0, Math.PI * 2);
  faceContext.clip();
};

var drawFace = function() {
  positionFaceCanvas() //will also clear the canvas
  var {x, dx, y, dy, scale, pinch, width, height} = pos;
  width = width * pinch * scale;
  height = height * pinch * scale;
  x = x + dx - width / 2;
  y = y + dy - height / 2;
  faceContext.drawImage(mug, x, y, width, height);
}
drawFace();

mug.onload = function() {
  var w = mug.naturalWidth || mug.height;
  var h = mug.naturalHeight || mug.height;
  pos.width = w;
  pos.height = h;
  pos.x = faceCanvas.width / 2;
  pos.y = faceCanvas.height / 2;
  drawFace();
}

//touch controls

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

// Mouse zoom controls
var onZoom = function(e) {
  var el = e.currentTarget;
  if (el.classList.contains("in")) {
    pos.scale *= 1.1;
  } else {
    pos.scale *= .9;
  }
  drawFace();
};

qsa(".zoom").forEach(el => el.addEventListener("click", onZoom));

faceCanvas.addEventListener("wheel", function(e) {
  e.preventDefault();
  if (e.deltaY < 0) {
    pos.scale *= 1.1;
  } else {
    pos.scale *= .9;
  }
  drawFace();
});

//load custom mugs from files or webcams

var fileInput = document.querySelector("#upload-image");
fileInput.addEventListener("change", function(e) {
  var reader = new FileReader();
  reader.addEventListener("load", function() {
    mug.src = reader.result;
    mug.onload = drawFace;
  });
  reader.readAsDataURL(fileInput.files[0]);
});

window.addEventListener("resize", drawFace);

document.querySelector(".take-selfie").addEventListener("click", function() {
  selfie.open(function(image) {
    mug = image;
    pos.width = mug.width;
    pos.height = mug.height;
    pos.x = faceCanvas.width / 2;
    pos.y = faceCanvas.width / 2;
    pos.scale = 1;
    drawFace();
  })
});

// UI for skin tones

var setShade = function(shade) {
  $("#face rect, #face path, #face polygon").style({
    fill: shade
  });
}

var useEmojiSkin = function() {
  var shade = this.getAttribute("data-shade");
  setShade(shade);
};

qsa(".skin-tones .emoji").forEach(el => el.addEventListener("click", useEmojiSkin));

document.querySelector(".skin-tones .dropper").addEventListener("click", function() {
  var clickImage = function(e) {
    var bounds = faceCanvas.getBoundingClientRect();
    var x = e.clientX - bounds.left;
    var y = e.clientY - bounds.top;
    var pixels = faceContext.getImageData(x, y, 1, 1);
    var [r,g,b] = pixels.data;
    setShade(`rgb(${r}, ${g}, ${b})`);
    document.body.classList.remove("eyedropper");
    faceCanvas.removeEventListener("click", clickImage);
  }
  document.body.classList.add("eyedropper");
  faceCanvas.addEventListener("click", clickImage);
});
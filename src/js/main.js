require("./lib/social");
require("./lib/ads");
// var track = require("./lib/tracking");

var qsa = s => Array.prototype.slice.call(document.querySelectorAll(s));
var noop = function() {};

var $ = require("./savage");
var SVGCamera = require("./camera");
var Hammer = require("hammerjs/hammer.min");
var SelfieCamera = require("./selfie");

var svg = document.querySelector("svg");
var svgCam = new SVGCamera(svg);
var selfie = new SelfieCamera();


var originalViewbox = document.querySelector("svg").getAttribute("viewBox").split(" ").map(Number);

var faceCanvas = document.querySelector("canvas.face");
var faceContext = faceCanvas.getContext("2d");

// Global position state for the mug
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
var mug = new Image();

//set up the mug for the first time
var mugCanvas = document.createElement("canvas");
mugCanvas.width = mugCanvas.height = 600;
var mugContext = mugCanvas.getContext("2d");
mugContext.font = "bold 30px sans-serif";
mugContext.textAlign = "center";
var w = mugCanvas.width / 2;
var h = mugCanvas.height / 2;
// mugContext.fillRect(0, 0, mugCanvas.width, mugCanvas.height);
mugContext.fillText("your", w, h - 25);
mugContext.fillText("face", w, h + 10);
mugContext.fillText("here", w, h + 45);
pos.width = pos.height = mugCanvas.width;
pos.x = faceCanvas.offsetWidth / 2;
pos.y = faceCanvas.offsetHeight / 2;
mug.src = mugCanvas.toDataURL();

var facePath = document.querySelector("#face path");
var svgContainer = document.querySelector(".canvas-inner");

var positionFaceCanvas = function() {
  // get various bounding rectangles
  var faceBounds = facePath.getBoundingClientRect();
  var containerBounds = svgContainer.getBoundingClientRect();
  var canvasBefore = faceCanvas.getBoundingClientRect();

  //adjust position
  faceCanvas.style.width = faceBounds.width / containerBounds.width * 100 + "%";
  faceCanvas.style.height = faceBounds.height / containerBounds.height * 100 + "%";
  faceCanvas.style.left = (faceBounds.left - containerBounds.left) / containerBounds.width * 100 + "%";
  faceCanvas.style.top = (faceBounds.top - containerBounds.top) / containerBounds.height * 100 + "%";
  faceCanvas.width = faceCanvas.offsetWidth;
  faceCanvas.height = faceCanvas.offsetHeight;

  //adjust sprite position to match
  var rx = pos.x / canvasBefore.width;
  var ry = pos.y / canvasBefore.height;
  var canvasAfter = faceCanvas.getBoundingClientRect();
  pos.width *= canvasAfter.width / canvasBefore.width;
  pos.height *= canvasAfter.height / canvasBefore.height;
  pos.x = canvasAfter.width * rx;
  pos.y = canvasAfter.height * ry;

  //set the clipping path
  var vScale = 1.5;
  var x = faceCanvas.width / 2;
  var y = faceCanvas.height / 2 / vScale * .8;
  faceContext.scale(1, vScale);
  faceContext.arc(x, y, faceCanvas.width / 1.85, 0, Math.PI * 2);
  faceContext.clip();
  faceContext.scale(1, 1 / vScale);
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
  pos.width = mugCanvas.width;
  pos.height = mugCanvas.height;
  drawFace();
}

//camera controls for customize/print
var zooming = false;
var mode = "print";

var zoomToFace = function(done = noop) {
  zooming = true;
  mode = "customize";
  svgCam.zoomTo(facePath, 50, 1000, drawFace, function() {
    zooming = false;
    done();
  });
};

var zoomToPrint = function(done = noop) {
  zooming = true;
  mode = "print";
  var view = { x: originalViewbox[0], y: originalViewbox[1], width: originalViewbox[2], height: originalViewbox[3] };
  svgCam.pan(view, 1000, drawFace, function() {
    zooming = false;
    done();
  });
};

var onClickMode = function() {
  if (zooming) return;
  var active = document.querySelector(".active.mode");
  if (active) active.classList.remove("active");
  this.classList.add("active");
  if (this.classList.contains("zoom-out") && mode == "customize") {
    document.body.classList.add("print-ready");
    zoomToPrint();
  } else if (this.classList.contains("print")) {
    mode = "print";
    window.print()
  } else if (this.classList.contains("customize") && mode == "print") {
    document.body.classList.remove("print-ready");
    zoomToFace();
  }
};

qsa(".workflow-controls .mode").forEach(el => el.addEventListener("click", onClickMode));

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
    mug.onload = function() {
      var width = mug.naturalWidth || mug.width;
      var height = mug.naturalHeight || mug.height;
      pos.width = width > 600 ? 600 : width;
      pos.height = pos.width / width * height;
      drawFace();
    };
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

// UI for skin/hair tones

var cancelEyedropper = function() {};

var getEyedropper = function(callback) {
  var clickImage = function(e) {
    var bounds = faceCanvas.getBoundingClientRect();
    var x = e.clientX - bounds.left;
    var y = e.clientY - bounds.top;
    var pixels = faceContext.getImageData(x, y, 1, 1);
    var [r,g,b] = pixels.data;
    cancelEyedropper();
    callback(r, g, b);
  }
  document.body.classList.add("eyedropper");
  faceCanvas.addEventListener("click", clickImage);
  cancelEyedropper = function() {
    document.body.classList.remove("eyedropper");
    faceCanvas.removeEventListener("click", clickImage);
  }
};

var setShade = function(shade) {
  $("#face path, .st8, .st19, .st14, .st49, .styled-35, .styled-26, .styled-41, .styled-48, .styled-24").style({
    fill: shade
  });
};

var useEmojiSkin = function() {
  cancelEyedropper();
  var shade = this.getAttribute("data-shade");
  setShade(shade);
};

qsa(".skin-tones .skin.emoji").forEach(el => el.addEventListener("click", useEmojiSkin));

document.querySelector(".skin-tones .dropper").addEventListener("click", function() {
  getEyedropper((r, g, b) => setShade(`rgb(${r}, ${g}, ${b})`));
});

var setHair = function(color) {
  $(".st10").style({ fill: color });
};

var usePresetHair = function() {
  cancelEyedropper();
  var shade = this.getAttribute("data-shade");
  setHair(shade);
};

qsa(".hair-tones .hair").forEach(el => el.addEventListener("click", usePresetHair))

document.querySelector(".hair-tones .dropper").addEventListener("click", function() {
  getEyedropper((r, g, b) => setHair(`rgb(${r}, ${g}, ${b}`));
});

//detect printing
window.onbeforeprint = function() {
  if (document.body.classList.contains("print-ready")) return;
  document.body.classList.add("print-ready");
  svg.setAttribute("viewBox", originalViewbox.join(" "));
  document.body.offsetWidth;
  drawFace();
};
if (window.matchMedia) {
  var printQuery = window.matchMedia("print");
  printQuery.addListener(function(e) {
    if (printQuery.matches) window.onbeforeprint();
  });
}
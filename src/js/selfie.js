var getUserMedia = (function() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return function(config, success, err) {
      navigator.mediaDevices.getUserMedia(config).then(success, err);
    }
  }
  var gum = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  if (!gum) return null;
  return gum.bind(navigator);
})();

if (!getUserMedia) {
  document.body.classList.add("no-gum");
}

var modal = document.querySelector(".viewfinder-modal");
var viewfinder = modal.querySelector(".viewfinder");

var stream;

var WebCam = function() {
  //register for UI events
  modal.querySelector(".close").addEventListener("click", function() {
    modal.classList.remove("show");
  });
  modal.querySelector(".shutter").addEventListener("click", e => this.clickShutter());
};
WebCam.prototype = {
  open: function(callback) {
    if (callback) this.onSnap = callback;
    var self = this;
    var reticule = modal.querySelector(".reticule");
    var success = function(s) {
      self.stream = s;
      var url = URL.createObjectURL(s);
      viewfinder.src = url;
      viewfinder.play();
    };
    var error = function(err) {
      reticule.classList.add("error");
      reticule.innerHTML = "Error: unable to open camera";
      console.error(err);
    };
    modal.classList.add("show");
    reticule.innerHTML = "";
    reticule.classList.remove("error");
    if (!self.stream) {
      getUserMedia({ 
        video: { optional: [{ facingMode: "user" }] } 
      }, success, error);
    } else {
      success(self.stream);
    }
  },
  clickShutter: function() {
    var remaining = 4;
    var reticule = modal.querySelector(".reticule");
    var self = this;
    var snap = document.createElement("canvas");
    snap.width = viewfinder.videoWidth;
    snap.height = viewfinder.videoHeight;
    var countdown = function() {
      remaining--;
      if (remaining == 0) {
        viewfinder.pause();
        snap.getContext("2d").drawImage(viewfinder, 0, 0);
        self.onSnap(snap);
        modal.classList.remove("show");
        return;
      }
      reticule.innerHTML = remaining;
      setTimeout(countdown, 1000);
    };
    countdown();
  },
  onSnap: function() {},
  stream: null
}

module.exports = WebCam;
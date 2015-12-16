var ease = p => 0.5 - Math.cos( p * Math.PI ) / 2;

var clone = require("./clone");

class Camera {
  constructor(element) {
    this.element = element;
    this.animating = false;
    this.queue = [];
  }

  pan(to, duration = 1000) {
    if (this.animating) {
      this.queue.push({
        method: "pan",
        to,
        duration
      });
      return;
    }
    this.animating = true;

    var self = this;
    var element = this.element;
    var current = element.getAttribute("viewBox");
    var [x, y, width, height] = current.split(" ").map(Number);

    if (to.scale) {
      to.width = width / to.scale;
      to.height = height / to.scale;
    }

    var dx = to.x ? to.x - x : 0;
    var dy = to.y ? to.y - y : 0;
    var dw = to.width ? to.width - width : 0;
    var dh = to.height ? to.height - height : 0;
    var now = Date.now();

    var step = function() {
      var elapsed = Date.now() - now;
      var dt = elapsed / duration;
      if (dt > 1) dt = 1;
      var scale = ease(dt);
      var box = [x + dx * scale, y + dy * scale, width + dw * scale, height + dh * scale];
      box = box.map(Math.round);
      element.setAttribute("viewBox", box.join(" "));
      if (dt < 1) {
        (requestAnimationFrame || setTimeout)(step);
        return;
      }
      self.animating = false;
      if (self.queue.length) {
        var instruction = self.queue.shift();
        self[instruction.method](instruction.to, instruction.duration);
      }
    };

    step();
  }

  zoomTo(target, padding = 20) {
    if (typeof target == "string") {
      target = document.querySelector(target);
    }
    var bounds = clone(target.getBBox());
    bounds.x -= padding;
    bounds.y -= padding;
    bounds.width += padding * 2;
    bounds.height += padding * 2;
    this.pan(bounds);
  }
}

module.exports = Camera;
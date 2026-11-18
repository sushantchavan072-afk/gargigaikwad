/* Image Animation — port of the Framer component of the same name on Xhulia's /about page.

   The original is a 4-variant Framer component that plays itself once, on its own:
     Out  ->  In  ->  Scale Down  ->  Expand
   (each step fires 400ms after the previous one becomes active; "Expand" is the end state).
   Every number below is copied from that component:

     Out        stack sits 1200px below its slot, rotated -40deg, scaled 1.2, all 7 cards stacked
     In         stack flies up into its slot and swings to -14deg            spring, bounce 0,  0.4s
     Scale Down stack settles to 0deg, scale 1                                spring, bounce 0,  1s
     Expand     cards leave the stack for their fan slots and tilt
                (-12, -9, -5, 0, 6, 10, 12deg);                              spring, bounce 0,  1s
                the two tags pop in (scale 0 -> 1, colour change)            spring, bounce .6, 1s, delay .4s / .5s

   Springs are run by the same engine Framer uses (motion's JSAnimation, vendor/motion-js.min.js).
   Final positions live in style.css (data-variant="expand"); this script only animates *to* them
   (FLIP: measure the stacked layout, switch to the fan layout, animate the difference to zero),
   then removes every inline style, so the settled page is plain CSS and stays responsive/themeable. */
(function () {
  "use strict";

  var M = window.GargiMotion;
  var roots = document.querySelectorAll("[data-img-anim]");
  if (!roots.length) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- values copied from the Framer component ---- */
  var T_IN = { type: "spring", bounce: 0, duration: 400 };   // "In"
  var T_Q = { type: "spring", bounce: 0, duration: 1000 };   // "Scale Down" and "Expand"
  var T_PIN = {
    2: { type: "spring", bounce: 0.6, duration: 1000, delay: 400 },  // Pin 2 (yellow tag)
    1: { type: "spring", bounce: 0.6, duration: 1000, delay: 500 }   // Pin 1 (light tag)
  };
  var STEP_DELAY = 400;                                      // ms between variants
  var CARD_ROTATION = { 7: -12, 6: -9, 5: -5, 4: 0, 3: 6, 2: 10, 1: 12 };
  // colours the tags start from in the component (bg / tail / text); they animate to the CSS colours
  var PIN_FROM = {
    2: { bg: [0, 128, 255], tail: [42, 98, 241], text: [255, 255, 255] },
    1: { bg: [212, 212, 212], tail: [115, 177, 153], text: [5, 5, 5] }
  };

  /* ---- tiny animatable value ---- */
  function Channel(value, onChange) {
    this.v = value;
    this.anim = null;
    this.onChange = onChange;
  }
  Channel.prototype.to = function (target, transition) {
    var self = this;
    if (this.anim) this.anim.stop();
    var opts = {};
    for (var k in transition) opts[k] = transition[k];
    opts.keyframes = [this.v, target];
    opts.onUpdate = function (x) { self.v = x; self.onChange(); };
    opts.onComplete = function () { self.anim = null; self.v = target; self.onChange(); self.onSettle && self.onSettle(); };
    this.anim = new M.JSAnimation(opts);
  };
  Channel.prototype.busy = function () { return !!this.anim; };

  function lerpColor(a, b, p) {
    var out = [];
    for (var i = 0; i < 3; i++) out.push(Math.max(0, Math.min(255, Math.round(a[i] + (b[i] - a[i]) * p))));
    return "rgb(" + out.join(",") + ")";
  }
  function parseRgb(str) {
    var m = str.match(/[\d.]+/g) || [0, 0, 0];
    return [+m[0], +m[1], +m[2]];
  }

  function mount(root) {
    var stack = root.querySelector('[data-name="Image Container"]');
    var cards = {}, pins = {};
    for (var n = 1; n <= 7; n++) cards[n] = root.querySelector('[data-name="Image ' + n + '"]');
    for (var q = 1; q <= 2; q++) pins[q] = root.querySelector('[data-name="Pin ' + q + '"]');

    // no engine (or reduced motion): show the finished fan, no animation
    if (!M || !M.JSAnimation || reduceMotion || !stack) {
      root.dataset.variant = "expand";
      return;
    }

    var render = function () {
      stack.style.transform = "translate3d(0," + stackY.v + "px,0) rotate(" + stackR.v + "deg) scale(" + stackS.v + ")";
      for (var n in cards) {
        var c = cardCh[n];
        cards[n].style.transform = "translate3d(" + c.x.v + "px," + c.y.v + "px,0) rotate(" + c.r.v + "deg)";
      }
      for (var k in pins) {
        var p = pinCh[k], el = pins[k];
        el.style.transform = "translate3d(" + p.x.v + "px," + p.y.v + "px,0) scale(" + p.s.v + ")";
        if (p.to) {
          el.style.backgroundColor = lerpColor(PIN_FROM[k].bg, p.to.bg, p.s.v);
          el.firstElementChild.style.color = lerpColor(PIN_FROM[k].text, p.to.text, p.s.v);
          el.lastElementChild.style.backgroundColor = lerpColor(PIN_FROM[k].tail, p.to.tail, p.s.v);
        }
      }
    };

    var stackY = new Channel(1200, render);
    var stackR = new Channel(-40, render);
    var stackS = new Channel(1.2, render);
    var cardCh = {}, pinCh = {};
    for (var n in cards) cardCh[n] = { x: new Channel(0, render), y: new Channel(0, render), r: new Channel(0, render) };
    for (var k in pins) pinCh[k] = { x: new Channel(0, render), y: new Channel(0, render), s: new Channel(0, render), to: null };

    var all = [stackY, stackR, stackS];
    for (n in cardCh) all.push(cardCh[n].x, cardCh[n].y, cardCh[n].r);
    for (k in pinCh) all.push(pinCh[k].x, pinCh[k].y, pinCh[k].s);

    // once the last spring is done, hand everything back to CSS
    var settleTimer = 0;
    var onSettle = function () {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        if (all.some(function (c) { return c.busy(); }) || root.dataset.variant !== "expand") return;
        stack.style.transform = "";
        for (var n in cards) cards[n].style.transform = "";
        for (var k in pins) {
          pins[k].style.transform = "";
          pins[k].style.backgroundColor = "";
          pins[k].firstElementChild.style.color = "";
          pins[k].lastElementChild.style.backgroundColor = "";
        }
      }, 50);
    };
    all.forEach(function (c) { c.onSettle = onSettle; });

    function measure() {
      var m = { cards: {}, pins: {} };
      for (var n in cards) m.cards[n] = [cards[n].offsetLeft, cards[n].offsetTop];
      for (var k in pins) m.pins[k] = [pins[k].offsetLeft, pins[k].offsetTop];
      return m;
    }

    /* ---- variants ---- */
    function toIn() {
      root.dataset.variant = "in";
      render();
      stackY.to(0, T_IN);        // the component's layout move: 1200px below -> its slot
      stackR.to(-14, T_IN);
      setTimeout(toScaleDown, STEP_DELAY);
    }

    function toScaleDown() {
      root.dataset.variant = "scale-down";
      stackR.to(0, T_Q);
      stackS.to(1, T_Q);
      setTimeout(toExpand, STEP_DELAY);
    }

    function toExpand() {
      var before = measure();                 // stacked layout
      root.dataset.variant = "expand";        // fan layout (CSS)
      var after = measure();

      for (var k in pins) {                   // colours the tags settle on (read from CSS, so themes work)
        var el = pins[k];
        var saved = [el.style.backgroundColor, el.firstElementChild.style.color, el.lastElementChild.style.backgroundColor];
        el.style.backgroundColor = ""; el.firstElementChild.style.color = ""; el.lastElementChild.style.backgroundColor = "";
        pinCh[k].to = {
          bg: parseRgb(getComputedStyle(el).backgroundColor),
          text: parseRgb(getComputedStyle(el.firstElementChild).color),
          tail: parseRgb(getComputedStyle(el.lastElementChild).backgroundColor)
        };
        el.style.backgroundColor = saved[0]; el.firstElementChild.style.color = saved[1]; el.lastElementChild.style.backgroundColor = saved[2];
      }

      for (var n in cards) {                  // FLIP: start where the card was, spring to where it belongs
        var c = cardCh[n];
        c.x.v = before.cards[n][0] - after.cards[n][0];
        c.y.v = before.cards[n][1] - after.cards[n][1];
        c.r.v = 0;
      }
      for (k in pins) {
        var p = pinCh[k];
        p.x.v = before.pins[k][0] - after.pins[k][0];
        p.y.v = before.pins[k][1] - after.pins[k][1];
        p.s.v = 0;
      }
      render();

      stackR.to(0, T_Q);
      stackS.to(1, T_Q);
      for (n in cardCh) {
        cardCh[n].x.to(0, T_Q);
        cardCh[n].y.to(0, T_Q);
        cardCh[n].r.to(CARD_ROTATION[n], T_Q);
      }
      for (k in pinCh) {
        pinCh[k].x.to(0, T_PIN[k]);
        pinCh[k].y.to(0, T_PIN[k]);
        pinCh[k].s.to(1, T_PIN[k]);
      }
    }

    // start state ("Out"), then play when the component is on screen
    root.dataset.variant = "out";
    render();
    pins[1].style.transform = pins[2].style.transform = "scale(0)";

    var started = false;
    function start() { if (started) return; started = true; toIn(); }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
      }, { threshold: 0.25 });
      io.observe(root);
    } else {
      start();
    }
  }

  for (var i = 0; i < roots.length; i++) mount(roots[i]);
})();

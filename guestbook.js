/* guestbook.js — C3 sticky-note wall (About page).
   HONEST BY DESIGN: there is no server. Notes a visitor pins are saved in THEIR OWN browser (localStorage) and shown on the wall for them.
   "Send to Gargi" really delivers a note: POST to  data-endpoint  (Formspree etc.) if Gargi sets one on #guestbook, else opens a prefilled email.
   Starts empty — no fake notes. */
(function () {
  "use strict";
  var root = document.querySelector("[data-guestbook]");
  if (!root) return;
  var KEY = "gg-guestbook-v1", MAX = 140, TO = root.getAttribute("data-email") || "", ENDPOINT = root.getAttribute("data-endpoint") || "";
  var COLORS = ["#fdcf00", "#ffd6e0", "#cdeac0", "#c9e4ff"];
  var form = root.querySelector(".gb-form"), wall = root.querySelector(".gb-wall"), msg = form.querySelector("[name=msg]"), who = form.querySelector("[name=who]"), count = root.querySelector(".gb-count"), status = root.querySelector(".gb-status"), swatches = root.querySelector(".gb-colors");
  var color = COLORS[0], notes = [];
  try { notes = JSON.parse(localStorage.getItem(KEY) || "[]").filter(function (n) { return n && typeof n.t === "string"; }); } catch (e) { notes = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch (e) { status.textContent = "Your browser would not save this note, but you can still send it."; } }
  function say(t) { status.textContent = t; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  COLORS.forEach(function (c, i) {
    var b = el("button", "gb-sw"); b.type = "button"; b.style.background = c; b.setAttribute("aria-label", "Note colour " + (i + 1)); b.setAttribute("aria-pressed", String(i === 0));
    b.addEventListener("click", function () { color = c; Array.prototype.forEach.call(swatches.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); }); });
    swatches.appendChild(b);
  });
  msg.maxLength = MAX;
  msg.addEventListener("input", function () { count.textContent = (MAX - msg.value.length) + " left"; });
  count.textContent = MAX + " left";

  function tilt(i) { return ((i * 37) % 7 - 3) * 1.1; }                 /* deterministic small rotation, no randomness between renders */
  function render() {
    wall.innerHTML = "";
    if (!notes.length) { wall.appendChild(el("p", "gb-empty", "No notes yet — be the first to pin one.")); return; }
    notes.slice().reverse().forEach(function (n, k) {
      var i = notes.length - 1 - k, card = el("article", "gb-note"); card.style.setProperty("--c", n.c || COLORS[0]); card.style.setProperty("--r", tilt(n.id || i) + "deg");
      card.appendChild(el("p", "gb-text", n.t)); card.appendChild(el("p", "gb-who", "— " + (n.w || "someone")));
      var row = el("div", "gb-row"), send = el("button", "gb-mini", n.sent ? "Sent ✓" : "Send to Gargi"), del = el("button", "gb-mini gb-x", "Remove");
      send.type = del.type = "button"; if (n.sent) send.disabled = true;
      send.addEventListener("click", function () { deliver(n, send); });
      del.addEventListener("click", function () { notes.splice(i, 1); save(); render(); say("Note removed from this browser."); });
      row.appendChild(send); row.appendChild(del); card.appendChild(row); wall.appendChild(card);
    });
  }
  function deliver(n, btn) {
    if (ENDPOINT) {
      btn.disabled = true; btn.textContent = "Sending…";
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ name: n.w || "", message: n.t, page: location.href }) })
        .then(function (r) { if (!r.ok) throw 0; n.sent = true; save(); render(); say("Sent — thank you!"); })
        .catch(function () { btn.disabled = false; btn.textContent = "Send to Gargi"; say("Could not send just now. Please try again, or email it."); });
    } else if (TO) {
      location.href = "mailto:" + TO + "?subject=" + encodeURIComponent("A note for your portfolio") + "&body=" + encodeURIComponent(n.t + "\n\n— " + (n.w || "someone"));
      say("Your email app should open with the note ready to send.");
    }
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); var t = msg.value.replace(/\s+/g, " ").trim(); if (!t) { say("Write a few words first."); msg.focus(); return; }
    notes.push({ id: Date.now() % 100000, t: t.slice(0, MAX), w: who.value.trim().slice(0, 30), c: color, sent: false }); save(); render();
    msg.value = ""; count.textContent = MAX + " left"; say("Pinned to the wall in this browser. Press “Send to Gargi” to really send it.");
  });
  render(); root.hidden = false;
})();

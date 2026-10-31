/* Small friendly sounds made with the Web Audio API (no audio files needed). */
(function () {
  "use strict";
  let ctx = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    const c = ensure();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    const t0 = c.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function enabled() { return WOS.store.data().sound !== false; }

  WOS.sound = {
    play: function (name) {
      if (!enabled()) return;
      switch (name) {
        case "tap": tone(520, 0, 0.08, "triangle", 0.08); break;
        case "good": tone(660, 0, 0.14, "sine"); tone(880, 0.12, 0.22, "sine"); break;
        case "oops": tone(300, 0, 0.18, "triangle", 0.1); tone(250, 0.14, 0.24, "triangle", 0.1); break;
        case "win": [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.12, 0.3, "sine", 0.14); }); break;
        case "try": tone(392, 0, 0.2, "triangle", 0.1); tone(440, 0.18, 0.3, "triangle", 0.1); break;
      }
    },
    toggle: function () {
      const d = WOS.store.data();
      d.sound = !(d.sound !== false);
      WOS.store.save();
      return d.sound;
    },
    isOn: enabled,
  };
})();

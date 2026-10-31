/* Simulations (labs): states of matter, electric circuit, light & shadow.
   Each lab is a function (container) -> cleanup function. */
(function () {
  "use strict";
  const { h, svg, t } = WOS;

  // ---------------------------------------------------------------- states of matter
  function statesLab(box) {
    const W = 320, H = 240;
    const canvas = h("canvas", { width: W, height: H, class: "sim-canvas", role: "img", "aria-label": t("labStates") });
    const ctx = canvas.getContext("2d");
    const label = h("div", { class: "sim-state", "aria-live": "polite" });
    const info = h("p", { class: "sim-info" });
    const tempOut = h("output", { class: "sim-value" });
    const slider = h("input", { type: "range", min: "-20", max: "120", value: "20", step: "1", id: "temp", "aria-label": t("temperature") });

    // 8 x 6 particles, each with a "home" spot in a tidy grid (the solid)
    const cols = 8, rows = 6, gapX = 34, gapY = 24;
    const left = (W - (cols - 1) * gapX) / 2, bottom = H - 22;
    const liquidTop = H * 0.36;
    const ps = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hx = left + c * gapX, hy = bottom - r * gapY;
        ps.push({ x: hx, y: hy, hx: hx, hy: hy, vx: 0, vy: 0, a: Math.random() * 6.28 });
      }
    }

    let temp = 20, raf = 0, prevState = "";
    const stateOf = function (v) { return v <= 0 ? "solid" : v < 100 ? "liquid" : "gas"; };

    function setTemp(v) {
      temp = v;
      slider.value = String(v);
      tempOut.textContent = v + " °C";
      const s = stateOf(v);
      label.textContent = t(s === "solid" ? "stSolid" : s === "liquid" ? "stLiquid" : "stGas");
      info.textContent = t(s === "solid" ? "stSolidInfo" : s === "liquid" ? "stLiquidInfo" : "stGasInfo");
    }

    function frame() {
      const s = stateOf(temp);
      const speed = s === "liquid" ? 0.9 + temp / 70 : 2.6 + (temp - 100) / 25;
      if (s !== prevState && s !== "solid") {
        // give particles a push in a random direction when they start moving freely
        ps.forEach(function (p) { const a = Math.random() * 6.28; p.vx = Math.cos(a) * speed; p.vy = Math.sin(a) * speed; });
      }
      prevState = s;

      ctx.clearRect(0, 0, W, H);
      // container
      ctx.fillStyle = "#eaf6ff"; ctx.fillRect(0, 0, W, H);
      if (s !== "gas") {
        ctx.fillStyle = s === "solid" ? "rgba(190,230,255,.55)" : "rgba(80,170,255,.28)";
        ctx.fillRect(0, s === "solid" ? bottom - (rows - 1) * gapY - 14 : liquidTop, W, H);
      }

      const jitter = 0.5 + (temp + 20) * 0.035;
      ps.forEach(function (p) {
        if (s === "solid") {
          p.x += (p.hx - p.x) * 0.2 + (Math.random() - 0.5) * jitter;
          p.y += (p.hy - p.y) * 0.2 + (Math.random() - 0.5) * jitter;
        } else {
          const m = Math.hypot(p.vx, p.vy) || 1;
          p.vx = (p.vx / m) * speed; p.vy = (p.vy / m) * speed;
          p.x += p.vx; p.y += p.vy;
          const top = s === "liquid" ? liquidTop : 9;
          if (s === "liquid" && p.y < top - 4) p.y += 2.5; // drift down into the liquid
          if (p.x < 9) { p.x = 9; p.vx = Math.abs(p.vx); }
          if (p.x > W - 9) { p.x = W - 9; p.vx = -Math.abs(p.vx); }
          if (p.y < top) { p.y = top; p.vy = Math.abs(p.vy); }
          if (p.y > H - 9) { p.y = H - 9; p.vy = -Math.abs(p.vy); }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, 6.283);
        ctx.fillStyle = s === "solid" ? "#8fd3ff" : s === "liquid" ? "#2f8cff" : "#b9a6ff";
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.stroke();
      });
      raf = requestAnimationFrame(frame);
    }

    slider.addEventListener("input", function () { setTemp(Number(slider.value)); });
    function preset(label, v, emoji) {
      return h("button", { class: "chip", type: "button", onclick: function () { WOS.sound.play("tap"); setTemp(v); } }, emoji + " " + label + " (" + v + " °C)");
    }
    box.append(
      h("div", { class: "sim-card" },
        canvas, label,
        h("label", { class: "sim-row", for: "temp" }, t("temperature") + ": ", tempOut),
        slider,
        h("div", { class: "chip-row" }, preset(t("freeze"), -10, "❄️"), preset(t("roomTemp"), 20, "💧"), preset(t("boil"), 110, "♨️")),
        info)
    );
    setTemp(20);
    frame();
    return function () { cancelAnimationFrame(raf); };
  }

  // ---------------------------------------------------------------- electric circuit
  const OBJECTS = [
    { e: "🔑", en: "The key", de: "Der Schlüssel", ok: true },
    { e: "🔩", en: "The metal screw", de: "Die Metallschraube", ok: true },
    { e: "📎", en: "The paper clip", de: "Die Büroklammer", ok: true },
    { e: "🥄", en: "The metal spoon", de: "Der Metalllöffel", ok: true },
    { e: "🥢", en: "The wooden stick", de: "Das Holzstäbchen", ok: false },
    { e: "📄", en: "The paper", de: "Das Papier", ok: false },
    { e: "🧦", en: "The woolly sock", de: "Die Wollsocke", ok: false },
    { e: "🖍️", en: "The wax crayon", de: "Der Wachsmalstift", ok: false },
  ];

  function circuitLab(box) {
    let sel = 0, closed = false;
    const msg = h("p", { class: "sim-message", "aria-live": "polite" });
    const W = 320, Hh = 200;
    const stage = svg("svg", { viewBox: "0 0 " + W + " " + Hh, class: "sim-svg", role: "img", "aria-label": t("labCircuit") });
    const picker = h("div", { class: "chip-row" });

    function draw() {
      const o = OBJECTS[sel];
      const lit = closed && o.ok;
      stage.replaceChildren();
      const wire = { stroke: "#444", "stroke-width": 5, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" };
      const flow = lit ? { class: "flow" } : {};
      // wires (top-left, top-right/bulb, bottom)
      stage.append(svg("path", Object.assign({ d: "M60 75 V35 H108" }, wire, flow)));
      stage.append(svg("path", Object.assign({ d: "M212 35 H265 V78" }, wire, flow)));
      stage.append(svg("path", Object.assign({ d: "M265 122 V165 H205" }, wire, flow)));
      stage.append(svg("path", Object.assign({ d: "M150 165 H60 V125" }, wire, flow)));
      // battery
      stage.append(svg("rect", { x: 40, y: 75, width: 40, height: 50, rx: 6, fill: "#ffcf4a", stroke: "#444", "stroke-width": 3 }));
      stage.append(svg("text", { x: 60, y: 107, "text-anchor": "middle", "font-size": 22 }, "🔋"));
      // gap with object
      stage.append(svg("rect", { x: 108, y: 18, width: 104, height: 34, rx: 10, fill: "#fff", stroke: "#999", "stroke-dasharray": "5 4", "stroke-width": 2 }));
      stage.append(svg("text", { x: 160, y: 43, "text-anchor": "middle", "font-size": 24 }, o.e));
      // switch
      stage.append(svg("circle", { cx: 205, cy: 165, r: 5, fill: "#444" }));
      stage.append(svg("circle", { cx: 150, cy: 165, r: 5, fill: "#444" }));
      stage.append(svg("line", { x1: 205, y1: 165, x2: closed ? 150 : 160, y2: closed ? 165 : 138, stroke: "#e8590c", "stroke-width": 6, "stroke-linecap": "round" }));
      stage.append(svg("text", { x: 178, y: 192, "text-anchor": "middle", "font-size": 13, fill: "#444" }, t("switchLabel")));
      // clickable switch area
      const hit = svg("rect", { x: 140, y: 125, width: 75, height: 60, fill: "transparent", style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": t("switchLabel") });
      hit.addEventListener("click", toggle);
      hit.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      stage.append(hit);
      // bulb
      if (lit) stage.append(svg("circle", { cx: 265, cy: 100, r: 40, fill: "rgba(255,230,80,.45)" }));
      stage.append(svg("circle", { cx: 265, cy: 100, r: 24, fill: lit ? "#ffe44d" : "#e8e8e8", stroke: "#444", "stroke-width": 3 }));
      stage.append(svg("text", { x: 265, y: 108, "text-anchor": "middle", "font-size": 22 }, "💡"));

      msg.className = "sim-message " + (lit ? "good" : "");
      msg.textContent = !closed ? t("circuitOpen")
        : lit ? t("circuitLit", { obj: WOS.pick([o.en, o.de]) }) : t("circuitDark", { obj: WOS.pick([o.en, o.de]) });

      picker.replaceChildren.apply(picker, OBJECTS.map(function (ob, i) {
        return h("button", {
          type: "button", class: "chip big" + (i === sel ? " on" : ""), "aria-pressed": i === sel ? "true" : "false",
          "aria-label": WOS.pick([ob.en, ob.de]),
          onclick: function () { sel = i; WOS.sound.play("tap"); draw(); },
        }, ob.e);
      }));
    }
    function toggle() { closed = !closed; WOS.sound.play(closed ? "good" : "tap"); draw(); }

    box.append(h("div", { class: "sim-card" }, stage, h("p", { class: "sim-row" }, t("pickObject")), picker, msg));
    draw();
    return function () {};
  }

  // ---------------------------------------------------------------- light & shadow
  function shadowLab(box) {
    const W = 360, Hh = 230, objX = 180, screenX = 335, cy = 115, halfObj = 28;
    let lampX = 70;
    const stage = svg("svg", { viewBox: "0 0 " + W + " " + Hh, class: "sim-svg", role: "img", "aria-label": t("labShadow") });
    const slider = h("input", { type: "range", min: "25", max: "140", value: String(lampX), step: "1", id: "lamp", "aria-label": t("lampDistance") });
    const msg = h("p", { class: "sim-message", "aria-live": "polite" });

    function draw() {
      const ratio = (screenX - lampX) / (objX - lampX);
      const half = Math.min(halfObj * ratio, 105);
      stage.replaceChildren();
      stage.append(svg("rect", { x: 0, y: 0, width: W, height: Hh, fill: "#fff8e1" }));
      // light cone (yellow) to the screen, edges grazing the object
      const edge = Math.min(halfObj * ratio, 105);
      stage.append(svg("polygon", { points: lampX + "," + cy + " " + screenX + "," + (cy - 105) + " " + screenX + "," + (cy + 105), fill: "rgba(255,226,89,.35)" }));
      // dark shadow region behind the object
      stage.append(svg("polygon", {
        points: objX + "," + (cy - halfObj) + " " + screenX + "," + (cy - edge) + " " + screenX + "," + (cy + edge) + " " + objX + "," + (cy + halfObj),
        fill: "rgba(60,60,90,.45)",
      }));
      // screen + shadow
      stage.append(svg("rect", { x: screenX, y: cy - 108, width: 12, height: 216, rx: 4, fill: "#ddd", stroke: "#999" }));
      stage.append(svg("rect", { x: screenX, y: cy - half, width: 12, height: half * 2, rx: 4, fill: "#33334d" }));
      // object (a little tree/pencil block)
      stage.append(svg("rect", { x: objX - 8, y: cy - halfObj, width: 16, height: halfObj * 2, rx: 5, fill: "#8d5a2b", stroke: "#4e2f12", "stroke-width": 2 }));
      // lamp
      stage.append(svg("text", { x: lampX, y: cy + 10, "text-anchor": "middle", "font-size": 34 }, "💡"));
      // distance guide
      stage.append(svg("line", { x1: lampX, y1: 208, x2: objX, y2: 208, stroke: "#e8590c", "stroke-width": 3, "stroke-dasharray": "6 5" }));
      msg.textContent = t("shadowSize", { x: ratio.toFixed(1) }) + " " + t("shadowTip");
    }
    slider.addEventListener("input", function () { lampX = Number(slider.value); draw(); });

    box.append(h("div", { class: "sim-card" }, stage,
      h("label", { class: "sim-row", for: "lamp" }, t("lampDistance")),
      h("div", { class: "slider-labels" }, h("span", null, "← " + t("far")), h("span", null, t("near") + " →")),
      slider, msg));
    draw();
    return function () {};
  }

  WOS.labs = [
    { id: "states", icon: "🧊", title: "labStates", desc: "labStatesDesc", run: statesLab },
    { id: "circuit", icon: "💡", title: "labCircuit", desc: "labCircuitDesc", run: circuitLab },
    { id: "shadow", icon: "🔦", title: "labShadow", desc: "labShadowDesc", run: shadowLab },
  ];
})();

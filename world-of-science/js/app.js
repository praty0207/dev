/* The World of Science – screens and navigation */
(function () {
  "use strict";
  const { h, svg, t } = WOS;
  const store = WOS.store, game = WOS.game;
  const root = document.getElementById("app");

  let view = { name: "start", params: {} };
  let cleanup = null;
  let quiz = null; // the test that is running right now

  // ------------------------------------------------------------------ navigation
  function go(name, params) {
    if (cleanup) { cleanup(); cleanup = null; }
    view = { name: name, params: params || {} };
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    if (cleanup) { cleanup(); cleanup = null; }
    const p = store.current();
    if (!p && view.name !== "start" && view.name !== "new") view = { name: "start", params: {} };
    const builders = {
      start: startView, new: newView, map: mapView, step: stepView, quiz: quizView,
      result: resultView, progress: progressView, labs: labsView, lab: labView,
    };
    const inQuiz = view.name === "quiz";
    const out = builders[view.name](p);
    const main = h("main", { id: "main", class: "main", tabindex: "-1" }, out.el);
    cleanup = out.cleanup || null;
    root.replaceChildren(
      ...headerEl(p, inQuiz),
      main,
      p && !inQuiz && view.name !== "new" ? navEl() : null
    );
    document.documentElement.lang = WOS.lang;
    document.title = t("appName");
  }

  // ------------------------------------------------------------------ shared bits
  function headerEl(p, inQuiz) {
    const langBtns = WOS.LANGS.map(function (l) {
      return h("button", {
        type: "button", class: "seg" + (WOS.lang === l ? " on" : ""), "aria-pressed": WOS.lang === l ? "true" : "false",
        "aria-label": l === "en" ? "English" : "Deutsch", lang: l,
        onclick: function () { setLang(l); },
      }, l.toUpperCase());
    });
    const soundOn = WOS.sound.isOn();
    const bar = h("header", { class: "topbar" },
      h("button", { type: "button", class: "brand", onclick: function () { if (!inQuiz) go(p ? "map" : "start"); } },
        h("span", { class: "brand-icon", "aria-hidden": "true" }, "🔬"), h("span", { class: "brand-text" }, t("appName"))),
      h("div", { class: "tools" },
        h("div", { class: "segs", role: "group", "aria-label": t("language") }, langBtns),
        h("button", {
          type: "button", class: "icon-btn", "aria-pressed": soundOn ? "true" : "false", "aria-label": soundOn ? t("soundOn") : t("soundOff"),
          onclick: function () { WOS.sound.toggle(); WOS.sound.play("good"); render(); },
        }, soundOn ? "🔊" : "🔇")));
    const parts = [bar];
    if (p && !inQuiz && view.name !== "new") parts.push(playerBar(p));
    return parts;
  }

  function playerBar(p) {
    const level = game.levelOf(p.points);
    const into = p.points % WOS.POINTS_PER_LEVEL;
    return h("div", { class: "player" },
      h("div", { class: "player-avatar", "aria-hidden": "true" }, p.avatar),
      h("div", { class: "player-info" },
        h("div", { class: "player-name" }, t("hello", { name: p.name })),
        h("div", { class: "player-level" }, t("level") + " " + level + " · " + game.levelTitle(level)),
        h("div", { class: "meter", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(WOS.POINTS_PER_LEVEL), "aria-valuenow": String(into) },
          h("div", { class: "meter-fill", style: "width:" + Math.round((into / WOS.POINTS_PER_LEVEL) * 100) + "%" }))),
      h("div", { class: "player-points" }, h("strong", null, "⭐ " + p.points), h("span", null, t("points"))),
      h("button", { type: "button", class: "small-btn", onclick: function () { store.setCurrent(null); quiz = null; go("start"); } }, t("switchPlayer")));
  }

  function navEl() {
    const items = [["map", "🗺️", "nav_map"], ["labs", "🧪", "nav_labs"], ["progress", "📈", "nav_progress"]];
    const active = view.name === "step" ? "map" : view.name === "result" ? "map" : view.name === "lab" ? "labs" : view.name;
    return h("nav", { class: "nav", "aria-label": "Main" }, items.map(function (it) {
      return h("button", {
        type: "button", class: "nav-btn" + (active === it[0] ? " on" : ""), "aria-current": active === it[0] ? "page" : null,
        onclick: function () { WOS.sound.play("tap"); go(it[0]); },
      }, h("span", { class: "nav-icon", "aria-hidden": "true" }, it[1]), h("span", null, t(it[2])));
    }));
  }

  function setLang(l) {
    WOS.lang = l;
    const d = store.data(); d.lang = l; store.save();
    WOS.sound.play("tap");
    render();
  }

  function confetti() {
    if (WOS.reducedMotion()) return;
    const layer = h("div", { class: "confetti", "aria-hidden": "true" });
    const bits = ["🎉", "⭐", "✨", "🌟", "🎈"];
    for (let i = 0; i < 28; i++) {
      layer.append(h("span", {
        style: "left:" + Math.random() * 100 + "%;animation-delay:" + Math.random() * 0.6 + "s;font-size:" + (18 + Math.random() * 18) + "px",
      }, bits[i % bits.length]));
    }
    document.body.append(layer);
    setTimeout(function () { layer.remove(); }, 3200);
  }

  const stars = function (n, big) {
    return h("span", { class: "stars" + (big ? " big" : ""), role: "img", "aria-label": n + "/3" },
      [1, 2, 3].map(function (i) { return h("span", { class: i <= n ? "on" : "" }, "★"); }));
  };

  // ------------------------------------------------------------------ start / profiles
  function startView() {
    const profiles = store.profiles();
    if (!profiles.length) { return newView(null); }
    const list = profiles.map(function (p) {
      const level = game.levelOf(p.points);
      return h("div", { class: "profile-row" },
        h("button", {
          type: "button", class: "profile-card",
          onclick: function () { store.setCurrent(p.id); WOS.sound.play("good"); go("map"); },
        },
          h("span", { class: "profile-avatar", "aria-hidden": "true" }, p.avatar),
          h("span", { class: "profile-text" }, h("strong", null, p.name),
            h("small", null, t("level") + " " + level + " · ⭐ " + p.points))),
        h("button", {
          type: "button", class: "icon-btn tiny", "aria-label": "Delete " + p.name,
          onclick: function () {
            const q = WOS.lang === "de" ? "Profil „" + p.name + "“ wirklich löschen?" : "Really delete the profile “" + p.name + "”?";
            if (window.confirm(q)) { store.remove(p.id); render(); }
          },
        }, "🗑️"));
    });
    return {
      el: h("section", { class: "start" },
        h("div", { class: "hero" }, h("div", { class: "owl", "aria-hidden": "true" }, "🦉"), h("h1", null, t("appName")), h("p", null, t("tagline"))),
        h("h2", null, t("whoPlays")),
        h("div", { class: "profile-list" }, list),
        h("button", { type: "button", class: "btn primary big", onclick: function () { go("new"); } }, "➕ " + t("newExplorer"))),
    };
  }

  function newView() {
    let avatar = WOS.avatars[0];
    const input = h("input", { type: "text", id: "nm", maxlength: "16", autocomplete: "off", placeholder: t("yourName"), class: "text-input" });
    const err = h("p", { class: "error", role: "alert" });
    const grid = h("div", { class: "avatar-grid", role: "radiogroup", "aria-label": t("pickBuddy") });
    function drawAvatars() {
      grid.replaceChildren.apply(grid, WOS.avatars.map(function (a) {
        return h("button", {
          type: "button", role: "radio", "aria-checked": a === avatar ? "true" : "false", class: "avatar-btn" + (a === avatar ? " on" : ""),
          onclick: function () { avatar = a; WOS.sound.play("tap"); drawAvatars(); },
        }, a);
      }));
    }
    drawAvatars();
    function submit(e) {
      if (e) e.preventDefault();
      const name = input.value.trim();
      if (!name) { err.textContent = t("nameNeeded"); input.focus(); return; }
      store.newProfile(name, avatar);
      WOS.sound.play("win");
      go("map");
    }
    const hasProfiles = store.profiles().length > 0;
    return {
      el: h("form", { class: "start card", onsubmit: submit },
        h("div", { class: "hero small" }, h("div", { class: "owl", "aria-hidden": "true" }, "🦉"), h("h1", null, t("appName")), h("p", null, t("tagline"))),
        h("h2", null, t("newExplorer")),
        h("label", { for: "nm", class: "label" }, t("yourName")), input, err,
        h("div", { class: "label" }, t("pickBuddy")), grid,
        h("p", { class: "note" }, "🔒 " + t("privacy")),
        h("button", { type: "submit", class: "btn primary big" }, t("letsGo")),
        hasProfiles ? h("button", { type: "button", class: "btn ghost", onclick: function () { go("start"); } }, t("cancel")) : null),
    };
  }

  // ------------------------------------------------------------------ map (grade plan)
  function mapView(p) {
    const done = game.stepsDone(p);
    const mr = p.mustRetake;
    let currentStep = 0;
    for (let n = 1; n <= WOS.STEPS; n++) { if (!(p.steps[n] && p.steps[n].passed)) { currentStep = n; break; } }

    const banner = mr
      ? h("div", { class: "banner retake", role: "status" },
        h("div", { class: "banner-emoji", "aria-hidden": "true" }, "🦉"),
        h("p", null, t("retakeBanner", { n: mr.step })),
        h("button", { type: "button", class: "btn primary", onclick: function () { go("step", { step: mr.step }); } }, t("retakeNow")))
      : done === WOS.STEPS ? h("div", { class: "banner win", role: "status" }, h("p", null, t("allDone"))) : null;

    const nodes = [];
    for (let n = 1; n <= WOS.STEPS; n++) {
      const topic = WOS.topics.filter(function (x) { return x.id === n; })[0];
      const info = game.stepInfo(p, n);
      const unlocked = game.isUnlocked(p, n);
      const playable = unlocked && (!mr || mr.step === n);
      const isCurrent = n === currentStep;
      const cls = "node " + (n % 2 ? "left" : "right") + (info.passed ? " done" : "") + (isCurrent ? " current" : "") + (!unlocked ? " locked" : "") + (mr && mr.step === n ? " retake" : "");
      const title = WOS.pick(topic.title);
      nodes.push(h("li", { class: cls },
        n % 5 === 0 ? h("div", { class: "milestone" }, "🏆 " + t("milestone")) : null,
        h("button", {
          type: "button", class: "node-btn", disabled: !playable,
          "aria-label": t("step", { n: n }) + ": " + title + (unlocked ? "" : " (" + t("locked") + ")"),
          onclick: function () { WOS.sound.play("tap"); go("step", { step: n }); },
        }, h("span", { class: "node-icon", "aria-hidden": "true" }, unlocked ? topic.icon : "🔒"), h("span", { class: "node-num" }, n)),
        h("div", { class: "node-label" }, h("strong", null, title), info.passed ? stars(info.stars) : h("small", null, t("step", { n: n })))));
    }

    return {
      el: h("section", { class: "map" },
        h("h1", null, t("gradePlan")), h("p", { class: "sub" }, t("gradePlanSub")),
        h("div", { class: "meter wide", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(WOS.STEPS), "aria-valuenow": String(done) },
          h("div", { class: "meter-fill", style: "width:" + (done / WOS.STEPS) * 100 + "%" }), h("span", { class: "meter-text" }, done + " / " + WOS.STEPS)),
        banner, h("ol", { class: "path" }, nodes)),
    };
  }

  // ------------------------------------------------------------------ step intro
  function stepView(p) {
    const n = view.params.step;
    const topic = WOS.topics.filter(function (x) { return x.id === n; })[0];
    const mr = p.mustRetake;
    if (!topic || !game.isUnlocked(p, n) || (mr && mr.step !== n)) { return mapView(p); }
    const d = store.data();
    let len = (mr && mr.step === n ? mr.len : d.len) === 20 ? 20 : 10;
    const info = game.stepInfo(p, n);
    const choose = h("div", { class: "len-choice", role: "radiogroup", "aria-label": t("chooseLength") });
    function drawChoice() {
      choose.replaceChildren.apply(choose,
        [["lenShort", 10, "🐇"], ["lenLong", 20, "🐢"]].map(function (o) {
          return h("button", {
            type: "button", role: "radio", "aria-checked": len === o[1] ? "true" : "false", class: "len-btn" + (len === o[1] ? " on" : ""),
            onclick: function () { len = o[1]; d.len = o[1]; store.save(); WOS.sound.play("tap"); drawChoice(); },
          }, h("span", { class: "len-emoji", "aria-hidden": "true" }, o[2]), h("strong", null, t(o[0])), h("small", null, t("questionsCount", { n: o[1] })));
        }));
    }
    drawChoice();
    return {
      el: h("section", { class: "step card" },
        h("button", { type: "button", class: "btn ghost back", onclick: function () { go("map"); } }, "← " + t("back")),
        mr ? h("div", { class: "banner retake" }, h("p", null, t("retakeBanner", { n: n }))) : null,
        h("div", { class: "step-head" }, h("div", { class: "step-icon", "aria-hidden": "true" }, topic.icon),
          h("div", null, h("small", null, t("step", { n: n })), h("h1", null, WOS.pick(topic.title)), info.passed ? stars(info.stars) : null)),
        h("div", { class: "lesson" }, h("h2", null, "📘 " + t("quickLesson")), h("p", null, WOS.pick(topic.lesson))),
        h("h2", null, t("chooseLength")), choose,
        h("p", { class: "note" }, t("needToPass", { p: WOS.PASS_PERCENT })),
        h("button", {
          type: "button", class: "btn primary big",
          onclick: function () { quiz = game.buildTest(p, n, len); WOS.sound.play("good"); go("quiz"); },
        }, "🚀 " + t("startQuiz"))),
    };
  }

  // ------------------------------------------------------------------ quiz
  function quizView(p) {
    if (!quiz) return mapView(p);
    const test = quiz;
    const it = test.items[test.i];
    const answered = it.picked !== null;
    const total = test.items.length;
    const lastQ = test.i === total - 1;

    function pick(k) {
      if (it.picked !== null) return;
      it.picked = k;
      const ok = it.order[k] === 0;
      if (ok) test.correct++;
      WOS.sound.play(ok ? "good" : "oops");
      render();
      const nx = document.getElementById("next-btn");
      if (nx) nx.focus({ preventScroll: false });
    }
    function next() {
      if (it.picked === null) return;
      WOS.sound.play("tap");
      if (!lastQ) { test.i++; go("quiz"); return; }
      const res = game.finishTest(p, test);
      const done = test; quiz = null;
      WOS.sound.play(res.passed ? "win" : "try");
      go("result", { test: done, res: res });
      if (res.passed) confetti();
    }
    function onKey(e) {
      if (e.target && e.target.tagName === "INPUT") return;
      if (!answered && e.key >= "1" && e.key <= "4") { pick(Number(e.key) - 1); }
    }
    document.addEventListener("keydown", onKey);

    const letters = ["A", "B", "C", "D"];
    const opts = it.order.map(function (ai, k) {
      const correct = ai === 0;
      let cls = "option";
      let mark = null;
      if (answered) {
        if (correct) { cls += " right"; mark = "✓"; }
        else if (it.picked === k) { cls += " wrong"; mark = "✗"; }
        else cls += " dim";
      }
      return h("button", {
        type: "button", class: cls, disabled: answered, onclick: function () { pick(k); },
        "aria-label": letters[k] + ": " + WOS.pick(it.q.a[ai]) + (mark ? (correct ? " ✓" : " ✗") : ""),
      }, h("span", { class: "opt-letter", "aria-hidden": "true" }, letters[k]), h("span", { class: "opt-text" }, WOS.pick(it.q.a[ai])), mark ? h("span", { class: "opt-mark", "aria-hidden": "true" }, mark) : null);
    });

    let feedback = null;
    if (answered) {
      const ok = it.order[it.picked] === 0;
      const praise = WOS.tList("praise");
      feedback = h("div", { class: "feedback " + (ok ? "ok" : "no"), role: "status" },
        h("div", { class: "fb-owl", "aria-hidden": "true" }, ok ? "🦉" : "🤔"),
        h("div", { class: "fb-text" },
          h("strong", null, ok ? praise[(test.i + test.correct) % praise.length] : t("oops")),
          ok ? null : h("p", { class: "fb-right" }, t("rightAnswer") + " ", h("b", null, WOS.pick(it.q.a[0]))),
          h("p", null, "💡 " + WOS.pick(it.q.e))));
    }

    return {
      el: h("section", { class: "quiz" },
        h("div", { class: "quiz-top" },
          h("button", {
            type: "button", class: "small-btn",
            onclick: function () { if (window.confirm(t("quitConfirm"))) { quiz = null; go("map"); } },
          }, "✕ " + t("quitQuiz")),
          h("span", { class: "quiz-count" }, t("questionOf", { i: test.i + 1, n: total })),
          h("span", { class: "quiz-score", "aria-hidden": "true" }, "✓ " + test.correct)),
        h("div", { class: "meter wide", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(total), "aria-valuenow": String(test.i + (answered ? 1 : 0)) },
          h("div", { class: "meter-fill", style: "width:" + ((test.i + (answered ? 1 : 0)) / total) * 100 + "%" })),
        h("h1", { class: "question" }, WOS.pick(it.q.q)),
        h("div", { class: "options" }, opts),
        feedback,
        answered ? h("button", { type: "button", id: "next-btn", class: "btn primary big", onclick: next }, (lastQ ? t("seeResults") : t("next")) + " →") : null),
      cleanup: function () { document.removeEventListener("keydown", onKey); },
    };
  }

  // ------------------------------------------------------------------ result
  function resultView(p) {
    const test = view.params.test, res = view.params.res;
    if (!test) return mapView(p);
    const n = test.step;
    const wrong = test.items.filter(function (it) { return it.order[it.picked] !== 0; });
    const hasNext = res.passed && n < WOS.STEPS;

    const review = wrong.length
      ? h("div", { class: "review" }, h("h2", null, "🧠 " + t("rememberThese")),
        wrong.map(function (it) {
          return h("div", { class: "review-item" },
            h("p", { class: "review-q" }, WOS.pick(it.q.q)),
            h("p", { class: "review-mine" }, "✗ " + t("yourAnswer") + " " + WOS.pick(it.q.a[it.order[it.picked]])),
            h("p", { class: "review-right" }, "✓ " + t("rightAnswer") + " ", h("b", null, WOS.pick(it.q.a[0]))),
            h("p", { class: "review-why" }, "💡 " + WOS.pick(it.q.e)));
        }))
      : null;

    const actions = [];
    if (hasNext) actions.push(h("button", { type: "button", class: "btn primary big", onclick: function () { go("step", { step: n + 1 }); } }, "➡️ " + t("nextStep")));
    if (!res.passed) actions.push(h("button", {
      type: "button", class: "btn primary big",
      onclick: function () { quiz = game.buildTest(p, n, test.len); WOS.sound.play("good"); go("quiz"); },
    }, "🔁 " + t("tryAgain")));
    actions.push(h("button", { type: "button", class: "btn ghost", onclick: function () { go("map"); } }, t("backToMap")));

    return {
      el: h("section", { class: "result card " + (res.passed ? "pass" : "fail") },
        h("div", { class: "result-emoji", "aria-hidden": "true" }, res.passed ? "🏆" : "💪"),
        h("h1", null, res.passed ? t("passTitle") : t("failTitle")),
        res.passed ? stars(res.stars, true) : null,
        h("p", { class: "score" }, t("scoreLine", { c: test.correct, n: test.items.length, p: res.pct })),
        h("p", { class: "earned" }, "⭐ " + t("pointsEarned", { p: res.earned }), res.firstPass ? h("small", null, " " + t("bonusLine", { b: WOS.PASS_BONUS })) : null),
        res.leveledUp ? h("p", { class: "levelup" }, "🎈 " + t("levelUp", { title: game.levelTitle(res.newLevel) })) : null,
        res.passed ? null : h("p", { class: "cheer" }, t("needToPass", { p: WOS.PASS_PERCENT }) + " " + t("failCheer")),
        h("div", { class: "actions" }, actions),
        review),
    };
  }

  // ------------------------------------------------------------------ progress charts
  function lineChart(history) {
    const data = history.slice(-15);
    const W = 340, H = 210, L = 36, R = 12, T = 14, B = 34;
    const iw = W - L - R, ih = H - T - B;
    const y = function (v) { return T + ih - (v / 100) * ih; };
    const x = function (i) { return data.length === 1 ? L + iw / 2 : L + (i / (data.length - 1)) * iw; };
    const s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "chart", role: "img", "aria-label": t("chartHistory") });
    [0, 50, 100].forEach(function (v) {
      s.append(svg("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: "#d7dff0", "stroke-width": 1 }));
      s.append(svg("text", { x: L - 6, y: y(v) + 4, "text-anchor": "end", "font-size": 11, fill: "#5b6785" }, v + "%"));
    });
    s.append(svg("line", { x1: L, x2: W - R, y1: y(WOS.PASS_PERCENT), y2: y(WOS.PASS_PERCENT), stroke: "#2fa66a", "stroke-width": 2, "stroke-dasharray": "6 5" }));
    s.append(svg("text", { x: W - R, y: y(WOS.PASS_PERCENT) - 5, "text-anchor": "end", "font-size": 11, fill: "#1f7a4d", "font-weight": "700" }, t("passLine")));
    s.append(svg("polyline", {
      points: data.map(function (d, i) { return x(i) + "," + y(d.pct); }).join(" "),
      fill: "none", stroke: "#6c8cff", "stroke-width": 3, "stroke-linejoin": "round", "stroke-linecap": "round",
    }));
    data.forEach(function (d, i) {
      s.append(svg("circle", { cx: x(i), cy: y(d.pct), r: 7, fill: d.passed ? "#2fa66a" : "#ff9f1c", stroke: "#fff", "stroke-width": 2 }));
      s.append(svg("text", { x: x(i), y: H - 16, "text-anchor": "middle", "font-size": 10, fill: "#5b6785" }, "S" + d.step));
    });
    return s;
  }

  function barChart(p) {
    const W = 340, H = 170, L = 8, R = 8, T = 10, B = 24;
    const iw = W - L - R, ih = H - T - B, bw = iw / WOS.STEPS;
    const s = svg("svg", { viewBox: "0 0 " + W + " " + H, class: "chart", role: "img", "aria-label": t("chartSteps") });
    const yPass = T + ih - (WOS.PASS_PERCENT / 100) * ih;
    for (let n = 1; n <= WOS.STEPS; n++) {
      const info = game.stepInfo(p, n);
      const bh = (info.bestPct / 100) * ih;
      const bx = L + (n - 1) * bw;
      s.append(svg("rect", { x: bx + 2, y: T, width: bw - 4, height: ih, rx: 3, fill: "#eef2fb" }));
      if (info.bestPct > 0) s.append(svg("rect", { x: bx + 2, y: T + ih - bh, width: bw - 4, height: bh, rx: 3, fill: info.passed ? "#2fa66a" : "#ff9f1c" }));
      s.append(svg("text", { x: bx + bw / 2, y: H - 8, "text-anchor": "middle", "font-size": 8.5, fill: "#5b6785" }, String(n)));
    }
    s.append(svg("line", { x1: L, x2: W - R, y1: yPass, y2: yPass, stroke: "#1f7a4d", "stroke-width": 1.5, "stroke-dasharray": "5 4" }));
    return s;
  }

  function progressView(p) {
    const stat = function (icon, val, label) {
      return h("div", { class: "stat" }, h("div", { class: "stat-icon", "aria-hidden": "true" }, icon), h("strong", null, String(val)), h("small", null, label));
    };
    return {
      el: h("section", { class: "progress" },
        h("h1", null, "📈 " + t("progressTitle")),
        h("div", { class: "stats" },
          stat("📝", p.history.length, t("statQuizzes")), stat("🗺️", game.stepsDone(p) + "/" + WOS.STEPS, t("statSteps")),
          stat("🌟", game.starsTotal(p), t("statStars")), stat("⭐", p.points, t("statPoints"))),
        h("div", { class: "card" }, h("h2", null, t("chartHistory")),
          p.history.length ? [lineChart(p.history), h("p", { class: "note" }, t("chartHistoryHint"))] : h("p", { class: "empty" }, "🦉 " + t("noData"))),
        h("div", { class: "card" }, h("h2", null, t("chartSteps")), barChart(p))),
    };
  }

  // ------------------------------------------------------------------ labs
  function labsView() {
    return {
      el: h("section", { class: "labs" },
        h("h1", null, "🧪 " + t("labsTitle")), h("p", { class: "sub" }, t("labsSub")),
        h("div", { class: "lab-list" }, WOS.labs.map(function (lab) {
          return h("button", { type: "button", class: "lab-card", onclick: function () { WOS.sound.play("tap"); go("lab", { id: lab.id }); } },
            h("span", { class: "lab-icon", "aria-hidden": "true" }, lab.icon),
            h("span", { class: "lab-text" }, h("strong", null, t(lab.title)), h("small", null, t(lab.desc))));
        }))),
    };
  }

  function labView() {
    const lab = WOS.labs.filter(function (l) { return l.id === view.params.id; })[0] || WOS.labs[0];
    const holder = h("div", { class: "lab-holder" });
    const stop = lab.run(holder);
    return {
      el: h("section", { class: "lab" },
        h("button", { type: "button", class: "btn ghost back", onclick: function () { go("labs"); } }, "← " + t("backToLabs")),
        h("h1", null, lab.icon + " " + t(lab.title)), h("p", { class: "sub" }, t(lab.desc)), holder),
      cleanup: stop,
    };
  }

  // ------------------------------------------------------------------ boot
  function boot() {
    const d = store.data();
    WOS.lang = d.lang || ((navigator.language || "en").toLowerCase().indexOf("de") === 0 ? "de" : "en");
    const p = store.current();
    view = { name: p ? "map" : "start", params: {} };
    render();
  }
  boot();
})();

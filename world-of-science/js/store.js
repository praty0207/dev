/* Profiles + progress, saved in the browser (localStorage). Falls back to memory
   if storage is blocked (e.g. private mode), so the app still works. */
(function () {
  "use strict";
  const KEY = "worldOfScience.v1";
  let db = null;

  function blank() { return { profiles: {}, current: null, lang: null, sound: true }; }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && parsed.profiles) return parsed;
      }
    } catch (e) { /* ignore */ }
    return blank();
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
  }

  function get() { if (!db) db = load(); return db; }

  function newProfile(name, avatar) {
    const d = get();
    const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    d.profiles[id] = {
      id: id, name: name, avatar: avatar, created: Date.now(),
      points: 0,
      steps: {},      // { [stepNo]: { passed, bestPct, stars, attempts } }
      history: [],    // [{ t, step, pct, correct, total, passed, len }]
      seen: {},       // { [questionId]: timesSeen }  -> used to rotate questions
      mustRetake: null, // { step, len } after a failed first attempt
    };
    d.current = id;
    save();
    return d.profiles[id];
  }

  WOS.store = {
    data: get,
    save: save,
    newProfile: newProfile,
    profiles: function () {
      const d = get();
      return Object.keys(d.profiles).map(function (k) { return d.profiles[k]; })
        .sort(function (a, b) { return a.created - b.created; });
    },
    current: function () { const d = get(); return d.current ? d.profiles[d.current] || null : null; },
    setCurrent: function (id) { get().current = id; save(); },
    remove: function (id) {
      const d = get();
      delete d.profiles[id];
      if (d.current === id) d.current = null;
      save();
    },
  };

  // ---- game rules on top of a profile --------------------------------------
  WOS.game = {
    stepInfo: function (p, n) {
      return p.steps[n] || { passed: false, bestPct: 0, stars: 0, attempts: 0 };
    },
    isUnlocked: function (p, n) {
      return n === 1 || !!(p.steps[n - 1] && p.steps[n - 1].passed);
    },
    stepsDone: function (p) {
      let c = 0;
      for (let n = 1; n <= WOS.STEPS; n++) if (p.steps[n] && p.steps[n].passed) c++;
      return c;
    },
    starsTotal: function (p) {
      let c = 0;
      Object.keys(p.steps).forEach(function (k) { c += p.steps[k].stars || 0; });
      return c;
    },
    levelOf: function (points) { return Math.floor(points / WOS.POINTS_PER_LEVEL) + 1; },
    levelTitle: function (level) {
      return WOS.pick(WOS.levelTitles[Math.min(level, WOS.levelTitles.length) - 1]);
    },
    starsFor: function (pct) { return pct >= 95 ? 3 : pct >= 85 ? 2 : pct >= WOS.PASS_PERCENT ? 1 : 0; },

    // Pick the questions for one test. Questions seen least often come first,
    // so every new test feels different. If the test is longer than the topic's
    // own pool (20-question test), we add review questions from other topics.
    buildTest: function (p, step, len) {
      const topic = WOS.topics.filter(function (t) { return t.id === step; })[0];
      function byFreshness(list) {
        return WOS.shuffle(list).sort(function (a, b) { return (p.seen[a.id] || 0) - (p.seen[b.id] || 0); });
      }
      let chosen = byFreshness(topic.qs).slice(0, len);
      if (chosen.length < len) {
        const earlier = [], later = [];
        WOS.topics.forEach(function (t) {
          if (t.id === step) return;
          (t.id < step ? earlier : later).push.apply(t.id < step ? earlier : later, t.qs);
        });
        const pool = earlier.length >= len - chosen.length ? earlier : earlier.concat(later);
        chosen = chosen.concat(byFreshness(pool).slice(0, len - chosen.length));
      }
      chosen = WOS.shuffle(chosen);
      return {
        step: step, len: len, i: 0, correct: 0, answered: false,
        items: chosen.map(function (q) {
          return { q: q, order: WOS.shuffle([0, 1, 2, 3]), picked: null }; // order[k] = index into q.a
        }),
      };
    },

    // Called when a test is finished. Returns what happened, for the result screen.
    finishTest: function (p, test) {
      const total = test.items.length;
      const pct = Math.round((test.correct / total) * 100);
      const passed = test.correct / total >= WOS.PASS_PERCENT / 100;
      const prev = WOS.game.stepInfo(p, test.step);
      const firstPass = passed && !prev.passed;
      const oldLevel = WOS.game.levelOf(p.points);

      let earned = test.correct * WOS.POINTS_PER_CORRECT;
      if (firstPass) earned += WOS.PASS_BONUS;
      p.points += earned;

      test.items.forEach(function (it) { p.seen[it.q.id] = (p.seen[it.q.id] || 0) + 1; });

      p.steps[test.step] = {
        passed: prev.passed || passed,
        bestPct: Math.max(prev.bestPct, pct),
        stars: Math.max(prev.stars, WOS.game.starsFor(pct)),
        attempts: prev.attempts + 1,
      };
      p.history.push({ t: Date.now(), step: test.step, pct: pct, correct: test.correct, total: total, passed: passed, len: test.len });

      // Mandatory retake: failing a step you have not passed yet means you must
      // do that test again (with new questions) before anything else.
      if (passed) {
        if (p.mustRetake && p.mustRetake.step === test.step) p.mustRetake = null;
      } else if (!prev.passed) {
        p.mustRetake = { step: test.step, len: test.len };
      }
      WOS.store.save();

      const newLevel = WOS.game.levelOf(p.points);
      return {
        pct: pct, passed: passed, earned: earned, firstPass: firstPass,
        stars: WOS.game.starsFor(pct), leveledUp: newLevel > oldLevel, newLevel: newLevel,
      };
    },
  };
})();

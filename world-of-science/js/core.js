/* The World of Science – core: namespace, helpers, translations */
(function () {
  "use strict";

  const WOS = (window.WOS = {
    topics: [],
    PASS_PERCENT: 70, // from the MVP notes: 70% minimum to pass
    LENGTHS: { short: 10, long: 20 }, // from the MVP notes: short / long (10 / 20)
    STEPS: 20, // grade plan with 20 steps / milestones
    POINTS_PER_CORRECT: 10,
    PASS_BONUS: 30,
    POINTS_PER_LEVEL: 150,
  });

  // ---- question helpers --------------------------------------------------
  // Q(questionEn, questionDe, correct, wrong1, wrong2, wrong3, explanation)
  // every answer / explanation is an [en, de] pair. The correct answer is
  // always written first; the app shuffles the options at run time.
  WOS.Q = function (qEn, qDe, c, w1, w2, w3, ex) {
    return { q: [qEn, qDe], a: [c, w1, w2, w3], e: ex };
  };
  WOS.N = function (s) { return [s, s]; }; // same text in both languages (numbers)

  WOS.addTopic = function (t) {
    t.qs.forEach(function (q, i) { q.id = t.id + "-" + i; q.topic = t.id; });
    WOS.topics.push(t);
    WOS.topics.sort(function (a, b) { return a.id - b.id; });
  };

  // ---- language ----------------------------------------------------------
  WOS.lang = "en";
  WOS.LANGS = ["en", "de"];
  WOS.pick = function (pair) { return pair[WOS.lang === "de" ? 1 : 0]; };

  const S = {
    appName: ["The World of Science", "Die Welt der Wissenschaft"],
    tagline: ["Explore, play and learn!", "Entdecken, spielen, lernen!"],
    whoPlays: ["Who is playing today?", "Wer spielt heute?"],
    newExplorer: ["New explorer", "Neuer Entdecker"],
    yourName: ["Your first name or a nickname", "Dein Vorname oder ein Spitzname"],
    pickBuddy: ["Pick your buddy", "Such dir dein Tier aus"],
    letsGo: ["Let's go!", "Los geht's!"],
    privacy: [
      "Please don't use your full name. Everything stays on this device only.",
      "Bitte nimm nicht deinen ganzen Namen. Alles bleibt nur auf diesem Gerät.",
    ],
    nameNeeded: ["Please type a name first.", "Bitte gib zuerst einen Namen ein."],
    cancel: ["Cancel", "Abbrechen"],
    switchPlayer: ["Switch player", "Spieler wechseln"],
    hello: ["Hi {name}!", "Hallo {name}!"],
    points: ["points", "Punkte"],
    level: ["Level", "Level"],
    nav_map: ["Map", "Karte"],
    nav_labs: ["Labs", "Labor"],
    nav_progress: ["Progress", "Fortschritt"],
    soundOn: ["Sound on", "Ton an"],
    soundOff: ["Sound off", "Ton aus"],
    language: ["Language", "Sprache"],
    gradePlan: ["Grade 5 adventure map", "Abenteuerkarte Klasse 5"],
    gradePlanSub: [
      "20 steps. Pass each quiz with 70% to open the next one!",
      "20 Schritte. Schaffe jedes Quiz mit 70 %, um das nächste zu öffnen!",
    ],
    step: ["Step {n}", "Schritt {n}"],
    locked: ["Locked", "Gesperrt"],
    milestone: ["Milestone!", "Meilenstein!"],
    retakeBanner: [
      "Let's try Step {n} again! You need 70% to go on. The questions are new this time!",
      "Versuche Schritt {n} noch einmal! Du brauchst 70 %, um weiterzukommen. Diesmal sind die Fragen neu!",
    ],
    retakeNow: ["Try again now", "Jetzt nochmal versuchen"],
    allDone: [
      "You finished all 20 steps! You are a Science Champion! 🏆",
      "Du hast alle 20 Schritte geschafft! Du bist Wissenschaftsmeister! 🏆",
    ],
    quickLesson: ["Quick lesson", "Kurze Lektion"],
    chooseLength: ["How long should your quiz be?", "Wie lang soll dein Quiz sein?"],
    lenShort: ["Short", "Kurz"],
    lenLong: ["Long", "Lang"],
    questionsCount: ["{n} questions", "{n} Fragen"],
    startQuiz: ["Start quiz", "Quiz starten"],
    back: ["Back", "Zurück"],
    quitQuiz: ["Quit", "Beenden"],
    quitConfirm: [
      "Leave the quiz? Your answers so far will not count.",
      "Quiz verlassen? Deine bisherigen Antworten zählen dann nicht.",
    ],
    questionOf: ["Question {i} of {n}", "Frage {i} von {n}"],
    praise: [
      ["Great job!", "Super!", "Awesome!", "You got it!", "Brilliant!"],
      ["Super gemacht!", "Toll!", "Klasse!", "Genau richtig!", "Prima!"],
    ],
    oops: [
      "Not quite – but now you know!",
      "Fast – aber jetzt weißt du es!",
    ],
    rightAnswer: ["The right answer:", "Die richtige Antwort:"],
    next: ["Next", "Weiter"],
    seeResults: ["See my results", "Meine Ergebnisse"],
    passTitle: ["You passed! 🎉", "Geschafft! 🎉"],
    failTitle: ["Almost there!", "Fast geschafft!"],
    scoreLine: [
      "{c} of {n} correct ({p}%)",
      "{c} von {n} richtig ({p} %)",
    ],
    needToPass: ["You need {p}% to pass.", "Du brauchst {p} %, um zu bestehen."],
    failCheer: [
      "Don't worry – every scientist learns from mistakes. Read the tips below, then try again!",
      "Keine Sorge – jeder Forscher lernt aus Fehlern. Lies die Tipps unten und versuche es nochmal!",
    ],
    pointsEarned: ["+{p} points", "+{p} Punkte"],
    bonusLine: ["(includes {b} bonus points for passing!)", "(mit {b} Bonuspunkten fürs Bestehen!)"],
    levelUp: ["Level up! You are now: {title}", "Level geschafft! Du bist jetzt: {title}"],
    tryAgain: ["Try again with new questions", "Nochmal mit neuen Fragen"],
    nextStep: ["Next step", "Nächster Schritt"],
    backToMap: ["Back to the map", "Zurück zur Karte"],
    rememberThese: ["Let's remember these:", "Das merken wir uns:"],
    yourAnswer: ["Your answer:", "Deine Antwort:"],
    progressTitle: ["My progress", "Mein Fortschritt"],
    chartHistory: ["My quiz results", "Meine Quiz-Ergebnisse"],
    chartHistoryHint: [
      "Each dot is one quiz. Above the dashed line = passed!",
      "Jeder Punkt ist ein Quiz. Über der gestrichelten Linie = bestanden!",
    ],
    chartSteps: ["Best score per step", "Beste Punktzahl pro Schritt"],
    passLine: ["Pass: 70%", "Bestanden: 70 %"],
    noData: [
      "Take your first quiz to see your chart grow!",
      "Mach dein erstes Quiz, dann wächst hier dein Diagramm!",
    ],
    statQuizzes: ["Quizzes", "Quizze"],
    statSteps: ["Steps done", "Schritte geschafft"],
    statStars: ["Stars", "Sterne"],
    statPoints: ["Points", "Punkte"],
    labsTitle: ["Science Labs", "Wissenschafts-Labor"],
    labsSub: [
      "Play with experiments – no mess, no mistakes!",
      "Probiere Experimente aus – ohne Chaos und ohne Fehler!",
    ],
    labStates: ["States of matter", "Aggregatzustände"],
    labStatesDesc: ["Heat or cool water and watch the particles!", "Erwärme oder kühle Wasser und beobachte die Teilchen!"],
    labCircuit: ["Electric circuit", "Stromkreis"],
    labCircuitDesc: ["Which things let electricity flow?", "Welche Dinge leiten Strom?"],
    labShadow: ["Light and shadow", "Licht und Schatten"],
    labShadowDesc: ["Move the lamp and watch the shadow change.", "Verschiebe die Lampe und beobachte den Schatten."],
    openLab: ["Open lab", "Labor öffnen"],
    backToLabs: ["Back to labs", "Zurück zum Labor"],
    // states of matter
    temperature: ["Temperature", "Temperatur"],
    stSolid: ["Solid ice 🧊", "Fest: Eis 🧊"],
    stLiquid: ["Liquid water 💧", "Flüssig: Wasser 💧"],
    stGas: ["Gas: water vapour ☁️", "Gasförmig: Wasserdampf ☁️"],
    stSolidInfo: [
      "The particles are packed tightly and only wiggle on the spot.",
      "Die Teilchen liegen dicht an dicht und zittern nur auf der Stelle.",
    ],
    stLiquidInfo: [
      "The particles slide past each other. Water takes the shape of its container.",
      "Die Teilchen gleiten aneinander vorbei. Wasser nimmt die Form des Gefäßes an.",
    ],
    stGasInfo: [
      "The particles fly around fast and spread out everywhere.",
      "Die Teilchen sausen schnell umher und verteilen sich überall.",
    ],
    freeze: ["Freeze", "Gefrieren"],
    roomTemp: ["Room", "Zimmer"],
    boil: ["Boil", "Kochen"],
    // circuit
    switchLabel: ["Switch", "Schalter"],
    pickObject: ["Put an object in the gap:", "Lege einen Gegenstand in die Lücke:"],
    circuitOpen: [
      "The switch is open, so the circuit is not closed. Tap the switch!",
      "Der Schalter ist offen, der Stromkreis ist nicht geschlossen. Tippe auf den Schalter!",
    ],
    circuitLit: [
      "The bulb glows! {obj} is a conductor – electricity can flow through it.",
      "Die Lampe leuchtet! {obj} ist ein Leiter – Strom kann hindurchfließen.",
    ],
    circuitDark: [
      "The bulb stays dark. {obj} is an insulator – electricity cannot flow through it.",
      "Die Lampe bleibt dunkel. {obj} ist ein Isolator – Strom kann nicht hindurchfließen.",
    ],
    // shadow
    lampDistance: ["Move the lamp", "Verschiebe die Lampe"],
    shadowSize: ["The shadow is {x}× as big as the object.", "Der Schatten ist {x}-mal so groß wie der Gegenstand."],
    shadowTip: [
      "Tip: the closer the lamp is to the object, the bigger the shadow!",
      "Tipp: Je näher die Lampe am Gegenstand ist, desto größer wird der Schatten!",
    ],
    far: ["far", "weit"],
    near: ["near", "nah"],
  };

  WOS.levelTitles = [
    ["Curious Explorer", "Neugieriger Entdecker"],
    ["Little Scientist", "Kleiner Forscher"],
    ["Lab Helper", "Laborhelfer"],
    ["Nature Detective", "Naturdetektiv"],
    ["Experiment Expert", "Experimente-Profi"],
    ["Science Star", "Wissenschaftsstern"],
    ["Brain Wizard", "Denk-Zauberer"],
    ["Discovery Hero", "Entdeckerheld"],
    ["Super Scientist", "Superforscher"],
    ["Science Champion", "Wissenschaftsmeister"],
  ];

  WOS.avatars = ["🦊", "🐼", "🐯", "🐸", "🦄", "🐙", "🐧", "🦉"];

  // t("key", {name: "Mia"}) -> translated string with {name} replaced
  WOS.t = function (key, vars) {
    const entry = S[key];
    if (!entry) return key;
    let s = entry[WOS.lang === "de" ? 1 : 0];
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split("{" + k + "}").join(vars[k]);
      });
    }
    return s;
  };
  WOS.tList = function (key) { return S[key][WOS.lang === "de" ? 1 : 0]; };

  // ---- tiny DOM helper (builds elements safely, no innerHTML) --------------
  WOS.h = function (tag, props) {
    const el = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      const v = props[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, v);
    });
    for (let i = 2; i < arguments.length; i++) {
      (function add(c) {
        if (c == null || c === false) return;
        if (Array.isArray(c)) { c.forEach(add); return; }
        el.append(c.nodeType ? c : document.createTextNode(String(c)));
      })(arguments[i]);
    }
    return el;
  };

  WOS.svg = function (tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      if (c == null) continue;
      el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
  };

  WOS.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  WOS.reducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };
})();

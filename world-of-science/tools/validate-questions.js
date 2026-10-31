#!/usr/bin/env node
/* Checks the question bank: 20 steps, enough questions, 4 distinct options,
   English + German text everywhere. Run: node tools/validate-questions.js */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {}, document: {}, navigator: {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
["js/core.js", "js/data/topics-1-5.js", "js/data/topics-6-10.js", "js/data/topics-11-15.js", "js/data/topics-16-20.js"].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), sandbox, { filename: f });
});

const WOS = sandbox.WOS;
const problems = [];
const bad = function (msg) { problems.push(msg); };
const okText = function (s) { return typeof s === "string" && s.trim().length > 0; };

if (WOS.topics.length !== WOS.STEPS) bad("Expected " + WOS.STEPS + " topics, found " + WOS.topics.length);
let total = 0;
WOS.topics.forEach(function (t, i) {
  if (t.id !== i + 1) bad("Topic ids must be 1..20 in order (got " + t.id + " at position " + (i + 1) + ")");
  ["title", "lesson"].forEach(function (k) {
    if (!Array.isArray(t[k]) || !okText(t[k][0]) || !okText(t[k][1])) bad("Topic " + t.id + " has no EN/DE " + k);
  });
  if (t.qs.length < 12) bad("Topic " + t.id + " has only " + t.qs.length + " questions (need at least 12 so tests can rotate)");
  const seenQ = new Set();
  t.qs.forEach(function (q) {
    total++;
    const where = "Topic " + t.id + " / " + q.id + ": ";
    if (!okText(q.q[0]) || !okText(q.q[1])) bad(where + "question missing EN/DE");
    if (!okText(q.e[0]) || !okText(q.e[1])) bad(where + "explanation missing EN/DE");
    if (q.a.length !== 4) bad(where + "needs exactly 4 options");
    ["en", "de"].forEach(function (lang, li) {
      const texts = q.a.map(function (a) { return a && a[li]; });
      if (!texts.every(okText)) bad(where + "empty option (" + lang + ")");
      if (new Set(texts).size !== 4) bad(where + "options are not distinct (" + lang + "): " + texts.join(" | "));
    });
    if (seenQ.has(q.q[0])) bad(where + "duplicate question text");
    seenQ.add(q.q[0]);
  });
});

if (problems.length) {
  console.error("✗ " + problems.length + " problem(s):\n - " + problems.join("\n - "));
  process.exit(1);
}
console.log("✓ " + WOS.topics.length + " steps, " + total + " questions (EN + DE), all checks passed.");

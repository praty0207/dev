# The World of Science 🔬

A mobile- and desktop-friendly website that makes learning science fun for children (MVP: Grade 5, English + German).

**Run it:** open `index.html` in a browser (no build, no server, no internet needed), or host the folder on any static web host.

## MVP checklist (from the project notes)
| Requirement | Status |
|---|---|
| Simulations | 3 labs: states of matter, electric circuit, light & shadow |
| Quizzes & points | 10 points per right answer, +30 bonus for first pass, levels every 150 points, 1–3 stars |
| Science, Grade 5 | 20 topics, 240 questions (12 per step) |
| 10 or 20 questions (selectable) | Short / Long choice before each quiz |
| Language selectable (EN / DE) | Switch any time (header) |
| Results + save results | Saved per profile in the browser |
| Individual accounts / profiles | Name + animal buddy, no e-mail/password, data stays on the device |
| Progress chart, updated after every test | Line chart of all quizzes + best score per step |
| Questions change every test | Least-seen questions first, shuffled order and answers |
| If failed, retake is mandatory | Failed step locks everything else until passed (survives reload) |
| Grade plan, 20 steps/milestones | Adventure map, 🏆 milestone every 5 steps |
| Multiple choice (4 options), 70% to pass | Yes |
| Wrong answers show explanation + correct answer | Yes, after every question and again in the result |

## Not yet included (from the notes' wider vision)
Placement questionnaire, microscope views, background music, small games, other grades.

## Content
Questions live in `js/data/`. Each is `Q(question, correct, wrong1, wrong2, wrong3, explanation)` as English/German pairs.
Check the bank with `node tools/validate-questions.js`.
The questions follow typical Grade 5/6 science topics; they should be reviewed by a teacher against the current Berlin-Brandenburg Rahmenlehrplan before real use.

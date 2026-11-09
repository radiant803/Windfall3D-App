// node --test .github/scripts/triage.test.cjs
const test = require("node:test");
const assert = require("node:assert");
const { check, parseForm } = require("./triage.cjs");

const CONTEXT = { releases: ["0.2.1", "0.2.0"], openTitles: [{ number: 7, title: "[Bug]: Window stays blank after update" }] };

function bugBody(over = {}) {
  const f = {
    "Windfall3D version": "0.2.1",
    "Operating system": "macOS (Apple silicon)",
    "Which assistant?": "ChatGPT desktop app (Work mode)",
    "What happened?": "The model appeared in the chat but the window never showed it, even after waiting two minutes.",
    "Steps to reproduce": "1. Open the app\n2. Ask ChatGPT for a bracket\n3. Watch the window",
    "What did you expect?": "The bracket to appear in the window",
    "Anything else?": "_No response_",
    "Before you submit": "- [X] I searched the existing issues\n- [X] I am using the latest version",
    ...over,
  };
  return Object.entries(f).map(([k, v]) => `### ${k}\n\n${v}`).join("\n\n");
}

const bug = (over, title = "[Bug]: Window does not show the model from ChatGPT") => ({
  title,
  body: bugBody(over),
  labels: ["bug"],
});

test("parses a form, treating 'No response' as empty", () => {
  const f = parseForm(bugBody());
  assert.strictEqual(f["Windfall3D version"], "0.2.1");
  assert.strictEqual(f["Anything else?"], "");
});

test("a complete bug report passes", () => {
  const r = check(bug(), CONTEXT);
  assert.deepStrictEqual(r.problems, []);
  assert.ok(r.ok);
});

test("an issue not made with a form is refused", () => {
  const r = check({ title: "it does not work", body: "help", labels: [] }, CONTEXT);
  assert.ok(!r.ok);
  assert.match(r.problems[0], /forms/);
});

test("a vague description is refused, naming the field", () => {
  const r = check(bug({ "What happened?": "broken" }), CONTEXT);
  assert.ok(!r.ok);
  assert.ok(r.problems.some((p) => p.includes("What happened?")));
});

test("an older version is asked to update first", () => {
  const r = check(bug({ "Windfall3D version": "0.2.0" }), CONTEXT);
  assert.ok(r.problems.some((p) => p.includes("latest version") && p.includes("0.2.1")));
});

test("a version that was never released is refused", () => {
  const r = check(bug({ "Windfall3D version": "3.0.0" }), CONTEXT);
  assert.ok(r.problems.some((p) => p.includes("not a released version")));
});

test("no version number at all is refused", () => {
  const r = check(bug({ "Windfall3D version": "latest" }), CONTEXT);
  assert.ok(r.problems.some((p) => p.includes("version number")));
});

test("unticked boxes are refused", () => {
  const r = check(bug({ "Before you submit": "- [X] I searched the existing issues\n- [ ] I am using the latest version" }), CONTEXT);
  assert.ok(r.problems.some((p) => p.includes("tick every box")));
});

test("a duplicate title points at the existing issue", () => {
  const r = check(bug({}, "[Bug]: window stays blank after update!"), CONTEXT);
  assert.ok(r.problems.some((p) => p.includes("#7")));
});

test("a one-word title is refused", () => {
  const r = check(bug({}, "[Bug]: help"), CONTEXT);
  assert.ok(r.problems.some((p) => p.includes("title")));
});

test("link spam is refused", () => {
  const links = Array.from({ length: 6 }, (_, i) => `https://example.com/${i}`).join(" ");
  const r = check(bug({ "Anything else?": links }), CONTEXT);
  assert.ok(r.problems.some((p) => p.includes("links")));
});

test("a feature request needs the problem and the proposal", () => {
  const body = [
    "### What problem would this solve?\n\nI print parts for a robot and have to export each body separately, which takes a long time every revision.",
    "### What would you like to happen?\n\nAn option to export every body as its own file at once",
    "### Before you submit\n\n- [X] I searched the existing issues",
  ].join("\n\n");
  assert.ok(check({ title: "[Feature]: Export all bodies at once", body, labels: ["enhancement"] }, CONTEXT).ok);
  const thin = body.replace("An option to export every body as its own file at once", "pls");
  assert.ok(!check({ title: "[Feature]: Export all bodies at once", body: thin, labels: ["enhancement"] }, CONTEXT).ok);
});

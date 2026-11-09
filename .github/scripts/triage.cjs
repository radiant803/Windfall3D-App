// Screens every new or edited issue before a maintainer looks at it.
//
// An issue that is missing what we need to act on it is closed with a comment saying exactly what
// to add; editing it to fill the gaps reopens it automatically. One that passes is labelled
// "pending review" until a maintainer adds "approved" (or "rejected", which closes it).
//
// check() is pure, so it can be tested without GitHub (see triage.test.cjs). run() does the
// GitHub calls, from actions/github-script.

const LABELS = {
  pending: "pending review",
  approved: "approved",
  rejected: "rejected",
  needsInfo: "needs info",
};
const MARKER = "<!-- windfall-triage -->";
const MAINTAINERS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
// A maintainer can try the screening on their own issue by starting the title with this.
const TEST_PREFIX = "[triage-test]";
const NO_RESPONSE = "_No response_";

/** The answers of an issue form: { "Heading": "value" }, or null when it is not a form. */
function parseForm(body) {
  const fields = {};
  const parts = String(body || "").split(/^### /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const name = (nl < 0 ? part : part.slice(0, nl)).trim();
    let value = nl < 0 ? "" : part.slice(nl + 1).trim();
    if (value === NO_RESPONSE) value = "";
    fields[name] = value;
  }
  return Object.keys(fields).length ? fields : null;
}

function words(text) {
  return String(text || "").split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

function normaliseTitle(title) {
  return String(title || "")
    .replace(/^\s*\[(bug|feature|help|triage-test)\]\s*:?\s*/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseVersion(v) {
  const m = String(v || "").match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? m.slice(1).map(Number) : null;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

const KINDS = {
  bug: {
    label: "bug",
    required: {
      "Windfall3D version": { min: 5 },
      "Operating system": { min: 3 },
      "What happened?": { words: 10, hint: "describe what went wrong in at least a sentence or two" },
      "Steps to reproduce": { words: 6, hint: "list the steps that lead to the problem" },
      "What did you expect?": { words: 3, hint: "say what you expected to happen instead" },
    },
    version: true,
  },
  feature: {
    label: "enhancement",
    required: {
      "What problem would this solve?": { words: 10, hint: "explain the problem in at least a sentence or two" },
      "What would you like to happen?": { words: 6, hint: "describe the change you would like" },
    },
  },
  help: {
    label: "question",
    required: {
      "Windfall3D version": { min: 5 },
      "Operating system": { min: 3 },
      "What are you trying to do?": { words: 10, hint: "describe what you are trying to do" },
      "What have you tried?": { words: 5, hint: "say what you have tried so far, including the Help section in the app" },
    },
    version: true,
  },
};

const CHECKBOX_HEADING = "Before you submit";

/**
 * Decide whether an issue is ready for review.
 *   issue: { title, body, labels: [names] }
 *   context: { releases: ["0.2.1", ...] newest first, openTitles: [{ number, title }] (others) }
 * Returns { ok, kind, problems: [strings] }.
 */
function check(issue, context) {
  const problems = [];
  const labels = issue.labels || [];
  const kind = Object.keys(KINDS).find((k) => labels.includes(KINDS[k].label));
  const form = parseForm(issue.body);

  if (!kind || !form) {
    return {
      ok: false,
      kind: kind || null,
      problems: [
        "Please open the issue with one of the forms (Bug report, Feature request or Help), so it has everything needed to act on it.",
      ],
    };
  }

  const title = normaliseTitle(issue.title);
  if (words(title) < 3) problems.push("Give the issue a title that says what it is about, in a few words.");

  for (const [name, rule] of Object.entries(KINDS[kind].required)) {
    const value = form[name] || "";
    const tooShort = rule.words ? words(value) < rule.words : value.trim().length < (rule.min || 1);
    if (tooShort) problems.push(`**${name}**: ${rule.hint || "this is required"}.`);
  }

  if (KINDS[kind].version && form["Windfall3D version"]) {
    const given = parseVersion(form["Windfall3D version"]);
    const released = (context.releases || []).map(parseVersion).filter(Boolean);
    const latest = released[0];
    if (!given) {
      problems.push("**Windfall3D version**: give the version number, such as `0.2.1`. It is shown at the bottom of the panel in the app.");
    } else if (!released.some((r) => compareVersions(r, given) === 0)) {
      problems.push(`**Windfall3D version**: \`${given.join(".")}\` is not a released version. Check the number at the bottom of the panel in the app.`);
    } else if (latest && compareVersions(given, latest) < 0) {
      problems.push(`**Windfall3D version**: please install the latest version, \`${latest.join(".")}\`, and check the problem still happens there.`);
    }
  }

  const ticks = form[CHECKBOX_HEADING] || "";
  const unticked = (ticks.match(/- \[ \]/g) || []).length;
  if (!/- \[x\]/i.test(ticks) || unticked > 0) {
    problems.push(`**${CHECKBOX_HEADING}**: tick every box.`);
  }

  const links = (String(issue.body || "").match(/https?:\/\//g) || []).length;
  if (links > 5) problems.push("Please include no more than 5 links.");

  const dup = (context.openTitles || []).find((o) => title && normaliseTitle(o.title) === title);
  if (dup) problems.push(`This looks like a duplicate of #${dup.number}. Please add your details there instead.`);

  return { ok: problems.length === 0, kind, problems };
}

function invalidComment(problems) {
  return [
    MARKER,
    "Thanks for reporting this. It has been closed for now because it is missing what we need to act on it:",
    "",
    ...problems.map((p) => `- ${p}`),
    "",
    "**Edit the issue** to add these, and it will reopen by itself and go to a maintainer for review.",
  ].join("\n");
}

const PENDING_COMMENT = [
  MARKER,
  "Thanks, this has everything we need. It is now waiting for a maintainer to review it.",
].join("\n");

async function ensureLabel(github, repo, name, color, description) {
  try {
    await github.rest.issues.getLabel({ ...repo, name });
  } catch {
    await github.rest.issues.createLabel({ ...repo, name, color, description });
  }
}

async function setComment(github, repo, number, body) {
  const comments = await github.paginate(github.rest.issues.listComments, { ...repo, issue_number: number });
  const mine = comments.find((c) => c.user && c.user.type === "Bot" && String(c.body).startsWith(MARKER));
  if (mine) {
    if (mine.body !== body) await github.rest.issues.updateComment({ ...repo, comment_id: mine.id, body });
  } else {
    await github.rest.issues.createComment({ ...repo, issue_number: number, body });
  }
}

async function removeLabel(github, repo, number, name) {
  try {
    await github.rest.issues.removeLabel({ ...repo, issue_number: number, name });
  } catch {
    /* it was not there */
  }
}

async function run({ github, context, core }) {
  const repo = context.repo;
  const action = context.payload.action;
  const issue = context.payload.issue;
  if (!issue || issue.pull_request) return;
  const number = issue.number;
  const labels = issue.labels.map((l) => l.name);

  await ensureLabel(github, repo, LABELS.pending, "fbca04", "Passed screening; waiting for a maintainer");
  await ensureLabel(github, repo, LABELS.approved, "0e8a16", "Accepted by a maintainer");
  await ensureLabel(github, repo, LABELS.rejected, "b60205", "Declined by a maintainer");
  await ensureLabel(github, repo, LABELS.needsInfo, "d93f0b", "Missing information; edit the issue to reopen it");

  // A maintainer's decision. Only people with triage access can add labels.
  if (action === "labeled") {
    const added = context.payload.label && context.payload.label.name;
    if (added === LABELS.approved) {
      await removeLabel(github, repo, number, LABELS.pending);
      await removeLabel(github, repo, number, LABELS.needsInfo);
      await removeLabel(github, repo, number, LABELS.rejected);
    } else if (added === LABELS.rejected) {
      await removeLabel(github, repo, number, LABELS.pending);
      await removeLabel(github, repo, number, LABELS.approved);
      if (issue.state === "open") {
        await github.rest.issues.update({ ...repo, issue_number: number, state: "closed", state_reason: "not_planned" });
      }
    }
    return;
  }

  // Once a maintainer has decided, later edits change nothing.
  if (labels.includes(LABELS.approved) || labels.includes(LABELS.rejected)) return;

  const testing = String(issue.title).toLowerCase().startsWith(TEST_PREFIX);
  if (MAINTAINERS.has(issue.author_association) && !testing) {
    await github.rest.issues.addLabels({ ...repo, issue_number: number, labels: [LABELS.approved] });
    return;
  }

  // Closed by someone else, not by this screening: an edit must not reopen it.
  if (issue.state === "closed" && !labels.includes(LABELS.needsInfo)) return;

  const releases = (await github.paginate(github.rest.repos.listReleases, { ...repo, per_page: 100 }))
    .filter((r) => !r.draft)
    .map((r) => r.tag_name.replace(/^v/, ""))
    .filter((v) => parseVersion(v))
    .sort((a, b) => compareVersions(parseVersion(b), parseVersion(a)));
  const open = await github.paginate(github.rest.issues.listForRepo, { ...repo, state: "open", per_page: 100 });
  const openTitles = open
    .filter((o) => !o.pull_request && o.number !== number)
    .map((o) => ({ number: o.number, title: o.title }));

  const result = check({ title: issue.title, body: issue.body, labels }, { releases, openTitles });
  core.info(`#${number}: ${result.ok ? "passed" : "needs info"} ${JSON.stringify(result.problems)}`);

  if (result.ok) {
    await removeLabel(github, repo, number, LABELS.needsInfo);
    await github.rest.issues.addLabels({ ...repo, issue_number: number, labels: [LABELS.pending] });
    await setComment(github, repo, number, PENDING_COMMENT);
    if (issue.state === "closed") {
      await github.rest.issues.update({ ...repo, issue_number: number, state: "open" });
    }
  } else {
    await removeLabel(github, repo, number, LABELS.pending);
    await github.rest.issues.addLabels({ ...repo, issue_number: number, labels: [LABELS.needsInfo] });
    await setComment(github, repo, number, invalidComment(result.problems));
    if (issue.state === "open") {
      await github.rest.issues.update({ ...repo, issue_number: number, state: "closed", state_reason: "not_planned" });
    }
  }
}

module.exports = { check, parseForm, normaliseTitle, run, LABELS, MARKER };

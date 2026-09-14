const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "member.html"), "utf8");
const css = fs.readFileSync(path.join(root, "member.css"), "utf8");
const script = fs.readFileSync(path.join(root, "js", "audio-practice.js"), "utf8");

test("audio practice script dependencies exist exactly once in member markup", () => {
  const requiredIds = [...new Set([...script.matchAll(/\$\(["']([^"']+)["']\)/g)].map((match) => match[1]))];
  const pageIds = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);

  for (const id of requiredIds) {
    assert.equal(pageIds.filter((candidate) => candidate === id).length, 1, `Expected one #${id}`);
  }

  assert.equal(new Set(pageIds).size, pageIds.length, "member.html must not contain duplicate IDs");
});

test("member page loads the Phase 2 practice panel and fresh assets", () => {
  assert.match(html, /id="practiceAppPanel"/);
  assert.doesNotMatch(html, /id="audioRecorderPanel"/);
  assert.match(html, /member\.css\?v=5/);
  assert.match(html, /audio-practice\.js\?v=4/);
});

test("practice curriculum has responsive styling", () => {
  assert.match(css, /\.practice-module-grid\s*\{/);
  assert.match(css, /\.selected-practice\s*\{/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*\.practice-guide-grid/);
});

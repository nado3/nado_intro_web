const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const directoryCss = fs.readFileSync(path.join(root, 'directory-application.css'), 'utf8');
const matchingGuardSource = fs.readFileSync(path.join(root, 'js', 'matching-guard.js'), 'utf8');

test('application choice cards are native keyboard-operable buttons with exposed state', () => {
  assert.ok(source.includes('<button type="button" class="tier-opt '));
  assert.ok(source.includes('<button type="button" class="opt trial-place-opt '));
  assert.ok(source.includes('<button type="button" class="opt rank '));
  assert.ok(source.includes('<button type="button" class="opt songdo-sub-place '));
  assert.match(source, /<button type="button" class="opt ' \+ \(step\.type==='multi'/);
  assert.ok(source.includes('<button type="button" class="time-slot '));
  assert.match(source, /data-key="' \+ key \+ '" aria-pressed=/);
  assert.match(source, /class="duration-options" role="group" aria-labelledby="questionTitle"/);
  assert.match(source, /class="service-area-options" role="group" aria-labelledby="serviceAreaLabel"/);
  assert.match(source, /class="day-tabs" id="dayTabs" role="group" aria-label="요일 선택"/);
  assert.doesNotMatch(source, /<div class="opt (?:trial-place-opt|rank |songdo-sub-place)/);
});

test('selection updates keep aria-pressed synchronized with visual state', () => {
  assert.match(source, /o\.setAttribute\('aria-pressed', 'false'\)/);
  assert.match(source, /el\.setAttribute\('aria-pressed', 'true'\)/);
  assert.match(source, /option\.setAttribute\('aria-pressed', 'true'\)/);
  assert.match(source, /el\.setAttribute\('aria-pressed', String\(arr\.includes\(val\)\)\)/);
  assert.match(source, /slot\.setAttribute\('aria-pressed', String\(shouldSelect\)\)/);
  assert.match(source, /event\.detail !== 0/);
  assert.match(css, /\.opt:focus-visible,[\s\S]*\.time-slot:focus-visible/);
});

test('duration remains a separate labelled keyboard step', () => {
  assert.doesNotMatch(source, /<fieldset class="inline-duration-picker">/);
  assert.match(source, /class="duration-options" role="group" aria-labelledby="questionTitle"/);
  assert.match(source, /if \(!TRIAL_MODE\) return steps\.filter\(s => s\.key !== 'trialType' && s\.key !== 'startDate'\)/);
  assert.match(source, /if \(option\.disabled\) return;/);
});

test('user-entered application values are escaped before innerHTML re-rendering', () => {
  const helperStart = source.indexOf('function escapeApplicationHtml');
  const helperEnd = source.indexOf('function serviceAreaLabel');
  assert.ok(helperStart >= 0 && helperEnd > helperStart);

  const context = vm.createContext({ String });
  vm.runInContext(source.slice(helperStart, helperEnd) + '\nthis.escapeForTest = escapeApplicationHtml;', context);
  assert.equal(
    context.escapeForTest(`<img src=x onerror="boom">Tom & 'Lee'`),
    '&lt;img src=x onerror=&quot;boom&quot;&gt;Tom &amp; &#39;Lee&#39;'
  );

  [
    /escapeApplicationHtml\(answers\.preferredPlace \|\| ''\)/,
    /escapeApplicationHtml\(answers\.referralOther \|\| ''\)/,
    /escapeApplicationHtml\(answers\.goalsOther \|\| ''\)/,
    /escapeApplicationHtml\(val\) \+ '<\/textarea>/,
    /escapeApplicationHtml\(v\.name\)/,
    /escapeApplicationHtml\(v\.phone\)/,
    /escapeApplicationHtml\(today\)/,
    /escapeApplicationHtml\(val\) \+ '" aria-labelledby="questionTitle"/
  ].forEach(pattern => assert.match(source, pattern));

  assert.doesNotMatch(source, /value="' \+ \(answers\.(?:preferredPlace|referralOther|goalsOther) \|\| ''\)/);
  assert.doesNotMatch(source, /value="' \+ v\.(?:name|phone) \+ '"/);
});

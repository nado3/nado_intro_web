const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const initializationEnd = source.indexOf('const ANALYTICS_FORM_ID');
assert.ok(initializationEnd > 0, 'Application initialization must precede analytics and DOM rendering');
const initialization = source.slice(0, initializationEnd);

// Execute the application's own URL parsing, answer initialization, and step building.
// Stop before rendering so these tests do not need a browser or make any requests.
function initializeApplication({ trial = false, params = {} } = {}) {
  const location = new URL(trial ? 'https://hellonado.com/trial.html' : 'https://hellonado.com/apply.html');
  location.search = new URLSearchParams(params).toString();
  const context = vm.createContext({
    URL,
    URLSearchParams,
    location,
    window: { location },
    document: { body: { dataset: trial ? { mode: 'trial' } : {} } }
  });
  return JSON.parse(vm.runInContext(initialization + `
    JSON.stringify({
      answers,
      current,
      currentStep: activeSteps[current].key,
      activeStepKeys: activeSteps.map(step => step.key),
      directorySelection: DIRECTORY_SELECTION
    });
  `, context, { timeout: 1000 }));
}

test('regular applications go from age and plan directly to duration and place', () => {
  const flow = initializeApplication();
  assert.deepEqual(flow.activeStepKeys.slice(0, 4), ['ageGroup', 'tier', 'duration', 'place']);
  assert.equal(flow.currentStep, 'ageGroup');
  assert.equal(flow.answers.matchingMethod, '나도 추천받기');
  assert.equal(flow.answers.lessonKind, '정규 수업');
  assert.equal(flow.answers.frequency, '주 1회');
  assert.equal(flow.activeStepKeys.includes('matchingMethod'), false);
});

test('paid trial applications go from age and plan directly to place', () => {
  const flow = initializeApplication({ trial: true });
  assert.deepEqual(flow.activeStepKeys.slice(0, 3), ['ageGroup', 'tier', 'place']);
  assert.equal(flow.currentStep, 'ageGroup');
  assert.equal(flow.answers.matchingMethod, '나도 추천받기');
  assert.equal(flow.answers.lessonKind, '체험 수업');
  assert.equal(flow.answers.trialType, '플랜 선택 체험');
  assert.equal(flow.answers.frequency, '체험 1회');
  assert.equal(flow.answers.duration.index, 0);
  assert.equal(flow.activeStepKeys.includes('duration'), false);
  assert.equal(flow.activeStepKeys.includes('matchingMethod'), false);
});

test('legacy direct-choice URLs use recommendations without a selected teacher', () => {
  for (const trial of [false, true]) {
    const flow = initializeApplication({ trial, params: { matching_method: 'direct' } });
    assert.equal(flow.answers.matchingMethod, '나도 추천받기');
    assert.equal(flow.directorySelection, null);
    assert.equal(flow.currentStep, 'ageGroup');
    assert.equal(flow.activeStepKeys.includes('matchingMethod'), false);
  }
});

test('resuming details preserves the chosen age and plan and begins after the plan', () => {
  for (const trial of [false, true]) {
    for (const matchingMethod of ['recommended', 'direct']) {
      const flow = initializeApplication({ trial, params: {
        resume: 'details',
        matching_method: matchingMethod,
        age_group: '30대',
        plan: 'standard',
        frequency: '2'
      } });
      assert.equal(flow.answers.ageGroup, '30대');
      assert.equal(flow.answers.tier, '스탠다드');
      assert.equal(flow.answers.matchingMethod, '나도 추천받기');
      assert.equal(flow.answers.frequency, trial ? '체험 1회' : '주 2회');
      assert.equal(flow.currentStep, trial ? 'place' : 'duration');
      assert.equal(flow.activeStepKeys[flow.current - 1], 'tier');
    }
  }
});

test('a details URL without a valid plan cannot skip the initial questions', () => {
  for (const trial of [false, true]) {
    for (const plan of ['', 'not-a-plan']) {
      const flow = initializeApplication({ trial, params: {
        resume: 'details', matching_method: 'direct', age_group: '20대', plan
      } });
      assert.equal(flow.currentStep, 'ageGroup');
      assert.equal(flow.answers.ageGroup, '20대');
      assert.equal(flow.answers.tier, undefined);
      assert.equal(flow.answers.matchingMethod, '나도 추천받기');
    }
  }
});

function selectedTeacherParams(trial) {
  return {
    source: 'teacher-directory',
    source_kind: 'live',
    teacher_id: '123e4567-e89b-42d3-a456-426614174000',
    teacher_name: 'Amy',
    plan: 'standard',
    region: 'Songdo',
    area: '트리플스트리트',
    day: '월요일',
    start: '13:00',
    end: '15:00',
    available_minutes: '120',
    mode: trial ? 'trial' : 'regular'
  };
}

test('valid existing teacher selections retain their teacher and selected-teacher flow', () => {
  for (const trial of [false, true]) {
    const flow = initializeApplication({ trial, params: selectedTeacherParams(trial) });
    assert.equal(flow.directorySelection.teacherName, 'Amy');
    assert.equal(flow.answers.teacher_id, '123e4567-e89b-42d3-a456-426614174000');
    assert.equal(flow.answers.teacher_name, 'Amy');
    assert.equal(flow.answers.matchingMethod, '선생님 직접 선택');
    assert.equal(flow.answers.matching_type, 'directory_selected');
    assert.equal(flow.answers.tier, '스탠다드');
    assert.equal(flow.answers.selection_source, 'teacher-directory');
    assert.equal(flow.currentStep, 'ageGroup');
    assert.equal(flow.activeStepKeys.includes('matchingMethod'), false);
    assert.equal(flow.activeStepKeys.includes('place'), false);
    assert.equal(flow.activeStepKeys.includes('duration'), !trial);
  }
});

test('returning from teacher selection still resumes after the previously completed plan', () => {
  for (const trial of [false, true]) {
    const flow = initializeApplication({ trial, params: {
      ...selectedTeacherParams(trial), application_flow: '1', age_group: '40대'
    } });
    assert.equal(flow.answers.ageGroup, '40대');
    assert.equal(flow.answers.tier, '스탠다드');
    assert.equal(flow.answers.matching_type, 'directory_selected');
    assert.equal(flow.currentStep, trial ? 'gender' : 'duration');
    assert.equal(flow.activeStepKeys[flow.current - 1], 'tier');
  }
});

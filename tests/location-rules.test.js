const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('general lesson pages use the unified service-area wording', () => {
  for (const file of ['index.html', 'how.html', 'apply.html', 'teachers.html']) {
    const content = read(file);
    assert.match(content, /서울 및 인천 지역/, `${file} is missing the unified service area`);
    assert.doesNotMatch(content, /서울 및 인천 일부 지역|인천 일부 지역/, `${file} still contains partial-area wording`);
  }
});

test('free trial remains limited to IGC or Triple Street', () => {
  const script = read('script.js');
  assert.match(script, /\['IGC 인천글로벌캠퍼스', '송도 트리플스트리트'\]/);
  assert.match(script, /무료 체험은 아래 두 곳 중에서 진행됩니다/);
  assert.match(read('how.html'), /무료 체험은 IGC 인천글로벌캠퍼스 또는 송도 트리플스트리트에서만 진행됩니다/);
});

test('Songdo discount is fixed at 10,000 won for every regular plan', () => {
  const script = read('script.js');
  assert.match(script, /const SONGDO_LOCATION_DISCOUNT = 10000/);
  assert.match(script, /const songdoDiscount = answers\.placeType === '송도 할인 장소'/);
  assert.match(script, /\['서울 원하는 장소', '인천 원하는 장소', '송도 할인 장소'\]/);
  assert.match(script, /송도 지정 장소 할인/);

  const pricingSource = script.split('const steps =')[0]
    + '\nglobalThis.pricing = { calcPrice };';
  const sandbox = {
    TRIAL_MODE: false,
    answers: { placeType: '송도 할인 장소' }
  };
  vm.runInNewContext(pricingSource, sandbox);
  assert.equal(sandbox.pricing.calcPrice('이코노미', 0, '주 1회'), 130000);
  assert.equal(sandbox.pricing.calcPrice('스탠다드', 0, '주 1회'), 170000);
  assert.equal(sandbox.pricing.calcPrice('프리미엄', 0, '주 1회'), 210000);
  sandbox.answers.placeType = '서울 원하는 장소';
  assert.equal(sandbox.pricing.calcPrice('이코노미', 0, '주 1회'), 140000);
});

test('pricing cards show regular prices and describe Songdo discount separately', () => {
  const html = read('index.html');
  for (const price of ['₩140,000', '₩180,000', '₩220,000']) {
    assert.match(html, new RegExp(price));
  }
  assert.doesNotMatch(html, /송도 지정 장소 할인 적용 시/);
  assert.match(html, /송도 지정 장소 선택 시 월 1만원 할인/);
});

test('hero copy remains unchanged', () => {
  const html = read('index.html');
  assert.match(html, />미국 대학생과 1:1 영어회화</);
  assert.match(html, />진짜 영어는</);
  assert.match(html, />만나서 합니다\.</);
  assert.match(html, />나도에서 미국 대학생과 만나 영어로 대화해보세요\.</);
});

test('plans list available English types and Economy still excludes business English', () => {
  const script = read('script.js');
  const index = read('index.html');
  assert.doesNotMatch(script + index, /최우수 선생님 3명 중 선택/);
  assert.match(script, /desc: '나도 최우수 선생님 배정'/);
  assert.match(index, /나도 최우수 선생님 배정/);
  assert.match(script, /step\.key === 'goals' && answers\.tier === '이코노미'/);
  assert.match(script, /filter\(opt => opt !== '비즈니스'\)/);
  assert.match(index, /일상회화 · 여행영어 · 시험\/면접 · 발음교정/);
  assert.match(index, /일상회화 · 비즈니스 · 여행영어 · 시험\/면접 · 발음교정/);
});

test('root structured data lists Seoul and Incheon coverage', () => {
  const html = read('index.html');
  const json = html.match(/<script id="seo-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(json, 'structured data block is missing');
  const data = JSON.parse(json[1]);
  const organization = data['@graph'].find((item) => item['@type'] === 'EducationalOrganization');
  assert.deepEqual(organization.areaServed.map((item) => item.name), ['서울', '인천']);
});

test('legacy broad location claims are absent from served content', () => {
  const servedFiles = ['index.html', 'how.html', 'apply.html', 'trial.html', 'teachers.html', 'script.js'];
  const content = servedFiles.map(read).join('\n');
  for (const legacy of ['인천 송도에서', '인천·서울', '서울·인천', '송도 원하는 곳 어디서든', '원하는 곳 어디서나']) {
    assert.doesNotMatch(content, new RegExp(legacy), `legacy copy remains: ${legacy}`);
  }
});

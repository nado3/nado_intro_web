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
    assert.match(content, /서울 및 송도 지역/, `${file} is missing the unified service area`);
    assert.doesNotMatch(content, /서울 및 인천 일부 지역|인천 일부 지역/, `${file} still contains partial-area wording`);
  }
});

test('free trial remains limited to IGC or Triple Street', () => {
  const script = read('script.js');
  assert.match(script, /\['IGC 인천글로벌캠퍼스', '송도 트리플스트리트'\]/);
  assert.match(script, /무료 체험은 아래 두 곳 중에서 진행됩니다/);
  assert.match(read('faq.html'), /Economy 방식의 1시간 무료 체험/);
});

test('Songdo discount is fixed at 10,000 won for every regular plan', () => {
  const script = read('script.js');
  assert.match(script, /const SONGDO_LOCATION_DISCOUNT = 10000/);
  assert.match(script, /const songdoDiscount = answers\.placeType === '송도 할인 장소'/);
  assert.doesNotMatch(script, /const songdoDiscount =[^\n]*tier !== '이코노미'/);
  assert.match(script, /\['서울 원하는 장소', '송도 원하는 장소', '송도 할인 장소'\]/);
  assert.match(script, /송도 지정 장소 할인/);
  assert.match(script, /!TRIAL_MODE && answers\.placeType === '송도 할인 장소'/);

  const pricingSource = script.split('const steps =')[0]
    + '\nglobalThis.pricing = { calcPrice };';
  const sandbox = {
    TRIAL_MODE: false,
    answers: { placeType: '송도 할인 장소' }
  };
  vm.runInNewContext(pricingSource, sandbox);
  assert.equal(sandbox.pricing.calcPrice('이코노미', 0, '주 1회'), 130000);
  assert.equal(sandbox.pricing.calcPrice('이코노미', 1, '주 1회'), 270000);
  assert.equal(sandbox.pricing.calcPrice('이코노미', 0, '주 2회'), 270000);
  assert.equal(sandbox.pricing.calcPrice('스탠다드', 0, '주 1회'), 170000);
  assert.equal(sandbox.pricing.calcPrice('프리미엄', 0, '주 1회'), 210000);
  sandbox.answers.placeType = '서울 원하는 장소';
  assert.equal(sandbox.pricing.calcPrice('이코노미', 0, '주 1회'), 140000);
  sandbox.TRIAL_MODE = true;
  sandbox.answers.trialType = '플랜 선택 체험';
  sandbox.answers.placeType = '송도 할인 장소';
  assert.equal(sandbox.pricing.calcPrice('이코노미', 0, '체험 1회'), 35000);
  assert.equal(sandbox.pricing.calcPrice('스탠다드', 0, '체험 1회'), 45000);
  assert.equal(sandbox.pricing.calcPrice('프리미엄', 0, '체험 1회'), 55000);
});

test('pricing cards show regular prices and describe Songdo discount separately', () => {
  const html = read('index.html');
  for (const price of ['₩140,000', '₩180,000', '₩220,000']) {
    assert.match(html, new RegExp(price));
  }
  assert.doesNotMatch(html, /송도 지정 장소 할인 적용 시/);
  assert.match(html, /송도 지정 장소 선택 시 월 1만원 할인/);
  assert.match(read('teachers.html'), /송도 지정 장소 수업 시 월 1만원 할인/);
  assert.match(html, /월 14만원부터 저렴하게 1:1 오프라인/);
  const discountCopy = ['index.html', 'teachers.html', 'how.html'].map(read).join('\n');
  assert.doesNotMatch(discountCopy, /Standard·Premium(?:은)?[^\n<]*지정 장소[^\n<]*할인/);
  assert.match(html, /Most Popular/);
  assert.doesNotMatch(html, /초등학생 이하 수업은 월 2만원 추가/);
});

test('hero keeps the original introduction', () => {
  const html = read('index.html');
  assert.match(html, />미국 대학생과 1:1 영어회화</);
  assert.match(html, />진짜 영어는</);
  assert.match(html, />만나서 합니다\.</);
  assert.match(html, />나도에서 미국 대학생과 만나 영어로 대화해보세요\.</);
});

test('application plans show customized Standard copy and Premium help', () => {
  const script = read('script.js');
  const index = read('index.html');
  const preferenceScript = read('js/manual-teacher-preference.js');
  const integrityScript = read('js/application-integrity-fix.js');
  assert.match(script, /나도 최우수 선생님과 함께 비즈니스·전문 목표에 집중하세요/);
  assert.match(script, /premium-plan-help/);
  assert.match(script, /부담 없이 시작/);
  assert.match(script, /내 목표와 수준에 맞춘 체계적인 수업을 경험하세요/);
  assert.match(index, /나도가 제공하는 기본 커리큘럼 중 나의 목적과 맞는 자료로 진행/);
  assert.match(index, /선생님이 자료와 수업 흐름을 개별적으로 준비/);
  assert.match(index, /선생님의 진행 의사와 일정을 확인한 후 확정/);
  assert.match(script, /step\.key === 'goals' && answers\.tier !== '프리미엄'/);
  assert.match(script, /filter\(opt => opt !== '비즈니스'\)/);
  assert.match(script, /answers\.tier !== '프리미엄'[\s\S]*?answers\.goals = answers\.goals\.filter/);
  assert.match(integrityScript, /answers\.tier !== '프리미엄'/);
});

test('root structured data lists Seoul and Songdo coverage', () => {
  const html = read('index.html');
  const json = html.match(/<script id="seo-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(json, 'structured data block is missing');
  const data = JSON.parse(json[1]);
  const organization = data['@graph'].find((item) => item['@type'] === 'EducationalOrganization');
  assert.deepEqual(organization.areaServed.map((item) => item.name), ['서울', '송도']);
});

test('legacy broad location claims are absent from served content', () => {
  const servedFiles = ['index.html', 'how.html', 'apply.html', 'trial.html', 'teachers.html', 'script.js'];
  const content = servedFiles.map(read).join('\n');
  for (const legacy of ['인천 송도에서', '인천·서울', '송도 원하는 곳 어디서든', '원하는 곳 어디서나']) {
    assert.doesNotMatch(content, new RegExp(legacy), `legacy copy remains: ${legacy}`);
  }
});

test('each teacher detail binds its own select button', () => {
  const script = read('script.js');
  assert.match(script, /detail\.querySelector\('\.teacher-select-btn'\)/);
  assert.doesNotMatch(script, /id="teacherSelectBtn"/);
});

test('Songdo matching excludes other Incheon locations and preserves canonical IGC', () => {
  const source=read('script.js');
  const helper=source.slice(source.indexOf('function isSongdoMatchingLocation('),source.indexOf('function matchingLocation('));
  const sandbox={};
  vm.runInNewContext(helper,sandbox);
  for (const value of ['IGC 인천글로벌캠퍼스','IGC','송도 트리플스트리트','Triple Street','송도 내 협의','Songdo']) {
    assert.equal(sandbox.isSongdoMatchingLocation(value),true,value);
  }
  for (const value of ['인천','Incheon','구월동','부평역','서울','',null]) {
    assert.equal(sandbox.isSongdoMatchingLocation(value),false,String(value));
  }
  for (const file of ['apply.html','trial.html']) {
    assert.doesNotMatch(read(file), /src="js\/incheon-(?:area-extension|validation-fix)/);
  }
  const served=['index.html','how.html','apply.html','trial.html','teachers.html','script.js','site-nav.js'].map(read).join('\n');
  assert.doesNotMatch(served.replaceAll('인천글로벌캠퍼스',''),/인천/);
  assert.match(source,/IGC 인천글로벌캠퍼스/);
});

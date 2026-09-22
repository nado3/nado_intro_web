const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const homepage = read('index.html');
const teachersPage = read('teachers.html');
const controller = read('homepage-teacher-finder.js');
const carousel = read('homepage-teacher-carousel.js');
const chooser = read('application-path-chooser.js');
const layoutCss = read('homepage-layout.css');
const homepageCss = read('homepage-teacher-finder.css');
const directoryCss = read('teacher-directory.css');
const siteNav = read('site-nav.js');

test('homepage restores the original hero and current-teacher card deck', () => {
  assert.match(homepage, /<section class="hero" id="about">/);
  assert.match(homepage, /진짜 영어는/);
  assert.match(homepage, /1분 만에 신청하기/);
  assert.match(homepage, /href="trial\.html\?lesson_kind=trial">1회 체험수업 신청하기/);
  assert.match(homepage, /id="randomTeachers"/);
  assert.doesNotMatch(homepage, /id="teacher-finder"/);
  assert.doesNotMatch(homepage, /id="teacherDirectoryGrid"/);
  assert.doesNotMatch(homepage, /data-homepage-teacher-carousel/);
});

test('homepage teacher deck is generated from the current fallback instead of stale hardcoded teachers', () => {
  assert.match(homepage, /teacher-directory-data\.js\?v=44/);
  assert.match(homepage, /homepage-teacher-carousel\.js\?v=49/);
  assert.ok(homepage.indexOf('teacher-directory-data.js?v=44') < homepage.indexOf('homepage-teacher-carousel.js?v=49'));
  assert.match(carousel, /NADO_TEACHER_DIRECTORY_FALLBACK/);
  assert.match(carousel, /document\.getElementById\('randomTeachers'\)/);
  assert.match(carousel, /teacher\.displayName/);
  assert.match(carousel, /teacher\.profilePhotoPath/);
  assert.match(carousel, /teacher\.regions/);
  assert.doesNotMatch(carousel, /const teachers\s*=\s*\[/);
  assert.match(carousel, /event\.key === 'Enter' \|\| event\.key === ' '/);
});

test('homepage cards open profiles without carousel controls', () => {
  assert.doesNotMatch(siteNav, /<div class="home-hero-teacher-marquee-controls"/);
  assert.match(siteNav, /let userPaused = reducedMotion\.matches/);
  assert.match(siteNav, /dragDistance >= 8/);
  assert.match(siteNav, /NADOOpenHomeTeacher/);
  assert.match(carousel, /url\.searchParams\.set\('teacher', teacher\.displayName\)/);
  assert.match(carousel, /location\.assign\(url\.href\)/);
});

test('only explicit regular-application triggers open the accessible two-path chooser', () => {
  assert.match(homepage, /<dialog class="application-path-dialog" id="applicationPathDialog" aria-labelledby="applicationPathTitle" aria-describedby="applicationPathIntro">/);
  assert.match(homepage, /href="apply\.html" data-application-chooser>1분 만에 신청하기/);
  assert.match(homepage, /<strong>1\. 바로 신청하기<\/strong>/);
  assert.match(homepage, /<strong>2\. 선생님 둘러보고 신청하기<\/strong>/);
  assert.match(homepage, /href="apply\.html">\s*<strong>1\./);
  assert.match(homepage, /href="teachers\.html">\s*<strong>2\./);
  assert.match(homepage, /href="trial\.html\?lesson_kind=trial">1회 체험수업 신청하기/);
  assert.doesNotMatch(homepage, /href="trial\.html" data-application-chooser/);
  assert.match(chooser, /querySelectorAll\('\[data-application-chooser\]'\)/);
  assert.match(chooser, /event\.preventDefault\(\)/);
  assert.match(chooser, /dialog\.showModal\(\)/);
  assert.match(chooser, /returnFocus\?\.isConnected && returnFocus\.getClientRects\(\)\.length/);
  assert.match(chooser, /document\.getElementById\('navToggle'\)/);
  assert.match(chooser, /returnTarget\?\.focus/);
});

test('teacher page owns the finder controls, region picker, directory, and profile dialog', () => {
  assert.match(teachersPage, /id="teacher-finder"/);
  assert.doesNotMatch(teachersPage, /data-finder-mode="regular"/);
  assert.doesNotMatch(teachersPage, /data-finder-mode="trial"/);
  assert.match(teachersPage, /data-directory-region="Songdo"/);
  assert.match(teachersPage, /data-directory-region="Seoul"/);
  assert.match(teachersPage, /id="teacherDirectoryGrid"/);
  assert.match(teachersPage, /id="teacherProfileDialog"/);
  assert.match(teachersPage, /homepage-teacher-finder\.css\?v=11/);
  assert.match(teachersPage, /homepage-teacher-finder\.js\?v=39/);

  assert.ok(teachersPage.indexOf('teacherRegionPicker') < teachersPage.indexOf('teacherDirectoryGrid'));
});

test('lesson questions belong to the application before age, not the teacher finder', () => {
  assert.doesNotMatch(teachersPage, /id="finderModePicker"|id="trialLessonPanel"/);
  assert.match(read('script.js'), /key:'lessonKind',type:'single'/);
  assert.match(read('script.js'), /\.\.\.buildLessonSteps\(\)/);
});
test('free and paid trial applications remain supported', () => {
  assert.match(read('script.js'), /trial_type','paid'/);
  assert.match(read('script.js'), /trial_type','free'/);
  assert.match(read('script.js'), /isTrialDirectoryAreaValue\(DIRECTORY_SELECTION.area\)/);
});
test('the teacher page offers a single region change button', () => {
  assert.match(teachersPage, /id="finderChange"/);
  assert.doesNotMatch(teachersPage, /id="finderChangeLesson"/);
  assert.match(controller, /selectedRegion='';apply\(\)/);
});
test('finder shows region results immediately', () => {
  assert.match(controller, /api\(\)\?\.selectRegion\(selectedRegion\)/);
  assert.match(controller, /directory.hidden = !selectedRegion/);
  assert.match(teachersPage, /data-manual-apply/);
});
test('finder keeps only region browsing preferences in its URL', () => {
  assert.match(controller, /\['finder','trial_type','plan','region'\].forEach/);
  assert.match(controller, /url.searchParams.set\('region',selectedRegion\)/);
});

test('narrow phones keep the trial call-to-action and promotion inside the hero', () => {
  assert.match(layoutCss, /@media \(max-width: 350px\)[\s\S]*?\.trial-cta-wrap\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(layoutCss, /@media \(max-width: 350px\)[\s\S]*?\.hero-buttons \.btn-text\s*\{[\s\S]*?width:\s*100%[\s\S]*?white-space:\s*nowrap/);
  assert.match(layoutCss, /@media \(max-width: 350px\)[\s\S]*?\.trial-event-bubble\s*\{[\s\S]*?font-size:\s*\.64rem/);
});

test('regular Songdo choice includes the designated-location discount without putting it on trial cards', () => {
  assert.match(teachersPage, /finder-discount-note">\*송도 지정 장소 수업 시 월 1만원 할인/);
  assert.match(directoryCss, /#teacher-finder\[data-finder-mode="trial"\] \.teacher-region-option__benefit\s*\{\s*display:\s*none/);
  const freeTrialCard = teachersPage.match(/data-trial-type="free"[\s\S]*?<\/button>/)?.[0] || '';
  assert.doesNotMatch(freeTrialCard, /월 1만원 할인/);
});

test('local previews keep analytics and manual submissions out of production', () => {
  assert.doesNotMatch(homepage, /<script async src="https:\/\/www\.googletagmanager\.com/);
  assert.match(homepage, /\['hellonado\.com', 'www\.hellonado\.com'\]\.includes/);
  assert.match(controller, /\['localhost', '127\.0\.0\.1', '::1', 'terminal\.local'\]/);
  assert.match(controller, /url\.searchParams\.set\('test', '1'\)/);
});

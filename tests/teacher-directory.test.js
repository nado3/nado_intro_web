const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

global.window = global;
require(path.join(root, 'teacher-directory.js'));
vm.runInThisContext(fs.readFileSync(path.join(root, 'teacher-directory-data.js'), 'utf8'));

const helpers = global.NADO_TEACHER_DIRECTORY_TESTING;
const fallback = global.NADO_TEACHER_DIRECTORY_FALLBACK;

test('directory snapshot contains only teachers available in the selected region', () => {
  const songdo = helpers.teachersForRegion(fallback, 'Songdo');
  const seoul = helpers.teachersForRegion(fallback, 'Seoul');

  assert.equal(songdo.length, 17);
  assert.equal(seoul.length, 10);
  assert.deepEqual(
    seoul.map(teacher => teacher.name),
    ['Abhinay', 'Amelia', 'Ej', 'Hyunwoo', 'Justina', 'May', 'Tae', 'Valeria', 'Victoria', 'Yerin']
  );
  assert.equal(helpers.teachersForRegion(fallback, 'Incheon').length, 0);
  assert.equal(helpers.teachersForRegion(fallback, '구월동').length, 0);
});

test('repeated area rows are grouped into one complete time range', () => {
  const amelia = helpers.teachersForRegion(fallback, 'Seoul')
    .find(teacher => teacher.name === 'Amelia');

  assert.equal(amelia.availability.length, 3);
  assert.deepEqual(
    amelia.availability.map(slot => [slot.dayLabel, slot.timeLabel, slot.areas.length]),
    [
      ['금요일', '16:00–22:00', 5],
      ['토요일', '12:00–22:00', 5],
      ['일요일', '12:00–17:00', 5]
    ]
  );
});

test('trial view is Songdo-only and uses explicit Economy trial locations', () => {
  const songdo = helpers.teachersForRegion(fallback, 'Songdo');
  const trial = helpers.teachersForView(songdo, { mode: 'trial' });

  assert.deepEqual(trial.map(teacher => teacher.name), [
    'Abhinay', 'Amelia', 'Amy', 'Anniah', 'Braydon', 'Ej', 'Hara', 'Hayden', 'Justina', 'May', 'Valeria', 'Vita', 'Yerin'
  ]);
  assert.ok(trial.every(teacher => teacher.planGroups.includes('economy')));
  assert.ok(trial.every(teacher => teacher.region === 'Songdo'));
  assert.ok(trial.every(teacher => teacher.availability.every(slot => (
    slot.areas.every(area => area.includes('인천글로벌캠퍼스') || area.includes('트리플스트리트'))
  ))));
  assert.equal(
    helpers.teachersForView(helpers.teachersForRegion(fallback, 'Seoul'), { mode: 'trial' }).length,
    0
  );
});

test('paid trial keeps the selected plan and supports both public regions', () => {
  const seoul = helpers.teachersForRegion(fallback, 'Seoul');
  const paidStandard = helpers.teachersForView(seoul, {
    mode: 'trial',
    trialType: 'paid',
    planFilter: 'standard'
  });
  assert.equal(paidStandard.length, 10);
  assert.ok(paidStandard.every(teacher => teacher.region === 'Seoul'));
  assert.ok(paidStandard.every(teacher => teacher.planGroups.includes('standard')));
});

test('teachers are sorted by longest introduction after filtering', () => {
  const songdo = helpers.sortTeachersByIntroductionLength(
    helpers.teachersForView(helpers.teachersForRegion(fallback, 'Songdo'), {})
  );
  assert.deepEqual(songdo.map(teacher => `${teacher.name}:${helpers.introductionLength(teacher)}`), [
    'Justina:443', 'Valeria:428', 'Vita:386', 'Abhinay:351', 'Amelia:237', 'Hayden:219', 'Anniah:192', 'Amy:172',
    'Oscar:164', 'Braydon:159', 'Victoria:147', 'Yerin:136', 'Ej:92', 'May:84', 'Sophie:71', 'Hara:49', 'Tae:37'
  ]);

  const freeTrial = helpers.sortTeachersByIntroductionLength(
    helpers.teachersForView(helpers.teachersForRegion(fallback, 'Songdo'), { mode: 'trial' })
  );
  assert.deepEqual(freeTrial.map(teacher => teacher.name), [
    'Justina', 'Valeria', 'Vita', 'Abhinay', 'Amelia', 'Hayden', 'Anniah', 'Amy', 'Braydon', 'Yerin', 'Ej', 'May', 'Hara'
  ]);

  assert.equal(helpers.bookableAvailabilityCount(songdo.find(teacher => teacher.name === 'Victoria')), 8);

  const source = [
    { id: '3', name: 'Zed', bio: 'abc' },
    { id: '2', name: 'Amy', bio: ' 😀a ' },
    { id: '1', name: 'Ben', bio: 'abc' },
    { id: '4', name: 'None' }
  ];
  assert.equal(helpers.introductionLength(source[1]), 2, 'Unicode code points and trimmed content should be counted');
  assert.deepEqual(helpers.sortTeachersByIntroductionLength(source).map(teacher => teacher.name), ['Ben', 'Zed', 'Amy', 'None']);
  assert.deepEqual(source.map(teacher => teacher.name), ['Zed', 'Amy', 'Ben', 'None'], 'sorting must not mutate source data');
});

test('availability is grouped by weekday and each day keeps chronological time order', () => {
  const groups = helpers.availabilityGroupsByDay([
    { dayOfWeek: 2, dayLabel: '화요일', startTime: '16:30', endTime: '19:00', timeLabel: '16:30–19:00' },
    { dayOfWeek: 1, dayLabel: '월요일', startTime: '16:00', endTime: '19:00', timeLabel: '16:00–19:00' },
    { dayOfWeek: 2, dayLabel: '화요일', startTime: '08:00', endTime: '09:30', timeLabel: '08:00–09:30' },
    { dayOfWeek: 1, dayLabel: '월요일', startTime: '08:00', endTime: '10:00', timeLabel: '08:00–10:00' }
  ]);
  assert.deepEqual(groups.map(group => [group.dayLabel, group.slots.map(slot => slot.timeLabel)]), [
    ['월요일', ['08:00–10:00', '16:00–19:00']],
    ['화요일', ['08:00–09:30', '16:30–19:00']]
  ]);
});

test('availability preview shows only the first three slots across all weekdays', () => {
  const model = helpers.availabilityDisplayModel([
    { dayOfWeek: 1, dayLabel: '월요일', startTime: '09:00', endTime: '10:00', timeLabel: '09:00–10:00' },
    { dayOfWeek: 1, dayLabel: '월요일', startTime: '18:00', endTime: '19:00', timeLabel: '18:00–19:00' },
    { dayOfWeek: 2, dayLabel: '화요일', startTime: '10:00', endTime: '11:00', timeLabel: '10:00–11:00' },
    { dayOfWeek: 2, dayLabel: '화요일', startTime: '20:00', endTime: '21:00', timeLabel: '20:00–21:00' },
    { dayOfWeek: 3, dayLabel: '수요일', startTime: '12:00', endTime: '13:00', timeLabel: '12:00–13:00' }
  ], 3);

  assert.equal(model.totalCount, 5);
  assert.equal(model.extraCount, 2);
  assert.deepEqual(model.groups.map(group => ({
    day: group.dayLabel,
    hidden: group.hidden,
    slots: group.slots.map(entry => entry.hidden)
  })), [
    { day: '월요일', hidden: false, slots: [false, false] },
    { day: '화요일', hidden: false, slots: [false, true] },
    { day: '수요일', hidden: true, slots: [false] }
  ]);

  const exactlyThree = helpers.availabilityDisplayModel(model.groups.flatMap(group => (
    group.slots.slice(0, group.dayLabel === '화요일' ? 1 : group.dayLabel === '수요일' ? 0 : 2).map(entry => entry.slot)
  )), 3);
  assert.equal(exactlyThree.totalCount, 3);
  assert.equal(exactlyThree.extraCount, 0);

  const oneDay = helpers.availabilityDisplayModel([
    { dayOfWeek: 1, dayLabel: '월요일', startTime: '09:00', endTime: '10:00', timeLabel: '09:00–10:00' },
    { dayOfWeek: 1, dayLabel: '월요일', startTime: '10:00', endTime: '11:00', timeLabel: '10:00–11:00' },
    { dayOfWeek: 1, dayLabel: '월요일', startTime: '11:00', endTime: '12:00', timeLabel: '11:00–12:00' },
    { dayOfWeek: 1, dayLabel: '월요일', startTime: '12:00', endTime: '13:00', timeLabel: '12:00–13:00' }
  ], 3);
  assert.equal(oneDay.extraCount, 1);
  assert.deepEqual(oneDay.groups[0].slots.map(entry => entry.hidden), [false, false, false, true]);
});

test('lesson types are capabilities, with Oscar as the only current exception', () => {
  const songdo = helpers.teachersForRegion(fallback, 'Songdo');
  const oscar = songdo.find(teacher => teacher.name === 'Oscar');
  const everyoneElse = songdo.filter(teacher => teacher.name !== 'Oscar');

  assert.ok(everyoneElse.every(teacher => (
    JSON.stringify(teacher.planGroups) === JSON.stringify(['economy', 'standard'])
  )));
  assert.deepEqual(oscar.planGroups, ['standard', 'premium']);
  assert.equal(helpers.teachersForView(songdo, { planFilter: 'economy' }).length, 16);
  assert.equal(helpers.teachersForView(songdo, { planFilter: 'standard' }).length, 17);
  assert.deepEqual(
    helpers.teachersForView(songdo, { planFilter: 'premium' }).map(teacher => teacher.name),
    ['Oscar']
  );

  const legacyAmy = helpers.normalizeTeacher({
    teacher_id: 'preview-legacy-amy',
    display_name: 'Amy',
    plan_group: 'economy',
    region: 'Songdo'
  }, 'Songdo');
  const legacyOscar = helpers.normalizeTeacher({
    teacher_id: 'preview-legacy-oscar',
    display_name: 'Oscar',
    plan_group: 'premium',
    region: 'Songdo'
  }, 'Songdo');
  assert.deepEqual(legacyAmy.planGroups, ['economy', 'standard']);
  assert.deepEqual(legacyOscar.planGroups, ['standard', 'premium']);

  const futureApproved = helpers.normalizeTeacher({
    teacher_id: 'preview-future-premium',
    display_name: 'Future Tutor',
    plan_groups: ['economy', 'standard', 'premium'],
    region: 'Songdo'
  }, 'Songdo');
  assert.ok(helpers.teachersForView([futureApproved], { planFilter: 'premium' }).includes(futureApproved));
});

test('direct application parameters are encoded from normalized public fields', () => {
  const teacher = helpers.teachersForRegion(fallback, 'Songdo').find(item => item.name === 'Amy');
  const slot = teacher.availability[0];
  const params = helpers.directApplicationParams(teacher, slot, {
    mode: 'trial',
    sourceKind: 'snapshot',
    plan: 'economy'
  });

  assert.equal(params.get('source'), 'teacher-directory');
  assert.equal(params.get('teacher_id'), 'preview-amy');
  assert.equal(params.get('teacher_name'), 'Amy');
  assert.equal(params.get('plan'), 'economy');
  assert.equal(params.get('region'), 'Songdo');
  assert.equal(params.get('day'), '월요일');
  assert.equal(params.get('start'), '13:00');
  assert.equal(params.get('end'), '15:00');
  assert.equal(params.get('area'), '트리플스트리트');
  assert.equal(params.get('available_minutes'), '120');
  assert.equal(params.get('mode'), 'trial');
  assert.equal(params.get('trial_type'), 'free');
  assert.equal(params.get('source_kind'), 'snapshot');

  const standardParams = helpers.directApplicationParams(teacher, slot, {
    mode: 'regular',
    sourceKind: 'snapshot',
    plan: 'standard'
  });
  assert.equal(standardParams.get('plan'), 'standard');

  const regularChoiceParams = helpers.directApplicationParams(teacher, slot, {
    mode: 'regular',
    sourceKind: 'snapshot',
    planOptions: ['economy', 'standard', 'premium']
  });
  assert.equal(regularChoiceParams.has('plan'), false);
  assert.equal(regularChoiceParams.get('plan_options'), 'economy,standard');

  const paidParams = helpers.directApplicationParams(teacher, slot, {
    mode: 'trial',
    trialType: 'paid',
    sourceKind: 'snapshot',
    plan: 'standard'
  });
  assert.equal(paidParams.get('trial_type'), 'paid');
  assert.equal(paidParams.get('plan'), 'standard');
});

test('slot duration guard handles half hours and the end-of-day boundary', () => {
  assert.equal(helpers.slotDurationMinutes({ startTime: '20:00', endTime: '20:30' }), 30);
  assert.equal(helpers.slotDurationMinutes({ startTime: '18:30', endTime: '20:00' }), 90);
  assert.equal(helpers.slotDurationMinutes({ startTime: '21:00', endTime: '24:00' }), 180);
  assert.equal(helpers.slotDurationMinutes({ startTime: '', endTime: '' }), 0);
});

test('direct actions require a complete source-safe teacher and slot', () => {
  const teacher = helpers.teachersForRegion(fallback, 'Songdo').find(item => item.name === 'Amy');
  const slot = teacher.availability[0];

  assert.equal(helpers.hasCompleteDirectSelection(teacher, slot, 'snapshot', 'economy'), true);
  assert.equal(helpers.hasCompleteDirectSelection(teacher, slot, 'snapshot', 'premium'), false);
  assert.equal(helpers.hasCompleteDirectSelection(teacher, slot, 'live', 'economy'), false);
  assert.equal(helpers.hasCompleteDirectSelection(
    Object.assign({}, teacher, { id: '123e4567-e89b-42d3-a456-426614174000' }),
    slot,
    'live',
    'standard'
  ), true);
  assert.equal(helpers.hasCompleteDirectSelection(teacher, Object.assign({}, slot, { areas: [] }), 'snapshot', 'economy'), false);
});

test('directory normalizes school names used by current profiles', () => {
  for (const value of [
    'GMUK',
    'George Mason Korea',
    'George Mason Korea University',
    'George Mason University Korea'
  ]) {
    assert.equal(helpers.normalizeSchool(value), 'George Mason University');
  }
  assert.equal(helpers.normalizeSchool('Utah University Asia Campus'), 'University of Utah');
});

test('video URLs never autoplay and unsafe schemes are rejected', () => {
  assert.deepEqual(
    helpers.videoEmbedInfo('https://youtu.be/abc123_X?autoplay=1'),
    { type: 'youtube', src: 'https://www.youtube-nocookie.com/embed/abc123_X' }
  );
  assert.deepEqual(
    helpers.videoEmbedInfo('https://media.example.com/intro.mp4', ['https://media.example.com']),
    { type: 'video', src: 'https://media.example.com/intro.mp4' }
  );
  assert.deepEqual(
    helpers.videoEmbedInfo('media/intro.mp4', ['http://127.0.0.1:4173'], 'http://127.0.0.1:4173/teachers.html'),
    { type: 'video', src: 'http://127.0.0.1:4173/media/intro.mp4' }
  );
  assert.equal(helpers.videoEmbedInfo('https://tracker.example/intro.mp4'), null);
  assert.equal(helpers.videoEmbedInfo('http://youtu.be/abc123_X'), null);
  assert.equal(helpers.videoEmbedInfo('javascript:alert(1)'), null);
  assert.equal(helpers.videoEmbedInfo(''), null);
});

test('available languages use controlled codes and reviewed Korean labels', () => {
  assert.deepEqual(
    helpers.normalizeLanguages(['English', '한국어', 'zh', 'Japanese', 'Spanish', 'French', 'Russian', 'EN', '<script>']),
    [
      { code: 'en', label: '영어', nativeLabel: 'English' },
      { code: 'ko', label: '한국어', nativeLabel: '한국어' },
      { code: 'zh', label: '중국어', nativeLabel: '中文' },
      { code: 'ja', label: '일본어', nativeLabel: '日本語' },
      { code: 'es', label: '스페인어', nativeLabel: 'Español' },
      { code: 'fr', label: '프랑스어', nativeLabel: 'Français' },
      { code: 'ru', label: '러시아어', nativeLabel: 'Русский' }
    ]
  );
  assert.ok(helpers.teachersForRegion(fallback, 'Songdo').every(teacher => (
    teacher.languages.some(language => language.code === 'en')
  )));
  assert.deepEqual(fallback.filter(t => t.languages.includes('ko')).map(t => t.displayName).sort(), ['Hyunwoo', 'Yerin']);
});

test('teacher profiles normalize legacy English and separate Korean introduction videos', () => {
  const teacher = helpers.normalizeTeacher({
    teacher_id: 'preview-media',
    display_name: 'Media Teacher',
    region: 'Songdo',
    available_languages: ['en', 'ko'],
    introduction_video_url: 'https://youtu.be/english12',
    introduction_video_ko_url: 'teacher-intro-videos-public/teacher/ko/intro.mp4'
  }, 'Songdo');
  assert.deepEqual(teacher.languages.map(language => language.code), ['en', 'ko']);
  assert.equal(teacher.videoUrls.en, 'https://youtu.be/english12');
  assert.equal(teacher.videoUrls.ko, 'teacher-intro-videos-public/teacher/ko/intro.mp4');

  const scrubbed = helpers.withoutUnreviewedLegacyVideos([{ introduction_video_url: 'https://youtu.be/unreviewed1' }]);
  assert.equal(scrubbed[0].introduction_video_url, '');
  assert.equal(scrubbed[0].intro_video_url, '');
  assert.equal(helpers.isMissingDirectoryV3Error({ code: 'PGRST202' }), true);
  assert.equal(helpers.isMissingDirectoryV3Error({ code: '42883' }), true);
  assert.equal(helpers.isMissingDirectoryV3Error({ code: '500', message: 'network failed' }), false);
});

test('public Storage video paths are restricted to the configured public bucket and media extensions', () => {
  const options = {
    supabaseUrl: 'https://project.supabase.co',
    bucket: 'teacher-intro-videos-public'
  };
  assert.equal(
    helpers.publicStorageVideoUrl('teacher-intro-videos-public/teacher/ko/intro.mp4', options),
    'https://project.supabase.co/storage/v1/object/public/teacher-intro-videos-public/teacher/ko/intro.mp4'
  );
  assert.equal(
    helpers.publicStorageVideoUrl('https://project.supabase.co/storage/v1/object/public/teacher-intro-videos-public/teacher/en/intro.webm', options),
    'https://project.supabase.co/storage/v1/object/public/teacher-intro-videos-public/teacher/en/intro.webm'
  );
  assert.equal(helpers.publicStorageVideoUrl('https://evil.example/intro.mp4', options), '');
  assert.equal(helpers.publicStorageVideoUrl('teacher-intro-videos-public/../secret.mp4', options), '');
  assert.equal(helpers.publicStorageVideoUrl('teacher-intro-videos-public/teacher/en/page.html', options), '');

  const sources = helpers.teacherVideoSources({
    videoUrls: {
      en: 'https://youtu.be/english12?autoplay=1',
      ko: 'teacher-intro-videos-public/teacher/ko/intro.mp4'
    }
  }, options);
  assert.deepEqual(sources.map(source => [source.code, source.info.type]), [['en', 'youtube'], ['ko', 'video']]);
  assert.ok(sources.every(source => !source.info.src.includes('autoplay')));
});

test('local preview snapshot contains no production UUIDs or storage-object paths', () => {
  const source = fs.readFileSync(path.join(root, 'teacher-directory-data.js'), 'utf8');
  assert.doesNotMatch(source, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  assert.doesNotMatch(source, /profile-\d+\.(?:jpg|jpeg|png|webp)/i);
});

test('proposed public RPC keeps region matching strict and its grants narrow', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/public-teacher-directory-rpc-v2.sql'), 'utf8');
  assert.match(sql, /p_region must be exactly Songdo or Seoul/);
  assert.match(sql, /schedule\.normalized_location in \('seoul', '서울'\)/);
  assert.match(sql, /schedule\.service_area::text/);
  assert.match(sql, /schedule\.normalized_service_area is null/);
  assert.match(sql, /select distinct schedule\.teacher_id, schedule\.area_label\s+from selected_availability/);
  assert.doesNotMatch(sql, /from selected_service_areas as coverage/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /revoke execute[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute[\s\S]*to anon, authenticated/);
  assert.match(sql, /get_public_teacher_directory_v2/);
  assert.match(sql, /plan_groups jsonb/);
  assert.match(sql, /\["economy", "standard"\]/);
  assert.match(sql, /\["standard", "premium"\]/);
  assert.doesNotMatch(sql, /\b(email|phone|kakao_id|account_number|bank_name|memo)\s+(?:text|jsonb)/i);
});

test('teacher directory page loads the local snapshot and pinned Supabase client', () => {
  const html = fs.readFileSync(path.join(root, 'teachers.html'), 'utf8');
  assert.match(html, /data-directory-region="Songdo"/);
  assert.match(html, /data-directory-region="Seoul"/);
  assert.match(html, /@supabase\/supabase-js@2\.57\.4/);
  assert.match(html, /teacher-directory-data\.js\?v=44/);
  assert.match(html, /teacher-directory\.css\?v=51/);
  assert.match(html, /teacher-directory\.js\?v=49/);
  assert.doesNotMatch(html, /src="teacher-carousel\.js/);
});

test('directory keeps card details semantic and exposes an accessible dialog trigger', () => {
  const html = fs.readFileSync(path.join(root, 'teachers.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'teacher-directory.js'), 'utf8');

  assert.match(html, /<ul class="teacher-directory-grid"/);
  assert.match(html, /role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
  assert.match(html, /role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="teacherDialogTitle"[^>]*aria-describedby="teacherDialogDescription"/);
  assert.match(script, /<li class="teacher-summary-item"/);
  assert.match(script, /data-teacher-open aria-haspopup="dialog" aria-controls="teacherProfileDialog"/);
  assert.match(script, /state\.mode === 'trial'[\s\S]*?무료 체험 신청/);
  assert.doesNotMatch(script, /진행 가능한 수업/);
  assert.match(script, /function dialogVideoMarkup/);
  assert.match(script, /role="tablist" aria-label="소개 영상 언어"/);
  assert.match(script, /data-teacher-video-player/);
  assert.doesNotMatch(script, /소개 영상 준비 중|영상과 자세한 소개 보기/);
  assert.match(script, /class="teacher-summary-card"/);
  assert.match(script, /Premium 상담 요청/);
  assert.match(script, /class="directory-availability-time/);
  assert.match(script, /data-directory-slot/);
  assert.match(script, /isPaidTrial \? '체험 신청' : '신청하기'/);
  assert.match(script, /applicationUrl\(teacher, slot, sourceKind, selectedPlan, selectedPlan \? \[\] : regularPlanOptions\)/);
  assert.match(script, /data-availability-toggle/);
  assert.match(script, /availabilityDisplayModel\(availability, 3\)/);
  assert.match(script, /시간대 \$\{display\.extraCount\}개 더보기/);
  assert.match(script, /button\.closest\('\.directory-availability-list'\)/);
  assert.match(script, /aria-expanded="false"/);
  assert.doesNotMatch(script, /다른 체험 일정 상담하기/);
  assert.doesNotMatch(script, /<button[^>]*class="directory-teacher-card"/);
  const cardSource = script.slice(script.indexOf('function teacherCardMarkup'), script.indexOf('function setDirectoryHeading'));
  assert.doesNotMatch(cardSource, /directory-teacher-card__bio|\$\{bio\}/);
  assert.match(cardSource, /teacherSummaryMarkup/);
  assert.doesNotMatch(script, />샘플<|샘플 시간|샘플 데이터|테스트 신청/);
  assert.match(script, /if \(sourceKind === 'snapshot' && !isLocalPreview\(\)\)/);
  const slotSource = script.slice(script.indexOf('function slotActionMarkup'), script.indexOf('function safeDomToken'));
  assert.match(slotSource, /return `<a class="directory-availability-time[^`]*data-directory-slot aria-label=/);
  assert.doesNotMatch(slotSource, /<button[^>]*directory-availability-time/);
  assert.match(script, /event\.target\.closest\('\[data-directory-slot\], \.directory-availability-time--disabled'\)\) return/);
  const dialogSource = script.slice(script.indexOf('function openTeacherDialog'), script.indexOf('function getPublicState'));
  assert.match(dialogSource, /avatarMarkup\(teacher, true\)[\s\S]*id="teacherDialogTitle"/);
  assert.match(dialogSource, /id="teacherDialogDescription"/);
  assert.match(dialogSource, /requestAnimationFrame\(\(\) => dialogClose\.focus\(\)\)/);
  assert.match(dialogSource, /event\.key === 'Escape'/);
  assert.match(dialogSource, /finishDialogClose[\s\S]*trigger\.focus\(\)/);
  assert.match(script, /get_public_teacher_directory_v3[\s\S]*get_public_teacher_directory_v2/);
});

test('v3 RPC exposes only approved media and review schema keeps submissions private', () => {
  const rpc = fs.readFileSync(path.join(root, 'supabase/public-teacher-directory-rpc-v3.sql'), 'utf8');
  const schema = fs.readFileSync(path.join(root, 'supabase/teacher-profile-media-schema-review.sql'), 'utf8');

  assert.match(rpc, /get_public_teacher_directory_v3/);
  assert.match(rpc, /available_languages jsonb/);
  assert.match(rpc, /introduction_video_en_url text/);
  assert.match(rpc, /introduction_video_ko_url text/);
  assert.match(rpc, /video\.status = 'approved'/);
  assert.match(rpc, /videos\.english_url as introduction_video_en_url/);
  assert.doesNotMatch(rpc, /directory\.introduction_video_url/);
  assert.match(rpc, /when details\.teacher_id is null then array\['en'\]/);
  assert.match(rpc, /revoke execute[\s\S]*from public, anon, authenticated/);
  assert.doesNotMatch(rpc, /storage_path|review_note/);

  assert.match(schema, /teacher_profile_public_details/);
  assert.match(schema, /teacher_intro_videos/);
  assert.match(schema, /teacher-intro-video-submissions/);
  assert.match(schema, /teacher-intro-videos-public/);
  assert.match(schema, /enable row level security/);
  assert.match(schema, /\(select auth\.uid\(\)\) = teacher_id/);
  assert.match(schema, /status = 'pending'/);
  assert.match(schema, /languages @> array\['en'\]/);
  assert.match(schema, /original_name text not null/);
  assert.match(schema, /mime_type text not null/);
  assert.match(schema, /size_bytes between 1 and 104857600/);
  assert.match(schema, /created_at timestamptz not null default now\(\)/);
  assert.match(schema, /teacher_intro_videos_select_own_or_admin/);
  assert.match(schema, /no authenticated INSERT\/UPDATE\/DELETE policy is created for[\s\S]*teacher-intro-videos-public/i);
  assert.doesNotMatch(schema, /to anon/);
});

test('directory layout has desktop, tablet, and mobile grid states', () => {
  const css = fs.readFileSync(path.join(root, 'teacher-directory.css'), 'utf8');
  const homepageCss = fs.readFileSync(path.join(root, 'homepage-teacher-finder.css'), 'utf8');
  assert.match(css, /\.teacher-directory-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.teacher-directory-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(css, /inset:\s*auto 0 0/);
  assert.match(css, /\.directory-availability-day\s*\{[\s\S]*?background:\s*#f5f8fc/);
  assert.match(css, /\.directory-availability-time\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) max-content[\s\S]*?background:\s*#fff/);
  assert.match(css, /\.directory-availability-time-item\[hidden\]\s*\{\s*display:\s*none/);
  assert.match(css, /\.directory-availability-day\[hidden\]\s*\{\s*display:\s*none/);
  assert.match(css, /\.directory-availability-day__toggle\s*\{[\s\S]*?min-height:\s*44px/);
  assert.doesNotMatch(css, /directory-teacher-card__bio|directory-teacher-badge--sample/);
  assert.match(css, /\.directory-teacher-card__head\s*\{[\s\S]*?grid-template-columns:\s*126px/);
  assert.match(css, /\.directory-teacher-avatar--large\s*\{[\s\S]*?width:\s*252px/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*?\.directory-teacher-avatar\s*\{[\s\S]*?width:\s*112px/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*?\.directory-teacher-avatar--large\s*\{[\s\S]*?width:\s*212px/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.teacher-region-segment--large\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.directory-teacher-card__name\s*\{[\s\S]*?font-size:\s*1\.68rem/);
  assert.match(css, /\.directory-availability-time__range\s*\{[\s\S]*?font-size:\s*1\.2rem/);
  assert.match(css, /\.teacher-dialog-description\s*\{[\s\S]*?font-size:\s*1\.16rem/);
  assert.match(css, /\.teacher-dialog-head\s*\{[\s\S]*?grid-template-columns:\s*1fr[\s\S]*?justify-items:\s*center[\s\S]*?text-align:\s*center/);
  assert.match(homepageCss, /\.homepage-finder-hero \.teacher-directory\s*\{[\s\S]*?padding:\s*0;[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?box-shadow:\s*none/);
  assert.match(css, /\.teacher-directory__toolbar\s*\{[\s\S]*?padding:[\s\S]*?background:[\s\S]*?box-shadow:/);
  assert.doesNotMatch(css, /directory-availability-row/);
});

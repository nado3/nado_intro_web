(function (global) {
  'use strict';

  const REGION_LABELS = Object.freeze({ Songdo: '송도', Seoul: '서울' });
  const DAY_LABELS = Object.freeze(['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']);
  const DAY_LOOKUP = Object.freeze({
    sunday: 0, sun: 0, 일요일: 0, 일: 0,
    monday: 1, mon: 1, 월요일: 1, 월: 1,
    tuesday: 2, tue: 2, tues: 2, 화요일: 2, 화: 2,
    wednesday: 3, wed: 3, 수요일: 3, 수: 3,
    thursday: 4, thu: 4, thur: 4, thurs: 4, 목요일: 4, 목: 4,
    friday: 5, fri: 5, 금요일: 5, 금: 5,
    saturday: 6, sat: 6, 토요일: 6, 토: 6
  });
  const AREA_LABELS = Object.freeze({
    gangnam: '강남', hongdae: '홍대', hapjeong: '합정', yongsan: '용산',
    sinchon: '신촌', daechi: '대치', jamsil: '잠실', hanti: '한티',
    igc: 'IGC 인천글로벌캠퍼스', 'triple street': '트리플스트리트',
    songdo: '송도', 'line 3 vicinity': '3호선 인근'
  });
  const LANGUAGE_DEFINITIONS = Object.freeze({
    en: Object.freeze({ code: 'en', label: '영어', nativeLabel: 'English' }),
    ko: Object.freeze({ code: 'ko', label: '한국어', nativeLabel: '한국어' }),
    zh: Object.freeze({ code: 'zh', label: '중국어', nativeLabel: '中文' }),
    ja: Object.freeze({ code: 'ja', label: '일본어', nativeLabel: '日本語' }),
    es: Object.freeze({ code: 'es', label: '스페인어', nativeLabel: 'Español' }),
    fr: Object.freeze({ code: 'fr', label: '프랑스어', nativeLabel: 'Français' }),
    ru: Object.freeze({ code: 'ru', label: '러시아어', nativeLabel: 'Русский' })
  });
  const LANGUAGE_ALIASES = Object.freeze({
    en: 'en', eng: 'en', english: 'en', '영어': 'en',
    ko: 'ko', kor: 'ko', korean: 'ko', '한국어': 'ko', '한국말': 'ko',
    zh: 'zh', zho: 'zh', chi: 'zh', chinese: 'zh', mandarin: 'zh', 'mandarin chinese': 'zh', '中文': 'zh', '중국어': 'zh', '보통화': 'zh',
    ja: 'ja', jpn: 'ja', japanese: 'ja', '日本語': 'ja', '일본어': 'ja',
    es: 'es', spa: 'es', spanish: 'es', 'español': 'es', '스페인어': 'es',
    fr: 'fr', fra: 'fr', fre: 'fr', french: 'fr', 'français': 'fr', '프랑스어': 'fr',
    ru: 'ru', rus: 'ru', russian: 'ru', 'русский': 'ru', '러시아어': 'ru'
  });
  const LOCAL_TEACHER_PHOTOS = Object.freeze({
    abhinay: 'img/abhinay.jpg',
    amelia: 'img/amelia.jpg',
    amy: 'img/amy.jpg',
    anniah: 'img/anniah.jpg',
    ej: 'img/ej.jpg',
    hara: 'img/hara.jpg',
    justina: 'img/justina.jpg',
    oscar: 'img/oscar.jpg',
    sophie: 'img/sophie.jpg',
    tae: 'img/tae.jpg',
    victoria: 'img/victoria.jpg',
    vita: 'img/vitalina.jpg',
    vitalina: 'img/vitalina.jpg'
  });

  function pick() {
    for (let index = 0; index < arguments.length; index += 1) {
      const value = arguments[index];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
  }

  function ownValue(map, key) {
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function uniqueStrings(values) {
    const seen = new Set();
    return values.reduce((output, value) => {
      const clean = String(value == null ? '' : value).trim();
      const key = clean.toLocaleLowerCase();
      if (!clean || seen.has(key)) return output;
      seen.add(key);
      output.push(clean);
      return output;
    }, []);
  }

  function parseMaybeJson(value) {
    if (typeof value !== 'string') return value;
    const clean = value.trim();
    if (!clean || (clean[0] !== '[' && clean[0] !== '{')) return value;
    try {
      return JSON.parse(clean);
    } catch (error) {
      return value;
    }
  }

  function toArray(value) {
    const parsed = parseMaybeJson(value);
    if (Array.isArray(parsed)) return parsed;
    if (parsed === undefined || parsed === null || parsed === '') return [];
    if (typeof parsed === 'string' && /[\n,]/.test(parsed)) {
      return parsed.split(/[\n,]+/).map(item => item.trim()).filter(Boolean);
    }
    return [parsed];
  }

  function normalizeLanguage(value) {
    const source = value && typeof value === 'object'
      ? pick(value.code, value.language_code, value.languageCode, value.value, value.label, '')
      : value;
    const alias = String(source == null ? '' : source).trim().toLocaleLowerCase();
    const code = ownValue(LANGUAGE_ALIASES, alias) || '';
    return code ? LANGUAGE_DEFINITIONS[code] : null;
  }

  function normalizeLanguages(value) {
    const seen = new Set();
    return toArray(value).reduce((languages, item) => {
      const language = normalizeLanguage(item);
      if (!language || seen.has(language.code)) return languages;
      seen.add(language.code);
      languages.push(language);
      return languages;
    }, []);
  }

  function normalizeRegion(value) {
    const key = String(value || '').trim().toLocaleLowerCase();
    if (key === 'songdo' || key === '송도') return 'Songdo';
    if (key === 'seoul' || key === '서울') return 'Seoul';
    return '';
  }

  function normalizeSchool(value) {
    const school = String(value || '').trim().replace(/\s+/g, ' ');
    const key = school.toLocaleLowerCase();
    if (key === 'gmuk' || key.includes('george mason')) return 'George Mason University';
    if (key === 'utah university asia campus' || key === 'university of utah asia campus') return 'University of Utah';
    return school;
  }

  function normalizeDay(value) {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6) return value;
    const clean = String(value == null ? '' : value).trim().toLocaleLowerCase();
    if (/^[0-6]$/.test(clean)) return Number(clean);
    return Object.prototype.hasOwnProperty.call(DAY_LOOKUP, clean) ? DAY_LOOKUP[clean] : null;
  }

  function normalizeTime(value) {
    const clean = String(value == null ? '' : value).trim();
    const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
    if (!match) return clean;
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }

  function timeToMinutes(value, allowEndOfDay) {
    const match = String(value || '').match(/^(\d{2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (minutes > 59 || hours > 24 || (hours === 24 && (!allowEndOfDay || minutes !== 0))) return null;
    return (hours * 60) + minutes;
  }

  function slotDurationMinutes(slot) {
    if (!slot || typeof slot !== 'object') return 0;
    const start = timeToMinutes(slot.startTime, false);
    const end = timeToMinutes(slot.endTime, true);
    if (start === null || end === null || end <= start) return 0;
    return end - start;
  }

  function normalizeArea(value) {
    if (value && typeof value === 'object') {
      return normalizeArea(pick(
        value.area_label,
        value.areaLabel,
        value.label,
        value.area_name,
        value.areaName,
        value.area,
        value.area_code,
        value.areaCode,
        value.location
      ));
    }
    const area = String(value == null ? '' : value).trim();
    if (!area) return '';
    return ownValue(AREA_LABELS, area.toLocaleLowerCase()) || area;
  }

  function groupAvailability(value) {
    const grouped = new Map();

    toArray(value).forEach((raw, originalIndex) => {
      if (typeof raw === 'string' || typeof raw === 'number') {
        const text = String(raw).trim();
        if (!text) return;
        const key = `text:${text.toLocaleLowerCase()}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            dayOfWeek: null,
            dayLabel: '',
            startTime: '',
            endTime: '',
            timeLabel: text,
            areas: [],
            originalIndex
          });
        }
        return;
      }

      if (!raw || typeof raw !== 'object') return;
      const dayOfWeek = normalizeDay(pick(raw.day_of_week, raw.dayOfWeek, raw.day, raw.weekday));
      const dayLabel = dayOfWeek === null
        ? String(pick(raw.day_label, raw.dayLabel, raw.weekday_label, raw.weekdayLabel, '')).trim()
        : DAY_LABELS[dayOfWeek];
      const startTime = normalizeTime(pick(raw.start_time, raw.startTime, raw.start, ''));
      const endTime = normalizeTime(pick(raw.end_time, raw.endTime, raw.end, ''));
      const suppliedTimeLabel = String(pick(raw.time_label, raw.timeLabel, raw.time, raw.label, '')).trim();
      const timeLabel = startTime && endTime
        ? `${startTime}–${endTime}`
        : (startTime || endTime || suppliedTimeLabel || '시간 협의');
      const areas = uniqueStrings(
        toArray(pick(raw.areas, raw.area_labels, raw.areaLabels, [])).map(normalizeArea)
          .concat([normalizeArea(pick(
            raw.area_label,
            raw.areaLabel,
            raw.area_name,
            raw.areaName,
            raw.area,
            raw.area_code,
            raw.areaCode,
            raw.location
          ))])
      );
      const dayKey = dayOfWeek === null ? dayLabel.toLocaleLowerCase() : String(dayOfWeek);
      const key = `slot:${dayKey}:${startTime}:${endTime}:${suppliedTimeLabel && !startTime ? suppliedTimeLabel.toLocaleLowerCase() : ''}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          dayOfWeek,
          dayLabel,
          startTime,
          endTime,
          timeLabel,
          areas,
          originalIndex
        });
        return;
      }

      const current = grouped.get(key);
      current.areas = uniqueStrings(current.areas.concat(areas));
    });

    return Array.from(grouped.values()).sort((left, right) => {
      const leftOrder = left.dayOfWeek === null ? 99 : (left.dayOfWeek + 6) % 7;
      const rightOrder = right.dayOfWeek === null ? 99 : (right.dayOfWeek + 6) % 7;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      if (left.startTime !== right.startTime) return left.startTime.localeCompare(right.startTime);
      if (left.endTime !== right.endTime) return left.endTime.localeCompare(right.endTime);
      return left.originalIndex - right.originalIndex;
    });
  }

  function regionBlockFor(source, region) {
    const regions = parseMaybeJson(pick(source.regions, source.region_data, source.regionData, null));
    if (!regions || typeof regions !== 'object' || Array.isArray(regions)) return { hasRegions: false, block: null };
    const direct = regions[region] || regions[region.toLocaleLowerCase()] || regions[REGION_LABELS[region]];
    if (direct) return { hasRegions: true, block: direct };
    const matchingKey = Object.keys(regions).find(key => normalizeRegion(key) === region);
    return { hasRegions: true, block: matchingKey ? regions[matchingKey] : null };
  }

  function isOscarTeacher(name) {
    const identity = String(name || '').trim().toLocaleLowerCase();
    return identity === 'oscar' || identity.startsWith('oscar ') || identity === '오스카';
  }

  function normalizePlanGroupsForTeacher(source, name) {
    const explicitSource = pick(
      source && source.plan_groups,
      source && source.planGroups,
      source && source.lesson_types,
      source && source.lessonTypes,
      ''
    );
    const explicitPlans = uniqueStrings(
      toArray(explicitSource).map(normalizePlanFilter).filter(Boolean)
    );
    if (explicitPlans.length) {
      return explicitPlans.sort((left, right) => (
        ['economy', 'standard', 'premium'].indexOf(left)
        - ['economy', 'standard', 'premium'].indexOf(right)
      ));
    }

    // Until every live catalog row has plan_groups, apply the confirmed NADO
    // lesson-type policy. The plural field remains the source of truth once set.
    return isOscarTeacher(name)
      ? ['standard', 'premium']
      : ['economy', 'standard'];
  }

  function teacherPlanGroups(teacher) {
    if (!teacher || typeof teacher !== 'object') return [];
    return normalizePlanGroupsForTeacher(teacher, teacher.name || teacher.displayName || teacher.display_name);
  }

  function normalizeTeacher(row, selectedRegion) {
    const region = normalizeRegion(selectedRegion);
    if (!row || typeof row !== 'object' || !region) return null;
    const source = Object.assign({}, row.profile || {}, row.teacher || {}, row);
    const regionMatch = regionBlockFor(source, region);
    if (regionMatch.hasRegions && !regionMatch.block) return null;
    const block = regionMatch.block && typeof regionMatch.block === 'object' ? regionMatch.block : {};
    const combined = Object.assign({}, source, block);
    const sourceRegion = normalizeRegion(pick(combined.region, combined.service_region, combined.serviceRegion, ''));
    if (!regionMatch.hasRegions && sourceRegion && sourceRegion !== region) return null;

    const availabilitySource = pick(
      block.availability,
      block.available_times,
      block.availableTimes,
      source.availability,
      source.available_times,
      source.availableTimes,
      source.schedules,
      source.time_rows,
      source.timeRows,
      []
    );
    const availability = groupAvailability(availabilitySource);
    const areaSource = pick(
      block.service_areas,
      block.serviceAreas,
      block.areas,
      source.service_areas,
      source.serviceAreas,
      source.areas,
      source.available_areas,
      source.availableAreas,
      []
    );
    const areas = uniqueStrings(
      toArray(areaSource).map(normalizeArea)
        .concat(availability.flatMap(slot => slot.areas))
        .concat([normalizeArea(pick(combined.area_label, combined.areaLabel, combined.area, ''))])
    );
    const name = String(pick(
      combined.display_name,
      combined.displayName,
      combined.teacher_name,
      combined.teacherName,
      combined.full_name,
      combined.fullName,
      combined.name,
      combined.english_name,
      combined.englishName,
      '선생님'
    )).trim();
    const businessValue = pick(combined.business_english, combined.businessEnglish, false);
    const tags = uniqueStrings(toArray(pick(combined.tags, combined.specialties, combined.strengths, [])));
    const legacyVideoUrl = String(pick(
      combined.introduction_video_url,
      combined.introductionVideoUrl,
      combined.intro_video_url,
      combined.introVideoUrl,
      combined.video_url,
      combined.videoUrl,
      combined.profile_video_url,
      combined.profileVideoUrl,
      ''
    )).trim();

    return {
      id: String(pick(combined.teacher_id, combined.teacherId, combined.id, combined.profile_id, combined.profileId, name)).trim(),
      name,
      planGroups: normalizePlanGroupsForTeacher(combined, name),
      businessEnglish: businessValue === true || businessValue === 1 || String(businessValue).toLocaleLowerCase() === 'true',
      school: normalizeSchool(pick(combined.school, combined.university, combined.university_name, combined.universityName, '')),
      major: String(pick(combined.major, combined.major_name, combined.majorName, '')).trim().replace(/^Busiess$/i, 'Business'),
      bio: String(pick(combined.bio, combined.short_bio, combined.shortBio, combined.introduction, combined.description, '')).trim().replace(/George Mason Uni(?:v)?ersity Korea/gi, 'George Mason University').replace(/Mason Korea(?: \(Songdo\))?/gi, 'George Mason University'),
      profilePhotoPath: String(pick(
        combined.profile_photo_path,
        combined.profilePhotoPath,
        combined.profile_photo_url,
        combined.profilePhotoUrl,
        combined.photo_url,
        combined.photoUrl,
        combined.avatar_url,
        combined.avatarUrl,
        ''
      )).trim(),
      languages: normalizeLanguages(pick(
        combined.available_languages,
        combined.availableLanguages,
        combined.languages,
        combined.spoken_languages,
        combined.spokenLanguages,
        []
      )),
      videoUrl: legacyVideoUrl,
      videoUrls: {
        en: String(pick(
          combined.introduction_video_en_url,
          combined.introductionVideoEnUrl,
          combined.english_introduction_video_url,
          combined.englishIntroductionVideoUrl,
          legacyVideoUrl,
          ''
        )).trim(),
        ko: String(pick(
          combined.introduction_video_ko_url,
          combined.introductionVideoKoUrl,
          combined.korean_introduction_video_url,
          combined.koreanIntroductionVideoUrl,
          ''
        )).trim()
      },
      region,
      areas,
      availability,
      tags
    };
  }

  function extractDirectoryRows(payload, region) {
    const parsed = parseMaybeJson(payload);
    if (Array.isArray(parsed)) return parsed;
    if (!parsed || typeof parsed !== 'object') return [];
    const regionValue = region && (parsed[region] || parsed[region.toLocaleLowerCase()] || parsed[REGION_LABELS[region]]);
    if (Array.isArray(regionValue)) return regionValue;
    if (regionValue && Array.isArray(regionValue.teachers)) return regionValue.teachers;
    const candidates = [parsed.teachers, parsed.results, parsed.items, parsed.rows, parsed.data];
    const match = candidates.find(Array.isArray);
    if (match) return match;
    if (parsed.teacher_id || parsed.teacherId || parsed.display_name || parsed.displayName) return [parsed];
    return [];
  }

  function mergeTeacher(previous, next) {
    return {
      id: previous.id || next.id,
      name: previous.name !== '선생님' ? previous.name : next.name,
      planGroups: uniqueStrings(previous.planGroups.concat(next.planGroups)).sort((left, right) => (
        ['economy', 'standard', 'premium'].indexOf(left)
        - ['economy', 'standard', 'premium'].indexOf(right)
      )),
      businessEnglish: previous.businessEnglish || next.businessEnglish,
      school: previous.school || next.school,
      major: previous.major || next.major,
      bio: introductionLength(previous) >= introductionLength(next) ? previous.bio : next.bio,
      profilePhotoPath: previous.profilePhotoPath || next.profilePhotoPath,
      videoUrl: previous.videoUrl || next.videoUrl,
      videoUrls: {
        en: pick(previous.videoUrls && previous.videoUrls.en, previous.videoUrl, next.videoUrls && next.videoUrls.en, next.videoUrl, ''),
        ko: pick(previous.videoUrls && previous.videoUrls.ko, next.videoUrls && next.videoUrls.ko, '')
      },
      languages: normalizeLanguages((previous.languages || []).concat(next.languages || [])),
      region: previous.region,
      areas: uniqueStrings(previous.areas.concat(next.areas)),
      availability: groupAvailability(previous.availability.concat(next.availability)),
      tags: uniqueStrings(previous.tags.concat(next.tags))
    };
  }

  function teachersForRegion(payload, selectedRegion) {
    const region = normalizeRegion(selectedRegion);
    if (!region) return [];
    const merged = new Map();
    extractDirectoryRows(payload, region).forEach(row => {
      const teacher = normalizeTeacher(row, region);
      if (!teacher) return;
      const key = teacher.id || teacher.name.toLocaleLowerCase();
      if (!key) return;
      merged.set(key, merged.has(key) ? mergeTeacher(merged.get(key), teacher) : teacher);
    });
    return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name, 'en'));
  }

  function normalizePlanFilter(value) {
    const plan = String(value || '').trim().toLocaleLowerCase();
    return ['economy', 'standard', 'premium'].includes(plan) ? plan : '';
  }

  function normalizeDirectoryMode(value) {
    return String(value || '').trim().toLocaleLowerCase() === 'trial' ? 'trial' : 'regular';
  }

  function normalizeTrialType(value) {
    const type = String(value || '').trim().toLocaleLowerCase();
    return type === 'paid' ? 'paid' : (type === 'free' ? 'free' : '');
  }

  function isTrialArea(value) {
    const key = String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    return key === 'igc'
      || key.includes('인천글로벌캠퍼스')
      || key === 'triple street'
      || key.includes('트리플스트리트');
  }

  function teachersForView(teachers, options) {
    const settings = options || {};
    const mode = normalizeDirectoryMode(settings.mode);
    const trialType = mode === 'trial' ? (normalizeTrialType(settings.trialType) || 'free') : '';
    const requestedPlan = normalizePlanFilter(settings.planFilter || settings.plan);
    const effectivePlan = mode === 'trial' && trialType === 'free' ? 'economy' : requestedPlan;

    return (Array.isArray(teachers) ? teachers : []).reduce((result, teacher) => {
      if (!teacher || (effectivePlan && !teacherPlanGroups(teacher).includes(effectivePlan))) return result;
      if (mode !== 'trial' || trialType === 'paid') {
        result.push(teacher);
        return result;
      }
      if (trialType !== 'free') return result;
      if (teacher.region !== 'Songdo') return result;

      // The public data does not expose a trial-specific flag yet. Until it does,
      // only Economy slots at the two explicitly supported Songdo trial locations
      // are presented as trial choices.
      const availability = teacher.availability.reduce((slots, slot) => {
        const areas = slot.areas.filter(isTrialArea);
        if (!areas.length) return slots;
        slots.push(Object.assign({}, slot, { areas }));
        return slots;
      }, []);
      if (!availability.length) return result;
      result.push(Object.assign({}, teacher, {
        availability,
        areas: uniqueStrings(availability.flatMap(slot => slot.areas))
      }));
      return result;
    }, []);
  }

  function teachersForArea(teachers, area) {
    if (!area) return teachers;
    return teachers.filter(teacher => teacher.areas.includes(area)
      || teacher.availability.some(slot => slot.areas.includes(area)));
  }

  function bookableAvailabilityCount(teacher) {
    return (Array.isArray(teacher && teacher.availability) ? teacher.availability : [])
      .filter(slot => slotDurationMinutes(slot) >= 60).length;
  }

  function introductionLength(teacher) {
    return Array.from(String(teacher && teacher.bio || '').trim()).length;
  }

  function sortTeachersByIntroductionLength(teachers) {
    return (Array.isArray(teachers) ? teachers : []).slice().sort((left, right) => {
      const lengthDifference = introductionLength(right) - introductionLength(left);
      return lengthDifference
        || String(left && left.name || '').localeCompare(String(right && right.name || ''), 'en')
        || String(left && left.id || '').localeCompare(String(right && right.id || ''), 'en');
    });
  }

  function availabilityGroupsByDay(availability) {
    const groups = new Map();
    (Array.isArray(availability) ? availability : []).forEach((slot, originalIndex) => {
      if (!slot || typeof slot !== 'object') return;
      const dayLabel = String(slot.dayLabel || '가능 시간').trim() || '가능 시간';
      const dayKey = slot.dayOfWeek === null || slot.dayOfWeek === undefined
        ? `label:${dayLabel.toLocaleLowerCase()}`
        : `day:${slot.dayOfWeek}`;
      if (!groups.has(dayKey)) {
        groups.set(dayKey, {
          dayLabel,
          dayOfWeek: slot.dayOfWeek,
          originalIndex,
          slots: []
        });
      }
      groups.get(dayKey).slots.push(slot);
    });

    return Array.from(groups.values()).map(group => Object.assign({}, group, {
      slots: group.slots.slice().sort((left, right) => {
        const leftStart = timeToMinutes(left.startTime, false);
        const rightStart = timeToMinutes(right.startTime, false);
        if (leftStart !== null && rightStart !== null && leftStart !== rightStart) return leftStart - rightStart;
        const leftEnd = timeToMinutes(left.endTime, true);
        const rightEnd = timeToMinutes(right.endTime, true);
        if (leftEnd !== null && rightEnd !== null && leftEnd !== rightEnd) return leftEnd - rightEnd;
        return String(left.timeLabel || '').localeCompare(String(right.timeLabel || ''), 'ko');
      })
    })).sort((left, right) => {
      const leftOrder = left.dayOfWeek === null || left.dayOfWeek === undefined ? 99 : (left.dayOfWeek + 6) % 7;
      const rightOrder = right.dayOfWeek === null || right.dayOfWeek === undefined ? 99 : (right.dayOfWeek + 6) % 7;
      return leftOrder - rightOrder || left.originalIndex - right.originalIndex;
    });
  }

  function availabilityDisplayModel(availability, visibleLimit) {
    const limit = Number.isInteger(visibleLimit) && visibleLimit >= 0 ? visibleLimit : 3;
    let slotIndex = 0;
    const groups = availabilityGroupsByDay(availability).map(group => {
      const groupHidden = slotIndex >= limit;
      const slots = group.slots.map(slot => {
        const hidden = !groupHidden && slotIndex >= limit;
        slotIndex += 1;
        return { slot, hidden };
      });
      return Object.assign({}, group, { slots, hidden: groupHidden });
    });
    return {
      groups,
      totalCount: slotIndex,
      extraCount: Math.max(0, slotIndex - limit)
    };
  }

  function safeQueryValue(value, maxLength) {
    return String(value == null ? '' : value)
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .slice(0, maxLength || 180);
  }

  function directApplicationParams(teacher, slot, options) {
    const settings = options || {};
    const mode = normalizeDirectoryMode(settings.mode);
    const trialType = mode === 'trial' ? (normalizeTrialType(settings.trialType) || 'free') : '';
    const sourceKind = settings.sourceKind === 'live' ? 'live' : 'snapshot';
    const selectedPlan = mode === 'trial' && trialType === 'free'
      ? 'economy'
      : normalizePlanFilter(settings.plan);
    const teacherPlans = teacherPlanGroups(teacher);
    const planOptions = uniqueStrings(Array.isArray(settings.planOptions) ? settings.planOptions : [])
      .map(normalizePlanFilter)
      .filter(plan => (plan === 'economy' || plan === 'standard') && teacherPlans.includes(plan));
    const params = new URLSearchParams();
    params.set('source', 'teacher-directory');
    params.set('teacher_id', safeQueryValue(teacher && teacher.id, 100));
    params.set('teacher_name', safeQueryValue(teacher && teacher.name, 100));
    if (selectedPlan) params.set('plan', selectedPlan);
    if (!selectedPlan && mode === 'regular' && planOptions.length) params.set('plan_options', planOptions.join(','));
    params.set('region', normalizeRegion(teacher && teacher.region));
    params.set('day', safeQueryValue(slot && (slot.dayLabel || slot.dayOfWeek), 40));
    params.set('start', safeQueryValue(slot && slot.startTime, 20));
    params.set('end', safeQueryValue(slot && slot.endTime, 20));
    params.set('area', safeQueryValue(slot && slot.areas && slot.areas.join(' · '), 300));
    params.set('available_minutes', String(slotDurationMinutes(slot)));
    params.set('mode', mode);
    if (mode === 'trial') params.set('trial_type', trialType);
    params.set('source_kind', sourceKind);
    return params;
  }

  function hasCompleteDirectSelection(teacher, slot, sourceKind, selectedPlan) {
    if (!teacher || !slot || slotDurationMinutes(slot) < 60) return false;
    const id = String(teacher.id || '').trim();
    const plan = normalizePlanFilter(selectedPlan);
    const sourceIdIsValid = sourceKind === 'live'
      ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      : /^preview-[a-z0-9_-]{1,60}$/i.test(id);
    return sourceIdIsValid
      && Boolean(String(teacher.name || '').trim())
      && Boolean(plan)
      && teacherPlanGroups(teacher).includes(plan)
      && Boolean(normalizeRegion(teacher.region))
      && Boolean(slot.dayLabel)
      && timeToMinutes(slot.startTime, false) !== null
      && timeToMinutes(slot.endTime, true) !== null
      && Array.isArray(slot.areas)
      && slot.areas.some(area => Boolean(String(area || '').trim()));
  }

  function videoEmbedInfo(value, allowedDirectOrigins, baseUrl) {
    const raw = String(value || '').trim();
    if (!raw) return null;
    let url;
    try {
      url = baseUrl ? new URL(raw, baseUrl) : new URL(raw);
    } catch (error) {
      return null;
    }
    const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !localHttp) return null;
    url.searchParams.delete('autoplay');
    const host = url.hostname.replace(/^www\./, '').toLocaleLowerCase();
    let videoId = '';
    if (host === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      videoId = url.searchParams.get('v') || '';
      if (!videoId) {
        const parts = url.pathname.split('/').filter(Boolean);
        const marker = parts.findIndex(part => part === 'embed' || part === 'shorts' || part === 'live');
        if (marker > -1) videoId = parts[marker + 1] || '';
      }
    }
    if (/^[A-Za-z0-9_-]{6,}$/.test(videoId)) {
      return { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${videoId}` };
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const vimeoId = url.pathname.split('/').filter(Boolean).find(part => /^\d+$/.test(part));
      if (vimeoId) return { type: 'vimeo', src: `https://player.vimeo.com/video/${vimeoId}` };
    }
    const directOrigins = Array.isArray(allowedDirectOrigins) ? allowedDirectOrigins : [];
    const directVideo = /\.(?:mp4|webm|ogg)$/i.test(url.pathname);
    return directVideo && directOrigins.includes(url.origin) ? { type: 'video', src: url.href } : null;
  }

  function publicStorageVideoUrl(value, options) {
    const settings = options || {};
    const raw = String(value || '').trim();
    const base = String(settings.supabaseUrl || '').trim().replace(/\/$/, '');
    const bucket = String(settings.bucket || 'teacher-intro-videos-public').trim().replace(/^\/+|\/+$/g, '');
    if (!raw || !base || !bucket) return '';

    let baseUrl;
    try {
      baseUrl = new URL(base);
    } catch (error) {
      return '';
    }
    if (baseUrl.protocol !== 'https:' && !(
      baseUrl.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname)
    )) return '';

    if (/^https?:\/\//i.test(raw)) {
      try {
        const direct = new URL(raw);
        const prefix = `/storage/v1/object/public/${encodeURIComponent(bucket)}/`;
        return direct.protocol === baseUrl.protocol
          && direct.origin === baseUrl.origin
          && direct.pathname.startsWith(prefix)
          && /\.(?:mp4|webm|ogg)$/i.test(direct.pathname)
          ? direct.href.replace(/[?&]autoplay=[^&]*/gi, '')
          : '';
      } catch (error) {
        return '';
      }
    }

    const clean = raw.replace(/^\/+/, '').replace(/^storage\/v1\/object\/public\//i, '');
    const withoutBucket = clean.startsWith(`${bucket}/`) ? clean.slice(bucket.length + 1) : clean;
    const segments = withoutBucket.split('/').filter(Boolean);
    if (!segments.length || segments.some(segment => segment === '.' || segment === '..')) return '';
    if (!/\.(?:mp4|webm|ogg)$/i.test(segments[segments.length - 1])) return '';
    const encodedPath = segments.map(encodeURIComponent).join('/');
    return `${baseUrl.origin}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
  }

  function teacherVideoSources(teacher, options) {
    const settings = options || {};
    const configured = teacher && teacher.videoUrls && typeof teacher.videoUrls === 'object'
      ? teacher.videoUrls
      : {};
    const rawSources = {
      en: pick(configured.en, teacher && teacher.videoUrl, ''),
      ko: pick(configured.ko, '')
    };
    return ['en', 'ko'].reduce((sources, code) => {
      const raw = String(rawSources[code] || '').trim();
      if (!raw) return sources;
      const hosted = videoEmbedInfo(raw, [], settings.baseUrl);
      const publicStorageUrl = publicStorageVideoUrl(raw, settings);
      const storage = publicStorageUrl
        ? videoEmbedInfo(publicStorageUrl, [new URL(String(settings.supabaseUrl).trim()).origin])
        : null;
      const info = hosted || storage;
      if (info) sources.push({ code, label: LANGUAGE_DEFINITIONS[code].nativeLabel, info });
      return sources;
    }, []);
  }

  function withoutUnreviewedLegacyVideos(payload) {
    if (!Array.isArray(payload)) return payload;
    return payload.map(row => {
      if (!row || typeof row !== 'object') return row;
      return Object.assign({}, row, {
        available_languages: row.available_languages || ['en'],
        introduction_video_url: '',
        introductionVideoUrl: '',
        intro_video_url: '',
        introVideoUrl: '',
        self_intro_video_url: '',
        video_url: '',
        videoUrl: '',
        profile_video_url: '',
        profileVideoUrl: ''
      });
    });
  }

  function isMissingDirectoryV3Error(error) {
    if (!error || typeof error !== 'object') return false;
    const code = String(error.code || '').trim().toUpperCase();
    const message = String(error.message || error.details || '').toLocaleLowerCase();
    return code === 'PGRST202'
      || code === '42883'
      || (
        message.includes('get_public_teacher_directory_v3')
        && (message.includes('could not find') || message.includes('does not exist'))
      );
  }

  global.NADO_TEACHER_DIRECTORY_TESTING = Object.freeze({
    normalizeTeacher,
    groupAvailability,
    teachersForRegion,
    teachersForView,
    teachersForArea,
    bookableAvailabilityCount,
    introductionLength,
    sortTeachersByIntroductionLength,
    availabilityGroupsByDay,
    availabilityDisplayModel,
    teacherPlanGroups,
    directApplicationParams,
    hasCompleteDirectSelection,
    slotDurationMinutes,
    normalizeSchool,
    normalizeLanguages,
    videoEmbedInfo,
    publicStorageVideoUrl,
    teacherVideoSources,
    withoutUnreviewedLegacyVideos,
    isMissingDirectoryV3Error
  });

  if (typeof document === 'undefined') return;

  const state = {
    seoulArea: '',
    teacherType: ['korean', 'native'].includes(new URLSearchParams(location.search).get('teacher_type')) ? new URLSearchParams(location.search).get('teacher_type') : '',
    region: '',
    teachers: [],
    rawTeachers: [],
    sourceKind: '',
    mode: 'regular',
    trialType: '',
    planFilter: '',
    initialized: false,
    client: null,
    liveCache: Object.create(null),
    inFlight: Object.create(null),
    requestId: 0,
    realtimeChannel: null,
    realtimeTimer: 0,
    dialogTrigger: null,
    dialogTeacherId: '',
    dialogTeacherName: '',
    dialogVideoSources: []
  };

  let picker;
  let directory;
  let title;
  let summary;
  let status;
  let grid;
  let dialog;
  let dialogSurface;
  let dialogContent;
  let dialogClose;

  function localPhotoFor(name) {
    const key = String(name || '').trim().toLocaleLowerCase();
    const direct = ownValue(LOCAL_TEACHER_PHOTOS, key);
    if (direct) return direct;
    const matchingKey = Object.keys(LOCAL_TEACHER_PHOTOS).find(candidate => key === candidate || key.startsWith(`${candidate} `));
    return matchingKey ? ownValue(LOCAL_TEACHER_PHOTOS, matchingKey) : '';
  }

  function safeHttpUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^(?:\.\/)?img\/[A-Za-z0-9._/-]+$/i.test(raw)) return raw;
    try {
      const url = new URL(raw, window.location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  function publicPhotoUrl(path) {
    const raw = String(path || '').trim();
    if (!raw) return '';
    if (/^(?:\.\/)?img\//i.test(raw)) return safeHttpUrl(raw);
    const config = global.NADO_MEMBER_CONFIG || {};
    const base = String(config.SUPABASE_URL || '').replace(/\/$/, '');
    if (/^https?:\/\//i.test(raw)) {
      const direct = safeHttpUrl(raw);
      if (!direct || !base) return '';
      try {
        const directUrl = new URL(direct);
        const storageUrl = new URL(base);
        return directUrl.protocol === 'https:'
          && directUrl.origin === storageUrl.origin
          && directUrl.pathname.startsWith('/storage/v1/object/public/')
          ? directUrl.href
          : '';
      } catch (error) {
        return '';
      }
    }
    if (!base) return '';
    const clean = raw.replace(/^\/+/, '');
    if (clean.startsWith('storage/v1/object/public/')) return `${base}/${clean}`;
    const bucket = String(config.PROFILE_PHOTO_BUCKET || 'profile-photos').replace(/^\/+|\/+$/g, '');
    const objectPath = clean.startsWith(`${bucket}/`) ? clean.slice(bucket.length + 1) : clean;
    const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
    return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
  }

  function avatarMarkup(teacher, large) {
    const remote = publicPhotoUrl(teacher.profilePhotoPath);
    const local = localPhotoFor(teacher.name);
    const initialUrl = remote || local;
    const fallback = remote && local && remote !== local ? local : '';
    const initial = escapeHtml((teacher.name || 'T').charAt(0).toUpperCase());
    return `<span class="directory-teacher-avatar${large ? ' directory-teacher-avatar--large' : ''}">
      ${initialUrl ? `<img src="${escapeHtml(initialUrl)}" data-photo-fallback="${escapeHtml(fallback)}" alt="${escapeHtml(teacher.name)} 선생님 프로필 사진" loading="lazy" referrerpolicy="no-referrer">` : ''}
      <span class="directory-teacher-avatar__initial"${initialUrl ? ' hidden' : ''}>${initial}</span>
    </span>`;
  }

  function bindPhotoFallbacks(scope) {
    scope.querySelectorAll('.directory-teacher-avatar img').forEach(image => {
      image.addEventListener('error', () => {
        const fallback = image.dataset.photoFallback;
        if (fallback) {
          image.dataset.photoFallback = '';
          image.src = fallback;
          return;
        }
        image.hidden = true;
        const initial = image.parentElement.querySelector('.directory-teacher-avatar__initial');
        if (initial) initial.hidden = false;
      });
    });
  }

  function schoolClass(school) {
    const key = String(school || '').toLocaleLowerCase();
    if (key.includes('mason')) return ' directory-teacher-card__school--mason';
    if (key.includes('utah')) return ' directory-teacher-card__school--utah';
    return '';
  }

  function dialogSchoolClass(school) {
    const key = String(school || '').toLocaleLowerCase();
    if (key.includes('mason')) return ' teacher-dialog-school--mason';
    if (key.includes('utah')) return ' teacher-dialog-school--utah';
    return '';
  }

  function planLabel(plan) {
    return ({ economy: 'Economy', standard: 'Standard', premium: 'Premium' })[String(plan || '').toLocaleLowerCase()] || '';
  }

  function badgesMarkup(teacher) {
    const badges = ['<span class="directory-teacher-badges__label">수업 플랜</span>'];
    teacherPlanGroups(teacher).forEach(planKey => {
      const plan = planKey === 'premium' ? 'Premium 상담' : planLabel(planKey);
      if (plan) badges.push(`<span class="directory-teacher-badge directory-teacher-badge--${escapeHtml(planKey)}">${plan}</span>`);
    });
    if (teacher.businessEnglish) badges.push('<span class="directory-teacher-badge directory-teacher-badge--premium">Business English</span>');

    return badges.length ? `<span class="directory-teacher-badges">${badges.join('')}</span>` : '';
  }

  function languagesMarkup(teacher, dialogView) {
    const extra = global.nadoTeacherProfile?.(teacher || {}).languages || [];
    const languages = normalizeLanguages([...(teacher && teacher.languages || []), ...extra]);
    if (!languages.length) return '';
    const items = languages.map(language => (
      `<span class="directory-teacher-language">${escapeHtml(language.label)}</span>`
    )).join('');
    return `<div class="directory-teacher-languages${dialogView ? ' directory-teacher-languages--dialog' : ''}" aria-label="가능 언어">
      <span class="directory-teacher-languages__label" aria-hidden="true">가능 언어</span>${items}
    </div>`;
  }

  function configuredTeacherVideoSources(teacher) {
    const config = global.NADO_MEMBER_CONFIG || {};
    return teacherVideoSources(teacher, {
      supabaseUrl: config.SUPABASE_URL,
      bucket: config.TEACHER_INTRO_VIDEO_PUBLIC_BUCKET || 'teacher-intro-videos-public',
      baseUrl: window.location.href
    });
  }

  function videoPlayerMarkup(source) {
    if (!source || !source.info) return '';
    const title = `${source.label} 소개 영상`;
    if (source.info.type === 'video') {
      return `<video controls playsinline preload="metadata" aria-label="${escapeHtml(title)}"><source src="${escapeHtml(source.info.src)}"></video>`;
    }
    return `<iframe src="${escapeHtml(source.info.src)}" title="${escapeHtml(title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  }

  function dialogVideoMarkup(teacher) {
    const sources = configuredTeacherVideoSources(teacher);
    state.dialogVideoSources = sources;
    if (!sources.length) return '';
    const initial = sources[0];
    const tabs = sources.length > 1
      ? `<div class="teacher-dialog-video-tabs" role="tablist" aria-label="소개 영상 언어">
          ${sources.map((source, index) => `<button type="button" id="teacherVideoTab-${escapeHtml(source.code)}" class="teacher-dialog-video-tab" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" aria-controls="teacherDialogVideoPlayer" tabindex="${index === 0 ? '0' : '-1'}" data-teacher-video-tab="${escapeHtml(source.code)}">${escapeHtml(source.label)}</button>`).join('')}
        </div>`
      : `<h3 class="teacher-dialog-video-heading" id="teacherDialogVideoHeading">${escapeHtml(initial.label)} 소개 영상</h3>`;
    return `<section class="teacher-dialog-media" aria-label="선생님 소개 영상">
      ${tabs}
      <div class="teacher-dialog-video" id="teacherDialogVideoPlayer" role="${sources.length > 1 ? 'tabpanel' : 'group'}" aria-labelledby="${sources.length > 1 ? `teacherVideoTab-${escapeHtml(initial.code)}` : 'teacherDialogVideoHeading'}" data-teacher-video-player data-video-language="${escapeHtml(initial.code)}">
        ${videoPlayerMarkup(initial)}
      </div>
    </section>`;
  }

  function selectDialogVideo(languageCode, moveFocus) {
    const source = state.dialogVideoSources.find(item => item.code === languageCode);
    const player = dialogContent && dialogContent.querySelector('[data-teacher-video-player]');
    if (!source || !player) return false;
    const tabs = Array.from(dialogContent.querySelectorAll('[data-teacher-video-tab]'));
    tabs.forEach(tab => {
      const selected = tab.dataset.teacherVideoTab === languageCode;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) tab.focus();
    });
    player.dataset.videoLanguage = languageCode;
    player.setAttribute('aria-labelledby', `teacherVideoTab-${languageCode}`);
    player.innerHTML = videoPlayerMarkup(source);
    return true;
  }

  function areasMarkup(areas) {
    if (!areas.length) return '<li class="directory-area-chip">세부 장소 협의</li>';
    return areas.map(area => `<li class="directory-area-chip">${escapeHtml(area)}</li>`).join('');
  }

  function isLocalPreview() {
    return ['localhost', '127.0.0.1', '::1', '[::1]', 'terminal.local'].includes(window.location.hostname);
  }

  function applicationPage() {
    return state.mode === 'trial' ? 'trial.html' : 'apply.html';
  }

  function applicationUrl(teacher, slot, sourceKind, selectedPlan, planOptions) {
    const url = new URL(applicationPage(), window.location.href);
    if (slot) {
      const directParams = directApplicationParams(teacher, slot, {
        mode: state.mode,
        trialType: state.trialType,
        sourceKind,
        plan: selectedPlan,
        planOptions
      });
      directParams.forEach((value, key) => url.searchParams.set(key, value));
    } else {
      url.searchParams.set('region', teacher.region);
      url.searchParams.set('mode', state.mode);
      if (state.mode === 'trial') url.searchParams.set('trial_type', state.trialType);
      if (state.planFilter) url.searchParams.set('plan', state.planFilter);
    }
    if (isLocalPreview()) url.searchParams.set('test', '1');
    return `${url.pathname.split('/').pop()}${url.search}`;
  }

  function slotActionMarkup(teacher, slot, sourceKind) {
    const day = slot.dayLabel || '가능 시간';
    const areas = Array.isArray(slot.areas) ? slot.areas : [];
    const areaLine = areas.length
      ? `<small class="directory-availability-time__areas">${escapeHtml(areas.join(' · '))}</small>`
      : '';
    const content = `<span class="directory-availability-time__copy">
        <strong class="directory-availability-time__range">${escapeHtml(slot.timeLabel)}</strong>
        ${areaLine}
      </span>`;
    const accessibleLabel = `${teacher.name} 선생님 ${day} ${slot.timeLabel}${areas.length ? `, ${areas.join(', ')}` : ''}`;
    const availableMinutes = slotDurationMinutes(slot);
    const isFreeTrial = state.mode === 'trial' && state.trialType === 'free';
    const isPaidTrial = state.mode === 'trial' && state.trialType === 'paid';
    const premiumSelection = normalizePlanFilter(state.planFilter) === 'premium';
    const teacherPlans = teacherPlanGroups(teacher);
    const regularPlanOptions = teacherPlans.filter(plan => plan === 'economy' || plan === 'standard');
    const selectedPlan = state.mode === 'trial'
      ? (isFreeTrial ? 'economy' : normalizePlanFilter(state.planFilter))
      : (premiumSelection ? 'premium' : '');
    const plansToValidate = selectedPlan ? [selectedPlan] : regularPlanOptions;

    if (availableMinutes < 60) {
      return `<span class="directory-availability-time directory-availability-time--disabled" aria-disabled="true" title="수업 신청에는 연속 60분 이상의 가능 시간이 필요해요." aria-label="${escapeHtml(accessibleLabel)} 신청 불가, 연속 60분 미만">
        ${content}<span class="directory-availability-time__cta" aria-hidden="true">신청 불가</span>
      </span>`;
    }

    if (!plansToValidate.length || !plansToValidate.every(plan => hasCompleteDirectSelection(teacher, slot, sourceKind, plan))) {
      return `<span class="directory-availability-time directory-availability-time--disabled" aria-disabled="true" title="신청에 필요한 시간 또는 장소 정보를 확인 중입니다." aria-label="${escapeHtml(accessibleLabel)} 신청 정보 확인 중">
        ${content}<span class="directory-availability-time__cta" aria-hidden="true">확인 중</span>
      </span>`;
    }

    if (sourceKind === 'snapshot' && !isLocalPreview()) {
      return `<span class="directory-availability-time directory-availability-time--disabled" aria-disabled="true" title="최신 일정을 확인 중입니다." aria-label="${escapeHtml(accessibleLabel)} 신청 준비 중">
        ${content}<span class="directory-availability-time__cta" aria-hidden="true">준비 중</span>
      </span>`;
    }

    const actionLabel = premiumSelection
      ? (isPaidTrial ? '체험 상담' : 'Premium 상담')
      : (isFreeTrial ? '무료 체험 신청' : (isPaidTrial ? '체험 신청' : '신청하기'));
    const actionAccessibleLabel = premiumSelection
      ? `${accessibleLabel}, ${isPaidTrial ? 'Premium 체험' : 'Premium 수업'} 상담 요청`
      : (isFreeTrial
        ? `${accessibleLabel}, 무료 체험 신청`
        : `${accessibleLabel}, ${isPaidTrial ? `${planLabel(selectedPlan)} 체험` : '수업 방식 선택 후 수업'} 신청`);
    const url = applicationUrl(teacher, slot, sourceKind, selectedPlan, selectedPlan ? [] : regularPlanOptions);
    return `<a class="directory-availability-time${premiumSelection ? ' directory-availability-time--premium' : ''}" href="${escapeHtml(url)}" data-directory-slot aria-label="${escapeHtml(actionAccessibleLabel)}">
      ${content}<span class="directory-availability-time__cta"><span>${escapeHtml(actionLabel)}</span><span aria-hidden="true">›</span></span>
    </a>`;
  }

  function safeDomToken(value) {
    return String(value || 'availability').replace(/[^A-Za-z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 80) || 'availability';
  }

  function availabilityMarkup(availability, rowTag, teacher, sourceKind, contextKey) {
    const tag = rowTag === 'li' ? 'li' : 'div';
    const display = availabilityDisplayModel(availability, 3);
    if (!display.groups.length) {
      return `<${tag} class="directory-availability-day"><div class="directory-availability-day__head"><strong>협의</strong></div><div class="directory-availability-time directory-availability-time--disabled" aria-disabled="true"><span class="directory-availability-time__copy"><strong class="directory-availability-time__range">가능 시간 문의</strong></span></div></${tag}>`;
    }

    const prefix = safeDomToken(`${contextKey || 'availability'}-${teacher && (teacher.id || teacher.name) || 'teacher'}`);
    const controlledIds = [];
    const groups = display.groups.map((group, groupIndex) => {
      const listId = `${prefix}-day-${groupIndex}`;
      const dayExtraId = `${listId}-extra`;
      const dayHidden = group.hidden ? ` id="${dayExtraId}" data-availability-extra hidden` : '';
      if (group.hidden) controlledIds.push(dayExtraId);
      const slots = group.slots.map((entry, slotIndex) => {
        const slot = entry.slot;
        const slotExtraId = `${listId}-slot-${slotIndex}`;
        const hidden = entry.hidden ? ` id="${slotExtraId}" data-availability-extra hidden` : '';
        if (entry.hidden) controlledIds.push(slotExtraId);
        const markup = teacher
          ? slotActionMarkup(teacher, slot, sourceKind)
          : `<span class="directory-availability-time"><span class="directory-availability-time__copy"><strong class="directory-availability-time__range">${escapeHtml(slot.timeLabel)}</strong>${slot.areas.length ? `<small class="directory-availability-time__areas">${escapeHtml(slot.areas.join(' · '))}</small>` : ''}</span></span>`;
        return `<li class="directory-availability-time-item"${hidden}>${markup}</li>`;
      }).join('');
      return `<${tag} class="directory-availability-day"${dayHidden}>
        <div class="directory-availability-day__head"><strong>${escapeHtml(group.dayLabel)}</strong><small>${group.slots.length}개</small></div>
        <ul class="directory-availability-time-list" id="${listId}">${slots}</ul>
      </${tag}>`;
    }).join('');
    const toggle = display.extraCount
      ? `<${tag} class="directory-availability-more"><button type="button" class="directory-availability-day__toggle" data-availability-toggle data-extra-count="${display.extraCount}" aria-expanded="false" aria-controls="${controlledIds.join(' ')}">시간대 ${display.extraCount}개 더보기</button></${tag}>`
      : '';
    return groups + toggle;
  }

  function teacherSummaryMarkup(teacher,index,recommendation=false) {
    const tags=(global.nadoTeacherProfile?.(teacher).keywords||teacher.tags||[]).map(tag=>`<span${["🇰🇷", "🇺🇸", "🇮🇳", "🇷🇺"].includes(tag) ? ' class="teacher-category-flag" role="img" aria-label="' + ({"🇰🇷":"한국", "🇺🇸":"미국", "🇮🇳":"인도", "🇷🇺":"러시아"}[tag]) + '"' : ""}>${escapeHtml(tag)}</span>`).join('');
    return `<button type="button" class="teacher-summary-card" ${recommendation?'data-related-teacher="'+index+'"':'data-teacher-open aria-haspopup="dialog" aria-controls="teacherProfileDialog"'} aria-label="${escapeHtml(teacher.name)} 선생님 자세히 보기">
      ${avatarMarkup(teacher,false)}<span class="teacher-summary-copy"><strong>${escapeHtml(teacher.name)}</strong><span class="teacher-summary-school">${escapeHtml(teacher.school)}</span><span class="teacher-summary-major">${escapeHtml(teacher.major)}</span><span class="teacher-summary-tags">${tags}</span></span><span class="teacher-summary-arrow" aria-hidden="true">›</span></button>`;
  }
  function teacherCardMarkup(teacher,index,sourceKind) {
    return `<li class="teacher-summary-item" data-teacher-index="${index}">${teacherSummaryMarkup(teacher,index)}</li>`;
  }

  function setDirectoryHeading(region, count) {
    title.textContent = '선생님 소개';
    summary.textContent = '선생님 소개와 가능한 시간·장소를 확인해보세요.';
  }

  function updateRegionControls(region) {
    const freeTrialLocked = state.mode === 'trial' && state.trialType === 'free';
    document.querySelectorAll('.teacher-region-segment').forEach(segment => {
      segment.classList.toggle('teacher-region-segment--locked', freeTrialLocked);
    });
    document.querySelectorAll('[data-directory-region]').forEach(button => {
      const buttonRegion = normalizeRegion(button.dataset.directoryRegion);
      const trialLocked = freeTrialLocked && buttonRegion !== 'Songdo';
      button.hidden = trialLocked;
      button.disabled = trialLocked;
      button.setAttribute('aria-pressed', buttonRegion === region ? 'true' : 'false');
    });
  }

  function renderSeoulAreaFilter(teachers, region) {
    const container = document.getElementById('seoulAreaFilter');
    if (!container) return;
    container.hidden = region !== 'Seoul';
    if (container.hidden) return;
    const areas = uniqueStrings(teachers.flatMap(teacher => teacher.areas)).sort((a,b)=>a.localeCompare(b,'ko'));
    if (state.seoulArea && !areas.includes(state.seoulArea)) state.seoulArea = '';
    const choices = [''].concat(areas);
    container.innerHTML = '<h4>서울 세부 장소</h4><div class="seoul-area-options" role="group" aria-label="서울 세부 장소">'+choices.map(area =>
      `<button type="button" data-seoul-area="${escapeHtml(area)}" aria-pressed="${state.seoulArea===area}">${escapeHtml(area || '서울 전체')}</button>`
    ).join('')+'</div>';
    container.querySelectorAll('[data-seoul-area]').forEach(button=>button.addEventListener('click',()=>{
      state.seoulArea = button.dataset.seoulArea;
      rerenderCurrentView();
      Array.from(container.querySelectorAll('[data-seoul-area]')).find(item=>item.dataset.seoulArea===state.seoulArea)?.focus();
    }));
  }

  function renderLoading(region) {
    setDirectoryHeading(region);
    status.textContent = `${REGION_LABELS[region]} 선생님 정보를 불러오는 중입니다.`;
    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = '<li class="teacher-directory-skeleton" aria-hidden="true"></li>'.repeat(3);
  }

  function emitDirectoryEvent(name) {
    if (typeof global.CustomEvent !== 'function') return;
    global.dispatchEvent(new global.CustomEvent(name, { detail: getPublicState() }));
  }

  let requestedTeacher = new URLSearchParams(global.location?.search || '').get('teacher');

  function renderTeachers(teachers, region, source) {
    const focusedCard = document.activeElement && document.activeElement.closest
      ? document.activeElement.closest('[data-teacher-index]')
      : null;
    const focusedTeacher = focusedCard ? state.teachers[Number(focusedCard.dataset.teacherIndex)] : null;
    state.rawTeachers = teachers;
    state.sourceKind = source;
    state.teachers = sortTeachersByIntroductionLength(teachersForView(teachers, {
      mode: state.mode,
      trialType: state.trialType,
      planFilter: state.planFilter
    }));
    renderSeoulAreaFilter(teachers, region);
    if (region === 'Seoul') state.teachers = teachersForArea(state.teachers, state.seoulArea);
    if (state.teacherType) state.teachers = state.teachers.filter(teacher => global.nadoTeacherProfile?.(teacher).teacherType === state.teacherType);
    setDirectoryHeading(region, state.teachers.length);
    status.textContent = `${REGION_LABELS[region]}에서 가능한 선생님을 불러왔습니다.`;
    grid.setAttribute('aria-busy', 'false');
    if (!state.teachers.length) {
      if (region === 'Seoul' && state.seoulArea) {
        status.textContent = state.seoulArea + '에서 현재 조건에 맞는 선생님이 없습니다. 다른 장소나 선생님 유형을 선택해주세요.';
        grid.innerHTML = '';
        emitDirectoryEvent('nado:teacher-directory-updated');
        return;
      }
      if (state.teacherType) {
        status.textContent = '선택한 분류로 등록된 선생님이 없습니다.';
        grid.innerHTML = '<li class="teacher-type-empty">한국인·원어민 정보는 등록 후 반영됩니다. 전체 목록을 확인해주세요.<button type="button" data-clear-type>전체 보기</button></li>';
        grid.querySelector('[data-clear-type]').onclick = () => setTeacherType('');
        emitDirectoryEvent('nado:teacher-directory-updated');
        return;
      }
      renderFilteredEmpty(region, source);
      return;
    }
    grid.innerHTML = state.teachers.map((teacher, index) => teacherCardMarkup(teacher, index, source)).join('');
    bindPhotoFallbacks(grid);
    if (requestedTeacher) {
      const target = state.teachers.findIndex(teacher => teacher.name === requestedTeacher || teacher.id === requestedTeacher);
      if (target >= 0) {
        requestedTeacher = null;
        openTeacherDialog(target, grid.querySelector(`[data-teacher-index="${target}"]`));
      }
    }

    if (focusedTeacher) {
      const nextIndex = state.teachers.findIndex(teacher => teacher.name === focusedTeacher.name);
      const nextTrigger = nextIndex < 0 ? null : grid.querySelector(`[data-teacher-index="${nextIndex}"] [data-teacher-open]`);
      window.requestAnimationFrame(() => (nextTrigger || title).focus());
    }
    emitDirectoryEvent('nado:teacher-directory-updated');
  }

  function renderFilteredEmpty(region) {
    const isTrial = state.mode === 'trial';
    const isFreeTrial = isTrial && state.trialType === 'free';
    const filter = planLabel(state.planFilter);
    status.textContent = isTrial
      ? `현재 등록된 시간 중 ${isFreeTrial ? '무료 체험' : '유료 체험'} 조건과 맞는 선생님이 없습니다.`
      : `현재 ${filter ? `${filter} 수업` : '선택한'} 조건과 맞는 선생님이 없습니다.`;
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = `<li class="teacher-directory-message">
      <div class="teacher-directory-message__inner">
        <span class="teacher-directory-message__icon" aria-hidden="true">N</span>
        <h3>${isTrial ? `현재 선택 가능한 ${isFreeTrial ? '무료' : '유료'} 체험 시간이 없어요` : '선택한 조건의 선생님이 없어요'}</h3>
        <p>${isTrial ? '다른 시간이 열리면 이 목록에 반영됩니다. 카카오톡으로 가능한 일정을 먼저 문의하실 수도 있어요.' : '수업 방식 필터를 해제하거나 다른 지역을 선택해보세요.'}</p>
        ${!isTrial && filter
          ? '<button type="button" class="teacher-directory-action" data-directory-clear-filter>모든 수업 방식 보기</button>'
          : '<a class="teacher-directory-action" href="https://pf.kakao.com/_pbPJX/chat" target="_blank" rel="noopener noreferrer">카카오톡으로 문의하기</a>'}
      </div>
    </li>`;
    const clearFilter = grid.querySelector('[data-directory-clear-filter]');
    if (clearFilter) clearFilter.addEventListener('click', () => setPlanFilter(''));
    emitDirectoryEvent('nado:teacher-directory-updated');
  }

  function renderEmpty(region) {
    const hadGridFocus = grid.contains(document.activeElement);
    state.teachers = [];
    state.rawTeachers = [];
    state.sourceKind = 'live';
    setDirectoryHeading(region, 0);
    status.textContent = `현재 공개된 ${REGION_LABELS[region]} 선생님이 없습니다.`;
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = `<li class="teacher-directory-message">
      <div class="teacher-directory-message__inner">
        <span class="teacher-directory-message__icon" aria-hidden="true">N</span>
        <h3>현재 공개된 ${escapeHtml(REGION_LABELS[region])} 선생님이 없어요</h3>
        <p>새로운 가능 시간이 등록되면 이 화면에 바로 반영됩니다. 급한 문의는 카카오톡으로 도와드릴게요.</p>
        <a class="teacher-directory-action" href="https://pf.kakao.com/_pbPJX/chat" target="_blank" rel="noopener noreferrer">카카오톡으로 문의하기</a>
      </div>
    </li>`;
    if (hadGridFocus) window.requestAnimationFrame(() => title.focus());
    emitDirectoryEvent('nado:teacher-directory-updated');
  }

  function renderError(region) {
    const hadGridFocus = grid.contains(document.activeElement);
    state.teachers = [];
    state.rawTeachers = [];
    state.sourceKind = '';
    setDirectoryHeading(region);
    status.textContent = `${REGION_LABELS[region]} 선생님 정보를 불러오지 못했습니다.`;
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = `<li class="teacher-directory-message">
      <div class="teacher-directory-message__inner">
        <span class="teacher-directory-message__icon" aria-hidden="true">!</span>
        <h3>선생님 정보를 불러오지 못했어요</h3>
        <p>잠시 후 다시 시도해주세요. 계속 보이지 않으면 카카오톡으로 가능한 선생님을 바로 안내해드릴게요.</p>
        <button type="button" class="teacher-directory-action" data-directory-retry>다시 불러오기</button>
      </div>
    </li>`;
    const retry = grid.querySelector('[data-directory-retry]');
    if (retry) retry.addEventListener('click', () => loadRegion(region, { historyMode: 'none', force: true }));
    if (hadGridFocus) window.requestAnimationFrame(() => (retry || title).focus());
    emitDirectoryEvent('nado:teacher-directory-updated');
  }

  function getClient() {
    if (state.client) return state.client;
    const config = global.NADO_MEMBER_CONFIG || {};
    const key = config.SUPABASE_ANON_KEY || config.SUPABASE_PUBLISHABLE_KEY;
    if (!global.supabase || !config.SUPABASE_URL || !key) throw new Error('Public directory connection is unavailable.');
    state.client = global.supabase.createClient(config.SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return state.client;
  }

  function scheduleRealtimeRefresh() {
    if (!state.region) return;
    if (state.realtimeTimer) window.clearTimeout(state.realtimeTimer);
    state.realtimeTimer = window.setTimeout(() => {
      state.realtimeTimer = 0;
      if (state.region) loadRegion(state.region, { historyMode: 'none', force: true });
    }, 650);
  }

  function setupRealtimeRefresh() {
    if (state.realtimeChannel) return;
    const config = global.NADO_MEMBER_CONFIG || {};
    const channelName = String(config.TEACHER_DIRECTORY_REALTIME_CHANNEL || '').trim();
    if (!/^[A-Za-z0-9:_-]{1,100}$/.test(channelName)) return;
    const eventName = /^[A-Za-z0-9:_-]{1,100}$/.test(String(config.TEACHER_DIRECTORY_REALTIME_EVENT || '').trim())
      ? String(config.TEACHER_DIRECTORY_REALTIME_EVENT).trim()
      : 'directory-changed';
    try {
      state.realtimeChannel = getClient()
        .channel(channelName)
        .on('broadcast', { event: eventName }, scheduleRealtimeRefresh)
        .subscribe();
    } catch (error) {
      state.realtimeChannel = null;
    }
  }

  function teardownRealtimeRefresh() {
    if (state.realtimeTimer) {
      window.clearTimeout(state.realtimeTimer);
      state.realtimeTimer = 0;
    }
    if (!state.realtimeChannel || !state.client) return;
    try {
      state.client.removeChannel(state.realtimeChannel);
    } catch (error) {
      // The page is already unloading; there is nothing else to clean up.
    }
    state.realtimeChannel = null;
  }

  async function fetchLiveTeachers(region, force) {
    if (!force && Object.prototype.hasOwnProperty.call(state.liveCache, region)) {
      return state.liveCache[region];
    }
    if (state.inFlight[region]) return state.inFlight[region];
    state.inFlight[region] = Promise.resolve(getClient().rpc('get_public_teacher_directory_v3', { p_region: region }))
      .then(async response => {
        if (response.error) {
          if (!isMissingDirectoryV3Error(response.error)) throw response.error;
          const fallbackResponse = await getClient().rpc('get_public_teacher_directory_v2', { p_region: region });
          if (fallbackResponse.error) throw fallbackResponse.error;
          fallbackResponse.data = withoutUnreviewedLegacyVideos(fallbackResponse.data);
          return fallbackResponse;
        }
        return response;
      })
      .then(response => {
        const teachers = teachersForRegion(response.data, region);
        state.liveCache[region] = teachers;
        return teachers;
      })
      .finally(() => {
        delete state.inFlight[region];
      });
    return state.inFlight[region];
  }

  function updateUrl(region, historyMode) {
    if (historyMode === 'none') return;
    const url = new URL(window.location.href);
    url.searchParams.set('region', region);
    if (historyMode === 'replace') window.history.replaceState({ teacherRegion: region }, '', url);
    else window.history.pushState({ teacherRegion: region }, '', url);
  }

  function loadRegion(value, options) {
    const requestedRegion = normalizeRegion(value);
    const region = state.mode === 'trial' && state.trialType === 'free' ? 'Songdo' : requestedRegion;
    if (!region) return;
    const settings = options || {};
    const sameRegion = state.region === region && !settings.force;
    const moveFocusToResults = picker.contains(document.activeElement);
    if (state.region !== region) state.seoulArea = '';
    state.region = region;
    const areaFilter = document.getElementById('seoulAreaFilter');
    if (areaFilter) areaFilter.hidden = region !== 'Seoul';
    picker.hidden = true;
    directory.hidden = false;
    updateRegionControls(region);
    if (!sameRegion) updateUrl(region, settings.historyMode || 'push');
    if (sameRegion) return;

    const requestId = ++state.requestId;
    const fallbackTeachers = teachersForRegion(global.NADO_TEACHER_DIRECTORY_FALLBACK, region);
    if (fallbackTeachers.length) renderTeachers(fallbackTeachers, region, 'snapshot');
    else renderLoading(region);
    if (moveFocusToResults) window.requestAnimationFrame(() => title.focus());

    fetchLiveTeachers(region, settings.force === true).then(liveTeachers => {
      if (requestId !== state.requestId || state.region !== region) return;
      setupRealtimeRefresh();
      if (liveTeachers.length) renderTeachers(liveTeachers, region, 'live');
      else renderEmpty(region);
    }).catch(error => {
      if (requestId !== state.requestId || state.region !== region) return;
      if (!fallbackTeachers.length) renderError(region);
      if (global.console && typeof global.console.warn === 'function') {
        global.console.warn('NADO teacher directory is using its local snapshot.', error && error.message ? error.message : error);
      }
    });
  }

  function showRegionPicker(moveFocus) {
    if (state.mode === 'trial' && state.trialType === 'free') {
      loadRegion('Songdo', { historyMode: 'none' });
      return;
    }
    state.requestId += 1;
    state.region = '';
    state.teachers = [];
    state.rawTeachers = [];
    state.sourceKind = '';
    picker.hidden = false;
    directory.hidden = true;
    grid.innerHTML = '';
    status.textContent = '';
    updateRegionControls('');
    if (moveFocus) {
      const pickerTitle = document.getElementById('teacherRegionPickerTitle');
      if (pickerTitle) window.requestAnimationFrame(() => pickerTitle.focus());
    }
  }

  function dialogApplicationCta(teacher) {
    if (state.mode === 'trial') return '';
    const label = state.planFilter === 'premium' ? 'Premium 상담 요청하기' : '다른 일정으로 맞춤 상담하기';
    return `<a class="teacher-dialog-cta" href="${escapeHtml(applicationUrl(teacher, null, state.sourceKind))}">${label}</a>`;
  }

  function timetableMarkup(teacher, sourceKind = state.sourceKind) {
    return '<p class="timetable-hint">가능한 시작 시간을 여러 개 선택해주세요.</p>' + groupAvailabilityByDayForTimetable(teacher, sourceKind) + '<p class="timetable-selection" role="status">선택한 시간이 없습니다.</p><button type="button" class="teacher-dialog-cta timetable-apply" disabled>선택한 시간으로 신청하기</button>';
  }
  function groupAvailabilityByDayForTimetable(teacher, sourceKind = state.sourceKind) {
    const groups = new Map();
    teacher.availability.forEach(slot=>{
      const source = document.createElement('div'); source.innerHTML=slotActionMarkup(teacher,slot,sourceKind);
      const link=source.querySelector('a'); if(!link) return;
      const day=slot.dayLabel;
      if(!groups.has(day)) groups.set(day,[]);
      for(let m=timeToMinutes(slot.startTime,false);m+60<=timeToMinutes(slot.endTime,true);m+=30){
        const time=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
        const url=new URL(link.getAttribute('href'),location.href); url.searchParams.set('preferred_time',time);
        groups.get(day).push('<button type="button" class="timetable-time" aria-pressed="false" data-time-url="'+escapeHtml(url.search)+'" data-area="'+escapeHtml(slot.areas.join(' · '))+'" data-time-label="'+escapeHtml(day+' '+time)+'">'+time+'</button>');
      }
    });
    return [...groups].map(([day,buttons])=>'<div class="timetable-day"><strong>'+escapeHtml(day)+'</strong><div class="timetable-buttons">'+buttons.join('')+'</div></div>').join('') || '<p>현재 신청 가능한 시간을 확인 중입니다.</p>';
  }
  function bindTimetable() {
    const selected=new Map(); const summary=dialogContent.querySelector('.timetable-selection'); const apply=dialogContent.querySelector('.timetable-apply');
    dialogContent.querySelectorAll('[data-time-url]').forEach(button=>button.addEventListener('click',()=>{
      const key=button.dataset.timeUrl;
      if(selected.has(key)) selected.delete(key);
      else {
        const first=[...selected.values()][0];
        if(first && first.dataset.area!==button.dataset.area){summary.textContent='장소가 다른 시간은 기존 선택을 해제한 후 선택해주세요.';return;}
        selected.set(key,button);
      }
      button.setAttribute('aria-pressed',String(selected.has(key)));
      summary.textContent=selected.size?[...selected.values()].map(b=>b.dataset.timeLabel).join(' · '):'선택한 시간이 없습니다.';
      apply.disabled=!selected.size;
    }));
    apply?.addEventListener('click',()=>{
      const values=[...selected.keys()]; if(!values.length)return;
      const url=new URL(applicationPage()+values[0],location.href);
      url.searchParams.set('time_choices',JSON.stringify(values));
      const kind=new URL(location.href).searchParams.get('lesson_kind'); if(kind)url.searchParams.set('lesson_kind',kind);
      location.assign(url.href);
    });
  }

  function bindProfileRegions(originalTeacher) {
    const originalSourceKind = state.sourceKind;
    const panel = dialogContent.querySelector('#teacherRegionDetails');
    const buttons = [...dialogContent.querySelectorAll('[data-profile-region]')];
    let request = 0;
    const matches = teacher => teacher.id === originalTeacher.id
      || teacher.name.trim().toLocaleLowerCase() === originalTeacher.name.trim().toLocaleLowerCase();
    const render = (teacher, region, sourceKind) => {
      if (!teacher || (!teacher.areas.length && !teacher.availability.length)) {
        panel.innerHTML = `<p class="teacher-region-unavailable">이 선생님은 현재 ${escapeHtml(REGION_LABELS[region])}에서 수업을 진행하지 않아요. 해당 지역에서 수업 가능한 다른 선생님을 찾아보세요.</p><a class="teacher-dialog-cta" href="teachers.html?region=${region}">${escapeHtml(REGION_LABELS[region])} 선생님 찾아보기 →</a>`;
        return;
      }
      panel.innerHTML = `<ul class="directory-area-chips">${areasMarkup(teacher.areas)}</ul><h3 class="teacher-region-times">가능 시간</h3>${timetableMarkup(teacher, sourceKind)}`;
      bindTimetable();
    };
    const select = async region => {
      const token = ++request;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.profileRegion === region)));
      // Keep the listing filters unchanged while changing this profile's schedule.
      if (region === originalTeacher.region) {
        render(originalTeacher, region, originalSourceKind);
        return;
      }
      panel.innerHTML = '<p role="status">수업 지역과 시간을 확인하고 있어요.</p>';
      try {
        const teachers = await fetchLiveTeachers(region, false);
        if (token !== request || !panel.isConnected) return;
        render(teachers.find(matches), region, 'live');
      } catch (_) {
        if (token !== request || !panel.isConnected) return;
        const teacher = teachersForRegion(global.NADO_TEACHER_DIRECTORY_FALLBACK, region).find(matches);
        if (teacher) render(teacher, region, 'snapshot');
        else panel.innerHTML = '<p>해당 지역의 최신 정보를 불러오지 못했어요. 잠시 후 다시 선택해주세요.</p>';
      }
    };
    buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.profileRegion)));
    select(originalTeacher.region);
  }

  function openTeacherDialog(index, trigger) {
    const teacher = state.teachers[index];
    if (!teacher) return;
    state.dialogTrigger = trigger || document.activeElement;
    state.dialogTeacherId = teacher.id;
    state.dialogTeacherName = teacher.name;
    const school = teacher.school
      ? `<p class="teacher-dialog-school${dialogSchoolClass(teacher.school)}">${escapeHtml(teacher.school)}</p>`
      : '';
    const major = teacher.major ? `<p class="teacher-dialog-major">${escapeHtml(teacher.major)}</p>` : '';
    const translatedBio = global.nadoTeacherBio?.(teacher);
    const description = translatedBio?.en || teacher.bio || '선생님의 자세한 소개는 첫 연결 시 안내해드릴게요.';
    const video = dialogVideoMarkup(teacher);
    dialogContent.innerHTML = `<div class="teacher-dialog-body">
        <div class="teacher-dialog-head">
          ${avatarMarkup(teacher, true)}
          <div>
            <h2 id="teacherDialogTitle">${escapeHtml(teacher.name)}</h2>
            ${major}${school}
            ${badgesMarkup(teacher)}
            ${languagesMarkup(teacher, true)}
            <div class="teacher-summary-tags teacher-dialog-keywords" aria-label="선생님 키워드">${(global.nadoTeacherProfile?.(teacher).keywords || teacher.tags || []).map(tag=>`<span${["🇰🇷", "🇺🇸", "🇮🇳", "🇷🇺"].includes(tag) ? ' class="teacher-category-flag" role="img" aria-label="' + ({"🇰🇷":"한국", "🇺🇸":"미국", "🇮🇳":"인도", "🇷🇺":"러시아"}[tag]) + '"' : ""}>${escapeHtml(tag)}</span>`).join('')}</div>
          </div>
        </div>
        <section class="teacher-introduction"${translatedBio ? ' role="button" tabindex="0" aria-pressed="false" aria-label="자기소개 한국어로 보기"' : ''}><div class="bio-heading"><h3>자기소개</h3>${translatedBio ? '<span class="bio-language-hint">눌러서 한국어로 보기</span>' : ''}</div><p class="teacher-dialog-description" id="teacherDialogDescription" lang="en">${escapeHtml(description)}</p></section>
        ${video}
        <section class="teacher-dialog-detail teacher-region-details" aria-labelledby="teacherDialogAreasTitle">
          <h3 id="teacherDialogAreasTitle">수업 가능 지역·시간</h3>
          <div class="teacher-region-segment" role="group" aria-label="선생님 수업 지역">
            <button type="button" data-profile-region="Songdo" aria-pressed="false">송도</button>
            <button type="button" data-profile-region="Seoul" aria-pressed="false">서울</button>
          </div>
          <div id="teacherRegionDetails" aria-live="polite"></div>
        </section>
        <section class="related-teachers"><a class="teacher-dialog-cta" href="teachers.html">다른 선생님 만나보기 →</a></section>
      </div>`;
    dialogContent.querySelectorAll('[data-related-teacher]').forEach(button=>button.addEventListener('click',()=>openTeacherDialog(Number(button.dataset.relatedTeacher),state.dialogTrigger)));
    if (translatedBio) {
      const box = dialogContent.querySelector('.teacher-introduction');
      const text = box.querySelector('.teacher-dialog-description');
      const hint = box.querySelector('.bio-language-hint');
      const toggleBio = () => {
        const korean = box.getAttribute('aria-pressed') !== 'true';
        text.textContent = korean ? translatedBio.ko : translatedBio.en;
        text.lang = korean ? 'ko' : 'en';
        box.setAttribute('aria-pressed', String(korean));
        box.setAttribute('aria-label', korean ? '자기소개 영어로 보기' : '자기소개 한국어로 보기');
        hint.textContent = korean ? '눌러서 영어로 보기' : '눌러서 한국어로 보기';
      };
      box.addEventListener('click', toggleBio);
      box.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleBio(); }
      });
    }
    bindProfileRegions(teacher);
    bindPhotoFallbacks(dialogContent);
    dialogSurface.scrollTop = 0;
    document.body.classList.add('teacher-dialog-open');
    if (!dialog.open && typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    window.requestAnimationFrame(() => dialogClose.focus());
  }

  function finishDialogClose() {
    if (new URL(location.href).searchParams.has('teacher')) { location.replace('teachers.html'); return; }
    dialogContent.innerHTML = '';
    state.dialogVideoSources = [];
    document.body.classList.remove('teacher-dialog-open');
    let trigger = state.dialogTrigger;
    if (!trigger || !document.contains(trigger)) {
      const currentIndex = state.teachers.findIndex(teacher => (
        (state.dialogTeacherId && teacher.id === state.dialogTeacherId)
        || (state.dialogTeacherName && teacher.name === state.dialogTeacherName)
      ));
      if (currentIndex > -1) trigger = grid.querySelector(`[data-teacher-index="${currentIndex}"] [data-teacher-open]`);
    }
    if (!trigger || !document.contains(trigger)) {
      trigger = document.querySelector('.teacher-region-segment--compact [aria-pressed="true"]');
    }
    state.dialogTrigger = null;
    state.dialogTeacherId = '';
    state.dialogTeacherName = '';
    if (trigger && document.contains(trigger) && typeof trigger.focus === 'function') trigger.focus();
  }

  function closeTeacherDialog() {
    if (!dialog.hasAttribute('open')) return;
    if (typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      finishDialogClose();
    }
  }

  function trapDialogFocus(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeTeacherDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(element => !element.hidden && element.getClientRects().length > 0);
    if (!focusable.length) {
      event.preventDefault();
      dialogClose.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function regionFromUrl() {
    return normalizeRegion(new URL(window.location.href).searchParams.get('region'));
  }

  function getPublicState() {
    return Object.freeze({
      teacherType: state.teacherType,
      mode: state.mode,
      trialType: state.trialType,
      planFilter: state.planFilter,
      effectivePlanFilter: state.mode === 'trial' && state.trialType === 'free' ? 'economy' : state.planFilter,
      region: state.region,
      sourceKind: state.sourceKind,
      teacherCount: state.teachers.length,
      realtimeConfigured: Boolean(state.realtimeChannel)
    });
  }

  function rerenderCurrentView() {
    if (!state.initialized) return;
    updateRegionControls(state.region);
    if (state.region && state.rawTeachers.length) {
      renderTeachers(state.rawTeachers, state.region, state.sourceKind || 'snapshot');
    } else if (state.region) {
      loadRegion(state.region, { historyMode: 'none', force: true });
    }
  }

  function setDirectoryMode(value, options) {
    const settings = options || {};
    const nextMode = normalizeDirectoryMode(value);
    const hasPlan = Object.prototype.hasOwnProperty.call(settings, 'planFilter')
      || Object.prototype.hasOwnProperty.call(settings, 'plan');
    state.mode = nextMode;
    state.trialType = nextMode === 'trial' ? normalizeTrialType(settings.trialType) : '';
    if (hasPlan) state.planFilter = normalizePlanFilter(settings.planFilter || settings.plan);
    if (!state.initialized) return getPublicState();

    if (nextMode === 'trial' && state.trialType === 'free') {
      if (state.region !== 'Songdo') {
        loadRegion('Songdo', { historyMode: settings.historyMode || 'none' });
      } else {
        rerenderCurrentView();
      }
    } else if (nextMode === 'trial' && state.trialType === 'paid' && !state.planFilter) {
      state.region = '';
      state.teachers = [];
      state.rawTeachers = [];
      picker.hidden = true;
      directory.hidden = true;
    } else if (nextMode === 'trial' && state.trialType === 'paid') {
      rerenderCurrentView();
      if (!state.region) showRegionPicker(false);
    } else if (nextMode === 'trial') {
      state.region = '';
      state.teachers = [];
      state.rawTeachers = [];
      picker.hidden = true;
      directory.hidden = true;
    } else {
      rerenderCurrentView();
      if (!state.region) showRegionPicker(false);
    }
    emitDirectoryEvent('nado:teacher-directory-mode-changed');
    return getPublicState();
  }

  function setTeacherType(value) {
    state.teacherType = ['korean','native'].includes(value) ? value : '';
    rerenderCurrentView();
    return getPublicState();
  }

  function setPlanFilter(value) {
    state.planFilter = normalizePlanFilter(value);
    rerenderCurrentView();
    emitDirectoryEvent('nado:teacher-directory-filter-changed');
    return getPublicState();
  }

  function selectRegion(value, options) {
    const region = normalizeRegion(value);
    if (!region || (state.mode === 'trial' && state.trialType === 'free' && region !== 'Songdo')) return false;
    if (!state.initialized) {
      state.region = region;
      return true;
    }
    loadRegion(region, { historyMode: (options && options.historyMode) || 'none' });
    return true;
  }

  function resetRegion(moveFocus) {
    if (state.mode === 'trial' && state.trialType === 'free') return false;
    if (!state.initialized) {
      state.region = '';
      return true;
    }
    showRegionPicker(moveFocus !== false);
    return true;
  }

  function refreshDirectory() {
    if (!state.initialized || !state.region) return Promise.resolve(getPublicState());
    loadRegion(state.region, { historyMode: 'none', force: true });
    return Promise.resolve(getPublicState());
  }

  function applyDirectoryConfiguration(event) {
    const detail = event && event.detail && typeof event.detail === 'object' ? event.detail : {};
    const mode = Object.prototype.hasOwnProperty.call(detail, 'mode') ? detail.mode : state.mode;
    const settings = { historyMode: detail.historyMode || 'none' };
    if (Object.prototype.hasOwnProperty.call(detail, 'trialType')) settings.trialType = detail.trialType;
    if (Object.prototype.hasOwnProperty.call(detail, 'planFilter')) settings.planFilter = detail.planFilter;
    else if (Object.prototype.hasOwnProperty.call(detail, 'plan')) settings.plan = detail.plan;
    setDirectoryMode(mode, settings);
    if (detail.region) selectRegion(detail.region, { historyMode: detail.historyMode || 'none' });
  }

  const initialOptions = global.NADO_TEACHER_DIRECTORY_OPTIONS && typeof global.NADO_TEACHER_DIRECTORY_OPTIONS === 'object'
    ? global.NADO_TEACHER_DIRECTORY_OPTIONS
    : {};
  state.mode = normalizeDirectoryMode(new URL(location.href).searchParams.get('mode') || initialOptions.mode);
  state.trialType = state.mode === 'trial' ? normalizeTrialType(initialOptions.trialType) : '';
  state.planFilter = normalizePlanFilter(initialOptions.planFilter || initialOptions.plan);

  const publicApi = Object.freeze({
    setMode: setDirectoryMode,
    setPlanFilter,
    setTeacherType,
    selectRegion,
    resetRegion,
    refresh: refreshDirectory,
    getState: getPublicState
  });
  global.NADOTeacherDirectory = publicApi;
  global.NADO_TEACHER_DIRECTORY = publicApi;
  global.addEventListener('nado:teacher-directory-config', applyDirectoryConfiguration);
  global.addEventListener('nado:directory-config', applyDirectoryConfiguration);

  function toggleAvailabilityGroup(button) {
    if (!button) return false;
    const list = button.closest('.directory-availability-list');
    if (!list) return false;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    list.querySelectorAll('[data-availability-extra]').forEach(item => {
      item.hidden = expanded;
    });
    const nextExpanded = !expanded;
    button.setAttribute('aria-expanded', String(nextExpanded));
    button.textContent = nextExpanded
      ? '시간대 접기'
      : `시간대 ${Number(button.dataset.extraCount) || 0}개 더보기`;
    return true;
  }

  function initialize() {
    picker = document.getElementById('teacherRegionPicker');
    directory = document.getElementById('teacherDirectory');
    title = document.getElementById('teacherDirectoryTitle');
    summary = document.getElementById('teacherDirectorySummary');
    status = document.getElementById('teacherDirectoryStatus');
    grid = document.getElementById('teacherDirectoryGrid');
    dialog = document.getElementById('teacherProfileDialog');
    dialogSurface = dialog && dialog.querySelector('.teacher-profile-dialog__surface');
    dialogContent = document.getElementById('teacherDialogContent');
    dialogClose = document.getElementById('teacherDialogClose');
    if (!picker || !directory || !title || !summary || !status || !grid || !dialog || !dialogSurface || !dialogContent || !dialogClose) return;
    state.initialized = true;

    document.querySelectorAll('[data-directory-region]').forEach(button => {
      button.addEventListener('click', () => loadRegion(button.dataset.directoryRegion, { historyMode: 'push' }));
    });
    grid.addEventListener('click', event => {
      const availabilityToggle = event.target.closest('[data-availability-toggle]');
      if (availabilityToggle) {
        toggleAvailabilityGroup(availabilityToggle);
        return;
      }
      if (event.target.closest('[data-directory-slot], .directory-availability-time--disabled')) return;
      const card = event.target.closest('[data-teacher-index]');
      if (!card) return;
      const trigger = event.target.closest('[data-teacher-open]') || card.querySelector('[data-teacher-open]');
      openTeacherDialog(Number(card.dataset.teacherIndex), trigger);
    });
    dialogClose.addEventListener('click', closeTeacherDialog);
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeTeacherDialog();
    });
    dialog.addEventListener('close', finishDialogClose);
    dialog.addEventListener('click', event => {
      const videoTab = event.target.closest('[data-teacher-video-tab]');
      if (videoTab) {
        selectDialogVideo(videoTab.dataset.teacherVideoTab, false);
        return;
      }
      const availabilityToggle = event.target.closest('[data-availability-toggle]');
      if (availabilityToggle) {
        toggleAvailabilityGroup(availabilityToggle);
        return;
      }
      if (event.target !== dialog) return;
      const bounds = dialogSurface.getBoundingClientRect();
      const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
        && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      if (!inside) closeTeacherDialog();
    });
    dialog.addEventListener('keydown', trapDialogFocus);
    dialog.addEventListener('keydown', event => {
      const tab = event.target.closest('[data-teacher-video-tab]');
      if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = Array.from(dialog.querySelectorAll('[data-teacher-video-tab]'));
      if (tabs.length < 2) return;
      event.preventDefault();
      const current = Math.max(0, tabs.indexOf(tab));
      const next = event.key === 'Home'
        ? 0
        : (event.key === 'End'
          ? tabs.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length);
      selectDialogVideo(tabs[next].dataset.teacherVideoTab, true);
    });
    window.addEventListener('popstate', () => {
      closeTeacherDialog();
      const region = state.mode === 'trial' && state.trialType === 'free' ? 'Songdo' : regionFromUrl();
      if (region) loadRegion(region, { historyMode: 'none' });
      else showRegionPicker(true);
    });
    window.addEventListener('pagehide', teardownRealtimeRefresh, { once: true });
    const sdk = document.getElementById('teacherDirectorySupabaseSdk');
    if (sdk && !global.supabase) {
      sdk.addEventListener('load', () => {
        if (state.region) loadRegion(state.region, { historyMode: 'none', force: true });
      }, { once: true });
    }

    const configuredRegion = normalizeRegion(initialOptions.region || state.region);
    const initialRegion = state.mode === 'trial' && state.trialType === 'free'
      ? 'Songdo'
      : (configuredRegion || regionFromUrl());
    if (initialRegion) loadRegion(initialRegion, { historyMode: 'none' });
    else showRegionPicker(false);
    updateRegionControls(state.region);
    emitDirectoryEvent('nado:teacher-directory-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})(typeof window !== 'undefined' ? window : globalThis);

// User-confirmed teacher categories and additional languages. Flags reflect user-confirmed countries.
window.NADO_TEACHER_PROFILE_CONFIG = {
  "img/abhinay.jpg": {
    "name": "Abhinay",
    "teacherType": "native",
    "keywords": [
      "🇮🇳",
      "중급/고급",
      "친근한",
      "재밌는"
    ]
  },
  "img/amelia.jpg": {
    "name": "Amelia",
    "teacherType": "korean",
    "keywords": [
      "🇰🇷",
      "초급/중급/고급",
      "경험 공유",
      "성실함"
    ],
    "languages": [
      "ko"
    ]
  },
  "img/amy.jpg": {
    "name": "Amy",
    "teacherType": "native",
    "keywords": [
      "🇺🇸",
      "중급/고급",
      "실력 상승",
      "편안한"
    ]
  },
  "img/anniah.jpg": {
    "name": "Anniah",
    "teacherType": "native",
    "keywords": [
      "🇺🇸",
      "중급/고급",
      "편안한",
      "친절한"
    ]
  },
  "img/ej.jpg": {
    "name": "Ej",
    "teacherType": "native",
    "keywords": [
      "🇺🇸",
      "초급/중급/고급",
      "동기부여",
      "따뜻한"
    ]
  },
  "img/hara.jpg": {
    "name": "Hara",
    "teacherType": "korean",
    "keywords": [
      "🇰🇷",
      "초급/중급/고급",
      "실력 상승",
      "꼼꼼함",
      "초등/중등 학생 수업 전문"
    ],
    "languages": [
      "ko"
    ]
  },
  "img/justina.jpg": {
    "name": "Justina",
    "teacherType": "korean",
    "keywords": [
      "🇰🇷",
      "초급/중급/고급",
      "꼼꼼함",
      "준비도",
      "초등/중등 학생 수업 전문"
    ],
    "languages": [
      "ko"
    ]
  },
  "img/oscar.jpg": {
    "name": "Oscar",
    "teacherType": "native",
    "keywords": [
      "🇺🇸",
      "중급/고급",
      "비즈니스",
      "친근한",
      "꼼꼼함"
    ]
  },
  "img/sophie.jpg": {
    "name": "Sophie",
    "teacherType": "native",
    "keywords": [
      "🇺🇸",
      "중급/고급",
      "일상회화",
      "편안한"
    ]
  },
  "img/tae.jpg": {
    "name": "Tae",
    "teacherType": "korean",
    "keywords": [
      "🇰🇷",
      "초급/중급",
      "일상회화",
      "편안한",
      "노하우"
    ],
    "languages": [
      "ko"
    ]
  },
  "img/victoria.jpg": {
    "name": "Victoria",
    "teacherType": "native",
    "keywords": [
      "🇷🇺",
      "중급/고급",
      "5년 이상 경력",
      "친근한 소통"
    ]
  },
  "img/vitalina.jpg": {
    "name": "Vita",
    "teacherType": "native",
    "keywords": [
      "🇺🇸",
      "중급/고급",
      "맞춤형 수업",
      "실생활 영어"
    ]
  },
  "img/hayden.jpg": {
    "name": "Hayden",
    "teacherType": "native",
    "keywords": [
      "🇺🇸",
      "중급/고급",
      "미국 여러 지역 생활",
      "기다려주는 설명",
      "친근한 대화"
    ],
    "languages": [
      "en"
    ]
  },
  "img/hyunwoo.jpg": {
    "name": "Hyunwoo",
    "teacherType": "korean",
    "keywords": [
      "🇰🇷",
      "초급/중급",
      "기초 영어",
      "일상 회화",
      "한국어 가능"
    ],
    "languages": [
      "en",
      "ko"
    ]
  },
  "img/yerin.jpg": {
    "name": "Yerin",
    "teacherType": "korean",
    "keywords": [
      "🇰🇷",
      "초급/중급",
      "유아 지도 경험",
      "즐거운 수업",
      "한국어 가능"
    ],
    "languages": [
      "en",
      "ko"
    ]
  },
  "img/braydon.png": {
    "name": "Braydon",
    "teacherType": "native",
    "keywords": [
      "🇺🇸",
      "중급/고급",
      "맞춤형 전문",
      "친근한 대화",
      "꼼꼼함"
    ],
    "languages": [
      "en"
    ]
  },
  "img/may.jpg": {
    "name": "May",
    "teacherType": "native",
    "keywords": [
      "🇺🇸",
      "중급/고급",
      "편안한 분위기",
      "친근한",
      "밝은 에너지"
    ],
    "languages": [
      "en"
    ]
  },
  "img/valeria.jpg": {
    "name": "Valeria",
    "teacherType": "native",
    "keywords": [
      "🇺🇸",
      "중급/고급",
      "맞춤형 수업",
      "친절한 소통",
      "자신감 향상"
    ],
    "languages": [
      "en"
    ]
  }
};
window.nadoTeacherProfile = function(teacher) {
  const profiles = window.NADO_TEACHER_PROFILE_CONFIG;
  if (profiles[teacher.profilePhotoPath]) return profiles[teacher.profilePhotoPath];
  const name = String(teacher.name || teacher.displayName || '').trim().toLowerCase().split(/\s+/)[0];
  return Object.values(profiles).find(profile => profile.name.toLowerCase() === name) || {};
};

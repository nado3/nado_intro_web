(function (global) {
  'use strict';
  const entries = [
  {
    "name": "Abhinay",
    "variants": ["Hello Guys!! My name is Abhinay. I am studying Business B.S. in George Mason University Korea. I’m passionate about helping students build natural confidence in English conversation and writing. Whether you want to improve daily communication, practice writing, or speak more comfortably, I’m here to support your goals in an encouraging and engaging space!"],
    "bio": "Hello Guys!! My name is Abhinay. I am studying Business B.S. at George Mason University. I’m passionate about helping students build natural confidence in English conversation and writing. Whether you want to improve daily communication, practice writing, or speak more comfortably, I’m here to support your goals in an encouraging and engaging space!",
    "ko": "안녕하세요! 저는 Abhinay입니다. George Mason University에서 경영학을 전공하고 있어요. 학생들이 영어 회화와 글쓰기에 자연스럽게 자신감을 갖도록 돕는 데 열정을 가지고 있습니다. 일상적인 의사소통이나 글쓰기를 연습하고 싶거나, 좀 더 편안하게 영어로 말하고 싶다면 격려와 활기 있는 분위기 속에서 여러분의 목표를 함께 이루고 싶어요!",
    "en": "Hello Guys!! My name is Abhinay. I am studying Business B.S. at George Mason University. I’m passionate about helping students build natural confidence in English conversation and writing. Whether you want to improve daily communication, practice writing, or speak more comfortably, I’m here to support your goals in an encouraging and engaging space!"
  },
  {
    "name": "Amelia",
    "bio": "Hi, My name is Amelia! I’m a native speaker from the US, and I'm interested in a wide variety of music, movies, and books. I’m thrilled to be able to share our experiences together. Let's have fun learning and getting to know each other!",
    "ko": "안녕하세요, Amelia입니다! 저는 미국 출신의 영어 원어민이고, 다양한 음악과 영화, 책에 관심이 많아요. 서로의 경험을 나눌 수 있어 기대됩니다. 즐겁게 배우면서 서로 알아가요!",
    "en": "Hi, My name is Amelia! I’m a native speaker from the US, and I'm interested in a wide variety of music, movies, and books. I’m thrilled to be able to share our experiences together. Let's have fun learning and getting to know each other!"
  },
  {
    "name": "Amy",
    "bio": "Hello! My name is Amy Trejo, and I hope to help you improve your English speaking skills. I also aim to make this experience fun and relaxed while getting to know everyone.",
    "ko": "안녕하세요! 저는 Amy Trejo입니다. 여러분의 영어 말하기 실력 향상을 돕고 싶어요. 서로 알아가면서 즐겁고 편안한 시간을 만드는 것도 저의 목표입니다.",
    "en": "Hello! My name is Amy Trejo, and I hope to help you improve your English speaking skills. I also aim to make this experience fun and relaxed while getting to know everyone."
  },
  {
    "name": "Anniah",
    "bio": "Hi! I’m a native English speaker from Washington DC. As a Conflict student it is my mission to connect with people of various backgrounds and find understanding! I’d love to teach you English!",
    "ko": "안녕하세요! 저는 워싱턴 DC 출신의 영어 원어민입니다. 갈등 분야를 공부하는 학생으로서 다양한 배경을 가진 사람들과 교류하고 서로를 이해하는 것을 중요하게 생각해요. 여러분에게 영어를 가르치고 싶습니다!",
    "en": "Hi! I’m a native English speaker from Washington DC. As a Conflict student it is my mission to connect with people of various backgrounds and find understanding! I’d love to teach you English!"
  },
  {
    "name": "Ej",
    "bio": "Hello, I'm Ej here to help you on your english journey. Looking forward to working with you.",
    "ko": "안녕하세요, Ej입니다. 여러분의 영어 학습 여정을 도와드리고 싶어요. 함께 공부할 시간을 기대하고 있습니다.",
    "en": "Hello, I'm Ej here to help you on your english journey. Looking forward to working with you."
  },
  {
    "name": "Hara",
    "bio": "안녕하세요! 학생분들에게 영어를 ‘즐기는’ 법을 공유하는 것에 대한 열정이 있습니다 :)",
    "ko": "안녕하세요! 학생분들에게 영어를 ‘즐기는’ 법을 공유하는 것에 대한 열정이 있습니다 :)",
    "en": "Hello! I’m passionate about sharing ways for students to enjoy learning English :)"
  },
  {
    "name": "Justina",
    "bio": "I’m a Conflict Analysis and Resolution student at George Mason University.\n\nBorn and raised in Korea, I speak English fluently and naturally. Having learned English in Korea myself, I understand what Korean learners struggle with and what it takes to become a confident English speaker.\n\nMy lessons focus on real conversations and natural expressions, helping you turn the English you know into English you can actually use with confidence! :)",
    "ko": "저는 George Mason University에서 갈등 분석 및 해결을 전공하고 있습니다.\n\n한국에서 나고 자랐으며, 영어를 유창하고 자연스럽게 구사합니다. 저 역시 한국에서 영어를 배웠기 때문에 한국인 학습자가 어떤 어려움을 겪는지, 자신감 있게 영어를 말하려면 무엇이 필요한지 이해하고 있어요.\n\n제 수업은 실제 대화와 자연스러운 표현에 집중합니다. 여러분이 알고 있는 영어를 자신 있게 실제로 사용할 수 있는 영어로 바꾸도록 도와드릴게요! :)",
    "en": "I’m a Conflict Analysis and Resolution student at George Mason University.\n\nBorn and raised in Korea, I speak English fluently and naturally. Having learned English in Korea myself, I understand what Korean learners struggle with and what it takes to become a confident English speaker.\n\nMy lessons focus on real conversations and natural expressions, helping you turn the English you know into English you can actually use with confidence! :)"
  },
  {
    "name": "Oscar",
    "bio": "Hi! I'm Oscar, a friendly native English speaker who enjoys helping students improve their confidence and communication skills. I look forward to learning with you!",
    "ko": "안녕하세요! 저는 Oscar입니다. 학생들이 자신감과 의사소통 능력을 키우도록 돕는 것을 좋아하는 친근한 영어 원어민이에요. 여러분과 함께 배울 시간을 기대합니다!",
    "en": "Hi! I'm Oscar, a friendly native English speaker who enjoys helping students improve their confidence and communication skills. I look forward to learning with you!"
  },
  {
    "name": "Sophie",
    "bio": "Hi! My name is Sophie, and I am a native English speaker from Virginia!",
    "ko": "안녕하세요! 저는 Sophie이고, 버지니아 출신의 영어 원어민입니다!",
    "en": "Hi! My name is Sophie, and I am a native English speaker from Virginia!"
  },
  {
    "name": "Tae",
    "bio": "내가 좋아하는 영화나 미디어를 보면서 편안하고 쉽게 영어를 배우자!",
    "ko": "내가 좋아하는 영화나 미디어를 보면서 편안하고 쉽게 영어를 배우자!",
    "en": "Let’s learn English comfortably and easily by watching movies and media we enjoy!"
  },
  {
    "name": "Victoria",
    "bio": "Hi, my name is Victoria Yuguy! I love talking to people and getting to know others. I talk a lot so let me know if you want to practice with me. :)",
    "ko": "안녕하세요, Victoria Yuguy입니다! 저는 사람들과 대화하고 서로 알아가는 것을 좋아해요. 말하는 것을 좋아하니 저와 함께 연습하고 싶다면 알려주세요. :)",
    "en": "Hi, my name is Victoria Yuguy! I love talking to people and getting to know others. I talk a lot so let me know if you want to practice with me. :)"
  },
  {
    "name": "Vita",
    "bio": "Having learned multiple foreign languages myself, I understand the challenges language learners face when trying to improve their skills and overcome language barriers. Because of this, I strive to develop a unique teaching approach for each student based on their interests, goals, and needs. I aim to build practical language skills that students can confidently use in everyday life.",
    "ko": "저도 여러 외국어를 배웠기 때문에, 실력을 높이고 언어의 장벽을 넘으려는 학습자들이 겪는 어려움을 이해합니다. 그래서 학생마다 관심사와 목표, 필요에 맞는 수업 방식을 만들기 위해 노력해요. 일상에서 자신 있게 활용할 수 있는 실용적인 언어 능력을 기르는 것이 제 목표입니다.",
    "en": "Having learned multiple foreign languages myself, I understand the challenges language learners face when trying to improve their skills and overcome language barriers. Because of this, I strive to develop a unique teaching approach for each student based on their interests, goals, and needs. I aim to build practical language skills that students can confidently use in everyday life."
  },
  {
    "name": "Hayden",
    "bio": "Hi! My name is Hayden Jump. I’m a native English speaker who grew up across the U.S. I’m friendly, patient, and enjoy helping others feel more confident speaking and learning English. I look forward to working with you!",
    "ko": "안녕하세요! 저는 Hayden Jump입니다. 미국의 여러 지역에서 자란 영어 원어민이에요. 친근하고 인내심 있는 성격이며, 다른 사람들이 영어로 말하고 배우는 데 자신감을 갖도록 돕는 것을 좋아합니다. 여러분과 함께할 시간을 기대합니다!",
    "en": "Hi! My name is Hayden Jump. I’m a native English speaker who grew up across the U.S. I’m friendly, patient, and enjoy helping others feel more confident speaking and learning English. I look forward to working with you!"
  },
  {
    "name": "Hyunwoo",
    "bio": "Hello! My name is Hyunwoo, and I am currently a student at George Mason University.\n\nI am confident in teaching basic English and English conversation. I am available for tutoring on Fridays, Saturdays, and Sundays in Seoul.\nLet's learn English together!",
    "ko": "안녕하세요! 저는 Hyunwoo이고, 현재 George Mason University에 재학 중입니다.\n\n기초 영어와 영어 회화를 가르치는 데 자신 있습니다. 금요일, 토요일, 일요일에 서울에서 수업할 수 있어요.\n함께 영어를 배워봐요!",
    "en": "Hello! My name is Hyunwoo, and I am currently a student at George Mason University.\n\nI am confident in teaching basic English and English conversation. I am available for tutoring on Fridays, Saturdays, and Sundays in Seoul.\nLet's learn English together!"
  },
  {
    "name": "Yerin",
    "bio": "Hi! I'm Yerin :) I have experience teaching English to kindergarteners.\nI can help you practice basic English conversation in a fun way!",
    "ko": "안녕하세요! 저는 Yerin입니다 :) 유치원생에게 영어를 가르친 경험이 있어요.\n기초 영어 회화를 재미있게 연습할 수 있도록 도와드릴게요!",
    "en": "Hi! I'm Yerin :) I have experience teaching English to kindergarteners.\nI can help you practice basic English conversation in a fun way!"
  },
  {
    "name": "Braydon",
    "bio": "Hello!\nMy name is Braydon Andruzzi and I am from the US studying abroad in Korea. I am currently attending George Mason University, majoring in Global Affairs.",
    "ko": "안녕하세요!\n저는 미국에서 온 Braydon Andruzzi이고, 한국에서 유학하고 있습니다. 현재 George Mason University에서 국제학을 전공하고 있어요.",
    "en": "Hello!\nMy name is Braydon Andruzzi and I am from the US studying abroad in Korea. I am currently attending George Mason University, majoring in Global Affairs."
  },
  {
    "name": "May",
    "bio": "Hi my name is May Solomon and I am a student at GMUK, I’m super excited to meet you!",
    "ko": "안녕하세요! 저는 May Solomon이고, George Mason University의 학생입니다. 여러분을 만나게 되어 정말 기대돼요!",
    "en": "Hi my name is May Solomon and I am a student at GMUK, I’m super excited to meet you!"
  },
  {
    "name": "Valeria",
    "bio": "Hi! I’m Valeria, a Business student at George Mason University. I studied at an American school, so English has been a big part of my academic and everyday life. I’m patient, friendly, and passionate about helping others feel confident speaking English. My classes are relaxed and personalized, and I’m happy to adapt our lessons to the learning style that works best for you. Let’s make English fun, practical, and comfortable!",
    "ko": "안녕하세요! 저는 George Mason University에서 경영학을 공부하는 Valeria입니다. 미국 학교에서 공부했기 때문에 영어는 학업과 일상에서 큰 부분을 차지해왔어요. 저는 인내심이 있고 친근한 성격이며, 다른 사람들이 자신 있게 영어로 말하도록 돕는 데 열정을 가지고 있습니다. 수업은 편안하고 학생에게 맞춰 진행하며, 여러분에게 가장 잘 맞는 학습 방식에 맞춰 수업을 조정하고 싶어요. 영어를 재미있고 실용적이며 편안하게 배워봐요!",
    "en": "Hi! I’m Valeria, a Business student at George Mason University. I studied at an American school, so English has been a big part of my academic and everyday life. I’m patient, friendly, and passionate about helping others feel confident speaking English. My classes are relaxed and personalized, and I’m happy to adapt our lessons to the learning style that works best for you. Let’s make English fun, practical, and comfortable!"
  }
];
  const normalize = value => String(value || '').replace(/George Mason Uni(?:v)?ersity Korea/gi, 'George Mason University').replace(/Mason Korea(?: \(Songdo\))?/gi, 'George Mason University').replace(/\s+/g, ' ').trim();
  global.nadoTeacherBio = teacher => {
    const name = String(teacher.name || teacher.displayName || '').trim().toLowerCase();
    const entry = entries.find(row => row.name.toLowerCase() === name && [row.bio, ...(row.variants || [])].some(bio => normalize(bio) === normalize(teacher.bio)));
    // Do not show an old translation when a teacher updates their introduction.
    return entry ? {en: entry.en, ko: entry.ko} : null;
  };
})(typeof window === 'undefined' ? globalThis : window);

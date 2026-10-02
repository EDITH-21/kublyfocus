/**
 * Knolect - Channel Classification & Verification Engine
 * 
 * Deterministic local classification system for YouTube channels.
 * Evaluates multi-signal educational vs entertainment indicators without external AI/API dependencies.
 * Enforces: DEFAULT = BLOCK. Only verified/qualified learning channels are eligible.
 */

// 1. Positive Education Signals Dictionary
const POSITIVE_EDUCATION_KEYWORDS = [
  // Academic & Core Subjects
  'study', 'education', 'learning', 'lecture', 'lectures', 'class', 'course',
  'tutorial', 'tutorials', 'exam', 'preparation', 'prep', 'revision', 'notes',
  'subject', 'mathematics', 'math', 'maths', 'physics', 'chemistry', 'biology',
  'science', 'computer science', 'engineering', 'college', 'university', 'school',
  'academic', 'calculus', 'algebra', 'geometry', 'statistics', 'economics',
  'history', 'geography', 'philosophy', 'sociology', 'literature', 'botany', 'zoology',

  // Competitive & Entrance Exams
  'jee', 'iit', 'neet', 'gate', 'upsc', 'ssc', 'cat', 'cet', 'nit', 'cbse',
  'icse', 'ugc net', 'banking', 'government exam', 'ias', 'ips', 'nda', 'cds',
  'aiims', 'ies', 'sat', 'gre', 'gmat', 'clat', 'ca foundation', 'boards',
  'pw', 'physics wallah', 'unacademy', 'allen', 'vedantu', 'byjus', 'drishti ias',
  'khan academy', 'examrace', 'testbook', 'addatwofour', 'gradeup',

  // Technical & Software Engineering
  'programming', 'coding', 'developer', 'software', 'software engineering',
  'web development', 'frontend', 'backend', 'fullstack', 'javascript', 'typescript',
  'python', 'java', 'c++', 'c#', 'rust', 'golang', 'react', 'node', 'nodejs',
  'mongodb', 'sql', 'database', 'data structures', 'algorithms', 'dsa',
  'machine learning', 'artificial intelligence', 'deep learning', 'data science',
  'cloud computing', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes',
  'cybersecurity', 'ethical hacking', 'linux', 'git', 'github', 'flutter', 'dart',
  'system design', 'leetcode', 'competitive programming',

  // Language & Professional Skills
  'english learning', 'spoken english', 'ielts', 'toefl', 'communication skills',
  'technical skills', 'career skills', 'professional development', 'grammar',
  'pronunciation', 'vocabulary', 'spanish', 'french', 'german', 'japanese',
  'mandarin', 'public speaking', 'research methodology', 'academic writing'
];

// 2. Negative Entertainment Signals Dictionary
const NEGATIVE_ENTERTAINMENT_KEYWORDS = [
  // Music & Audio
  'music', 'song', 'songs', 'official music', 'official video', 'lyrics', 'lyric video',
  'album', 'audio', 'remix', 'dj', 'vevo', 'record label', 'pop', 'hip hop', 'rap',
  'rock', 'bollywood', 'soundtrack', 'tseries', 'sony music', 'zee music',

  // Movies & Cinema
  'movie', 'movies', 'film', 'films', 'trailer', 'teaser', 'box office', 'cinema',
  'scene', 'full movie', 'web series', 'episode', 'drama', 'telefilm', 'netflix',

  // Short-form & Addictive Content
  'shorts', 'reel', 'reels', 'tiktok', 'trending shorts', 'viral shorts',

  // Entertainment, Humor & Vlogging
  'vlog', 'vlogs', 'daily vlog', 'prank', 'pranks', 'comedy', 'roast', 'standup',
  'gaming', 'gameplay', 'gamer', 'let\'s play', 'esports', 'minecraft', 'pubg',
  'freefire', 'gta', 'fortnite', 'roblox', 'reaction', 'reactions', 'reacting to',
  'celebrity', 'entertainment', 'dance', 'travel vlog', 'lifestyle', 'fashion',
  'makeup', 'beauty', 'haul', 'challenge', 'podcast entertainment', 'memes',
  'funny', 'gossip', 'viral', 'compilation', 'anime edit', 'streamer', 'twitch',
  'unboxing toys', 'couple vlog', 'mukbang', 'asmr entertainment'
];

// 3. System-Approved Verified Curated Registry (Canonical Channel Identities)
const SYSTEM_VERIFIED_CHANNELS = [
  {
    channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    handle: '@mitocw',
    normalizedHandle: 'mitocw',
    name: 'MIT OpenCourseWare',
    category: 'education',
    confidence: 100,
    reason: 'Official university open courseware lectures and STEM courses'
  },
  {
    channelId: 'UCYO_jab_esuFRV4b17AJtAw',
    handle: '@3blue1brown',
    normalizedHandle: '3blue1brown',
    name: '3Blue1Brown',
    category: 'education',
    confidence: 100,
    reason: 'Higher mathematics, calculus, linear algebra and neural networks visualization'
  },
  {
    channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
    handle: '@freecodecamp',
    normalizedHandle: 'freecodecamp',
    name: 'freeCodeCamp.org',
    category: 'education',
    confidence: 100,
    reason: 'Complete software development, coding tutorials, and computer science'
  },
  {
    channelId: 'UC4a-Gbdw7vOaccHmFo40b9g',
    handle: '@khanacademy',
    normalizedHandle: 'khanacademy',
    name: 'Khan Academy',
    category: 'education',
    confidence: 100,
    reason: 'Comprehensive K-12 and university academic lessons'
  },
  {
    channelId: 'UCV3ab_4Tsq_j3_cI-8n_rAw',
    handle: '@PW-Foundation',
    normalizedHandle: 'pw-foundation',
    name: 'PW Foundation',
    category: 'education',
    confidence: 99,
    reason: 'Class 9th & 10th foundation, Olympiad, and STEM preparation by Physics Wallah'
  },
  {
    channelId: 'UCiGyWN60ITDeK2Z54sqWkJQ',
    handle: '@PhysicsWallah',
    normalizedHandle: 'physicswallah',
    name: 'Physics Wallah - Alakh Pandey',
    category: 'education',
    confidence: 99,
    reason: 'JEE, NEET, and academic physics/chemistry lectures'
  },
  {
    channelId: 'UCJihyK0A38SZ6SdJirEdIOw',
    handle: '@GateSmashers',
    normalizedHandle: 'gatesmashers',
    name: 'Gate Smashers',
    category: 'education',
    confidence: 99,
    reason: 'GATE computer science, IT engineering, DSA, OS, DBMS and computer networks'
  },
  {
    channelId: 'UCcabW7890RKJzL968QWEykA',
    handle: '@cs50',
    normalizedHandle: 'cs50',
    name: 'CS50',
    category: 'education',
    confidence: 100,
    reason: 'Harvard University Introduction to Computer Science'
  },
  {
    channelId: 'UCFbcWx2b54vRkKzOQkRknjw',
    handle: '@crashcourse',
    normalizedHandle: 'crashcourse',
    name: 'CrashCourse',
    category: 'education',
    confidence: 98,
    reason: 'Curriculum-aligned world history, science, biology, and literature courses'
  },
  {
    channelId: 'UCVls1GmFKf6WlTraIb_IaJg',
    handle: '@nptelhrd',
    normalizedHandle: 'nptelhrd',
    name: 'NPTEL-NOC IITM',
    category: 'education',
    confidence: 100,
    reason: 'IIT & IISc certified engineering and science video lectures'
  },
  {
    channelId: 'UCR1IuLEqb6UEA_zQ81kwXfg',
    handle: '@stanfordonline',
    normalizedHandle: 'stanfordonline',
    name: 'Stanford Online',
    category: 'education',
    confidence: 100,
    reason: 'Stanford University academic courses and engineering seminars'
  },
  {
    channelId: 'UC7cs8q-gJRlGSUqeY051SAg',
    handle: '@ApnaCollegeOfficial',
    normalizedHandle: 'apnacollegeofficial',
    name: 'Apna College',
    category: 'education',
    confidence: 98,
    reason: 'Programming tutorials, web development, and coding interview preparation'
  },
  {
    channelId: 'UCW5YeuERMmlnqo4oq8vwUpg',
    handle: '@TheOrganicChemistryTutor',
    normalizedHandle: 'theorganicchemistrytutor',
    name: 'The Organic Chemistry Tutor',
    category: 'education',
    confidence: 100,
    reason: 'Organic chemistry, physics, algebra, calculus, and test preparation'
  },
  {
    channelId: 'UC59K-uG2A5ogwIrHw4bmlEg',
    handle: '@Telusko',
    normalizedHandle: 'telusko',
    name: 'Telusko',
    category: 'education',
    confidence: 96,
    reason: 'Java, Python, Spring Boot, and software engineering tutorials'
  }
];

/**
 * Check if text contains a keyword with word-boundary awareness
 * @param {string} text 
 * @param {string} keyword 
 * @returns {boolean}
 */
function containsKeyword(text, keyword) {
  if (!text || !keyword) return false;
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase().trim();

  if (lowerKeyword.includes(' ') || lowerKeyword.includes('-')) {
    return lowerText.includes(lowerKeyword);
  }
  
  // Single token word boundary match or exact inclusion in handles
  const regex = new RegExp(`(?:^|[\\s_\\-@./#[\\]()])${escapeRegex(lowerKeyword)}(?:$|[\\s_\\-@./#[\\]()])`, 'i');
  return regex.test(lowerText) || lowerText.includes(lowerKeyword);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize channel input into a clean lookup object
 * @param {string|object} input 
 * @returns {{ name: string, handle: string, normalizedHandle: string, channelId: string, url: string }}
 */
function resolveChannelIdentity(input) {
  if (!input) {
    return { name: '', handle: '', normalizedHandle: '', channelId: '', url: '' };
  }

  let raw = '';
  let channelId = '';
  let handle = '';
  let name = '';

  if (typeof input === 'object') {
    raw = input.url || input.handle || input.identifier || input.name || '';
    channelId = (input.channelId || '').trim();
    handle = (input.handle || '').trim();
    name = (input.name || '').trim();
  } else {
    raw = String(input).trim();
  }

  // Handle URL parsing
  if (raw.includes('youtube.com/') || raw.includes('youtu.be/')) {
    try {
      const urlObj = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const pathname = urlObj.pathname.replace(/\/$/, '');
      const parts = pathname.split('/').filter(Boolean);

      if (parts[0] && parts[0].startsWith('@')) {
        handle = parts[0];
        if (!name) name = handle.slice(1);
      } else if (parts[0] === 'channel' && parts[1]) {
        channelId = parts[1];
        if (!name) name = channelId;
      } else if ((parts[0] === 'c' || parts[0] === 'user') && parts[1]) {
        if (!name) name = parts[1];
      } else if (parts[0]) {
        if (parts[0].startsWith('@')) handle = parts[0];
        if (!name) name = parts[0];
      }
    } catch (e) {
      // Fallback
    }
  } else if (raw.startsWith('@')) {
    handle = raw;
    if (!name) name = raw.slice(1);
  } else if (/^UC[\w-]{21,23}$/.test(raw)) {
    channelId = raw;
    if (!name) name = raw;
  } else if (!name) {
    name = raw;
  }

  if (handle && !handle.startsWith('@')) {
    handle = `@${handle}`;
  }

  if (!handle && raw && !raw.includes(' ') && !raw.includes('/') && !channelId) {
    handle = `@${raw.replace(/^@/, '')}`;
  }

  const normalizedHandle = (handle || '').replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '');

  return {
    name: name || (handle ? handle.slice(1) : channelId),
    handle: handle || (normalizedHandle ? `@${normalizedHandle}` : ''),
    normalizedHandle,
    channelId: channelId || '',
    url: handle ? `https://www.youtube.com/${handle}` : (channelId ? `https://www.youtube.com/channel/${channelId}` : '')
  };
}

/**
 * Check if channel matches system-approved verified registry
 * @param {object} channelInfo 
 * @returns {object|null}
 */
function isSystemVerifiedLearningChannel(channelInfo) {
  if (!channelInfo) return null;
  const identity = resolveChannelIdentity(channelInfo);

  const matched = SYSTEM_VERIFIED_CHANNELS.find(item => {
    // 1. Channel ID Match (Strongest)
    if (identity.channelId && item.channelId && identity.channelId.toLowerCase() === item.channelId.toLowerCase()) {
      return true;
    }
    // 2. Normalized Handle Match
    if (identity.normalizedHandle && item.normalizedHandle && identity.normalizedHandle === item.normalizedHandle) {
      return true;
    }
    // 3. Exact Name Match
    if (identity.name && item.name && identity.name.toLowerCase().trim() === item.name.toLowerCase().trim()) {
      return true;
    }
    return false;
  });

  return matched || null;
}

/**
 * Classify a YouTube channel locally based on multi-signal scoring
 * @param {object} channelData - { name, handle, channelId, description, videoTitle, keywords }
 * @returns {{
 *   category: 'education' | 'entertainment' | 'mixed' | 'unknown',
 *   confidence: number,
 *   reasons: string[],
 *   eligible: boolean,
 *   educationScore: number,
 *   entertainmentScore: number
 * }}
 */
function classifyChannel(channelData) {
  if (!channelData) {
    return {
      category: 'unknown',
      confidence: 0,
      reasons: ['No channel data provided.'],
      eligible: false,
      educationScore: 0,
      entertainmentScore: 0
    };
  }

  const identity = resolveChannelIdentity(channelData);

  // 1. Check System Verified Registry First
  const verified = isSystemVerifiedLearningChannel(identity);
  if (verified) {
    return {
      category: 'education',
      confidence: verified.confidence || 100,
      reasons: [verified.reason || 'Verified educational channel in Knolect directory.'],
      eligible: true,
      educationScore: 100,
      entertainmentScore: 0,
      verified: true
    };
  }

  // 2. Multi-Signal Text Assembly
  const channelName = (identity.name || '').toLowerCase();
  const handle = (identity.normalizedHandle || '').toLowerCase();
  const description = ((channelData.description || channelData.about) || '').toLowerCase();
  const videoTitle = (channelData.videoTitle || '').toLowerCase();
  const combinedChannelContext = `${channelName} ${handle} ${description}`;

  let educationScore = 0;
  let entertainmentScore = 0;
  const reasons = [];
  const positiveMatches = new Set();
  const negativeMatches = new Set();

  // Evaluate Positive Education Signals
  for (const kw of POSITIVE_EDUCATION_KEYWORDS) {
    // Channel name match: Heavy weight (30 pts)
    if (containsKeyword(channelName, kw)) {
      educationScore += 30;
      positiveMatches.add(kw);
    }
    // Handle match: Heavy weight (25 pts)
    else if (containsKeyword(handle, kw)) {
      educationScore += 25;
      positiveMatches.add(kw);
    }
    // Description match: Moderate weight (15 pts)
    else if (containsKeyword(description, kw)) {
      educationScore += 15;
      positiveMatches.add(kw);
    }
    // Video title match: Lower weight (10 pts)
    else if (containsKeyword(videoTitle, kw)) {
      educationScore += 10;
      positiveMatches.add(kw);
    }
  }

  // Evaluate Negative Entertainment Signals
  for (const kw of NEGATIVE_ENTERTAINMENT_KEYWORDS) {
    // Channel name match: Heavy penalty (35 pts)
    if (containsKeyword(channelName, kw)) {
      entertainmentScore += 35;
      negativeMatches.add(kw);
    }
    // Handle match: Heavy penalty (30 pts)
    else if (containsKeyword(handle, kw)) {
      entertainmentScore += 30;
      negativeMatches.add(kw);
    }
    // Description match: Moderate penalty (20 pts)
    else if (containsKeyword(description, kw)) {
      entertainmentScore += 20;
      negativeMatches.add(kw);
    }
    // Video title match: Low penalty (10 pts)
    else if (containsKeyword(videoTitle, kw)) {
      entertainmentScore += 10;
      negativeMatches.add(kw);
    }
  }

  // Specific high-trust educational channel name indicators
  if (/\b(foundation|academy|classes|institute|tutorials|lectures|engineering|university|college|school|dsa|neet|jee|upsc|gate|iit)\b/i.test(channelName)) {
    educationScore += 35;
    reasons.push('Academic/exam preparation keyword detected in channel title.');
  }

  // High-risk entertainment keywords in channel title
  if (/\b(gaming|gamer|vlogs|vlog|pranks|prank|comedy|roast|music|songs|vevo|trailers|reaction|memes)\b/i.test(channelName)) {
    entertainmentScore += 45;
    reasons.push('Entertainment/distraction keyword detected in channel title.');
  }

  // Cap scores
  educationScore = Math.min(100, educationScore);
  entertainmentScore = Math.min(100, entertainmentScore);

  // Determine Category & Eligibility
  let category = 'unknown';
  let eligible = false;
  let confidence = 0;

  if (positiveMatches.size > 0) {
    reasons.push(`Educational signals: ${Array.from(positiveMatches).slice(0, 4).join(', ')}`);
  }
  if (negativeMatches.size > 0) {
    reasons.push(`Entertainment signals: ${Array.from(negativeMatches).slice(0, 4).join(', ')}`);
  }

  // Strict Focus Eligibility Decision Rules:
  // 1. Education score must be >= 50 (or verified)
  // 2. Education score must significantly exceed entertainment score
  // 3. Entertainment score must not be overwhelming
  if (educationScore >= 50 && educationScore >= entertainmentScore * 1.8 && entertainmentScore < 40) {
    category = 'education';
    eligible = true;
    confidence = Math.min(98, Math.round(50 + (educationScore * 0.45) - (entertainmentScore * 0.2)));
    reasons.unshift('Channel verified as learning-focused based on academic/educational content signals.');
  } else if (entertainmentScore >= 40 && entertainmentScore >= educationScore) {
    category = 'entertainment';
    eligible = false;
    confidence = Math.min(99, Math.round(50 + (entertainmentScore * 0.5)));
    reasons.unshift('Channel classified as entertainment/distracting content.');
  } else if (educationScore > 0 && entertainmentScore > 0) {
    category = 'mixed';
    eligible = false;
    confidence = 65;
    reasons.unshift('Channel contains mixed entertainment & educational content. Not eligible for Strict Focus allowlist.');
  } else {
    category = 'unknown';
    eligible = false;
    confidence = 30;
    reasons.unshift('Could not confidently establish strong learning signals. Strict Focus defaults to BLOCK.');
  }

  return {
    category,
    confidence,
    reasons,
    eligible,
    educationScore,
    entertainmentScore,
    identity
  };
}

/**
 * Validate that a stored learning channel entry is still eligible
 * @param {object} channelItem 
 * @returns {boolean}
 */
function isStillEligible(channelItem) {
  if (!channelItem) return false;
  if (channelItem.source === 'system_verified' || channelItem.verified) return true;
  if (channelItem.category === 'education' && channelItem.confidence >= 50 && channelItem.eligible !== false) {
    return true;
  }
  
  // Re-classify to verify
  const result = classifyChannel(channelItem);
  return result.eligible;
}

// Attach to global scope for extension runtime & Node.js test suites
if (typeof globalThis !== 'undefined') {
  globalThis.POSITIVE_EDUCATION_KEYWORDS = POSITIVE_EDUCATION_KEYWORDS;
  globalThis.NEGATIVE_ENTERTAINMENT_KEYWORDS = NEGATIVE_ENTERTAINMENT_KEYWORDS;
  globalThis.SYSTEM_VERIFIED_CHANNELS = SYSTEM_VERIFIED_CHANNELS;
  globalThis.resolveChannelIdentity = resolveChannelIdentity;
  globalThis.isSystemVerifiedLearningChannel = isSystemVerifiedLearningChannel;
  globalThis.classifyChannel = classifyChannel;
  globalThis.isStillEligible = isStillEligible;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    POSITIVE_EDUCATION_KEYWORDS,
    NEGATIVE_ENTERTAINMENT_KEYWORDS,
    SYSTEM_VERIFIED_CHANNELS,
    resolveChannelIdentity,
    isSystemVerifiedLearningChannel,
    classifyChannel,
    isStillEligible
  };
}

/**
 * Client-Side Intent Matcher
 * Zero network dependency — 100% in-browser matching with local data.
 * Authoritative 12 questions mapped to 8 canonical intents across 6 coastal languages.
 */

import qaBank from '../../data/qa_bank.json' with { type: 'json' };

// Unicode script-based language detector
export function detectScriptLang(text) {
  if (!text) return 'en';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';
  if (/[\u0980-\u09FF]/.test(text)) return 'bn';
  return 'en';
}

// Normalize text: lowercase, remove punctuation, strip excess whitespace
export function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[।?!.,;:'"()\-–—_/[\]{}*&^%$#@!~`+=\\|<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match user input to one of the 8 canonical intents.
 * Returns { intent, score, lang, matchedKeyword }
 */
export function matchIntent(queryText, forcedLang = null) {
  if (!queryText || typeof queryText !== 'string') {
    return { intent: null, score: 0, lang: forcedLang || 'en' };
  }

  const detectedLang = detectScriptLang(queryText);
  const lang = (detectedLang !== 'en' ? detectedLang : (forcedLang || 'en'));
  const normalizedQ = normalize(queryText);

  const intents = qaBank.intents;
  let bestIntent = null;
  let bestScore = 0;
  let bestMatchedKw = null;

  // First pass: match within the target language
  for (const [intentKey, intentData] of Object.entries(intents)) {
    const langKeywords = intentData.keywords?.[lang] || [];
    let intentScore = 0;
    let matchedKw = null;

    // Direct sample question exact/near-exact match bonus
    const sampleQs = intentData.sampleQuestions?.[lang] || [];
    for (const sampleQ of sampleQs) {
      const normSample = normalize(sampleQ);
      if (normalizedQ === normSample || normalizedQ.includes(normSample) || normSample.includes(normalizedQ)) {
        intentScore += 10;
        matchedKw = sampleQ;
      }
    }

    // Keyword matching
    for (const kw of langKeywords) {
      const normKw = normalize(kw);
      if (!normKw) continue;
      if (normalizedQ.includes(normKw)) {
        // Multi-word keywords get higher weight
        const weight = normKw.includes(' ') ? 3 : 1.5;
        intentScore += weight;
        if (!matchedKw) matchedKw = kw;
      }
    }

    if (intentScore > bestScore) {
      bestScore = intentScore;
      bestIntent = intentKey;
      bestMatchedKw = matchedKw;
    }
  }

  // Second pass: if score is 0 and target language wasn't English, try English as fallback
  if (bestScore === 0 && lang !== 'en') {
    for (const [intentKey, intentData] of Object.entries(intents)) {
      const enKeywords = intentData.keywords?.['en'] || [];
      let intentScore = 0;
      let matchedKw = null;

      const sampleQs = intentData.sampleQuestions?.['en'] || [];
      for (const sampleQ of sampleQs) {
        const normSample = normalize(sampleQ);
        if (normalizedQ === normSample || normalizedQ.includes(normSample) || normSample.includes(normalizedQ)) {
          intentScore += 10;
          matchedKw = sampleQ;
        }
      }

      for (const kw of enKeywords) {
        const normKw = normalize(kw);
        if (normKw && normalizedQ.includes(normKw)) {
          const weight = normKw.includes(' ') ? 3 : 1.5;
          intentScore += weight;
          if (!matchedKw) matchedKw = kw;
        }
      }

      if (intentScore > bestScore) {
        bestScore = intentScore;
        bestIntent = intentKey;
        bestMatchedKw = matchedKw;
      }
    }
  }

  return {
    intent: bestScore > 0 ? bestIntent : null,
    score: bestScore,
    lang,
    matchedKeyword: bestMatchedKw,
  };
}

/**
 * Retrieve all 12 authoritative sample questions for a given language.
 * Preserves the exact 12-question order across the 8 canonical intents.
 */
export function getAllSampleQuestions(lang = 'en') {
  const targetLang = lang || 'en';
  const questions = [];
  
  // Ordered intents to maintain Q1 to Q12 sequence
  const orderedIntents = [
    'SAFETY_CHECK',       // Q1, Q2
    'PFZ_LOCATION',       // Q3, Q4
    'WEATHER_CONDITIONS', // Q5, Q6
    'CYCLONE_ALERT',      // Q7
    'LIGHTNING_ALERT',    // Q8
    'TIDE_INFO',          // Q9
    'ROUTE_REQUEST',      // Q10
    'HAZARD_ZONES',       // Q11, Q12
  ];

  for (const intentKey of orderedIntents) {
    const intentData = qaBank.intents[intentKey];
    if (intentData) {
      const langQs = intentData.sampleQuestions?.[targetLang] || intentData.sampleQuestions?.['en'] || [];
      questions.push(...langQs);
    }
  }

  return questions;
}

/**
 * Friendly clarifying fallback message when no intent threshold is met.
 */
export function getFallbackResponse(lang = 'en') {
  const targetLang = lang || 'en';
  return (
    qaBank.fallback?.[targetLang] ||
    qaBank.fallback?.['en'] ||
    "I can help with safety checks, fishing zones, weather, alerts, tides, and routes. Try asking about one of these or click any suggested query below."
  );
}

/**
 * Get answer template for an intent + language.
 */
export function getAnswerTemplate(intent, lang = 'en') {
  const targetLang = lang || 'en';
  return (
    qaBank.intents[intent]?.answerTemplate?.[targetLang] ||
    qaBank.intents[intent]?.answerTemplate?.['en'] ||
    "{score}/100"
  );
}

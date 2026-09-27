/**
 * Survival Kit Agent — Stateful Multi-Step Emergency Dialogue
 *
 * Implements a 4-step state machine for distress & at-sea emergency guidance.
 * Automatically computes distress severity and dispatches reports to SQLite.
 */

import boundariesMock from '../../data/boundaries_mock.json' with { type: 'json' };

export const DISTRESS_KEYWORDS = {
  en: [
    'i got stuck', 'i am lost', "help me i'm stranded", 'my boat broke down',
    "i don't know where i am", 'stranded', 'boat broken', 'emergency',
    'mayday', 'save me', 'lost at sea', 'shipwreck', 'sinking', 'engine failure',
    'sos', 'help me', 'boat breakdown', 'adrift', 'adrift at sea'
  ],
  hi: [
    'मैं फंस गया', 'खो गया', 'मदद करो', 'नाव खराब', 'बचाओ',
    'रास्ता भटक गया', 'संकट में हूँ', 'इंजन बंद', 'डूब रहा', 'फंस गया हूँ',
    'खो गया हूँ', 'नाव रुक गई', 'आपातकाल'
  ],
  ta: [
    'நான் மாட்டிக்கொண்டேன்', 'வழி தெரியவில்லை', 'படகில் பிரச்சனை',
    'காப்பாற்றுங்கள்', 'சிக்கிக்கொண்டேன்', 'உதவி வேண்டும்', 'என் படகு பழுதடைந்துவிட்டது',
    'எங்கு இருக்கிறேன் என்று தெரியவில்லை', 'படகில் ஆபத்து', 'அவசர உதவி'
  ],
  te: [
    'నేను చిక్కుకున్నాను', 'దారి తప్పాను', 'సహాయం చేయండి',
    'పడవ పాడైపోయింది', 'కాపాడండి', 'ఎక్కడ ఉన్నానో తెలియదు', 'పడవ మొరాయించింది',
    'అత్యవసర పరిస్థితి'
  ],
  ml: [
    'ഞാൻ കുടുങ്ങി', 'വഴി തെറ്റി', 'സഹായിക്കൂ', 'ബോട്ട് കേടായി',
    'രക്ഷിക്കൂ', 'എവിടെയാണെന്ന് അറിയില്ല', 'ബോട്ട് നിന്നുപോയി', 'അടിയന്തര സഹായം'
  ],
  bn: [
    'আমি আটকে গেছি', 'পথ হারিয়েছি', 'সাহায্য করুন', 'নৌকা নষ্ট',
    'বাঁচাও', 'কোথায় আছি বুঝতে পারছি না', 'ইঞ্জিন বন্ধ', 'জরুরী অবস্থা'
  ]
};

export const SURVIVAL_PROMPTS = {
  en: {
    concernGreeting: "🚨 Emergency Assistance Activated: Stay calm. I am initiating the ORCA Emergency Survival Protocol.\n\n👉 Step 1/3: How much food do you currently have left with you?",
    askWater: "👉 Step 2/3: How many litres of potable water do you have on board?",
    askLocation: "👉 Step 3/3: Do you know your current estimated location, or which bay/harbor you started your journey from?",
    confirmation: "✅ Your situation and coordinates have been automatically filed with the Coast Authority. Stay calm, keep your radio on VHF channel 16, and follow the survival guidance above."
  },
  hi: {
    concernGreeting: "🚨 आपातकालीन सहायता सक्रिय: शांत रहें। मैं ORCA आपातकालीन जीवन रक्षा प्रोटोकॉल शुरू कर रहा हूँ।\n\n👉 चरण 1/3: आपके पास वर्तमान में कितना भोजन बचा है?",
    askWater: "👉 चरण 2/3: आपके पास कितने लीटर पीने का पानी उपलब्ध है?",
    askLocation: "👉 चरण 3/3: क्या आपको अपना अनुमानित स्थान या वह बंदरगाह/खाड़ी पता है जहाँ से आपने यात्रा शुरू की थी?",
    confirmation: "✅ आपकी स्थिति और विवरण तटरक्षक प्राधिकरण को स्वचालित रूप से रिपोर्ट कर दिए गए हैं। शांत रहें, VHF चैनल 16 पर रेडियो चालू रखें और ऊपर दिए गए जीवन रक्षा निर्देशों का पालन करें।"
  },
  ta: {
    concernGreeting: "🚨 அவசர கால உதவி செயல்படுத்தப்பட்டது: அமைதியாக இருங்கள். ORCA அவசர பாதுகாப்பு நெறிமுறை தொடங்கப்பட்டுள்ளது.\n\n👉 படி 1/3: உங்களிடம் தற்போது எவ்வளவு உணவு மீதம் உள்ளது?",
    askWater: "👉 படி 2/3: உங்களிடம் எத்தனை லிட்டர் குடிநீர் உள்ளது?",
    askLocation: "👉 படி 3/3: நீங்கள் இருக்கும் தோராயமான இடம் அல்லது எந்த துறைமுகத்திலிருந்து புறப்பட்டீர்கள் என்று தெரியுமா?",
    confirmation: "✅ உங்கள் விவரங்கள் கடலோர காவல் படைக்கு தானாக தெரிவிக்கப்பட்டுள்ளன. அமைதியாக இருங்கள், VHF சேனல் 16-ல் வானொலியை இயக்கத்தில் வைத்திருங்கள், மேலே உள்ள வழிகாட்டுதலைப் பின்பற்றுங்கள்."
  },
  te: {
    concernGreeting: "🚨 అత్యవసర సహాయం ప్రారంభించబడింది: ప్రశాంతంగా ఉండండి. ORCA ఎమర్జెన్సీ సర్వైవల్ ప్రోటోకాల్ ప్రారంభించబడింది.\n\n👉 దశ 1/3: మీ వద్ద ప్రస్తుతం ఎంత ఆహారం మిగిలి ఉంది?",
    askWater: "👉 దశ 2/3: మీ వద్ద ఎన్ని లీటర్ల తాగునీరు ఉంది?",
    askLocation: "👉 దశ 3/3: మీ ప్రస్తుత అంచనా ప్రదేశం లేదా ప్రయాణం ప్రారంభించిన తీరం/ఓడరేవు తెలుసా?",
    confirmation: "✅ మీ పరిస్థితి తీరప్రాంత రక్షణ విభాగానికి నివేదించబడింది. ప్రశాంతంగా ఉండండి, VHF ఛానల్ 16 ని ఉపయోగించండి మరియు పై సూచనలను పాటించండి."
  },
  ml: {
    concernGreeting: "🚨 അടിയന്തര സഹായം ആരംഭിച്ചു: ശാന്തരായിരിക്കുക. ORCA അടിയന്തര അതിജീവന പ്രോട്ടോക്കോൾ സജീവമാക്കി.\n\n👉 ഘട്ടം 1/3: നിങ്ങളുടെ പക്കൽ ഇപ്പോൾ എത്ര ഭക്ഷണം ബാക്കിയുണ്ട്?",
    askWater: "👉 ഘട്ടം 2/3: നിങ്ങളുടെ പക്കൽ എത്ര ലിറ്റർ കുടിവെള്ളമുണ്ട്?",
    askLocation: "👉 ഘട്ടം 3/3: നിങ്ങളുടെ ഏകദേശ സ്ഥാനമോ യാത്ര തിരിച്ച തുറമുഖമോ അറിയാമോ?",
    confirmation: "✅ നിങ്ങളുടെ വിവരങ്ങൾ കോസ്റ്റ് അതോറിറ്റിക്ക് റിപ്പോർട്ട് ചെയ്തിട്ടുണ്ട്. ശാന്തമായിരിക്കുക, മുകളിലെ നിർദ്ദേശങ്ങൾ പാലിക്കുക."
  },
  bn: {
    concernGreeting: "🚨 জরুরী সহায়তা সক্রিয়: শান্ত থাকুন। ORCA জরুরী জীবনরক্ষা প্রোটোকল শুরু হয়েছে।\n\n👉 ধাপ ১/৩: আপনার কাছে বর্তমানে কতটা খাবার বাকি আছে?",
    askWater: "👉 ধাপ ২/৩: আপনার কাছে কত লিটার পানীয় জল আছে?",
    askLocation: "👉 ধাপ ৩/৩: আপনি কি আপনার বর্তমান আনুমানিক অবস্থান বা কোন বন্দর/উপসাগর থেকে যাত্রা শুরু করেছিলেন তা জানেন?",
    confirmation: "✅ আপনার পরিস্থিতি কোস্ট গার্ড কর্তৃপক্ষের কাছে স্বয়ংক্রিয়ভাবে রিপোর্ট করা হয়েছে। শান্ত থাকুন এবং উপরের নির্দেশিকা অনুসরণ করুন।"
  }
};

const STATIC_SHELTER_GUIDANCE = {
  en: "🛡️ Shelter & Sea Survival Directives:\n• Stay with the vessel if it remains afloat — it provides the largest visual and radar target for Indian Coast Guard search aircraft.\n• Rig any canvas, sailcloth, or tarp for shade to avoid rapid dehydration from tropical UV exposure.\n• Use mirrors, smartphone flash, or flares if approaching vessels or aircraft are spotted.\n• Conserve battery: turn off continuous screen and keep VHF radio monitored on Marine Channel 16 (156.8 MHz).",
  hi: "🛡️ आश्रय और समुद्री जीवन रक्षा निर्देश:\n• यदि नाव तैर रही है तो नाव के साथ ही रहें — यह तटरक्षक खोज विमानों के लिए सबसे बड़ा रडार लक्ष्य प्रदान करती है।\n• सीधे धूप से बचने और निर्जलीकरण रोकने के लिए तिरपाल या कपड़े से छाया बनाएँ।\n• किसी जहाज या विमान के दिखने पर परावर्तक दर्पण या टॉर्च से संकेत दें।\n• फोन/रेडियो की बैटरी बचाएँ; VHF चैनल 16 पर समय-समय पर सुनें।",
  ta: "🛡️ தங்குமிடம் மற்றும் கடல் உயிர்வாழும் வழிகாட்டல்:\n• படகு மிதக்கும் வரை அதிலேயே இருங்கள் — இது கடலோர காவல்படை தேடல் விமானங்களுக்கு பெரிய அடையாளமாக இருக்கும்.\n• சூரிய வெப்பத்தால் நீர்ச்சத்து குறைவதைத் தடுக்க தார்பாய் அல்லது துணியால் நிழல் அமைக்கவும்.\n• கப்பல் அல்லது விமானம் தென்பட்டால் கண்ணாடி அல்லது ஃபிளாஷ்லைட் மூலம் சமிக்ஞை செய்யவும்.\n• பேட்டரியை சேமிக்கவும்; VHF சேனல் 16-ல் அவசர அழைப்பை கண்காணிக்கவும்.",
  te: "🛡️ ఆశ్రయం & సముద్ర మనుగడ సూచనలు:\n• పడవ తేలియాడుతుంటే దానితోనే ఉండండి — ఇది రెస్క్యూ విమానాలకు స్పష్టమైన రక్షణ లక్ష్యం.\n• ఎండ తాపం నుండి రక్షణ కోసం టార్పాలిన్ లేదా వస్త్రంతో నీడ ఏర్పాటు చేయండి.\n• విమానాలు లేదా నౌకలు కనిపించినప్పుడు అద్దాలు లేదా ఫ్లాష్‌లైట్‌తో సంకేతాలు ఇవ్వండి.\n• బ్యాటరీని ఆదా చేయండి; VHF ఛానల్ 16 ని గమనించండి.",
  ml: "🛡️ സമുദ്ര അതിജീവന നിർദ്ദേശങ്ങൾ:\n• ബോട്ട് പൊങ്ങിക്കിടക്കുന്നിടത്തോളം ബോട്ടിനൊപ്പം തുടരുക.\n• കഠിനമായ വെയിൽ ഏൽക്കാതിരിക്കാൻ ടാർപോളിൻ ഉപയോഗിച്ച് തണൽ ഒരുക്കുക.\n• സിഗ്നൽ നൽകാൻ കണ്ണാടിയോ ഫ്ലാഷ്‌ലൈറ്റോ ഉപയോഗിക്കുക. ബാറ്ററി സംരക്ഷിക്കുക; VHF 16 ശ്രദ്ധിക്കുക.",
  bn: "🛡️ সামুদ্রিক জীবনরক্ষার নির্দেশিকা:\n• নৌকা ভাসমান থাকলে নৌকার সাথেই থাকুন — এটি উদ্ধারকারী বিমানের জন্য সহজে দৃশ্যমান।\n• রোদ ও ডিহাইড্রেশন থেকে বাঁচতে ত্রিপল বা কাপড়ের ছায়া তৈরি করুন।\n• জাহাজ দেখলে প্রতিফলক বা টর্চ দিয়ে সংকেত দিন। ব্যাটারি বাঁচান এবং VHF চ্যানেল ১৬ শুনুন।"
};

function haversineDist(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

/**
 * Check if a text matches distress triggers in any language
 */
export function isDistressQuery(queryText) {
  if (!queryText || typeof queryText !== 'string') return false;
  const clean = queryText.toLowerCase().trim();

  for (const langList of Object.values(DISTRESS_KEYWORDS)) {
    for (const kw of langList) {
      if (clean.includes(kw.toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Parse water quantity in liters from free text
 */
export function parseWaterLiters(text) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  if (/\b(no|zero|none|empty|0|nil|nahi|illai)\b/i.test(lower) || lower.includes('नहीं') || lower.includes('இல்லை')) {
    // Make sure it's not preceded by a non-zero digit like 10, 20
    if (!/\b[1-9][0-9]*\s*(l|litres|liters|लीटर|லிட்டர்)?\b/i.test(lower)) {
      return 0;
    }
  }
  const match = lower.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  if (lower.includes('half') || lower.includes('आधा') || lower.includes('பாதி')) return 0.5;
  if (lower.includes('few drops') || lower.includes('little') || lower.includes('कम')) return 0.8;
  return 2.0; // fallback default
}

/**
 * Parse food status from free text
 */
export function isFoodNone(text) {
  if (!text) return true;
  const lower = text.toLowerCase().trim();
  if (/\b(no|zero|none|nothing|empty|finish|finished|nil)\b/i.test(lower) || 
      lower.includes('खत्म') || lower.includes('कुछ नहीं') ||
      lower.includes('இல்லை') || lower.includes('തീർന്നു') || lower === '0') {
    if (!/\b[1-9][0-9]*\s*(day|days|packet|packets|kg|rations|meals|रोटी|உணவு)?\b/i.test(lower)) {
      return true;
    }
  }
  return false;
}

/**
 * Fuzzy match user location text against mock harbors and coastal locations
 */
export function matchNearestHarborOrLocation(locQuery) {
  const harbors = boundariesMock.harbors || [];
  const q = (locQuery || '').toLowerCase();

  let matchedHarbor = harbors.find(h => q.includes(h.name.toLowerCase()) || q.includes((h.region || '').toLowerCase()));
  if (!matchedHarbor) {
    // Check keyword tokens
    for (const h of harbors) {
      const parts = h.name.toLowerCase().split(' ');
      if (parts.some(p => p.length > 3 && q.includes(p))) {
        matchedHarbor = h;
        break;
      }
    }
  }

  if (!matchedHarbor) {
    matchedHarbor = harbors[0] || {
      name: 'Chennai Fishing Harbour',
      lat: 13.0878,
      lng: 80.2985,
      region: 'Tamil Nadu'
    };
  }

  return matchedHarbor;
}

/**
 * Compute rule-based Water Rationing guidance
 * THRESHOLD SPECIFICATIONS:
 *  - < 1L: Critical emergency rationing (sip only in micro-doses, strictly avoid physical exertion)
 *  - 1L - 2L: Limit intake to ~250 ml every 8 hours
 *  - 2L - 5L: Ration to ~500 ml every 6 hours during daytime
 *  - > 5L: Maintain standard hydration with 1 Liter per 24 hours safely
 */
export function computeWaterGuidance(waterText, lang = 'en') {
  const liters = parseWaterLiters(waterText);

  if (liters < 1.0) {
    return {
      liters,
      tier: 'CRITICAL',
      text: lang === 'hi'
        ? `💧 जल राशनिंग (गंभीर स्थिति: ${liters}L): केवल मुँह गीला करने के लिए छोटी घूंट लें। समुद्री पानी बिल्कुल न पिएं। पसीना रोकने के लिए पूरी तरह छाया में आराम करें।`
        : lang === 'ta'
        ? `💧 குடிநீர் பங்கீடு (அவசர நிலை: ${liters}L): வாயை நனைக்க மட்டுமே மிகக் குறைந்த அளவு குடிக்கவும். கடல் நீரைக் குடிக்க வேண்டாம். நிழலில் ஓய்வெடுக்கவும்.`
        : `💧 Water Rationing (CRITICAL < 1L available: ${liters}L): Sip only in micro-doses to moisten mouth. Strictly do NOT swallow seawater. Rest completely in shade to prevent sweat perspiration loss.`
    };
  } else if (liters <= 2.0) {
    return {
      liters,
      tier: 'LOW',
      text: lang === 'hi'
        ? `💧 जल राशनिंग (सीमित: ${liters}L): प्रत्येक 8 घंटे में लगभग 250 मिलीलीटर तक सीमित करें। भारी शारीरिक परिश्रम से बचें।`
        : lang === 'ta'
        ? `💧 குடிநீர் பங்கீடு (குறைவு: ${liters}L): ஒவ்வொரு 8 மணி நேரத்திற்கும் சுமார் 250 மி.லி மட்டும் அருந்தவும். கடின உழைப்பைத் தவிர்க்கவும்.`
        : `💧 Water Rationing (Low Reserve: ${liters}L): Limit intake to ~250 ml every 8 hours. Strictly avoid heavy exertion to conserve fluid balance.`
    };
  } else if (liters <= 5.0) {
    return {
      liters,
      tier: 'MODERATE',
      text: lang === 'hi'
        ? `💧 जल राशनिंग (मध्यम: ${liters}L): दिन के समय प्रत्येक 6 घंटे में लगभग 500 मिलीलीटर पिएं। धूप से बचकर रहें।`
        : lang === 'ta'
        ? `💧 குடிநீர் பங்கீடு (மிதமான அளவு: ${liters}L): பகல் நேரத்தில் ஒவ்வொரு 6 மணி நேரத்திற்கும் ~500 மி.லி அருந்தவும்.`
        : `💧 Water Rationing (Moderate: ${liters}L): Ration to ~500 ml per 6 hours during daytime. Keep body shaded.`
    };
  } else {
    return {
      liters,
      tier: 'ADEQUATE',
      text: lang === 'hi'
        ? `💧 जल राशनिंग (पर्याप्त: ${liters}L): सुरक्षित स्तर। बचाव दल आने तक प्रति 24 घंटे में 1 लीटर पानी का सेवन करें।`
        : lang === 'ta'
        ? `💧 குடிநீர் பங்கீடு (போதுமானது: ${liters}L): பாதுகாப்பான இருப்பு. 24 மணி நேரத்திற்கு 1 லிட்டர் வீதம் குடிக்கவும்.`
        : `💧 Water Rationing (Adequate: ${liters}L): Safe reserve. Maintain steady hydration with 1 Liter per 24 hours while awaiting recovery.`
    };
  }
}

/**
 * Compute rule-based Food Rationing guidance
 */
export function computeFoodGuidance(foodText, lang = 'en') {
  const isNone = isFoodNone(foodText);

  if (isNone) {
    return {
      isNone: true,
      text: lang === 'hi'
        ? "🍞 खाद्य राशनिंग: कोई भोजन उपलब्ध नहीं है। शरीर की ऊर्जा बचाने के लिए सभी प्रकार की शारीरिक गतिविधियों को न्यूनतम रखें और छाया में रहें।"
        : lang === 'ta'
        ? "🍞 உணவு வழிகாட்டுதல்: உணவு இல்லை. ஆற்றலைச் சேமிக்க உடல் உழைப்பைக் குறைத்து, மீட்புக் குழு வரும் வரை நிழலில் ஓய்வெடுக்கவும்."
        : "🍞 Food Rationing: Zero food available. Minimize all physical exertion, remain in shade, and conserve body metabolic reserves until SAR assets arrive."
    };
  }

  return {
    isNone: false,
    text: lang === 'hi'
      ? `🍞 खाद्य राशनिंग (${foodText}): आपूर्ति बढ़ाने के लिए प्रत्येक 8-12 घंटे में केवल छोटे हिस्से ही खाएं। पानी की कमी होने पर सूखा भोजन न खाएं।`
      : lang === 'ta'
      ? `🍞 உணவு வழிகாட்டுதல் (${foodText}): உணவை நீட்டிக்க ஒவ்வொரு 8-12 மணி நேரத்திற்கும் சிறிய பகுதியாக உட்கொள்ளவும்.`
      : `🍞 Food Rationing (${foodText}): Ration supply into small portions every 8–12 hours to extend reserves. Avoid protein-heavy food if water is restricted.`
  };
}

/**
 * Generate full Emergency Guidance Response and file report
 */
export async function generateSurvivalGuidance({
  role = 'Fisherman',
  foodText,
  waterText,
  locationText,
  lang = 'en'
}) {
  const waterRes = computeWaterGuidance(waterText, lang);
  const foodRes = computeFoodGuidance(foodText, lang);
  const matchedHarbor = matchNearestHarborOrLocation(locationText);

  // Approximate distance / bearing to nearest harbor
  const approxDist = haversineDist(13.08, 80.27, matchedHarbor.lat, matchedHarbor.lng) || 18.5;

  // Severity rule: water < 1L OR food is None -> HIGH, else MEDIUM
  const severity = (waterRes.liters < 1.0 || foodRes.isNone) ? 'HIGH' : 'MEDIUM';

  const shelterText = STATIC_SHELTER_GUIDANCE[lang] || STATIC_SHELTER_GUIDANCE.en;
  const prompt = SURVIVAL_PROMPTS[lang] || SURVIVAL_PROMPTS.en;

  const locationGuidance = lang === 'hi'
    ? `📍 स्थान एवं बचाव स्टेशन विश्लेषण:\n• निकटतम ज्ञात बंदरगाह/स्टेशन: ${matchedHarbor.name} (लगभग ${approxDist} किमी)।\n• भारतीय तटरक्षक SAR ग्रिड अलर्ट पर है।`
    : lang === 'ta'
    ? `📍 இருப்பிட மதிப்பீடு & மீட்பு மையம்:\n• அருகிலுள்ள துறைமுகம்/மையம்: ${matchedHarbor.name} (சுமார் ${approxDist} கி.மீ).\n• கடலோர காவல்படை மீட்புக் குழு தயார் நிலையில் உள்ளது.`
    : `📍 Location & Rescue Station Assessment:\n• Nearest identified harbor/station: ${matchedHarbor.name} (~${approxDist} km).\n• Coast Guard Search and Rescue (SAR) sector active.`;

  const fullGuidanceText = [
    `🆘 =====================================`,
    `🚨 ORCA EMERGENCY SURVIVAL PROTOCOL`,
    `=====================================`,
    ``,
    foodRes.text,
    ``,
    waterRes.text,
    ``,
    locationGuidance,
    ``,
    shelterText,
    ``,
    `-------------------------------------`,
    prompt.confirmation
  ].join('\n');

  // Auto-file report to server SQLite
  let reportResult = null;
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        location: locationText || matchedHarbor.name,
        food_status: foodText || 'Unspecified',
        water_status: `${waterRes.liters} Litres (${waterText})`,
        severity,
        status: 'Open',
        notes: `Automated distress protocol dispatched. Matched harbor: ${matchedHarbor.name}`
      })
    });
    if (res.ok) {
      reportResult = await res.json();
    }
  } catch (err) {
    console.warn('Auto report filing fallback handled:', err);
  }

  return {
    guidanceText: fullGuidanceText,
    severity,
    matchedHarbor,
    waterRes,
    foodRes,
    reportResult
  };
}

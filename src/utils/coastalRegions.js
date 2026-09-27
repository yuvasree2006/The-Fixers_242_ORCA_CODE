/**
 * Coastal Regions Directory for ORCA
 * Hardcoded isIndianRegion flag for strict geofencing & foreign waters advisory rule.
 */

export const COASTAL_REGIONS = [
  {
    id: 'chennai',
    name: 'Chennai (India)',
    shortName: 'Chennai',
    lat: 13.0827,
    lng: 80.2707,
    isIndianRegion: true,
    country: 'India',
    state: 'Tamil Nadu'
  },
  {
    id: 'kochi',
    name: 'Kochi (India)',
    shortName: 'Kochi',
    lat: 9.9312,
    lng: 76.2673,
    isIndianRegion: true,
    country: 'India',
    state: 'Kerala'
  },
  {
    id: 'visakhapatnam',
    name: 'Visakhapatnam (India)',
    shortName: 'Visakhapatnam',
    lat: 17.6868,
    lng: 83.2185,
    isIndianRegion: true,
    country: 'India',
    state: 'Andhra Pradesh'
  },
  {
    id: 'mumbai',
    name: 'Mumbai (India)',
    shortName: 'Mumbai',
    lat: 18.9220,
    lng: 72.8347,
    isIndianRegion: true,
    country: 'India',
    state: 'Maharashtra'
  },
  {
    id: 'kolkata',
    name: 'Kolkata (India)',
    shortName: 'Kolkata',
    lat: 22.5726,
    lng: 88.3639,
    isIndianRegion: true,
    country: 'India',
    state: 'West Bengal'
  },
  {
    id: 'colombo',
    name: 'Colombo (Sri Lanka)',
    shortName: 'Colombo',
    lat: 6.9271,
    lng: 79.8612,
    isIndianRegion: false,
    country: 'Sri Lanka'
  },
  {
    id: 'chittagong',
    name: 'Chittagong (Bangladesh)',
    shortName: 'Chittagong',
    lat: 22.3569,
    lng: 91.7832,
    isIndianRegion: false,
    country: 'Bangladesh'
  },
  {
    id: 'karachi',
    name: 'Karachi (Pakistan)',
    shortName: 'Karachi',
    lat: 24.8607,
    lng: 67.0011,
    isIndianRegion: false,
    country: 'Pakistan'
  },
  {
    id: 'male',
    name: 'Malé (Maldives)',
    shortName: 'Male',
    lat: 4.1755,
    lng: 73.5093,
    isIndianRegion: false,
    country: 'Maldives'
  },
  {
    id: 'yangon',
    name: 'Yangon (Myanmar)',
    shortName: 'Yangon',
    lat: 16.8661,
    lng: 96.1951,
    isIndianRegion: false,
    country: 'Myanmar'
  }
];

export const FOREIGN_WATERS_ALERTS = {
  en: {
    title: "⚠ Do Not Travel Today — Foreign Maritime Zone / Restricted Advisory",
    description: "You have selected a foreign coastal region beyond Indian sovereign maritime territory. Standard Indian fishing operations and venture permits are NOT authorized in international/foreign EEZ zones without bilateral diplomatic clearance. Return to sovereign Indian waters.",
    tag: "RESTRICTED MARITIME ZONE"
  },
  hi: {
    title: "⚠ आज यात्रा न करें — विदेशी समुद्री क्षेत्र / प्रतिबंधित सलाह",
    description: "आपने भारतीय संप्रभु समुद्री क्षेत्र से परे एक विदेशी तटीय क्षेत्र का चयन किया है। द्विपक्षीय राजनयिक अनुमति के बिना अंतरराष्ट्रीय/विदेशी विशेष आर्थिक क्षेत्र में सामान्य मछली पकड़ने की अनुमति नहीं है। भारतीय जलक्षेत्र में लौटें।",
    tag: "प्रतिबंधित समुद्री क्षेत्र"
  },
  ta: {
    title: "⚠ இன்று பயணம் செய்ய வேண்டாம் — வெளிநாட்டு கடல் மண்டலம் / தடைசெய்யப்பட்ட ஆலோசனை",
    description: "இந்திய இறையாண்மை கொண்ட கடல் எல்லைக்கு அப்பால் உள்ள வெளிநாட்டு கடலோரப் பகுதியை நீங்கள் தேர்ந்தெடுத்துள்ளீர்கள். சர்வதேச/வெளிநாட்டு EEZ மண்டலங்களில் முறையான அனுமதியின்றி மீன்பிடிக்க அனுமதி இல்லை. இந்திய எல்லைக்குள் திரும்பவும்.",
    tag: "தடைசெய்யப்பட்ட கடல் மண்டலம்"
  },
  te: {
    title: "⚠ ఈరోజు ప్రయాణించవద్దు — విదేశీ సముద్ర మండలం / నిషేధిత హెచ్చరిక",
    description: "మీరు భారతీయ సముద్ర ప్రాదేశిక పరిధి దాటిన విదేశీ తీర ప్రాంతాన్ని ఎంచుకున్నారు. దౌత్య అనుమతి లేకుండా అంతర్జాతీయ/విదేశీ EEZ ప్రాంతాలలో చేపలు పట్టడం నిషేధించబడింది. భారతీయ జలాల్లోకి తిరిగి రండి.",
    tag: "నిషేధిత సముద్ర ప్రాంతం"
  },
  ml: {
    title: "⚠️ ഇന്ന് യാത്ര ചെയ്യരുത് — വിദേശ സമുദ്ര മേഖല / നിയന്ത്രിത മുന്നറിയിപ്പ്",
    description: "നിങ്ങൾ ഇന്ത്യൻ സമുദ്ര അതിർത്തിക്ക് പുറത്തുള്ള വിദേശ തീരദേശ മേഖലയാണ് തിരഞ്ഞെടുത്തത്. നയതന്ത്ര അനുമതിയില്ലാതെ അന്താരാഷ്ട്ര/വിദേശ EEZ മേഖലകളിൽ മത്സ്യബന്ധനം അനുവദനീയമല്ല. ഇന്ത്യൻ സമുദ്രത്തിലേക്ക് മടങ്ങുക.",
    tag: "നിയന്ത്രിത സമുദ്ര മേഖല"
  },
  bn: {
    title: "⚠️ আজ ভ্রমণ করবেন না — বিদেশী সামুদ্রিক অঞ্চল / নিষিদ্ধ পরামর্শ",
    description: "আপনি ভারতীয় সামুদ্রিক সীমার বাইরের একটি বিদেশী উপকূলীয় অঞ্চল নির্বাচন করেছেন। দ্বিপাক্ষিক কূটনৈতিক অনুমতি ছাড়া আন্তর্জাতিক/বিদেশী EEZ অঞ্চলে মাছ ধরা কঠোরভাবে নিষিদ্ধ। ভারতীয় জলসীমায় ফিরে আসুন।",
    tag: "নিষিদ্ধ সামুদ্রিক অঞ্চল"
  }
};

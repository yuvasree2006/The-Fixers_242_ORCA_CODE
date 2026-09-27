/**
 * Medical Guidance Matcher & Agent for Survival Kit Medical Mode
 * Handles 10 predefined marine medical emergencies, stateful queries (such as age prompt for seizure),
 * and automatic incident filing with report_type='Medical'.
 */

import medicalQaBank from '../../data/medical_qa_bank.json' with { type: 'json' };

/**
 * Match a medical query to one of the 10 scenarios
 */
export function matchMedicalScenario(queryText, lang = 'en') {
  if (!queryText || typeof queryText !== 'string') return null;
  const clean = queryText.toLowerCase().trim();

  // Search through all scenarios
  for (const scenario of medicalQaBank.scenarios) {
    // Check keywords for all languages or specific language
    for (const [lKey, kws] of Object.entries(scenario.keywords || {})) {
      for (const kw of kws) {
        if (clean.includes(kw.toLowerCase())) {
          return scenario;
        }
      }
    }
  }

  return null;
}

/**
 * Get fallback medical response
 */
export function getMedicalFallback(lang = 'en') {
  return medicalQaBank.fallback[lang] || medicalQaBank.fallback.en;
}

/**
 * Execute Medical Advice Generation and auto-file to SQLite
 */
export async function generateMedicalGuidance({
  role = 'Fisherman',
  scenario,
  ageText = null,
  locationText = 'Coastal Waters',
  lang = 'en'
}) {
  if (!scenario) {
    const fallbackText = getMedicalFallback(lang);
    return {
      guidanceText: fallbackText,
      severity: 'MEDIUM',
      scenarioId: 'unknown',
      reportResult: null
    };
  }

  const baseGuidance = scenario.guidance[lang] || scenario.guidance.en;
  const resolvedAge = ageText ? ageText.trim() : (lang === 'hi' ? 'आयु अनिर्दिष्ट' : lang === 'ta' ? 'வயது குறிப்பிடப்படவில்லை' : 'Age unspecified');
  const formattedGuidance = baseGuidance.replace('{age}', resolvedAge);

  const severity = scenario.severity || 'MEDIUM';

  // Auto-file medical report to server SQLite
  let reportResult = null;
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_type: 'Medical',
        role,
        location: locationText,
        food_status: 'Not applicable',
        water_status: 'Not applicable',
        severity,
        status: 'Open',
        notes: `[Medical Mode Emergency - ${scenario.id.toUpperCase()}] ${resolvedAge ? `Patient Info: ${resolvedAge}. ` : ''}Emergency protocol dispatched.`
      })
    });
    if (res.ok) {
      reportResult = await res.json();
    }
  } catch (err) {
    console.warn('Medical report auto-filing error:', err);
  }

  return {
    guidanceText: formattedGuidance,
    severity,
    scenarioId: scenario.id,
    reportResult
  };
}

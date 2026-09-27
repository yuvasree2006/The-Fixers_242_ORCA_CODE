import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getPfzList,
  getWeatherLocal,
  getGeospatialLocal,
  computeRiskLocal,
  computeRouteLocal,
  buildAnswerText
} from '../src/agents/client-pipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const qaBank = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/qa_bank.json'), 'utf8'));

const userLat = 13.0827;
const userLng = 80.2707;

const pfzList = getPfzList();
const weather = getWeatherLocal(userLat, userLng);
const geospatial = getGeospatialLocal(userLat, userLng, pfzList);
const risk = computeRiskLocal(weather, geospatial);
const route = computeRouteLocal(userLat, userLng, geospatial.nearestPfz);

const ROLE_DEFINITIONS = {
  "Fisherman": [
    { intent: "FISHERMAN_VENTURE_SAFETY", idx: 0 },
    { intent: "FISHERMAN_VENTURE_SAFETY", idx: 1 },
    { intent: "FISHERMAN_VENTURE_SAFETY", idx: 2 },
    { intent: "FISHERMAN_NEAREST_ZONE", idx: 0 },
    { intent: "FISHERMAN_NEAREST_ZONE", idx: 1 },
    { intent: "LOCAL_WAVE_CONDITIONS", idx: 0 },
    { intent: "LOCAL_WAVE_CONDITIONS", idx: 1 },
    { intent: "WEEKLY_CYCLONE_OUTLOOK", idx: 0 },
    { intent: "TIDE_SCHEDULE", idx: 0 },
    { intent: "LIKELY_CATCH_SPECIES", idx: 0 },
    { intent: "NEAREST_SAFE_HARBOR", idx: 0 },
    { intent: "EMERGENCY_GUIDANCE", idx: 0 },
  ],
  "Commercial Operator": [
    { intent: "FLEET_PFZ_FORECAST", idx: 0 },
    { intent: "FLEET_PFZ_FORECAST", idx: 1 },
    { intent: "LIKELY_CATCH_SPECIES", idx: 1 },
    { intent: "CHLOROPHYLL_FORECAST", idx: 0 },
    { intent: "FLEET_ROUTE_OPTIMIZATION", idx: 0 },
    { intent: "FLEET_ROUTE_OPTIMIZATION", idx: 1 },
    { intent: "FLEET_ROUTE_OPTIMIZATION", idx: 2 },
    { intent: "MULTIDAY_WEATHER_OUTLOOK", idx: 0 },
    { intent: "MULTIDAY_WEATHER_OUTLOOK", idx: 1 },
    { intent: "REGULATORY_GEOFENCE_ALERT", idx: 0 },
    { intent: "REGULATORY_GEOFENCE_ALERT", idx: 1 },
    { intent: "REGULATORY_GEOFENCE_ALERT", idx: 2 },
  ],
  "Society / Coastal Fisherman": [
    { intent: "COMMUNITY_STATUS_ADVISORY", idx: 0 },
    { intent: "COMMUNITY_STATUS_ADVISORY", idx: 1 },
    { intent: "COMMUNITY_STATUS_ADVISORY", idx: 2 },
    { intent: "COMMUNITY_STATUS_ADVISORY", idx: 3 },
    { intent: "COMMUNITY_STATUS_ADVISORY", idx: 4 },
    { intent: "WEEKLY_CYCLONE_OUTLOOK", idx: 1 },
    { intent: "TIDE_SCHEDULE", idx: 1 },
    { intent: "NEAREST_SAFE_HARBOR", idx: 1 },
    { intent: "REGULATORY_GEOFENCE_ALERT", idx: 5 },
    { intent: "CATCH_REPORTING", idx: 0 },
    { intent: "CATCH_REPORTING", idx: 1 },
    { intent: "REGULATORY_GEOFENCE_ALERT", idx: 3 },
  ],
  "Port Authority": [
    { intent: "PORT_OPERATIONS_STATUS", idx: 0 },
    { intent: "PORT_OPERATIONS_STATUS", idx: 1 },
    { intent: "PORT_OPERATIONS_STATUS", idx: 2 },
    { intent: "PORT_OPERATIONS_STATUS", idx: 3 },
    { intent: "PORT_OPERATIONS_STATUS", idx: 4 },
    { intent: "PORT_OPERATIONS_STATUS", idx: 5 },
    { intent: "PORT_OPERATIONS_STATUS", idx: 6 },
    { intent: "PORT_OPERATIONS_STATUS", idx: 7 },
    { intent: "MULTIDAY_WEATHER_OUTLOOK", idx: 2 },
    { intent: "TIDE_SCHEDULE", idx: 2 },
    { intent: "WEEKLY_CYCLONE_OUTLOOK", idx: 2 },
    { intent: "REGULATORY_GEOFENCE_ALERT", idx: 4 },
  ]
};

const LANG_CONFIG = [
  {
    code: 'en',
    title: '## English',
    roles: {
      'Fisherman': '### Fisherman',
      'Commercial Operator': '### Commercial Operator',
      'Society / Coastal Fisherman': '### Society / Coastal Fisherman',
      'Port Authority': '### Port Authority',
    }
  },
  {
    code: 'hi',
    title: '## हिन्दी (Hindi)',
    roles: {
      'Fisherman': '### मछुआरा (Fisherman)',
      'Commercial Operator': '### वाणिज्यिक ऑपरेटर (Commercial Operator)',
      'Society / Coastal Fisherman': '### तटीय समाज / मछुआरा (Society / Coastal Fisherman)',
      'Port Authority': '### पोर्ट अथॉरिटी (Port Authority)',
    }
  },
  {
    code: 'ta',
    title: '## தமிழ் (Tamil)',
    roles: {
      'Fisherman': '### மீனவர் (Fisherman)',
      'Commercial Operator': '### வணிக ஆபரேட்டர் (Commercial Operator)',
      'Society / Coastal Fisherman': '### கடலோர சமூகம் / மீனவர் (Society / Coastal Fisherman)',
      'Port Authority': '### துறைமுக ஆணையம் (Port Authority)',
    }
  },
  {
    code: 'te',
    title: '## తెలుగు (Telugu)',
    roles: {
      'Fisherman': '### మత్స్యకారుడు (Fisherman)',
      'Commercial Operator': '### వాణిజ్య ఆపరేటర్ (Commercial Operator)',
      'Society / Coastal Fisherman': '### తీరప్రాంత సంఘం / మత్స్యకారుడు (Society / Coastal Fisherman)',
      'Port Authority': '### పోర్ట్ అథారిటీ (Port Authority)',
    }
  },
  {
    code: 'ml',
    title: '## മലയാളം (Malayalam)',
    roles: {
      'Fisherman': '### മത്സ്യത്തൊഴിലാളി (Fisherman)',
      'Commercial Operator': '### വാണിജ്യ ഓപ്പറേറ്റർ (Commercial Operator)',
      'Society / Coastal Fisherman': '### തീരദേശ സമൂഹം (Society / Coastal Fisherman)',
      'Port Authority': '### പോർട്ട് അതോറിറ്റി (Port Authority)',
    }
  },
  {
    code: 'bn',
    title: '## বাংলা (Bengali)',
    roles: {
      'Fisherman': '### জেলে (Fisherman)',
      'Commercial Operator': '### বাণিজ্যিক অপারেটর (Commercial Operator)',
      'Society / Coastal Fisherman': '### উপকূলীয় সম্প্রদায় / জেলে (Society / Coastal Fisherman)',
      'Port Authority': '### পোর্ট অথরিটি (Port Authority)',
    }
  }
];

let md = `
---

## 🔑 Demo Login Credentials

The application automatically seeds 4 role-specific demonstration accounts into the local SQLite database (\`server/orca.db\`) on startup:

| Role | Email | Password | Primary Scope |
|---|---|---|---|
| **Fisherman** | \`fisherman@orca.demo\` | \`Fisher@123\` | Small craft coastal safety, wave forecasts, nearest PFZ |
| **Commercial Operator** | \`commercial@orca.demo\` | \`Commercial@123\` | Deep-sea trawlers, high-yield PFZ rankings, fuel routing |
| **Society / Coastal Fisherman** | \`society@orca.demo\` | \`Society@123\` | Village community advisories, crowdsourced catch reporting |
| **Port Authority** | \`port@orca.demo\` | \`PortAuth@123\` | Channel sea state, port closure guidance, IMBL boundary alerts |

> 💡 **Cross-Role Switching**: Any single account can access all 4 role dashboards using the **Role Switcher dropdown** in the dashboard header next to Logout — separate logins are provided for demo clarity, not because they are required to view each role.
>
> 🌐 **Role-Blind Q&A Engine**: All 288 question-answer paths are cross-accessible at all times regardless of active role view. Asking a Port Authority question while in the Fisherman view or vice versa works seamlessly without restrictions.

---

## 📚 Sample Questions, Answers & Login Credentials (All Languages)

Below is the complete reference of all 48 questions and realistic computed answers generated by the client-side pipeline across all 6 coastal languages (288 Q&A combinations total).

`;

for (const langCfg of LANG_CONFIG) {
  md += `\n${langCfg.title}\n`;

  for (const [roleKey, roleHeading] of Object.entries(langCfg.roles)) {
    md += `\n${roleHeading}\n\n`;
    const questions = ROLE_DEFINITIONS[roleKey];

    questions.forEach((qDef, qIdx) => {
      const intentData = qaBank.intents[qDef.intent];
      const qText = intentData.sampleQuestions[langCfg.code]?.[qDef.idx] || intentData.sampleQuestions['en'][qDef.idx];
      const answer = buildAnswerText(qDef.intent, langCfg.code, weather, geospatial, risk, route);
      
      // Indent answer nicely for markdown list
      const formattedAnswer = answer.split('\n').map((line, lIdx) => (lIdx === 0 ? line : `   ${line}`)).join('\n');

      md += `${qIdx + 1}. **Q**: ${qText}\n   **A**: ${formattedAnswer}\n\n`;
    });
  }
}

// Read current README up to line 87 (before "Pre-seeded Sample Queries")
const readmePath = path.join(__dirname, '../README.md');
const currentReadme = fs.readFileSync(readmePath, 'utf8');
const cutIndex = currentReadme.indexOf('## 💡 Pre-seeded Sample Queries to Try');
const baseReadme = cutIndex !== -1 ? currentReadme.substring(0, cutIndex).trimEnd() : currentReadme;

fs.writeFileSync(readmePath, `${baseReadme}\n${md}`, 'utf8');
console.log('Successfully updated README.md with credentials and all 288 Q&A combinations!');

/**
 * AGENT 10: Memory & Context Agent
 * Stores session-based conversation context, previous query history, and last known location state.
 */

const sessionStore = new Map();

export function getOrCreateSession(sessionId = "default-session") {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, {
      sessionId,
      lastQuery: null,
      lastLocation: { lat: 13.0827, lng: 80.2707, name: "Chennai Coast" },
      lastLangCode: "en",
      history: []
    });
  }
  return sessionStore.get(sessionId);
}

export function updateSession(sessionId, queryText, langCode, location, response) {
  const session = getOrCreateSession(sessionId);
  session.lastQuery = queryText;
  session.lastLangCode = langCode;
  if (location) session.lastLocation = location;
  
  session.history.push({
    timestamp: new Date().toISOString(),
    queryText,
    langCode,
    responseText: response.responseText,
    safetyScore: response.safetyScore
  });

  if (session.history.length > 20) {
    session.history.shift();
  }

  return session;
}

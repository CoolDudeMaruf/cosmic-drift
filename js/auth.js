/**
 * Cosmic Drift — Authentication & User Module
 *
 * Handles guest play, account creation with country flags,
 * sign-in, and session management via localStorage.
 *
 * @module auth
 * @version 1.0.0
 */

const CosmicAuth = (() => {
  'use strict';

  /* ══════════════════════════════════════
     COUNTRY DATA
     ══════════════════════════════════════ */
  const COUNTRIES = [
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  ];

  /* ══════════════════════════════════════
     STORAGE KEYS
     ══════════════════════════════════════ */
  const STORAGE = {
    USERS: 'cosmicDrift_users',
    SESSION: 'cosmicDrift_session',
  };

  /* ══════════════════════════════════════
     HELPERS
     ══════════════════════════════════════ */

  /** Simple string hash (NOT cryptographic — for game demo only) */
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return hash.toString(36);
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.USERS) || '{}');
    } catch { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE.USERS, JSON.stringify(users));
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.SESSION) || 'null');
    } catch { return null; }
  }

  function saveSession(session) {
    if (session) {
      localStorage.setItem(STORAGE.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE.SESSION);
    }
  }

  /* ══════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════ */

  /** Create a new account. Returns { ok, error?, user? } */
  function createAccount(username, password, countryCode) {
    const name = username.trim();
    if (!name || name.length < 2) return { ok: false, error: 'Callsign must be at least 2 characters.' };
    if (name.length > 16) return { ok: false, error: 'Callsign max 16 characters.' };
    if (!/^[a-zA-Z0-9_]+$/.test(name)) return { ok: false, error: 'Only letters, numbers, and underscores allowed.' };
    if (!password || password.length < 4) return { ok: false, error: 'Access code must be at least 4 characters.' };
    if (!countryCode) return { ok: false, error: 'Please select your country.' };

    const users = getUsers();
    const key = name.toLowerCase();
    if (users[key]) return { ok: false, error: 'That callsign is already taken!' };

    const country = COUNTRIES.find(c => c.code === countryCode);
    const user = {
      username: name,
      passwordHash: simpleHash(password),
      country: country || COUNTRIES[0],
      highScore: 0,
      gamesPlayed: 0,
      totalScore: 0,
      bestCombo: 0,
      createdAt: Date.now(),
      scores: [],       // History of recent scores
    };

    users[key] = user;
    saveUsers(users);

    const session = { username: user.username, isGuest: false };
    saveSession(session);

    return { ok: true, user };
  }

  /** Sign in. Returns { ok, error?, user? } */
  function signIn(username, password) {
    const name = username.trim();
    if (!name) return { ok: false, error: 'Enter your callsign.' };
    if (!password) return { ok: false, error: 'Enter your access code.' };

    const users = getUsers();
    const key = name.toLowerCase();
    const user = users[key];
    if (!user) return { ok: false, error: 'Callsign not found.' };
    if (user.passwordHash !== simpleHash(password)) return { ok: false, error: 'Wrong access code!' };

    const session = { username: user.username, isGuest: false };
    saveSession(session);

    return { ok: true, user };
  }

  /** Start a guest session */
  function playAsGuest() {
    const session = { username: 'Guest', isGuest: true };
    saveSession(session);
    return session;
  }

  /** Sign out */
  function signOut() {
    saveSession(null);
  }

  /** Get current session (or null) */
  function getCurrentSession() {
    return getSession();
  }

  /** Get user data by username */
  function getUser(username) {
    const users = getUsers();
    return users[username.toLowerCase()] || null;
  }

  /** Get current logged-in user data */
  function getCurrentUser() {
    const session = getSession();
    if (!session || session.isGuest) return null;
    return getUser(session.username);
  }

  /** Record a score for the current user */
  function recordScore(finalScore, comboMax) {
    const session = getSession();
    if (!session || session.isGuest) return;

    const users = getUsers();
    const key = session.username.toLowerCase();
    const user = users[key];
    if (!user) return;

    user.gamesPlayed++;
    user.totalScore += finalScore;
    if (finalScore > user.highScore) user.highScore = finalScore;
    if (comboMax > user.bestCombo) user.bestCombo = comboMax;

    // Keep last 20 scores
    user.scores.unshift({ score: finalScore, date: Date.now() });
    if (user.scores.length > 20) user.scores.length = 20;

    users[key] = user;
    saveUsers(users);
  }

  /** Get all registered users for leaderboard */
  function getAllUsers() {
    const users = getUsers();
    return Object.values(users);
  }

  /** Get countries list */
  function getCountries() {
    return COUNTRIES;
  }

  return {
    createAccount,
    signIn,
    playAsGuest,
    signOut,
    getCurrentSession,
    getCurrentUser,
    getUser,
    recordScore,
    getAllUsers,
    getCountries,
  };
})();

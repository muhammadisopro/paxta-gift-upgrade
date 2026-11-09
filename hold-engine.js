// ============================================================================
// HOLD ENGINE (@HOLDbot — Official Sapphire Web3 Mini App)
// ============================================================================
import crypto from 'node:crypto';
import path from 'node:path';

const FORBIDDEN_GIFT_IDS = new Set([6068, 4226, 3015, 6095]);

export const MORSE_MAP = {
  A: '.-',    B: '-...',  C: '-.-.',  D: '-..',   E: '.',     F: '..-.',
  G: '--.',   H: '....',  I: '..',    J: '.---',  K: '-.-',   L: '.-..',
  M: '--',    N: '-.',    O: '---',   P: '.--.',  Q: '--.-',  R: '.-.',
  S: '...',   T: '-',     U: '..-',   V: '...-',  W: '.--',   X: '-..-',
  Y: '-.--',  Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.'
};

export const REVERSE_MORSE = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
);

export const HOLD_LEAGUES = [
  {
    id: 'bronze',
    name: 'Bronze',
    trophyImg: '/hold/trophies/bronze.png',
    minHold: 0,
    bonusTap: 0,
    color: '#d97706',
    glow: 'rgba(217, 119, 6, 0.42)'
  },
  {
    id: 'silver',
    name: 'Silver',
    trophyImg: '/hold/trophies/silver.png',
    minHold: 200_000,
    bonusTap: 1,
    color: '#cbd5e1',
    glow: 'rgba(203, 213, 225, 0.42)'
  },
  {
    id: 'gold',
    name: 'Gold',
    trophyImg: '/hold/trophies/gold.png',
    minHold: 1_000_000,
    bonusTap: 2,
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.48)'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    trophyImg: '/hold/trophies/platinum.png',
    minHold: 2_500_000,
    bonusTap: 4,
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.46)'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    trophyImg: '/hold/trophies/diamond.png',
    minHold: 5_000_000,
    bonusTap: 6,
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.52)'
  }
];

export const HOLD_SKINS = [
  {
    id: 'basic',
    name: 'Basic',
    subtitle: 'You own it',
    img: '/hold/skins/skin-4.png',
    priceHold: 0,
    theme: {
      accent: '#38b6ff',
      secondary: '#0066ff',
      glow1: 'rgba(0, 132, 255, 0.58)',
      glow2: 'rgba(0, 68, 204, 0.30)',
      bgBottom: '#041b4d'
    }
  },
  {
    id: 'chrome',
    name: 'Du Rove Chrome',
    subtitle: '500,000 HOLD',
    img: '/hold/skins/skin-2.png',
    priceHold: 500_000,
    theme: {
      accent: '#e2e8f0',
      secondary: '#64748b',
      glow1: 'rgba(226, 232, 240, 0.45)',
      glow2: 'rgba(100, 116, 139, 0.25)',
      bgBottom: '#0f172a'
    }
  },
  {
    id: 'paxta_neon',
    name: 'Paxta Blossom',
    subtitle: '1,500,000 HOLD',
    img: '/hold/skins/skin-3.png',
    priceHold: 1_500_000,
    theme: {
      accent: '#c084fc',
      secondary: '#7c3aed',
      glow1: 'rgba(192, 132, 252, 0.54)',
      glow2: 'rgba(124, 58, 237, 0.30)',
      bgBottom: '#1e0938'
    }
  },
  {
    id: 'pizza',
    name: 'Pizza',
    subtitle: '750,000 HOLD',
    img: '/hold/skins/skin-5.png',
    priceHold: 750_000,
    theme: {
      accent: '#fb923c',
      secondary: '#ea580c',
      glow1: 'rgba(251, 146, 60, 0.52)',
      glow2: 'rgba(234, 88, 12, 0.28)',
      bgBottom: '#2b0f04'
    }
  },
  {
    id: 'cookie',
    name: 'Cookie',
    subtitle: '350,000 HOLD',
    img: '/hold/skins/skin-1.webp',
    priceHold: 350_000,
    theme: {
      accent: '#fbbf24',
      secondary: '#d97706',
      glow1: 'rgba(251, 191, 36, 0.50)',
      glow2: 'rgba(217, 119, 6, 0.28)',
      bgBottom: '#291503'
    }
  },
  {
    id: 'cyber_lonely',
    name: 'You look lonely',
    subtitle: '2,500,000 HOLD',
    img: '/hold/skins/skin-6.png',
    priceHold: 2_500_000,
    theme: {
      accent: '#f472b6',
      secondary: '#db2777',
      glow1: 'rgba(244, 114, 182, 0.56)',
      glow2: 'rgba(219, 39, 119, 0.30)',
      bgBottom: '#2d0620'
    }
  }
];

export const DEFAULT_SECRET_CODES = {
  WAKEUP:   { reward: 500_000,   title: 'WAKEUP kodi ochildi', skin: 'cyber_lonely' },
  PAXTA:    { reward: 600_000,   title: 'PAXTA kodi ochildi',  skin: 'paxta_neon' },
  MEDAL:    { reward: 750_000,   title: 'MEDAL kodi ochildi' },
  OBSIDIAN: { reward: 1_000_000, title: 'OBSIDIAN kodi ochildi', skin: 'chrome' },
  MOON:     { reward: 888_888,   title: 'MOON kodi ochildi' }
};

export const DEFAULT_HOLD_QUESTS = [
  // Onboarding
  { id: 'join_squad',        cat: 'onboarding', title: 'Join Squad',                reward: 100_000, type: 'check_squad',  icon: '🛡️', link: '' },
  { id: 'earn_1000_hold',    cat: 'onboarding', title: 'Earn 1,000 HOLD',           reward: 50_000,  type: 'check_1k',     icon: '🐣', link: '' },
  { id: 'invite_10_frens',   cat: 'onboarding', title: 'Invite 10 frens',           reward: 500_000, type: 'check_ref_10', icon: '🧸', link: '' },
  // Specials
  { id: 'join_insider_ch',   cat: 'specials',   title: 'Insider Official Channel',  reward: 150_000, type: 'link',         icon: '📢', link: 'https://paxta.online/insider' },
  { id: 'join_medal_ch',     cat: 'specials',   title: 'Welcome to MEDAL NFT',      reward: 200_000, type: 'link',         icon: '🖼️', link: 'https://paxta.online/MEDAL' },
  { id: 'join_kalendar_ch',  cat: 'specials',   title: 'Desk Calendar Collectors',  reward: 200_000, type: 'link',         icon: '📅', link: 'https://paxta.online/Kalendar' },
  { id: 'solve_first_morse', cat: 'specials',   title: 'Secret Morse Master',       reward: 250_000, type: 'check_morse',  icon: '📡', link: '' },
  // Web3 world
  { id: 'reach_silver',      cat: 'web3',       title: 'Silver League Holder',      reward: 300_000, type: 'check_silver', icon: '🥈', link: '' },
  { id: 'reach_gold',        cat: 'web3',       title: 'Gold League Whale',         reward: 750_000, type: 'check_gold',   icon: '🏆', link: '' },
  { id: 'upgrade_Verify',    cat: 'web3',       title: 'Paxta Gift Upgrade',        reward: 150_000, type: 'link',         icon: '⭐', link: 'https://paxta.online/UpgradeBot' }
];

export const STARS_VIP_PACKS = [
  {
    id: 'starter_hold',
    name: '1,000,000 HOLD + Tap Boost',
    desc: '+1,000,000 HOLD · Multitap +2',
    starsPrice: 49,
    holdGrant: 1_000_000,
    tapBoost: 2,
    enableAutoBot: false
  },
  {
    id: 'god_mode',
    name: '3,000,000 HOLD + Auto-Bot',
    desc: '+3,000,000 HOLD · Multitap +5 · 24/7 Auto-Bot',
    starsPrice: 99,
    holdGrant: 3_000_000,
    tapBoost: 5,
    enableAutoBot: true
  },
  {
    id: 'whale_pack',
    name: '7,500,000 HOLD + Whale Boost',
    desc: '+7,500,000 HOLD · Multitap +10 · 24/7 Auto-Bot',
    starsPrice: 199,
    holdGrant: 7_500_000,
    tapBoost: 10,
    enableAutoBot: true
  },
  {
    id: 'obsidian_pack',
    name: '20,000,000 HOLD · Diamond Max',
    desc: '+20,000,000 HOLD · Multitap +18 · Top-10 Boost',
    starsPrice: 399,
    holdGrant: 20_000_000,
    tapBoost: 18,
    enableAutoBot: true
  }
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function getLeagueForHold(lifetimeHold) {
  let current = HOLD_LEAGUES[0];
  for (const lg of HOLD_LEAGUES) {
    if (lifetimeHold >= lg.minHold) current = lg;
  }
  return current;
}

export function registerHoldEngine(app, deps) {
  const {
    publicDir,
    usersFile,
    holdStateFile,
    channelCalendarsFile,
    channelMedalsFile,
    loadJSON,
    saveJSON,
    cleanKey,
    cleanName,
    verifySessionToken,
    verifyWebAppInitData,
    createSessionToken,
    isRequestAdmin,
    ADMIN_PAXTA_ID,
    PUBLIC_APP_URL,
    holdBotCall,
    moonClient,
    milliybekClient
  } = deps;

  function loadHoldState() {
    const st = loadJSON(holdStateFile, null);
    if (st && st.users && st.config && st.squads) {
      if (!st.soldMedals) st.soldMedals = {};
      if (!Array.isArray(st.nftClaims)) st.nftClaims = [];
      if (!st.payments) st.payments = { invoices: {}, charges: {}, lastUpdateId: 0 };
      if (!st.config.secretCodes) st.config.secretCodes = { ...DEFAULT_SECRET_CODES };
      if (!Array.isArray(st.config.customQuests)) st.config.customQuests = [...DEFAULT_HOLD_QUESTS];
      return st;
    }
    const initial = {
      users: {},
      config: {
        dailyMorse: {
          word: 'HOLD',
          reward: 1_000_000,
          hint: 'Loyihamizning asosiy 4 harfli nomi (H-O-L-D)'
        },
        secretCodes: { ...DEFAULT_SECRET_CODES },
        customQuests: [...DEFAULT_HOLD_QUESTS]
      },
      squads: {
        insider:  { id: 'insider',  handle: 'insider',  name: 'Insider Official',   members: 42, totalHold: 28_500_000, verified: true, link: 'https://paxta.online/insider' },
        medal:    { id: 'medal',    handle: 'MEDAL',    name: 'MEDAL Collectors',   members: 31, totalHold: 19_400_000, verified: true, link: 'https://paxta.online/MEDAL' },
        kalendar: { id: 'kalendar', handle: 'Kalendar', name: 'Kalendar Whales',    members: 27, totalHold: 16_200_000, verified: true, link: 'https://paxta.online/Kalendar' },
        hold_vip: { id: 'hold_vip', handle: 'hold',     name: 'Hold Verified Club', members: 54, totalHold: 34_800_000, verified: true, link: 'https://paxta.online/HOLDbot' }
      },
      soldMedals: {},
      nftClaims: [],
      payments: { invoices: {}, charges: {}, lastUpdateId: 0 }
    };
    saveJSON(holdStateFile, initial);
    return initial;
  }

  function saveHoldState(st) {
    saveJSON(holdStateFile, st);
  }

  // Verify a real PaxtaGram user or channel on paxta.online
  async function verifyOnPaxtaGram(handleRaw) {
    const clean = String(handleRaw || '').replace(/^@/, '').replace(/^https?:\/\/(www\.)?paxta\.online\//i, '').trim();
    if (!clean) return null;

    // 1. Try Bot API getChat
    try {
      const chatRes = await holdBotCall('getChat', { chat_id: `@${clean}` });
      if (chatRes && chatRes.ok && chatRes.result) {
        const ch = chatRes.result;
        return {
          id: ch.id,
          username: ch.username || clean,
          title: ch.title || ch.first_name || clean,
          type: ch.type || 'channel',
          verified: true
        };
      }
    } catch {}

    // 2. Try MoonClient resolveUserByUsername
    try {
      const u = await moonClient.resolveUserByUsername(clean);
      if (u && u.id) {
        return {
          id: u.id,
          username: u.username || clean,
          title: u.name || u.first_name || u.username || clean,
          avatar: u.avatar_url || null,
          isVerified: !!u.is_verified,
          isPremium: !!u.is_premium,
          createdAt: u.created_at || null,
          type: 'user',
          verified: true
        };
      }
    } catch {}

    // 3. Try checking public PaxtaGram page
    try {
      const res = await fetch(`https://paxta.online/${encodeURIComponent(clean)}`, {
        method: 'GET',
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const html = await res.text();
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(/\s*[-|]\s*PaxtaGram.*/i, '').trim() : clean;
        return {
          id: null,
          username: clean,
          title: title || clean,
          type: 'channel',
          verified: true
        };
      }
    } catch {}

    return null;
  }

  function computeUserRank(st, usernameKey) {
    const sorted = Object.values(st.users || {}).sort((a, b) => (b.lifetimeHold || 0) - (a.lifetimeHold || 0));
    const idx = sorted.findIndex(u => u.username === usernameKey);
    return idx >= 0 ? idx + 1 : sorted.length + 1;
  }

  function getOrCreateHoldUser(usernameRaw, displayNameRaw, paxtaId = null, refCode = null) {
    const st = loadHoldState();
    const key = cleanKey(usernameRaw);
    const mainUsers = loadJSON(usersFile, {});

    if (!mainUsers[key]) {
      mainUsers[key] = {
        username: key,
        displayName: cleanName(displayNameRaw || usernameRaw),
        paxtaId: paxtaId || null,
        stars: 0,
        createdAt: new Date().toISOString()
      };
      saveJSON(usersFile, mainUsers);
    } else if (paxtaId && !mainUsers[key].paxtaId) {
      mainUsers[key].paxtaId = paxtaId;
      saveJSON(usersFile, mainUsers);
    }

    const resolvedPaxtaId = paxtaId || mainUsers[key]?.paxtaId || null;

    if (!st.users[key]) {
      st.users[key] = {
        username: key,
        displayName: cleanName(displayNameRaw || mainUsers[key]?.displayName || key),
        paxtaId: resolvedPaxtaId,
        paxtaVerified: !!resolvedPaxtaId,
        holdBalance: 0,
        lifetimeHold: 0,
        ogBonusClaimed: false,
        ogDetails: null,
        energy: 1500,
        maxEnergy: 1500,
        lastEnergyAt: Date.now(),
        tapLevel: 1,
        energyLevel: 1,
        rechargingSpeedLevel: 1,
        autoBotEnabled: false,
        fullTankCount: 3,
        rocketCount: 3,
        lastBoostResetDay: todayStr(),
        lastAutoBotClaimAt: Date.now(),
        morseSolvedDays: [],
        lastSolvedMorseWord: '',
        secretCodesClaimed: [],
        referrals: [],
        referredBy: null,
        squadId: null,
        tasksCompleted: [],
        claimedNfts: [],
        ownedSkins: ['basic'],
        skin: 'basic',
        createdAt: new Date().toISOString()
      };

      // Handle Referral attribution
      if (refCode) {
        const refKey = cleanKey(String(refCode).replace(/^ref_/i, ''));
        if (refKey && refKey !== key && st.users[refKey]) {
          st.users[key].referredBy = refKey;
          st.users[key].holdBalance += 25_000;
          st.users[key].lifetimeHold += 25_000;
          if (!st.users[refKey].referrals.includes(key)) {
            st.users[refKey].referrals.push(key);
            st.users[refKey].holdBalance += 50_000;
            st.users[refKey].lifetimeHold += 50_000;
          }
        }
      }
      saveHoldState(st);
    } else {
      if (resolvedPaxtaId && !st.users[key].paxtaId) {
        st.users[key].paxtaId = resolvedPaxtaId;
        st.users[key].paxtaVerified = true;
      }
      if (displayNameRaw && st.users[key].displayName === st.users[key].username) {
        st.users[key].displayName = cleanName(displayNameRaw);
      }
    }

    const u = st.users[key];
    const now = Date.now();
    const today = todayStr();

    // Daily free boosts reset
    if (u.lastBoostResetDay !== today) {
      u.fullTankCount = 3;
      u.rocketCount = 3;
      u.lastBoostResetDay = today;
    }

    // Regenerate energy
    const maxE = 1000 + (u.energyLevel || 1) * 500;
    u.maxEnergy = maxE;
    const elapsedSec = Math.max(0, Math.floor((now - (u.lastEnergyAt || now)) / 1000));
    if (elapsedSec > 0) {
      const regenRate = 3 + Math.floor((u.energyLevel || 1) / 2) + ((u.rechargingSpeedLevel || 1) - 1) * 2;
      u.energy = Math.min(maxE, (u.energy || 0) + elapsedSec * regenRate);
      u.lastEnergyAt = now;
    }

    // Auto Tap Bot offline earnings (if autoBotEnabled)
    let passiveEarned = 0;
    const botElapsedMs = Math.max(0, now - (u.lastAutoBotClaimAt || now));
    if (u.autoBotEnabled && botElapsedMs >= 30_000) {
      const cappedHours = Math.min(12, botElapsedMs / (3600 * 1000));
      const hourlyRate = ((u.tapLevel || 1) * 1800);
      passiveEarned = Math.floor(hourlyRate * cappedHours);
      if (passiveEarned > 0) {
        u.holdBalance += passiveEarned;
        u.lifetimeHold += passiveEarned;
        if (u.squadId && st.squads[u.squadId]) {
          st.squads[u.squadId].totalHold += passiveEarned;
        }
      }
      u.lastAutoBotClaimAt = now;
    } else if (botElapsedMs >= 30_000) {
      u.lastAutoBotClaimAt = now;
    }

    return { st, u, mainUser: mainUsers[key], passiveEarned };
  }

  function formatHoldUserResponse(st, u, mainUser, passiveEarned = 0) {
    const today = todayStr();
    const league = getLeagueForHold(u.lifetimeHold || 0);
    const tapPower = (u.tapLevel || 1) + (league.bonusTap || 0);
    const morseWord = (st.config?.dailyMorse?.word || 'HOLD').toUpperCase();
    const morseOverlay = morseWord.split('').map(ch => ({
      letter: ch,
      morse: MORSE_MAP[ch] || '.-'
    }));

    if (!Array.isArray(u.ownedSkins) || !u.ownedSkins.includes('basic')) {
      u.ownedSkins = Array.from(new Set(['basic', ...(u.ownedSkins || [])]));
    }
    const activeSkinId = HOLD_SKINS.some(s => s.id === u.skin) ? u.skin : 'basic';
    const rSpeedLvl = u.rechargingSpeedLevel || 1;
    const rank = computeUserRank(st, u.username);

    const pid = Number(u.paxtaId) || 999;
    const topPct = pid <= 150 ? 1 : pid <= 500 ? 5 : pid <= 1500 ? 10 : 25;
    const yearsEquivalent = pid <= 200 ? 3 : pid <= 800 ? 2 : 1;

    const solvedToday = (u.morseSolvedDays || []).includes(today) && u.lastSolvedMorseWord === morseWord;

    return {
      username: u.username,
      displayName: u.displayName,
      paxtaId: u.paxtaId,
      paxtaVerified: !!u.paxtaVerified,
      rank,
      topPct,
      yearsEquivalent,
      isAdmin: Number(u.paxtaId) === ADMIN_PAXTA_ID || u.username === 'moon' || u.username === 'shade',
      stars: mainUser?.stars || 0,
      holdBalance: Math.floor(u.holdBalance || 0),
      lifetimeHold: Math.floor(u.lifetimeHold || 0),
      passiveEarnedJustNow: passiveEarned,
      tapPower,
      tapLevel: u.tapLevel || 1,
      nextTapUpgradeCost: Math.round(1_000 * Math.pow(1.65, (u.tapLevel || 1) - 1)),
      energy: u.energy,
      maxEnergy: u.maxEnergy,
      energyLevel: u.energyLevel || 1,
      nextEnergyUpgradeCost: Math.round(1_000 * Math.pow(1.65, (u.energyLevel || 1) - 1)),
      rechargingSpeedLevel: rSpeedLvl,
      rechargingSpeedMax: 5,
      nextRechargingUpgradeCost: rSpeedLvl >= 5 ? 0 : Math.round(2_000 * Math.pow(1.8, rSpeedLvl - 1)),
      autoBotEnabled: !!u.autoBotEnabled,
      autoBotCost: 150_000,
      fullTankCount: u.fullTankCount ?? 3,
      rocketCount: u.rocketCount ?? 3,
      ogBonusClaimed: !!u.ogBonusClaimed,
      ogDetails: u.ogDetails,
      league,
      allLeagues: HOLD_LEAGUES,
      skin: activeSkinId,
      ownedSkins: u.ownedSkins,
      allSkins: HOLD_SKINS,
      morse: {
        wordLength: morseWord.length,
        word: morseWord,
        secretWords: Object.keys(st.config?.secretCodes || DEFAULT_SECRET_CODES),
        secretCodesMap: st.config?.secretCodes || DEFAULT_SECRET_CODES,
        hint: st.config?.dailyMorse?.hint || 'Maxfiy soʻzni Morze alifbosida tering',
        reward: st.config?.dailyMorse?.reward || 1_000_000,
        solvedToday,
        lettersGuide: morseOverlay
      },
      squadId: u.squadId,
      squads: Object.values(st.squads || {}).sort((a, b) => b.totalHold - a.totalHold),
      referrals: (u.referrals || []).map(rKey => {
        const rUser = st.users[rKey];
        return {
          username: rKey,
          displayName: rUser?.displayName || rKey,
          lifetimeHold: Math.floor(rUser?.lifetimeHold || 0),
          league: getLeagueForHold(rUser?.lifetimeHold || 0).name
        };
      }),
      tasksCompleted: u.tasksCompleted || [],
      quests: st.config?.customQuests || DEFAULT_HOLD_QUESTS,
      vipPacks: STARS_VIP_PACKS,
      claimedNfts: u.claimedNfts || [],
      secretCodesClaimed: u.secretCodesClaimed || []
    };
  }

  // ---- Serve /hold WebApp Page ----
  app.get(['/hold', '/hold/'], (req, res) => {
    res.sendFile(path.join(publicDir, 'hold', 'index.html'));
  });

  // ---- 1. Login / Sync User State (With Real PaxtaGram Profile Resolution) ----
  app.post('/api/hold/sync', async (req, res) => {
    let resolvedUsername = req.body?.username;
    let resolvedDisplayName = req.body?.displayName;
    let resolvedPaxtaId = req.body?.paxtaId ? Number(req.body.paxtaId) : null;
    const refCode = req.body?.ref || null;

    const authToken = req.headers['x-auth-token'] || req.body?.authToken;
    const session = verifySessionToken(authToken);
    if (session) {
      resolvedUsername = session.username;
      if (session.paxtaId) resolvedPaxtaId = session.paxtaId;
    }

    const initData = req.headers['x-init-data'] || req.body?.initData;
    const webAppUser = verifyWebAppInitData(initData);
    if (webAppUser) {
      resolvedUsername = webAppUser.username || webAppUser.first_name || `user_${webAppUser.id}`;
      resolvedDisplayName = [webAppUser.first_name, webAppUser.last_name].filter(Boolean).join(' ') || resolvedUsername;
      resolvedPaxtaId = Number(webAppUser.id);
    }

    // If we have a real username (not auto-generated holder_XXX) and no paxtaId yet, resolve on PaxtaGram
    if (resolvedUsername && !resolvedUsername.startsWith('holder_') && !resolvedPaxtaId) {
      try {
        const pUser = await moonClient.resolveUserByUsername(resolvedUsername);
        if (pUser && pUser.id) {
          resolvedPaxtaId = Number(pUser.id);
          resolvedUsername = pUser.username || resolvedUsername;
          resolvedDisplayName = pUser.name || pUser.first_name || resolvedDisplayName;
        }
      } catch {}
    }

    const { st, u, mainUser, passiveEarned } = getOrCreateHoldUser(
      resolvedUsername || 'holder',
      resolvedDisplayName,
      resolvedPaxtaId,
      refCode
    );
    saveHoldState(st);

    const newSessionToken = resolvedPaxtaId ? createSessionToken(u.username, resolvedPaxtaId) : authToken;
    res.json({
      ok: true,
      authToken: newSessionToken,
      user: formatHoldUserResponse(st, u, mainUser, passiveEarned)
    });
  });

  // ---- 2. Claim Initial Onboarding Snapshot Bonus ----
  app.post('/api/hold/claim-og', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    if (u.ogBonusClaimed) {
      return res.json({ ok: true, alreadyClaimed: true, user: formatHoldUserResponse(st, u, mainUser) });
    }

    const pid = Number(u.paxtaId) || 999;
    let tierName = 'Verified Holder';
    let idBonus = 50_000;
    if (pid <= 150) {
      tierName = 'Legendary Pioneer';
      idBonus = 250_000;
    } else if (pid <= 600) {
      tierName = 'Early Pioneer';
      idBonus = 150_000;
    } else if (pid <= 1400) {
      tierName = 'Veteran Holder';
      idBonus = 95_000;
    }

    const activityBonus = 30_000;
    const totalBonus = idBonus + activityBonus;

    u.ogBonusClaimed = true;
    u.ogDetails = {
      paxtaId: pid,
      tierName,
      idBonus,
      activityBonus,
      totalBonus
    };
    u.holdBalance += totalBonus;
    u.lifetimeHold += totalBonus;
    saveHoldState(st);

    res.json({
      ok: true,
      ogDetails: u.ogDetails,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 3. Batch Tap + Turbo Sync ----
  app.post('/api/hold/tap', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const taps = Math.max(1, Math.min(120, parseInt(req.body?.taps, 10) || 1));
    const isTurbo = !!req.body?.turbo;

    const league = getLeagueForHold(u.lifetimeHold || 0);
    const baseTap = (u.tapLevel || 1) + (league.bonusTap || 0);
    const perTap = isTurbo ? baseTap * 7 : baseTap;

    let actualTaps = taps;
    if (!isTurbo) {
      const maxPossible = Math.floor((u.energy || 0) / Math.max(1, baseTap));
      actualTaps = Math.min(taps, Math.max(1, maxPossible));
      u.energy = Math.max(0, (u.energy || 0) - actualTaps * baseTap);
    }

    const earned = actualTaps * perTap;
    u.holdBalance += earned;
    u.lifetimeHold += earned;
    u.lastEnergyAt = Date.now();

    if (u.squadId && st.squads[u.squadId]) {
      st.squads[u.squadId].totalHold += earned;
    }

    saveHoldState(st);
    res.json({
      ok: true,
      earned,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 4. Boosts (Full Tank, Rocket, Multitap, Energy Limit, Recharging Speed, Auto-Bot) ----
  app.post('/api/hold/boost', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const type = req.body?.type;

    if (type === 'full_tank') {
      if ((u.fullTankCount ?? 0) <= 0) {
        return res.status(400).json({ ok: false, error: 'Bugungi bepul energiya limiti tugadi' });
      }
      u.fullTankCount--;
      u.energy = u.maxEnergy;
      u.lastEnergyAt = Date.now();
      saveHoldState(st);
      return res.json({ ok: true, message: '⚡ Full Energy activated!', user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'rocket') {
      if ((u.rocketCount ?? 0) <= 0) {
        return res.status(400).json({ ok: false, error: 'Bugungi Turbo limiti tugadi' });
      }
      u.rocketCount--;
      saveHoldState(st);
      return res.json({ ok: true, turboDurationMs: 10_000, message: '🚀 7x Turbo activated (10s)!', user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'multitap') {
      const cost = Math.round(1_000 * Math.pow(1.65, (u.tapLevel || 1) - 1));
      if (u.holdBalance < cost) {
        return res.status(400).json({ ok: false, error: `Need ${cost.toLocaleString()} HOLD` });
      }
      u.holdBalance -= cost;
      u.tapLevel = (u.tapLevel || 1) + 1;
      saveHoldState(st);
      return res.json({ ok: true, message: `☝️ Multitap · ${u.tapLevel} level`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'energy_limit') {
      const cost = Math.round(1_000 * Math.pow(1.65, (u.energyLevel || 1) - 1));
      if (u.holdBalance < cost) {
        return res.status(400).json({ ok: false, error: `Need ${cost.toLocaleString()} HOLD` });
      }
      u.holdBalance -= cost;
      u.energyLevel = (u.energyLevel || 1) + 1;
      u.maxEnergy = 1000 + u.energyLevel * 500;
      u.energy = u.maxEnergy;
      saveHoldState(st);
      return res.json({ ok: true, message: `🔋 Energy Limit · ${u.energyLevel} level`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'recharging_speed') {
      const curLvl = u.rechargingSpeedLevel || 1;
      if (curLvl >= 5) {
        return res.status(400).json({ ok: false, error: 'Max level reached' });
      }
      const cost = Math.round(2_000 * Math.pow(1.8, curLvl - 1));
      if (u.holdBalance < cost) {
        return res.status(400).json({ ok: false, error: `Need ${cost.toLocaleString()} HOLD` });
      }
      u.holdBalance -= cost;
      u.rechargingSpeedLevel = curLvl + 1;
      saveHoldState(st);
      return res.json({ ok: true, message: `⚡ Recharging speed · ${u.rechargingSpeedLevel} level`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'autobot') {
      if (u.autoBotEnabled) {
        return res.status(400).json({ ok: false, error: 'Auto tap bot already active' });
      }
      const cost = 150_000;
      if (u.holdBalance < cost) {
        return res.status(400).json({ ok: false, error: `Need ${cost.toLocaleString()} HOLD` });
      }
      u.holdBalance -= cost;
      u.autoBotEnabled = true;
      u.lastAutoBotClaimAt = Date.now();
      saveHoldState(st);
      return res.json({ ok: true, message: '🤖 Auto tap bot enabled!', user: formatHoldUserResponse(st, u, mainUser) });
    }

    res.status(400).json({ ok: false, error: 'Unknown boost type' });
  });

  // ---- 4B. Buy / Equip Coin Skin ----
  app.post('/api/hold/skin', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const skinId = req.body?.skinId;
    const skinDef = HOLD_SKINS.find(s => s.id === skinId);
    if (!skinDef) {
      return res.status(404).json({ ok: false, error: 'Skin not found' });
    }

    if (!Array.isArray(u.ownedSkins)) u.ownedSkins = ['basic'];

    if (u.ownedSkins.includes(skinId)) {
      u.skin = skinId;
      saveHoldState(st);
      return res.json({
        ok: true,
        message: `${skinDef.name} enabled`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    const cost = skinDef.priceHold || 0;
    if (u.holdBalance < cost) {
      return res.status(400).json({
        ok: false,
        error: `Need ${cost.toLocaleString()} HOLD for ${skinDef.name}`
      });
    }

    u.holdBalance -= cost;
    u.ownedSkins.push(skinId);
    u.skin = skinId;
    saveHoldState(st);

    res.json({
      ok: true,
      message: `${skinDef.name} unlocked & enabled!`,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 6. Solve Daily Morse Cipher & Secret Mystery Codes ----
  app.post('/api/hold/solve-morse', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const wordInput = String(req.body?.word || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!wordInput) {
      return res.status(400).json({ ok: false, error: 'Empty code' });
    }

    const today = todayStr();
    const dailyWord = (st.config?.dailyMorse?.word || 'HOLD').toUpperCase();
    const dailyReward = st.config?.dailyMorse?.reward || 1_000_000;
    const secretMap = st.config?.secretCodes || DEFAULT_SECRET_CODES;

    if (!Array.isArray(u.morseSolvedDays)) u.morseSolvedDays = [];
    if (!Array.isArray(u.secretCodesClaimed)) u.secretCodesClaimed = [];

    // 1. Check Daily Morse Word
    if (wordInput === dailyWord) {
      const alreadyDoneForThisWord = u.morseSolvedDays.includes(today) && u.lastSolvedMorseWord === dailyWord;
      if (alreadyDoneForThisWord) {
        return res.json({
          ok: true,
          alreadyClaimed: true,
          word: dailyWord,
          reward: 0,
          message: `✨ "${dailyWord}" shifri bugun olingan!`,
          user: formatHoldUserResponse(st, u, mainUser)
        });
      }
      if (!u.morseSolvedDays.includes(today)) {
        u.morseSolvedDays.push(today);
      }
      u.lastSolvedMorseWord = dailyWord;
      u.holdBalance += dailyReward;
      u.lifetimeHold += dailyReward;
      if (u.squadId && st.squads[u.squadId]) {
        st.squads[u.squadId].totalHold += dailyReward;
      }
      saveHoldState(st);
      return res.json({
        ok: true,
        type: 'daily_morse',
        word: dailyWord,
        reward: dailyReward,
        message: `✨ "${dailyWord}" · +${dailyReward.toLocaleString()} HOLD!`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    // 2. Check Secret Bonus Mystery Words (WAKEUP, PAXTA, MEDAL, OBSIDIAN, MOON, or Admin added codes)
    const secret = secretMap[wordInput];
    if (secret) {
      if (u.secretCodesClaimed.includes(wordInput)) {
        return res.json({
          ok: true,
          alreadyClaimed: true,
          word: wordInput,
          reward: 0,
          message: `"${wordInput}" kodi allaqachon olingan`,
          user: formatHoldUserResponse(st, u, mainUser)
        });
      }
      u.secretCodesClaimed.push(wordInput);
      u.holdBalance += secret.reward;
      u.lifetimeHold += secret.reward;
      if (secret.skin) {
        if (!Array.isArray(u.ownedSkins)) u.ownedSkins = ['basic'];
        if (!u.ownedSkins.includes(secret.skin)) u.ownedSkins.push(secret.skin);
        u.skin = secret.skin;
      }
      saveHoldState(st);
      return res.json({
        ok: true,
        type: 'secret_code',
        word: wordInput,
        reward: secret.reward,
        message: `✨ ${secret.title || wordInput} · +${secret.reward.toLocaleString()} HOLD!`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    res.status(400).json({
      ok: false,
      error: `"${wordInput}" — notoʻgʻri kod`
    });
  });

  // ---- 7. Join Squad (or Verify & Create Squad from Official PaxtaGram Channel) ----
  app.post('/api/hold/join-squad', async (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    let squadId = req.body?.squadId;
    const channelHandle = req.body?.channelHandle;

    // Allow joining/adding any real PaxtaGram channel as a Squad!
    if (channelHandle && !squadId) {
      const cleanH = cleanKey(String(channelHandle).replace(/^@/, '').replace(/^https?:\/\/(www\.)?paxta\.online\//i, ''));
      if (st.squads[cleanH]) {
        squadId = cleanH;
      } else {
        const verifiedCh = await verifyOnPaxtaGram(cleanH);
        if (!verifiedCh) {
          return res.status(404).json({ ok: false, error: `@${cleanH} rasmiy PaxtaGram kanali topilmadi` });
        }
        st.squads[cleanH] = {
          id: cleanH,
          handle: verifiedCh.username || cleanH,
          name: verifiedCh.title || `@${cleanH}`,
          members: 1,
          totalHold: Math.floor(u.lifetimeHold || 0),
          verified: true,
          link: `https://paxta.online/${verifiedCh.username || cleanH}`
        };
        squadId = cleanH;
      }
    }

    if (!st.squads[squadId]) {
      return res.status(404).json({ ok: false, error: 'Squad topilmadi' });
    }
    if (u.squadId !== squadId) {
      u.squadId = squadId;
      st.squads[squadId].members = (st.squads[squadId].members || 0) + 1;
      saveHoldState(st);
    }
    res.json({
      ok: true,
      message: `Joined ${st.squads[squadId].name}!`,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 8. Complete Quests (Earn More Coins) ----
  app.post('/api/hold/claim-quest', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const questId = req.body?.questId;
    const allQuests = st.config?.customQuests || DEFAULT_HOLD_QUESTS;
    const quest = allQuests.find(q => q.id === questId);
    if (!quest) return res.status(404).json({ ok: false, error: 'Task not found' });

    if (!Array.isArray(u.tasksCompleted)) u.tasksCompleted = [];
    if (u.tasksCompleted.includes(questId)) {
      return res.status(400).json({ ok: false, error: 'Completed' });
    }

    if (quest.type === 'check_morse' && (!u.morseSolvedDays || u.morseSolvedDays.length === 0) && (!u.secretCodesClaimed || u.secretCodesClaimed.length === 0)) {
      return res.status(400).json({ ok: false, error: 'Avval tangada yashirin Morze soʻzini tering' });
    }
    if (quest.type === 'check_squad' && !u.squadId) {
      return res.status(400).json({ ok: false, error: 'Avval Squad (jamoa)ga qoʻshiling' });
    }
    if (quest.type === 'check_1k' && (u.lifetimeHold || 0) < 1_000) {
      return res.status(400).json({ ok: false, error: 'Avval 1,000 HOLD yigʻing' });
    }
    if (quest.type === 'check_ref_10' && (u.referrals || []).length < 10) {
      return res.status(400).json({ ok: false, error: `10 ta doʻst taklif qiling (${(u.referrals || []).length}/10)` });
    }
    if (quest.type === 'check_silver' && (u.lifetimeHold || 0) < 200_000) {
      return res.status(400).json({ ok: false, error: 'Avval Silver ligaga (200K HOLD) chiqing' });
    }
    if (quest.type === 'check_gold' && (u.lifetimeHold || 0) < 1_000_000) {
      return res.status(400).json({ ok: false, error: 'Avval Gold ligaga (1M HOLD) chiqing' });
    }

    u.tasksCompleted.push(questId);
    u.holdBalance += quest.reward;
    u.lifetimeHold += quest.reward;
    saveHoldState(st);

    res.json({
      ok: true,
      reward: quest.reward,
      message: `+${quest.reward.toLocaleString()} HOLD`,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 9. Buy VIP Pack with Stars ----
  app.post('/api/hold/buy-vip-pack', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const packId = req.body?.packId;
    const pack = STARS_VIP_PACKS.find(p => p.id === packId);
    if (!pack) return res.status(404).json({ ok: false, error: 'Pack not found' });

    const users = loadJSON(usersFile, {});
    const userRecord = users[u.username];
    const currentStars = userRecord?.stars || 0;

    if (currentStars < pack.starsPrice) {
      return res.status(400).json({
        ok: false,
        needStars: true,
        deficit: pack.starsPrice - currentStars,
        required: pack.starsPrice,
        error: `Need ${pack.starsPrice} Stars`
      });
    }

    userRecord.stars -= pack.starsPrice;
    saveJSON(usersFile, users);

    u.holdBalance += pack.holdGrant;
    u.lifetimeHold += pack.holdGrant;
    u.tapLevel = (u.tapLevel || 1) + (pack.tapBoost || 0);
    if (pack.enableAutoBot) u.autoBotEnabled = true;
    saveHoldState(st);

    res.json({
      ok: true,
      message: `${pack.name} · +${pack.holdGrant.toLocaleString()} HOLD`,
      user: formatHoldUserResponse(st, u, userRecord)
    });
  });

  // ---- 10. Top-10 Leaderboard & Allocated NFT / HOLD Prizes ----
  function getVaultItems() {
    const st = loadHoldState();
    const settings = loadJSON(path.join(path.dirname(usersFile), 'settings.json'), {});
    const soldCalendars = settings.soldCalendars || {};
    const soldMedals = st.soldMedals || {};

    const rawMedals = loadJSON(channelMedalsFile, []);
    const rawCalendars = loadJSON(channelCalendarsFile, []);

    const vaultMedals = rawMedals
      .filter(m => !FORBIDDEN_GIFT_IDS.has(Number(m.giftId)))
      .map(m => {
        const bLow = String(m.backdrop || '').toLowerCase();
        const isBlack = bLow.includes('black') || bLow.includes('onyx') || bLow.includes('gunmetal');
        const soldInfo = soldMedals[m.giftId] || null;
        return {
          vaultId: `medal_${m.giftId}`,
          giftId: Number(m.giftId),
          nftType: 'medal',
          title: `Victory Medal #${m.number}`,
          number: Number(m.number),
          model: m.model || 'Victory',
          backdrop: m.backdrop || 'Classic',
          centerColor: m.centerColor || '#3b82f6',
          edgeColor: m.edgeColor || '#1d4ed8',
          img: m.localImg || m.imageUrl,
          link: m.link || `https://paxta.online/nft/VictoryMedal-${m.number}`,
          isBlack,
          crafted: false,
          sold: !!soldInfo
        };
      });

    const vaultCalendars = rawCalendars
      .filter(c => !FORBIDDEN_GIFT_IDS.has(Number(c.giftId)))
      .map(c => {
        const bLow = String(c.backdrop || '').toLowerCase();
        const isBlack = bLow.includes('black') || bLow.includes('onyx') || bLow.includes('obsidian');
        const isCraft = !!c.crafted;
        const soldInfo = soldCalendars[c.id] || soldCalendars[c.giftId] || null;
        return {
          vaultId: `cal_${c.id}`,
          calId: c.id,
          giftId: Number(c.giftId),
          nftType: 'calendar',
          title: `Desk Calendar #${c.number}`,
          number: Number(c.number),
          model: c.model || 'Classic',
          backdrop: c.backdrop || 'Standard',
          centerColor: c.backdropColors?.center || c.centerColor || '#363738',
          edgeColor: c.backdropColors?.edge || c.edgeColor || '#0e0f0f',
          img: c.image || c.localImg || c.imageUrl,
          link: c.link || `https://paxta.online/nft/DeskCalendar-${c.number}`,
          isBlack,
          crafted: isCraft,
          sold: !!soldInfo
        };
      });

    return [...vaultMedals, ...vaultCalendars];
  }

  function getTop10PrizeAllocation(allItems) {
    const avail = allItems.filter(i => !i.sold);
    const usedIds = new Set();
    const pick = (predicate) => {
      const found = avail.find(x => !usedIds.has(x.vaultId) && predicate(x));
      if (found) {
        usedIds.add(found.vaultId);
        return found;
      }
      const fallback = avail.find(x => !usedIds.has(x.vaultId));
      if (fallback) usedIds.add(fallback.vaultId);
      return fallback || null;
    };

    const holdBonusByRank = [
      10_000_000, 7_500_000, 5_000_000, 3_500_000, 2_500_000,
      2_000_000, 1_500_000, 1_000_000, 750_000, 500_000
    ];

    const selected = [
      pick(x => x.nftType === 'calendar' && x.number < 100),
      pick(x => x.nftType === 'calendar' && x.isBlack),
      pick(x => x.nftType === 'medal' && x.isBlack),
      pick(x => x.nftType === 'calendar' && x.crafted),
      pick(x => x.nftType === 'medal'),
      pick(x => x.nftType === 'calendar'),
      pick(x => x.nftType === 'medal'),
      pick(x => x.nftType === 'calendar'),
      pick(x => x.nftType === 'medal'),
      pick(x => x.nftType === 'calendar')
    ];

    return selected.map((nft, idx) => ({
      rank: idx + 1,
      holdBonus: holdBonusByRank[idx],
      nft: nft ? {
        vaultId: nft.vaultId,
        title: nft.title,
        model: nft.model,
        backdrop: nft.backdrop,
        img: nft.img,
        centerColor: nft.centerColor,
        edgeColor: nft.edgeColor,
        link: nft.link
      } : null
    }));
  }

  app.get('/api/hold/vault', (req, res) => {
    const allItems = getVaultItems();
    const top10Prizes = getTop10PrizeAllocation(allItems);
    const st = loadHoldState();
    const sortedUsers = Object.values(st.users || {})
      .sort((a, b) => (b.lifetimeHold || 0) - (a.lifetimeHold || 0));

    const leaderboard = sortedUsers
      .slice(0, 100)
      .map((u, idx) => {
        const rank = idx + 1;
        const prize = rank <= 10 ? top10Prizes[rank - 1] : null;
        return {
          rank,
          username: u.username,
          displayName: u.displayName || u.username,
          lifetimeHold: Math.floor(u.lifetimeHold || 0),
          holdBalance: Math.floor(u.holdBalance || 0),
          league: getLeagueForHold(u.lifetimeHold || 0),
          referralsCount: (u.referrals || []).length,
          prize
        };
      });

    res.json({
      ok: true,
      totalPlayers: sortedUsers.length,
      top10Prizes,
      leaderboard
    });
  });

  // ---- 12. Create Stars Invoice via @HOLDbot ----
  app.post('/api/hold/create-invoice', async (req, res) => {
    const { st, u } = getOrCreateHoldUser(req.body?.username);
    const amount = Math.max(1, Math.min(100_000, parseInt(req.body?.amount, 10) || 100));
    const title = String(req.body?.title || `HOLD Boost (+${amount} ⭐)`).slice(0, 32);

    const invoiceId = `holdinv_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
    const payload = `holdstars:${u.username}:${amount}:${invoiceId}`;

    const apiRes = await holdBotCall('createInvoiceLink', {
      title,
      description: `@${u.username} hisobiga +${amount} Stars qoʻshish (HOLD)`,
      payload,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: `${amount} Stars`, amount }]
    });

    if (!apiRes || !apiRes.ok || !apiRes.result) {
      return res.status(502).json({
        ok: false,
        error: apiRes?.description || 'Invoice error'
      });
    }

    st.payments.invoices[invoiceId] = {
      invoiceId,
      username: u.username,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    saveHoldState(st);

    res.json({
      ok: true,
      invoiceId,
      invoiceUrl: apiRes.result,
      amount
    });
  });

  // ---- 13. Comprehensive Admin Studio API (ID 100 / @shade / @moon) ----
  app.post('/api/hold/admin-config', async (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const isAdmin = isRequestAdmin(req) || Number(u.paxtaId) === ADMIN_PAXTA_ID || u.username === 'moon' || u.username === 'shade';
    if (!isAdmin) return res.status(403).json({ ok: false, error: 'Faqat Admin (ID 100) uchun!' });

    const action = req.body?.action || 'save_morse';

    if (action === 'save_morse') {
      if (req.body?.morseWord) {
        st.config.dailyMorse.word = String(req.body.morseWord).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      }
      if (req.body?.morseReward) {
        st.config.dailyMorse.reward = Math.max(1_000, parseInt(req.body.morseReward, 10) || 1_000_000);
      }
      saveHoldState(st);
      return res.json({ ok: true, message: 'Kunlik Morze yangilandi', user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (action === 'add_secret_code') {
      const code = String(req.body?.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const reward = Math.max(1_000, parseInt(req.body?.reward, 10) || 500_000);
      const skin = req.body?.skin || null;
      if (!code) return res.status(400).json({ ok: false, error: 'Kod kiriting' });
      if (!st.config.secretCodes) st.config.secretCodes = { ...DEFAULT_SECRET_CODES };
      st.config.secretCodes[code] = {
        reward,
        title: `${code} kodi ochildi`,
        ...(skin ? { skin } : {})
      };
      saveHoldState(st);
      return res.json({ ok: true, message: `Maxfiy kod "${code}" qoʻshildi`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (action === 'delete_secret_code') {
      const code = String(req.body?.code || '').trim().toUpperCase();
      if (st.config.secretCodes && st.config.secretCodes[code]) {
        delete st.config.secretCodes[code];
        saveHoldState(st);
      }
      return res.json({ ok: true, message: `Kod "${code}" oʻchirildi`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (action === 'add_quest') {
      const title = String(req.body?.title || '').trim();
      const cat = ['onboarding', 'specials', 'web3'].includes(req.body?.cat) ? req.body.cat : 'specials';
      const reward = Math.max(1_000, parseInt(req.body?.reward, 10) || 100_000);
      let link = String(req.body?.link || '').trim();
      if (link && link.startsWith('@')) {
        link = `https://paxta.online/${link.slice(1)}`;
      }
      const icon = String(req.body?.icon || '⭐').trim() || '⭐';
      if (!title) return res.status(400).json({ ok: false, error: 'Vazifa nomini kiriting' });

      if (!Array.isArray(st.config.customQuests)) st.config.customQuests = [...DEFAULT_HOLD_QUESTS];
      st.config.customQuests.push({
        id: `q_${Date.now().toString(36)}`,
        cat,
        title,
        reward,
        type: link ? 'link' : 'instant',
        icon,
        link
      });
      saveHoldState(st);
      return res.json({ ok: true, message: `Vazifa "${title}" qoʻshildi`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (action === 'delete_quest') {
      const qId = req.body?.questId;
      if (Array.isArray(st.config.customQuests)) {
        st.config.customQuests = st.config.customQuests.filter(q => q.id !== qId);
        saveHoldState(st);
      }
      return res.json({ ok: true, message: 'Vazifa oʻchirildi', user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (action === 'add_squad') {
      const rawHandle = String(req.body?.handle || '').trim();
      const customName = String(req.body?.name || '').trim();
      const cleanH = cleanKey(rawHandle.replace(/^@/, '').replace(/^https?:\/\/(www\.)?paxta\.online\//i, ''));
      if (!cleanH) return res.status(400).json({ ok: false, error: 'Kanal @username kiriting' });

      const verified = await verifyOnPaxtaGram(cleanH);
      st.squads[cleanH] = {
        id: cleanH,
        handle: verified?.username || cleanH,
        name: customName || verified?.title || `@${cleanH}`,
        members: st.squads[cleanH]?.members || 1,
        totalHold: st.squads[cleanH]?.totalHold || 100_000,
        verified: !!verified,
        link: `https://paxta.online/${verified?.username || cleanH}`
      };
      saveHoldState(st);
      return res.json({
        ok: true,
        message: verified ? `✅ @${cleanH} PaxtaGramda tasdiqlandi va Squad qoʻshildi` : `Squad @${cleanH} qoʻshildi`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    if (action === 'delete_squad') {
      const sqId = req.body?.squadId;
      if (sqId && st.squads[sqId]) {
        delete st.squads[sqId];
        saveHoldState(st);
      }
      return res.json({ ok: true, message: 'Squad oʻchirildi', user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (action === 'user_grant') {
      const targetKey = cleanKey(req.body?.targetUsername || u.username);
      const holdDelta = parseInt(req.body?.holdDelta, 10) || 0;
      const targetUser = st.users[targetKey];
      if (!targetUser) return res.status(404).json({ ok: false, error: `@${targetKey} topilmadi` });

      if (holdDelta !== 0) {
        targetUser.holdBalance = Math.max(0, (targetUser.holdBalance || 0) + holdDelta);
        if (holdDelta > 0) targetUser.lifetimeHold = (targetUser.lifetimeHold || 0) + holdDelta;
      }
      if (req.body?.resetOnboarding) {
        targetUser.ogBonusClaimed = false;
      }
      if (req.body?.resetMorse) {
        targetUser.morseSolvedDays = [];
        targetUser.lastSolvedMorseWord = '';
        targetUser.secretCodesClaimed = [];
      }
      saveHoldState(st);
      return res.json({ ok: true, message: `@${targetKey} yangilandi`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    res.json({ ok: true, user: formatHoldUserResponse(st, u, mainUser) });
  });

  // ---- 14. @HOLDbot Polling Loop (Handles /start, Referrals & Stars Payments) ----
  async function startHoldBotLoop() {
    const holdWebAppUrl = `${PUBLIC_APP_URL}/hold`;
    holdBotCall('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'HOLD',
        web_app: { url: holdWebAppUrl }
      }
    }).catch(() => {});

    let st = loadHoldState();
    let offset = (st.payments?.lastUpdateId || 0) + 1;

    while (true) {
      try {
        const u = await holdBotCall('getUpdates', { offset, timeout: 2 });
        if (u && u.ok && Array.isArray(u.result) && u.result.length > 0) {
          st = loadHoldState();
          for (const item of u.result) {
            offset = item.update_id + 1;

            const fromUser = item.pre_checkout_query?.from || item.message?.from;
            const uKey = fromUser ? cleanKey(fromUser.username || fromUser.first_name || `user_${fromUser.id}`) : null;

            if (item.pre_checkout_query) {
              await holdBotCall('answerPreCheckoutQuery', {
                pre_checkout_query_id: item.pre_checkout_query.id,
                ok: true
              });
            }

            if (item.message?.successful_payment) {
              const sp = item.message.successful_payment;
              const chargeId = sp.telegram_payment_charge_id;
              if (!st.payments.charges[chargeId]) {
                const parts = String(sp.invoice_payload || '').split(':');
                const targetKey = cleanKey(parts[1] || uKey || 'holder');
                const starsAdded = parseInt(sp.total_amount, 10) || parseInt(parts[2], 10) || 0;

                const users = loadJSON(usersFile, {});
                if (!users[targetKey]) {
                  users[targetKey] = { username: targetKey, displayName: targetKey, stars: 0 };
                }
                users[targetKey].stars = (users[targetKey].stars || 0) + starsAdded;
                saveJSON(usersFile, users);

                st.payments.charges[chargeId] = {
                  username: targetKey,
                  amount: starsAdded,
                  paidAt: new Date().toISOString()
                };
                saveHoldState(st);

                if (item.message.chat?.id) {
                  const token = createSessionToken(targetKey, fromUser?.id);
                  await holdBotCall('sendMessage', {
                    chat_id: item.message.chat.id,
                    text: `Toʻlov tasdiqlandi. Balans: ${users[targetKey].stars} Stars.`,
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: 'HOLD', web_app: { url: `${holdWebAppUrl}?auth=${encodeURIComponent(token)}` } }]
                      ]
                    }
                  });
                }
              }
            }

            const txt = (item.message?.text || '').trim();
            if (txt.startsWith('/start') || txt.startsWith('/hold') || txt.startsWith('/play')) {
              const parts = txt.split(/\s+/);
              const refParam = parts[1] || null;
              const sender = item.message.from || {};
              const senderKey = cleanKey(sender.username || sender.first_name || `user_${sender.id}`);

              getOrCreateHoldUser(senderKey, sender.first_name || sender.username, sender.id, refParam);
              const token = createSessionToken(senderKey, sender.id);
              const personalUrl = `${holdWebAppUrl}?auth=${encodeURIComponent(token)}${refParam ? `&ref=${encodeURIComponent(refParam)}` : ''}`;

              await holdBotCall('sendMessage', {
                chat_id: item.message.chat.id,
                text: `Nothing to sell. Just hold. @hold`,
                reply_markup: {
                  inline_keyboard: [
                    [{ text: 'HOLD', web_app: { url: personalUrl } }]
                  ]
                }
              });
            }
          }
          st.payments.lastUpdateId = offset - 1;
          saveHoldState(st);
        }
      } catch {}
      await new Promise(r => setTimeout(r, 900));
    }
  }

  return { startHoldBotLoop };
}

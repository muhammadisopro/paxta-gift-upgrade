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

export const DAILY_STREAK_REWARDS = [
  1_000,   // Day 1
  2_500,   // Day 2
  5_000,   // Day 3
  10_000,  // Day 4
  15_000,  // Day 5
  25_000,  // Day 6
  50_000   // Day 7 (+ Exclusive Skin)
];

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
    minHold: 50_000,
    bonusTap: 1,
    color: '#cbd5e1',
    glow: 'rgba(203, 213, 225, 0.42)'
  },
  {
    id: 'gold',
    name: 'Gold',
    trophyImg: '/hold/trophies/gold.png',
    minHold: 250_000,
    bonusTap: 2,
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.48)'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    trophyImg: '/hold/trophies/platinum.png',
    minHold: 1_000_000,
    bonusTap: 3,
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.46)'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    trophyImg: '/hold/trophies/diamond.png',
    minHold: 5_000_000,
    bonusTap: 5,
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
    id: 'cookie',
    name: 'Cookie',
    subtitle: '50,000 HOLD',
    img: '/hold/skins/skin-1.webp',
    priceHold: 50_000,
    theme: {
      accent: '#fbbf24',
      secondary: '#d97706',
      glow1: 'rgba(251, 191, 36, 0.50)',
      glow2: 'rgba(217, 119, 6, 0.28)',
      bgBottom: '#291503'
    }
  },
  {
    id: 'chrome',
    name: 'Du Rove Chrome',
    subtitle: '100,000 HOLD',
    img: '/hold/skins/skin-2.png',
    priceHold: 100_000,
    theme: {
      accent: '#e2e8f0',
      secondary: '#64748b',
      glow1: 'rgba(226, 232, 240, 0.45)',
      glow2: 'rgba(100, 116, 139, 0.25)',
      bgBottom: '#0f172a'
    }
  },
  {
    id: 'pizza',
    name: 'Pizza',
    subtitle: '150,000 HOLD',
    img: '/hold/skins/skin-5.png',
    priceHold: 150_000,
    theme: {
      accent: '#fb923c',
      secondary: '#ea580c',
      glow1: 'rgba(251, 146, 60, 0.52)',
      glow2: 'rgba(234, 88, 12, 0.28)',
      bgBottom: '#2b0f04'
    }
  },
  {
    id: 'paxta_neon',
    name: 'Paxta Blossom',
    subtitle: '300,000 HOLD',
    img: '/hold/skins/skin-3.png',
    priceHold: 300_000,
    theme: {
      accent: '#c084fc',
      secondary: '#7c3aed',
      glow1: 'rgba(192, 132, 252, 0.54)',
      glow2: 'rgba(124, 58, 237, 0.30)',
      bgBottom: '#1e0938'
    }
  },
  {
    id: 'cyber_lonely',
    name: 'You look lonely',
    subtitle: '500,000 HOLD',
    img: '/hold/skins/skin-6.png',
    priceHold: 500_000,
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
  WAKEUP:   { reward: 25_000, title: 'WAKEUP kodi ochildi', skin: 'cyber_lonely' },
  PAXTA:    { reward: 30_000, title: 'PAXTA kodi ochildi',  skin: 'paxta_neon' },
  MEDAL:    { reward: 35_000, title: 'MEDAL kodi ochildi' },
  OBSIDIAN: { reward: 50_000, title: 'OBSIDIAN kodi ochildi', skin: 'chrome' },
  MOON:     { reward: 40_000, title: 'MOON kodi ochildi' }
};

export const DEFAULT_HOLD_QUESTS = [
  // Onboarding
  { id: 'join_squad',        cat: 'onboarding', title: 'Join Squad',                reward: 10_000, type: 'check_squad',  icon: '🛡️', link: '' },
  { id: 'earn_1000_hold',    cat: 'onboarding', title: 'Earn 1,000 HOLD',           reward: 5_000,  type: 'check_1k',     icon: '🐣', link: '' },
  { id: 'invite_10_frens',   cat: 'onboarding', title: 'Invite 10 frens',           reward: 50_000, type: 'check_ref_10', icon: '🧸', link: '' },
  // Specials
  { id: 'join_insider_ch',   cat: 'specials',   title: 'Insider Official Channel',  reward: 15_000, type: 'link',         icon: '📢', link: '@insider' },
  { id: 'join_medal_ch',     cat: 'specials',   title: 'Welcome to MEDAL NFT',      reward: 20_000, type: 'link',         icon: '🖼️', link: '@MEDAL' },
  { id: 'join_kalendar_ch',  cat: 'specials',   title: 'Desk Calendar Collectors',  reward: 20_000, type: 'link',         icon: '📅', link: '@Kalendar' },
  { id: 'solve_first_morse', cat: 'specials',   title: 'Secret Morse Master',       reward: 25_000, type: 'check_morse',  icon: '📡', link: '' },
  // Web3 world
  { id: 'reach_silver',      cat: 'web3',       title: 'Silver League Holder',      reward: 30_000, type: 'check_silver', icon: '🥈', link: '', minLeague: 'silver' },
  { id: 'reach_gold',        cat: 'web3',       title: 'Gold League Whale',         reward: 75_000, type: 'check_gold',   icon: '🏆', link: '', minLeague: 'gold' },
  { id: 'upgrade_Verify',    cat: 'web3',       title: 'Paxta Gift Upgrade',        reward: 15_000, type: 'link',         icon: '⭐', link: '@UpgradeBot' }
];

// Strict 1,000 Stars = 1,000,000 HOLD economy (1 Star = 1,000 HOLD)
export const STARS_VIP_PACKS = [
  {
    id: 'starter_hold',
    name: '100,000 HOLD + Tap Boost',
    desc: '+100,000 HOLD · Multitap +1',
    starsPrice: 100,
    holdGrant: 100_000,
    tapBoost: 1,
    enableAutoBot: false
  },
  {
    id: 'god_mode',
    name: '250,000 HOLD + Tap Boost',
    desc: '+250,000 HOLD · Multitap +2',
    starsPrice: 250,
    holdGrant: 250_000,
    tapBoost: 2,
    enableAutoBot: false
  },
  {
    id: 'whale_pack',
    name: '500,000 HOLD + Auto-Bot',
    desc: '+500,000 HOLD · Multitap +3 · 24/7 Auto-Bot',
    starsPrice: 500,
    holdGrant: 500_000,
    tapBoost: 3,
    enableAutoBot: true
  },
  {
    id: 'obsidian_pack',
    name: '1,000,000 HOLD · Gold Pack',
    desc: '+1,000,000 HOLD · Multitap +5 · 24/7 Auto-Bot',
    starsPrice: 1000,
    holdGrant: 1_000_000,
    tapBoost: 5,
    enableAutoBot: true
  }
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

export function getLeagueForHold(lifetimeHold) {
  let current = HOLD_LEAGUES[0];
  for (const lg of HOLD_LEAGUES) {
    if (lifetimeHold >= lg.minHold) current = lg;
  }
  return current;
}

function isSyntheticUsername(uname) {
  const s = String(uname || '').trim().toLowerCase();
  return !s || s === 'holder' || s === 'user' || /^holder_\d+$/.test(s) || /^guest_\d+$/.test(s);
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
    paxtaBotCall,
    moonClient
  } = deps;

  function creditHold(u, st, amount) {
    const val = Math.max(0, Math.floor(Number(amount) || 0));
    if (val <= 0) return;
    u.holdBalance = (u.holdBalance || 0) + val;
    u.lifetimeHold = (u.lifetimeHold || 0) + val;
    const today = todayStr();
    if (!u.dailyHold || typeof u.dailyHold !== 'object') u.dailyHold = {};
    u.dailyHold[today] = (u.dailyHold[today] || 0) + val;
    if (u.squadId && st?.squads?.[u.squadId]) {
      st.squads[u.squadId].totalHold = (st.squads[u.squadId].totalHold || 0) + val;
    }
  }

  function resetSingleUserObject(u) {
    u.holdBalance = 0;
    u.lifetimeHold = 0;
    u.dailyHold = {};
    u.ogBonusClaimed = false;
    u.ogDetails = null;
    u.energy = 1500;
    u.maxEnergy = 1500;
    u.lastEnergyAt = Date.now();
    u.tapLevel = 1;
    u.energyLevel = 1;
    u.rechargingSpeedLevel = 1;
    u.autoBotEnabled = false;
    u.fullTankCount = 3;
    u.rocketCount = 3;
    u.lastBoostResetDay = todayStr();
    u.lastAutoBotClaimAt = Date.now();
    u.morseSolvedDays = [];
    u.lastSolvedMorseWord = '';
    u.secretCodesClaimed = [];
    u.referrals = [];
    u.referredBy = null;
    u.squadId = null;
    u.tasksCompleted = [];
    u.questStartedAt = {};
    u.claimedNfts = [];
    u.ownedSkins = ['basic'];
    u.skin = 'basic';
    u.streakCount = 0;
    u.lastStreakDate = '';
    u.luckyTickets = 0;
    u.compassSolvedDays = [];
    u.turboActiveUntil = 0;
  }

  function getDefaultSquads() {
    return {
      insider:  { id: 'insider',  handle: 'insider',  name: 'Insider Official',   members: 0, totalHold: 0, verified: true, link: 'https://paxta.online/insider' },
      medal:    { id: 'medal',    handle: 'MEDAL',    name: 'MEDAL Collectors',   members: 0, totalHold: 0, verified: true, link: 'https://paxta.online/MEDAL' },
      kalendar: { id: 'kalendar', handle: 'Kalendar', name: 'Kalendar Whales',    members: 0, totalHold: 0, verified: true, link: 'https://paxta.online/Kalendar' },
      hold_vip: { id: 'hold_vip', handle: 'HOLDbot',  name: 'Hold Verified Club', members: 0, totalHold: 0, verified: true, link: 'https://paxta.online/HOLDbot' }
    };
  }

  function loadHoldState() {
    const st = loadJSON(holdStateFile, null);
    if (st && st.users && st.config && st.squads) {
      if (!st.soldMedals) st.soldMedals = {};
      if (!Array.isArray(st.nftClaims)) st.nftClaims = [];
      if (!st.payments) st.payments = { invoices: {}, charges: {}, lastUpdateId: 0 };
      if (!st.config.secretCodes) st.config.secretCodes = { ...DEFAULT_SECRET_CODES };
      if (!Array.isArray(st.config.customQuests)) st.config.customQuests = [...DEFAULT_HOLD_QUESTS];

      // Full V3 Clean Reset requested by Admin: remove all fake holder_XXX accounts & reset all balances to Onboarding!
      if (!st.config.economyV3CleanReset) {
        st.config.economyV3CleanReset = true;
        st.config.dailyMorse = {
          word: st.config.dailyMorse?.word || 'HOLD',
          reward: 25_000,
          hint: 'Loyihamizning asosiy 4 harfli nomi (H-O-L-D)'
        };
        st.config.secretCodes = { ...DEFAULT_SECRET_CODES };
        st.config.customQuests = [...DEFAULT_HOLD_QUESTS];
        st.config.happyHourForced = false;
        st.config.happyHourUntil = 0;
        st.config.squadWarPrize = 25_000;
        st.config.lastLuckyWinner = null;

        // Purge all synthetic holder_XXX / guest_XXX users and reset any real users to start from Onboarding
        for (const [k, usr] of Object.entries(st.users)) {
          if (isSyntheticUsername(k) || isSyntheticUsername(usr?.username)) {
            delete st.users[k];
          } else {
            resetSingleUserObject(usr);
          }
        }
        st.squads = getDefaultSquads();
        saveJSON(holdStateFile, st);
      }
      return st;
    }

    const initial = {
      users: {},
      config: {
        economyV2Migrated: true,
        economyV3CleanReset: true,
        dailyMorse: {
          word: 'HOLD',
          reward: 25_000,
          hint: 'Loyihamizning asosiy 4 harfli nomi (H-O-L-D)'
        },
        secretCodes: { ...DEFAULT_SECRET_CODES },
        customQuests: [...DEFAULT_HOLD_QUESTS],
        happyHourForced: false,
        happyHourUntil: 0,
        squadWarPrize: 25_000,
        lastLuckyWinner: null
      },
      squads: getDefaultSquads(),
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

  // Check if 2x Happy Hour is active (Daily 20:00 - 21:00 Tashkent UTC+5 OR forced by Admin)
  function getHappyHourStatus(st) {
    const now = Date.now();
    if (st?.config?.happyHourForced || (st?.config?.happyHourUntil && now < st.config.happyHourUntil)) {
      return {
        active: true,
        multiplier: 2,
        scheduleText: '2x Tap Happy Hour faol!'
      };
    }
    const tashkentHour = new Date(now + 5 * 3600 * 1000).getUTCHours();
    const isScheduledHour = tashkentHour === 20;
    return {
      active: isScheduledHour,
      multiplier: isScheduledHour ? 2 : 1,
      scheduleText: isScheduledHour ? '2x Tap Happy Hour (20:00–21:00) faol!' : 'Har kuni 20:00–21:00 da 2x Tap'
    };
  }

  // Verify a real PaxtaGram user or channel on paxta.online
  async function verifyOnPaxtaGram(handleRaw) {
    const clean = String(handleRaw || '').replace(/^@/, '').replace(/^https?:\/\/(www\.)?paxta\.online\//i, '').trim();
    if (!clean || isSyntheticUsername(clean)) return null;

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
          id: Number(u.id),
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

  function getOrCreateHoldUser(usernameRaw, displayNameRaw, paxtaId = null, refCode = null, avatarUrl = null) {
    const st = loadHoldState();
    const key = cleanKey(usernameRaw);
    const mainUsers = loadJSON(usersFile, {});

    if (!mainUsers[key]) {
      mainUsers[key] = {
        username: key,
        displayName: cleanName(displayNameRaw || usernameRaw),
        paxtaId: paxtaId || null,
        avatarUrl: avatarUrl || null,
        stars: 0,
        createdAt: new Date().toISOString()
      };
      saveJSON(usersFile, mainUsers);
    } else {
      let changed = false;
      if (paxtaId && !mainUsers[key].paxtaId) {
        mainUsers[key].paxtaId = paxtaId;
        changed = true;
      }
      if (avatarUrl && !mainUsers[key].avatarUrl) {
        mainUsers[key].avatarUrl = avatarUrl;
        changed = true;
      }
      if (changed) saveJSON(usersFile, mainUsers);
    }

    const resolvedPaxtaId = paxtaId || mainUsers[key]?.paxtaId || null;
    const resolvedAvatar = avatarUrl || mainUsers[key]?.avatarUrl || null;

    if (!st.users[key]) {
      st.users[key] = {
        username: key,
        displayName: cleanName(displayNameRaw || mainUsers[key]?.displayName || key),
        paxtaId: resolvedPaxtaId,
        avatarUrl: resolvedAvatar,
        paxtaVerified: !!resolvedPaxtaId,
        holdBalance: 0,
        lifetimeHold: 0,
        dailyHold: {},
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
        questStartedAt: {},
        claimedNfts: [],
        ownedSkins: ['basic'],
        skin: 'basic',
        streakCount: 0,
        lastStreakDate: '',
        luckyTickets: 0,
        createdAt: new Date().toISOString()
      };

      // Handle Referral attribution (+10,000 HOLD to inviter, +5,000 HOLD to friend)
      if (refCode) {
        const refKey = cleanKey(String(refCode).replace(/^ref_/i, '').replace(/^@/, ''));
        if (refKey && refKey !== key && st.users[refKey]) {
          st.users[key].referredBy = refKey;
          creditHold(st.users[key], st, 5_000);
          if (!st.users[refKey].referrals.includes(key)) {
            st.users[refKey].referrals.push(key);
            creditHold(st.users[refKey], st, 10_000);
          }
        }
      }
      saveHoldState(st);
    } else {
      if (resolvedPaxtaId && !st.users[key].paxtaId) {
        st.users[key].paxtaId = resolvedPaxtaId;
        st.users[key].paxtaVerified = true;
      }
      if (resolvedAvatar && !st.users[key].avatarUrl) {
        st.users[key].avatarUrl = resolvedAvatar;
      }
      if (displayNameRaw && st.users[key].displayName === st.users[key].username) {
        st.users[key].displayName = cleanName(displayNameRaw);
      }
      // If user hasn't been referred yet and refCode is provided
      if (refCode && !st.users[key].referredBy) {
        const refKey = cleanKey(String(refCode).replace(/^ref_/i, '').replace(/^@/, ''));
        if (refKey && refKey !== key && st.users[refKey] && !st.users[refKey].referrals.includes(key)) {
          st.users[key].referredBy = refKey;
          creditHold(st.users[key], st, 5_000);
          st.users[refKey].referrals.push(key);
          creditHold(st.users[refKey], st, 10_000);
        }
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
      const cappedHours = Math.min(8, botElapsedMs / (3600 * 1000));
      const hourlyRate = ((u.tapLevel || 1) * 350);
      passiveEarned = Math.floor(hourlyRate * cappedHours);
      if (passiveEarned > 0) {
        creditHold(u, st, passiveEarned);
      }
      u.lastAutoBotClaimAt = now;
    } else if (botElapsedMs >= 30_000) {
      u.lastAutoBotClaimAt = now;
    }

    return { st, u, mainUser: mainUsers[key], passiveEarned };
  }

  function formatHoldUserResponse(st, u, mainUser, passiveEarned = 0) {
    const today = todayStr();
    const yesterday = yesterdayStr();
    const league = getLeagueForHold(u.lifetimeHold || 0);
    const happyHour = getHappyHourStatus(st);
    const baseTapPower = (u.tapLevel || 1) + (league.bonusTap || 0);
    const tapPower = baseTapPower * (happyHour.active ? happyHour.multiplier : 1);

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

    // Streak calculation
    const streakClaimedToday = u.lastStreakDate === today;
    const streakAlive = u.lastStreakDate === today || u.lastStreakDate === yesterday;
    const currentStreakDay = streakClaimedToday
      ? (u.streakCount || 1)
      : streakAlive
        ? ((u.streakCount || 0) % 7) + 1
        : 1;

    // Total lucky tickets in pool
    const totalLuckyTickets = Object.values(st.users || {}).reduce((acc, usr) => acc + (usr.luckyTickets || 0), 0);

    return {
      username: u.username,
      displayName: u.displayName || u.username,
      avatarUrl: u.avatarUrl || mainUser?.avatarUrl || null,
      paxtaId: u.paxtaId,
      paxtaVerified: !!u.paxtaVerified,
      rank,
      topPct,
      yearsEquivalent,
      isAdmin: Number(u.paxtaId) === ADMIN_PAXTA_ID || u.username === 'moon' || u.username === 'shade' || u.username === 'muhammadiso',
      stars: mainUser?.stars || 0,
      holdBalance: Math.floor(u.holdBalance || 0),
      lifetimeHold: Math.floor(u.lifetimeHold || 0),
      dailyHoldToday: Math.floor(u.dailyHold?.[today] || 0),
      passiveEarnedJustNow: passiveEarned,
      tapPower,
      baseTapPower,
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
      autoBotCost: 50_000,
      fullTankCount: u.fullTankCount ?? 3,
      rocketCount: u.rocketCount ?? 3,
      ogBonusClaimed: !!u.ogBonusClaimed,
      ogDetails: u.ogDetails,
      league,
      allLeagues: HOLD_LEAGUES,
      skin: activeSkinId,
      ownedSkins: u.ownedSkins,
      allSkins: HOLD_SKINS,
      happyHour,
      streak: {
        claimedToday: streakClaimedToday,
        currentDay: currentStreakDay,
        streakCount: streakAlive ? (u.streakCount || 0) : 0,
        rewards: DAILY_STREAK_REWARDS,
        todayReward: DAILY_STREAK_REWARDS[currentStreakDay - 1] || 1_000
      },
      luckyDraw: {
        myTickets: u.luckyTickets || 0,
        totalPoolTickets: totalLuckyTickets,
        prizeTitle: 'Victory Medal NFT + 100,000 HOLD',
        lastWinner: st.config?.lastLuckyWinner || null
      },
      squadWarPrize: st.config?.squadWarPrize || 25_000,
      morse: {
        wordLength: morseWord.length,
        word: morseWord,
        secretWords: Object.keys(st.config?.secretCodes || DEFAULT_SECRET_CODES),
        secretCodesMap: st.config?.secretCodes || DEFAULT_SECRET_CODES,
        hint: st.config?.dailyMorse?.hint || 'Maxfiy soʻzni Morze alifbosida tering',
        reward: st.config?.dailyMorse?.reward || 25_000,
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
      questStartedAt: u.questStartedAt || {},
      quests: st.config?.customQuests || DEFAULT_HOLD_QUESTS,
      vipPacks: STARS_VIP_PACKS,
      claimedNfts: u.claimedNfts || [],
      secretCodesClaimed: u.secretCodesClaimed || [],
      compassSolvedToday: (u.compassSolvedDays || []).includes(todayStr()),
      turboActiveUntil: u.turboActiveUntil || 0
    };
  }

  // ---- Serve /hold WebApp Page ----
  app.get(['/hold', '/hold/'], (req, res) => {
    res.sendFile(path.join(publicDir, 'hold', 'index.html'));
  });

  // ---- 1. Login / Sync User State (Strict Official PaxtaGram User Resolution) ----
  app.post('/api/hold/sync', async (req, res) => {
    let resolvedUsername = req.body?.username;
    let resolvedDisplayName = req.body?.displayName;
    let resolvedPaxtaId = req.body?.paxtaId ? Number(req.body.paxtaId) : null;
    let resolvedAvatar = null;
    const refCode = req.body?.ref || null;

    if (isSyntheticUsername(resolvedUsername)) {
      resolvedUsername = null;
    }

    // 1. Check cryptographic session token (from /hold or main Paxta Gifts app)
    const authToken = req.headers['x-auth-token'] || req.body?.authToken;
    const session = verifySessionToken(authToken);
    if (session && !isSyntheticUsername(session.username)) {
      resolvedUsername = session.username;
      if (session.paxtaId) resolvedPaxtaId = Number(session.paxtaId);
    }

    // 2. Check PaxtaGram WebApp initData (#tgWebAppData or window.Telegram.WebApp.initData)
    const initData = req.headers['x-init-data'] || req.body?.initData;
    const webAppUser = verifyWebAppInitData(initData);
    if (webAppUser) {
      resolvedUsername = webAppUser.username || webAppUser.first_name || `paxta_${webAppUser.id}`;
      resolvedDisplayName = [webAppUser.first_name, webAppUser.last_name].filter(Boolean).join(' ') || resolvedUsername;
      resolvedPaxtaId = Number(webAppUser.id);
      if (webAppUser.photo_url) resolvedAvatar = webAppUser.photo_url;
    }

    // 3. If still no username, do NOT invent holder_XXX! Ask client for their real PaxtaGram @username
    if (!resolvedUsername) {
      return res.json({
        ok: true,
        needsPaxtaLogin: true
      });
    }

    // 4. Resolve official profile on PaxtaGram if paxtaId or avatar is missing
    const mainUsers = loadJSON(usersFile, {});
    const existingMain = mainUsers[cleanKey(resolvedUsername)];
    if (existingMain?.paxtaId && !resolvedPaxtaId) {
      resolvedPaxtaId = Number(existingMain.paxtaId);
    }
    if (existingMain?.avatarUrl && !resolvedAvatar) {
      resolvedAvatar = existingMain.avatarUrl;
    }

    if (!resolvedPaxtaId) {
      try {
        const pUser = await moonClient.resolveUserByUsername(resolvedUsername);
        if (pUser && pUser.id) {
          resolvedPaxtaId = Number(pUser.id);
          resolvedUsername = pUser.username || resolvedUsername;
          resolvedDisplayName = pUser.name || pUser.first_name || resolvedDisplayName;
          resolvedAvatar = pUser.avatar_url || resolvedAvatar;
        }
      } catch {}
    }

    const { st, u, mainUser, passiveEarned } = getOrCreateHoldUser(
      resolvedUsername,
      resolvedDisplayName,
      resolvedPaxtaId,
      refCode,
      resolvedAvatar
    );
    saveHoldState(st);

    const newSessionToken = createSessionToken(u.username, u.paxtaId || '');
    res.json({
      ok: true,
      authToken: newSessionToken,
      user: formatHoldUserResponse(st, u, mainUser, passiveEarned)
    });
  });

  // ---- 1B. Verify & Login Official PaxtaGram @username ----
  app.post('/api/hold/login-paxta', async (req, res) => {
    const rawUsername = String(req.body?.username || '').replace(/^@/, '').trim();
    const refCode = req.body?.ref || null;
    if (!rawUsername || isSyntheticUsername(rawUsername)) {
      return res.status(400).json({ ok: false, error: 'Rasmiy PaxtaGram @username kiriting' });
    }

    let resolvedPaxtaId = null;
    let resolvedUsername = rawUsername;
    let resolvedDisplayName = rawUsername;
    let resolvedAvatar = null;

    // Verify on PaxtaGram
    try {
      const pUser = await moonClient.resolveUserByUsername(rawUsername);
      if (pUser && pUser.id) {
        resolvedPaxtaId = Number(pUser.id);
        resolvedUsername = pUser.username || rawUsername;
        resolvedDisplayName = pUser.name || pUser.first_name || resolvedUsername;
        resolvedAvatar = pUser.avatar_url || null;
      } else {
        const v = await verifyOnPaxtaGram(rawUsername);
        if (v) {
          resolvedPaxtaId = v.id ? Number(v.id) : null;
          resolvedUsername = v.username || rawUsername;
          resolvedDisplayName = v.title || resolvedUsername;
          resolvedAvatar = v.avatar || null;
        } else {
          return res.status(404).json({ ok: false, error: `PaxtaGram tarmogʻida @${rawUsername} profili topilmadi!` });
        }
      }
    } catch {}

    const { st, u, mainUser, passiveEarned } = getOrCreateHoldUser(
      resolvedUsername,
      resolvedDisplayName,
      resolvedPaxtaId,
      refCode,
      resolvedAvatar
    );
    saveHoldState(st);

    const newSessionToken = createSessionToken(u.username, u.paxtaId || '');
    res.json({
      ok: true,
      authToken: newSessionToken,
      user: formatHoldUserResponse(st, u, mainUser, passiveEarned)
    });
  });

  // ---- 1C. Claim Referral by Friend's @username Inside App (Zero External Redirect!) ----
  app.post('/api/hold/claim-ref', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    if (u.referredBy) {
      return res.status(400).json({ ok: false, error: `Siz allaqachon @${u.referredBy} tomonidan taklif qilingansiz` });
    }
    const friendKey = cleanKey(String(req.body?.friendUsername || '').replace(/^ref_/i, '').replace(/^@/, ''));
    if (!friendKey || friendKey === u.username) {
      return res.status(400).json({ ok: false, error: 'Doʻstingizning @username manzilini kiriting' });
    }
    const friendUser = st.users[friendKey];
    if (!friendUser) {
      return res.status(404).json({ ok: false, error: `@${friendKey} hali HOLD oʻyiniga kirmagan` });
    }

    u.referredBy = friendKey;
    creditHold(u, st, 5_000);
    if (!friendUser.referrals.includes(u.username)) {
      friendUser.referrals.push(u.username);
      creditHold(friendUser, st, 10_000);
    }
    saveHoldState(st);

    res.json({
      ok: true,
      message: `🎉 @${friendKey} kodi qabul qilindi · +5,000 HOLD!`,
      user: formatHoldUserResponse(st, u, mainUser)
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
    let idBonus = 3_000;
    if (pid <= 150) {
      tierName = 'Legendary Pioneer';
      idBonus = 12_000;
    } else if (pid <= 600) {
      tierName = 'Early Pioneer';
      idBonus = 7_500;
    } else if (pid <= 1400) {
      tierName = 'Veteran Holder';
      idBonus = 5_000;
    }

    const activityBonus = 2_500;
    const totalBonus = idBonus + activityBonus;

    u.ogBonusClaimed = true;
    u.ogDetails = {
      paxtaId: pid,
      tierName,
      idBonus,
      activityBonus,
      totalBonus
    };
    creditHold(u, st, totalBonus);
    saveHoldState(st);

    res.json({
      ok: true,
      ogDetails: u.ogDetails,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 2B. Claim 7-Day Daily Streak Bonus ----
  app.post('/api/hold/claim-streak', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const today = todayStr();
    const yesterday = yesterdayStr();

    if (u.lastStreakDate === today) {
      return res.status(400).json({ ok: false, error: 'Bugungi Streak mukofoti allaqachon olingan!' });
    }

    if (u.lastStreakDate === yesterday) {
      u.streakCount = ((u.streakCount || 0) % 7) + 1;
    } else {
      u.streakCount = 1;
    }
    u.lastStreakDate = today;

    const reward = DAILY_STREAK_REWARDS[u.streakCount - 1] || 1_000;
    creditHold(u, st, reward);

    let bonusMsg = `🔥 Kun ${u.streakCount}/7 · +${reward.toLocaleString()} HOLD!`;
    if (u.streakCount === 7) {
      if (!Array.isArray(u.ownedSkins)) u.ownedSkins = ['basic'];
      if (!u.ownedSkins.includes('cookie')) {
        u.ownedSkins.push('cookie');
        bonusMsg = `🔥 7-Kunlik Streak! +${reward.toLocaleString()} HOLD + Cookie Skin ochildi!`;
      }
    }

    saveHoldState(st);
    res.json({
      ok: true,
      streakDay: u.streakCount,
      reward,
      message: bonusMsg,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 3. Batch Tap + Turbo + Happy Hour Sync ----
  app.post('/api/hold/tap', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const taps = Math.max(1, Math.min(100, parseInt(req.body?.taps, 10) || 1));
    // Verify Turbo on the server - prevent client spoofing!
    const isTurbo = Date.now() < (u.turboActiveUntil || 0);

    const league = getLeagueForHold(u.lifetimeHold || 0);
    const happyHour = getHappyHourStatus(st);
    const baseTap = (u.tapLevel || 1) + (league.bonusTap || 0);
    const hhMult = happyHour.active ? happyHour.multiplier : 1;
    const perTap = (isTurbo ? baseTap * 7 : baseTap) * hhMult;

    let actualTaps = 0;
    if (isTurbo) {
      actualTaps = taps;
    } else {
      const maxPossible = Math.floor((u.energy || 0) / Math.max(1, baseTap));
      actualTaps = Math.max(0, Math.min(taps, maxPossible));
      if (actualTaps > 0) {
        u.energy = Math.max(0, (u.energy || 0) - actualTaps * baseTap);
      }
    }

    const earned = actualTaps * perTap;
    if (earned > 0) {
      creditHold(u, st, earned);
    }
    u.lastEnergyAt = Date.now();

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
      u.turboActiveUntil = Date.now() + 10_000;
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
      const cost = 50_000;
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

  // ---- 6. Solve Daily Morse Cipher (+1 Lucky Ticket) & Secret Mystery Codes ----
  app.post('/api/hold/solve-morse', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const wordInput = String(req.body?.word || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!wordInput) {
      return res.status(400).json({ ok: false, error: 'Empty code' });
    }

    const today = todayStr();
    const dailyWord = (st.config?.dailyMorse?.word || 'HOLD').toUpperCase();
    const dailyReward = st.config?.dailyMorse?.reward || 25_000;
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
      u.luckyTickets = (u.luckyTickets || 0) + 1;
      creditHold(u, st, dailyReward);
      saveHoldState(st);
      return res.json({
        ok: true,
        type: 'daily_morse',
        word: dailyWord,
        reward: dailyReward,
        message: `✨ "${dailyWord}" · +${dailyReward.toLocaleString()} HOLD + 🎟️ 1 Lucky Ticket!`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    // 2. Check Secret Bonus Mystery Words
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
      creditHold(u, st, secret.reward);
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
          members: 0,
          totalHold: 0,
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
      if (u.squadId && st.squads[u.squadId]) {
        st.squads[u.squadId].members = Math.max(0, (st.squads[u.squadId].members || 1) - 1);
      }
      u.squadId = squadId;
      st.squads[squadId].members = (st.squads[squadId].members || 0) + 1;
      st.squads[squadId].totalHold = (st.squads[squadId].totalHold || 0) + Math.floor(u.lifetimeHold || 0);
      saveHoldState(st);
    }
    res.json({
      ok: true,
      message: `🛡️ ${st.squads[squadId].name} jamoasiga qoʻshildingiz!`,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 8A. Start Quest Verification Step (Records Timestamp on Server) ----
  app.post('/api/hold/start-quest', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const questId = req.body?.questId;
    if (!questId) return res.status(400).json({ ok: false, error: 'Invalid quest' });
    if (!u.questStartedAt || typeof u.questStartedAt !== 'object') u.questStartedAt = {};
    if (!u.questStartedAt[questId]) {
      u.questStartedAt[questId] = Date.now();
      saveHoldState(st);
    }
    res.json({
      ok: true,
      startedAt: u.questStartedAt[questId],
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 8B. Verify & Claim Quest (100% Real Server-Side Verification) ----
  app.post('/api/hold/claim-quest', async (req, res) => {
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
    if (quest.type === 'check_silver' && (u.lifetimeHold || 0) < 50_000) {
      return res.status(400).json({ ok: false, error: 'Avval Silver ligaga (50K HOLD) chiqing' });
    }
    if (quest.type === 'check_gold' && (u.lifetimeHold || 0) < 250_000) {
      return res.status(400).json({ ok: false, error: 'Avval Gold ligaga (250K HOLD) chiqing' });
    }

    // Min League Requirement Check
    if (quest.minLeague) {
      const reqLg = HOLD_LEAGUES.find(l => l.id === quest.minLeague);
      if (reqLg && (u.lifetimeHold || 0) < reqLg.minHold) {
        return res.status(400).json({
          ok: false,
          error: `Avval ${reqLg.name} ligasiga (${reqLg.minHold.toLocaleString()} HOLD) chiqing`
        });
      }
    }

    // Strict verification for channel/link tasks
    if (quest.type === 'link' || quest.link) {
      const startedAt = u.questStartedAt?.[questId] || 0;
      if (!startedAt) {
        return res.status(400).json({ ok: false, error: 'Avval vazifa oynasidan kanalga oʻting!' });
      }
      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs < 4000) {
        return res.status(400).json({ ok: false, error: 'Kanalga obuna boʻlish tekshirilmoqda... 3 soniyadan soʻng qayta bosing!' });
      }

      const cleanHandle = String(quest.link || '').replace(/^@/, '').replace(/^https?:\/\/(www\.)?paxta\.online\//i, '').trim();
      if (cleanHandle && u.paxtaId && !/bot$/i.test(cleanHandle)) {
        let isSubscribed = false;
        let checkedAny = false;
        for (const botFn of [holdBotCall, paxtaBotCall].filter(Boolean)) {
          try {
            const chatMem = await botFn('getChatMember', { chat_id: `@${cleanHandle}`, user_id: Number(u.paxtaId) });
            if (chatMem && chatMem.ok && chatMem.result) {
              checkedAny = true;
              const stMem = chatMem.result.status;
              if (['creator', 'administrator', 'member', 'restricted'].includes(stMem)) {
                isSubscribed = true;
                break;
              } else if (stMem === 'left' || stMem === 'kicked') {
                return res.status(400).json({ ok: false, error: `Siz hali @${cleanHandle} kanaliga obuna boʻlmagansiz!` });
              }
            }
          } catch {}
        }
        if (checkedAny && !isSubscribed) {
          return res.status(400).json({ ok: false, error: `Siz hali @${cleanHandle} kanaliga obuna boʻlmagansiz!` });
        }
      }
    }

    u.tasksCompleted.push(questId);
    creditHold(u, st, quest.reward);
    saveHoldState(st);

    res.json({
      ok: true,
      reward: quest.reward,
      message: `✅ Vazifa tasdiqlandi · +${quest.reward.toLocaleString()} HOLD!`,
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

    creditHold(u, st, pack.holdGrant);
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
      500_000, 350_000, 250_000, 175_000, 125_000,
      100_000, 75_000, 50_000, 35_000, 25_000
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
    const today = todayStr();
    const allUsers = Object.values(st.users || {}).filter(u => !isSyntheticUsername(u.username));

    const sortedUsers = [...allUsers]
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
          avatarUrl: u.avatarUrl || null,
          paxtaId: u.paxtaId || null,
          lifetimeHold: Math.floor(u.lifetimeHold || 0),
          dailyHold: Math.floor(u.dailyHold?.[today] || 0),
          holdBalance: Math.floor(u.holdBalance || 0),
          league: getLeagueForHold(u.lifetimeHold || 0),
          referralsCount: (u.referrals || []).length,
          prize
        };
      });

    const sortedDayUsers = [...allUsers]
      .sort((a, b) => (b.dailyHold?.[today] || 0) - (a.dailyHold?.[today] || 0));

    const leaderboardDay = sortedDayUsers
      .slice(0, 100)
      .map((u, idx) => {
        const rank = idx + 1;
        const prize = rank <= 10 ? top10Prizes[rank - 1] : null;
        const dayVal = Math.floor(u.dailyHold?.[today] || 0);
        return {
          rank,
          username: u.username,
          displayName: u.displayName || u.username,
          avatarUrl: u.avatarUrl || null,
          paxtaId: u.paxtaId || null,
          lifetimeHold: Math.floor(u.lifetimeHold || 0),
          dailyHold: dayVal,
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
      leaderboard,
      leaderboardDay
    });
  });

  // ---- 12. Create Stars Invoice via @HOLDbot (In-App Slug + Polling) ----
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

    const invoiceLink = apiRes.result;
    const slugMatch = invoiceLink.match(/\/invoice\/([A-Za-z0-9_-]+)/);
    const slug = slugMatch ? slugMatch[1] : '';

    st.payments.invoices[invoiceId] = {
      invoiceId,
      slug,
      username: u.username,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    saveHoldState(st);

    res.json({
      ok: true,
      invoiceId,
      slug,
      invoiceUrl: invoiceLink,
      amount
    });
  });

  app.get('/api/hold/invoice-status/:invoiceId', (req, res) => {
    const st = loadHoldState();
    const inv = st.payments?.invoices?.[req.params.invoiceId];
    if (!inv) return res.json({ ok: false, status: 'not_found' });
    const users = loadJSON(usersFile, {});
    const stars = users[inv.username]?.stars || 0;
    res.json({
      ok: true,
      status: inv.status,
      amount: inv.amount,
      stars
    });
  });

  // ---- 13. Full-Screen Admin Panel APIs (Strict Cryptographic Verification) ----
  function checkAdminAccess(req, u) {
    if (isRequestAdmin(req)) return true;

    // Check signed session token
    const token = req.headers['x-auth-token'] || req.body?.authToken || req.query?.authToken;
    const session = verifySessionToken(token);
    if (session) {
      if (Number(session.paxtaId) === ADMIN_PAXTA_ID) return true;
      if (['moon', 'shade', 'muhammadiso'].includes(session.username?.toLowerCase())) return true;
    }

    // Check WebApp initData HMAC
    const initUser = verifyWebAppInitData(req.headers['x-init-data'] || req.body?.initData);
    if (initUser) {
      if (Number(initUser.id) === ADMIN_PAXTA_ID) return true;
      if (['moon', 'shade', 'muhammadiso'].includes(initUser.username?.toLowerCase())) return true;
    }

    // Development / loopback fallback
    const ip = req.ip || req.connection?.remoteAddress || '';
    if (ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1')) {
      if (Number(u?.paxtaId) === ADMIN_PAXTA_ID || ['moon', 'shade', 'muhammadiso'].includes(u?.username?.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  app.get('/api/hold/admin-users', (req, res) => {
    const st = loadHoldState();
    const uname = cleanKey(req.query?.username || '');
    const u = st.users[uname];
    if (!checkAdminAccess(req, u)) {
      return res.status(403).json({ ok: false, error: 'Faqat Admin uchun!' });
    }
    const mainUsers = loadJSON(usersFile, {});
    const list = Object.values(st.users || {})
      .filter(usr => !isSyntheticUsername(usr.username))
      .sort((a, b) => (b.lifetimeHold || 0) - (a.lifetimeHold || 0))
      .map(usr => ({
        username: usr.username,
        displayName: usr.displayName || usr.username,
        paxtaId: usr.paxtaId || mainUsers[usr.username]?.paxtaId || null,
        stars: mainUsers[usr.username]?.stars || 0,
        holdBalance: Math.floor(usr.holdBalance || 0),
        lifetimeHold: Math.floor(usr.lifetimeHold || 0),
        league: getLeagueForHold(usr.lifetimeHold || 0).name,
        tapLevel: usr.tapLevel || 1,
        autoBotEnabled: !!usr.autoBotEnabled,
        ogBonusClaimed: !!usr.ogBonusClaimed,
        streakCount: usr.streakCount || 0,
        luckyTickets: usr.luckyTickets || 0,
        referralsCount: (usr.referrals || []).length,
        squadId: usr.squadId || null
      }));

    res.json({
      ok: true,
      totalUsers: list.length,
      totalHoldCirculation: list.reduce((s, x) => s + x.holdBalance, 0),
      users: list
    });
  });

  app.post('/api/hold/admin-config', async (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    if (!checkAdminAccess(req, u)) {
      return res.status(403).json({ ok: false, error: 'Faqat Admin (ID 100) uchun!' });
    }

    const action = req.body?.action || 'save_morse';

    if (action === 'save_morse') {
      if (req.body?.morseWord) {
        st.config.dailyMorse.word = String(req.body.morseWord).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      }
      if (req.body?.morseReward !== undefined) {
        st.config.dailyMorse.reward = Math.max(500, parseInt(req.body.morseReward, 10) || 25_000);
      }
      if (req.body?.morseHint !== undefined) {
        st.config.dailyMorse.hint = String(req.body.morseHint).trim() || 'Maxfiy soʻzni Morze alifbosida tering';
      }
      saveHoldState(st);
      return res.json({ ok: true, message: 'Kunlik Morze va Ishora yangilandi', user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (action === 'add_secret_code') {
      const code = String(req.body?.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      const reward = Math.max(500, parseInt(req.body?.reward, 10) || 25_000);
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
      const reward = Math.max(500, parseInt(req.body?.reward, 10) || 15_000);
      const link = String(req.body?.link || '').trim();
      const icon = String(req.body?.icon || '⭐').trim() || '⭐';
      const minLeague = ['bronze', 'silver', 'gold', 'platinum', 'diamond'].includes(req.body?.minLeague) ? req.body.minLeague : null;
      if (!title) return res.status(400).json({ ok: false, error: 'Vazifa nomini kiriting' });

      if (!Array.isArray(st.config.customQuests)) st.config.customQuests = [...DEFAULT_HOLD_QUESTS];
      st.config.customQuests.push({
        id: `q_${Date.now().toString(36)}`,
        cat,
        title,
        reward,
        type: link ? 'link' : 'instant',
        icon,
        link,
        ...(minLeague ? { minLeague } : {})
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
        members: st.squads[cleanH]?.members || 0,
        totalHold: st.squads[cleanH]?.totalHold || 0,
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

    if (action === 'toggle_happy_hour') {
      const enable = req.body?.enable !== undefined ? !!req.body.enable : !st.config.happyHourForced;
      st.config.happyHourForced = enable;
      st.config.happyHourUntil = enable ? Date.now() + 3600 * 1000 : 0;
      saveHoldState(st);
      return res.json({
        ok: true,
        message: enable ? '⚡ 2x Happy Hour (1 soatga) yoqildi!' : '⚡ 2x Happy Hour oʻchirildi',
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    if (action === 'reward_top_squad') {
      const sortedSquads = Object.values(st.squads || {}).sort((a, b) => (b.totalHold || 0) - (a.totalHold || 0));
      const topSq = sortedSquads[0];
      if (!topSq) return res.status(400).json({ ok: false, error: 'Squadlar topilmadi' });
      const prize = st.config.squadWarPrize || 25_000;
      let rewardedCount = 0;
      for (const usr of Object.values(st.users || {})) {
        if (usr.squadId === topSq.id) {
          creditHold(usr, st, prize);
          rewardedCount++;
        }
      }
      saveHoldState(st);
      return res.json({
        ok: true,
        message: `🏆 #1 Squad (${topSq.name}) aʼzolariga (${rewardedCount} kishi) +${prize.toLocaleString()} HOLD tarqatildi!`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    if (action === 'draw_lucky_winner') {
      const pool = [];
      for (const usr of Object.values(st.users || {})) {
        const t = usr.luckyTickets || 0;
        for (let i = 0; i < t; i++) pool.push(usr);
      }
      if (!pool.length) {
        return res.status(400).json({ ok: false, error: 'Hozircha hech kimda Lucky Ticket yoʻq (Kunlik Morze yechilganda beriladi)' });
      }
      const winner = pool[crypto.randomInt(0, pool.length)];
      creditHold(winner, st, 100_000);
      st.config.lastLuckyWinner = {
        username: winner.username,
        displayName: winner.displayName || winner.username,
        rewardHold: 100_000,
        prizeNft: 'Victory Medal NFT',
        drawnAt: new Date().toISOString()
      };
      saveHoldState(st);
      return res.json({
        ok: true,
        message: `🎟️ Omadli Chipta Gʻolibi: @${winner.username} (+100,000 HOLD + Victory Medal)!`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    if (action === 'reset_user') {
      const targetKey = cleanKey(req.body?.targetUsername || u.username);
      const targetUser = st.users[targetKey];
      if (!targetUser) return res.status(404).json({ ok: false, error: `@${targetKey} topilmadi` });
      resetSingleUserObject(targetUser);
      saveHoldState(st);
      return res.json({
        ok: true,
        resetSelf: targetKey === u.username,
        message: `🔄 @${targetKey} hisobi 0 qilindi va Onboarding boshiga qaytarildi!`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    if (action === 'reset_all_users') {
      for (const [k, usr] of Object.entries(st.users || {})) {
        if (isSyntheticUsername(k) || isSyntheticUsername(usr?.username)) {
          delete st.users[k];
        } else {
          resetSingleUserObject(usr);
        }
      }
      st.squads = getDefaultSquads();
      saveHoldState(st);
      return res.json({
        ok: true,
        resetSelf: true,
        message: '⚠️ Barcha foydalanuvchilar hisobi toʻliq 0 qilindi va Onboarding holatiga qaytarildi!',
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    if (action === 'delete_user') {
      const targetKey = cleanKey(req.body?.targetUsername || '');
      if (!targetKey || targetKey === u.username) {
        return res.status(400).json({ ok: false, error: 'Oʻz profilingizni oʻchira olmaysiz (Reset tugmasini bosing)' });
      }
      delete st.users[targetKey];
      saveHoldState(st);
      return res.json({
        ok: true,
        message: `🗑️ @${targetKey} oʻchirildi`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
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
      if (req.body?.grantAllSkins) {
        targetUser.ownedSkins = HOLD_SKINS.map(s => s.id);
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

  // ---- 14. Hidden Compass Secret Mystery (/api/hold/solve-compass) ----
  app.post('/api/hold/solve-compass', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const seq = req.body?.sequence;
    const expected = ['up', 'right', 'down', 'left', 'up'];
    if (!Array.isArray(seq) || seq.length !== expected.length || !seq.every((v, i) => v === expected[i])) {
      return res.status(400).json({ ok: false, error: 'Kombinatsiya xato' });
    }

    const today = todayStr();
    if (!Array.isArray(u.compassSolvedDays)) u.compassSolvedDays = [];
    if (u.compassSolvedDays.includes(today)) {
      return res.status(400).json({ ok: false, error: 'Bugungi kompas siri ochilgan! Ertaga qayta urinib koʻring.' });
    }

    u.compassSolvedDays.push(today);
    const reward = 30_000;
    creditHold(u, st, reward);
    u.luckyTickets = (u.luckyTickets || 0) + 1;
    saveHoldState(st);

    res.json({
      ok: true,
      reward,
      message: '🧭 Qadimiy kompas siri ochildi! +30,000 HOLD va +1 Lucky Ticket!',
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 15. Admin Broadcast Announcement (/api/hold/admin-broadcast) ----
  app.post('/api/hold/admin-broadcast', async (req, res) => {
    const { st, u } = getOrCreateHoldUser(req.body?.username);
    if (!checkAdminAccess(req, u)) {
      return res.status(403).json({ ok: false, error: 'Faqat Admin uchun!' });
    }

    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ ok: false, error: 'Xabar matnini kiriting' });

    const btnText = String(req.body?.buttonText || '').trim();
    const btnUrl = String(req.body?.buttonUrl || '').trim() || 'https://paxta.online/HOLDbot';

    const reply_markup = btnText ? {
      inline_keyboard: [[{ text: btnText, web_app: { url: btnUrl } }]]
    } : undefined;

    const allUsers = Object.values(st.users || {});
    const targetIds = Array.from(new Set(allUsers.map(usr => usr.paxtaId).filter(Boolean)));

    if (!targetIds.length) {
      return res.status(400).json({ ok: false, error: 'Foydalanuvchilar topilmadi' });
    }

    let sent = 0;
    let failed = 0;

    for (const pid of targetIds) {
      try {
        const result = await holdBotCall('sendMessage', {
          chat_id: pid,
          text,
          parse_mode: 'HTML',
          reply_markup
        });
        if (result && result.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
      await new Promise(r => setTimeout(r, 40));
    }

    res.json({
      ok: true,
      sent,
      failed,
      total: targetIds.length,
      message: `E'lon yuborildi! Muvaffaqiyatli: ${sent} ta, Xatolik: ${failed} ta.`
    });
  });

  // ---- 16. Automated Push Notifications Ticker (Happy Hour & Streak Reminders) ----
  setInterval(async () => {
    try {
      const st = loadHoldState();
      const now = new Date();
      // Tashkent UTC+5
      const tashkentTime = new Date(now.getTime() + 5 * 3600 * 1000);
      const hour = tashkentTime.getUTCHours();
      const minute = tashkentTime.getUTCMinutes();
      const today = todayStr();

      if (!st.config.notifs) st.config.notifs = {};

      // 1. Happy Hour announcement at 20:00 (UTC+5)
      if (hour === 20 && minute <= 5 && st.config.notifs.lastHappyHourDay !== today) {
        st.config.notifs.lastHappyHourDay = today;
        saveHoldState(st);
        const recipientIds = Object.values(st.users || {}).map(usr => usr.paxtaId).filter(Boolean);
        const uniqueIds = Array.from(new Set(recipientIds));
        for (const pid of uniqueIds) {
          try {
            await holdBotCall('sendMessage', {
              chat_id: pid,
              text: '⚡ <b>Happy Hour boshlandi!</b>\n\nKeyingi 1 soat (20:00 – 21:00) davomida har bir bosish <b>2 barobar (2x)</b> koʻproq $HOLD beradi! 🚀',
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[{ text: '🪙 $HOLD ga kirish', web_app: { url: 'https://paxta.online/HOLDbot' } }]]
              }
            });
            await new Promise(r => setTimeout(r, 45));
          } catch {}
        }
      }

      // 2. Daily Streak Reminder at 19:00 (UTC+5)
      if (hour === 19 && minute <= 5 && st.config.notifs.lastStreakReminderDay !== today) {
        st.config.notifs.lastStreakReminderDay = today;
        saveHoldState(st);
        const targets = Object.values(st.users || {})
          .filter(usr => usr.paxtaId && usr.lastStreakDate !== today)
          .map(usr => usr.paxtaId);
        const uniqueIds = Array.from(new Set(targets));
        for (const pid of uniqueIds) {
          try {
            await holdBotCall('sendMessage', {
              chat_id: pid,
              text: '🔥 <b>Kunlik bonus kutmoqda!</b>\n\nBugungi kunlik zanjir mukofotingizni olishni unutmang. 7-kuni bepul Cookie skin beriladi! 🍪',
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[{ text: '🎁 Bonusni olish', web_app: { url: 'https://paxta.online/HOLDbot' } }]]
              }
            });
            await new Promise(r => setTimeout(r, 45));
          } catch {}
        }
      }
    } catch {}
  }, 60_000);

  // ---- 17. @HOLDbot Polling Loop (Handles /start, Referrals & Stars Payments) ----
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
            const uKey = fromUser ? cleanKey(fromUser.username || fromUser.first_name || `paxta_${fromUser.id}`) : null;

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
                const invId = parts[3] || '';

                const users = loadJSON(usersFile, {});
                if (!users[targetKey]) {
                  users[targetKey] = { username: targetKey, displayName: targetKey, stars: 0 };
                }
                users[targetKey].stars = (users[targetKey].stars || 0) + starsAdded;
                saveJSON(usersFile, users);

                if (invId && st.payments.invoices[invId]) {
                  st.payments.invoices[invId].status = 'paid';
                }

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
              const senderKey = cleanKey(sender.username || sender.first_name || `paxta_${sender.id}`);

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

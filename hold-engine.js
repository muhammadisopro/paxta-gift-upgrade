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
  { id: 'bronze',   name: 'Bronze',   icon: 'trophy', minHold: 0,          bonusTap: 0, color: '#cd7f32' },
  { id: 'silver',   name: 'Silver',   icon: 'trophy', minHold: 250_000,    bonusTap: 1, color: '#c0c0c0' },
  { id: 'gold',     name: 'Gold',     icon: 'trophy', minHold: 1_000_000,  bonusTap: 2, color: '#ffd700' },
  { id: 'diamond',  name: 'Diamond',  icon: 'trophy', minHold: 4_000_000,  bonusTap: 4, color: '#38bdf8' },
  { id: 'obsidian', name: 'Obsidian', icon: 'trophy', minHold: 10_000_000, bonusTap: 7, color: '#60a5fa' }
];

export const HOLD_MINE_CARDS = [
  // Category: ecosystem
  {
    id: 'paxta_node',
    cat: 'ecosystem',
    name: 'Paxta Node',
    desc: 'Tarmoq serveridan soatlik passiv HOLD daromad',
    icon: 'server',
    baseCost: 5_000,
    baseProfit: 1_200
  },
  {
    id: 'hold_verify_hub',
    cat: 'ecosystem',
    name: 'Verification Hub',
    desc: 'Rasmiy tasdiqlash markazi ulushi',
    icon: 'shield',
    baseCost: 12_000,
    baseProfit: 2_800
  },
  {
    id: 'stars_liquidity',
    cat: 'ecosystem',
    name: 'Stars Pool',
    desc: 'Stars likvidlik hovuzidan doimiy ulush',
    icon: 'star',
    baseCost: 25_000,
    baseProfit: 5_400
  },
  // Category: web3
  {
    id: 'nft_floor_sniper',
    cat: 'web3',
    name: 'Floor Sniper',
    desc: 'Avtomatik bozor snayperi algoritmi',
    icon: 'target',
    baseCost: 18_000,
    baseProfit: 4_100
  },
  {
    id: 'whale_staking',
    cat: 'web3',
    name: 'Whale Staking',
    desc: 'Yirik fond bilan birgalikda staking',
    icon: 'layers',
    baseCost: 45_000,
    baseProfit: 9_500
  },
  {
    id: 'p2p_arbitrage',
    cat: 'web3',
    name: 'P2P Arbitrage',
    desc: 'Bozor savdosidan avtomatik daromad',
    icon: 'chart',
    baseCost: 75_000,
    baseProfit: 15_000
  },
  // Category: mystery
  {
    id: 'morse_ai_decoder',
    cat: 'mystery',
    name: 'Signal Decoder',
    desc: 'Yashirin signallarni tahlil qilish markazi',
    icon: 'radio',
    baseCost: 15_000,
    baseProfit: 3_600
  },
  {
    id: 'enigma_cipher',
    cat: 'mystery',
    name: 'Enigma Core',
    desc: 'Kriptografik bloklar tahlili',
    icon: 'lock',
    baseCost: 38_000,
    baseProfit: 8_200
  },
  {
    id: 'quantum_reactor',
    cat: 'mystery',
    name: 'Quantum Core',
    desc: 'Yuqori tezlikdagi kvant hisoblash',
    icon: 'cpu',
    baseCost: 90_000,
    baseProfit: 18_500
  },
  // Category: vip
  {
    id: 'victory_medal_mint',
    cat: 'vip',
    name: 'Medal Mint',
    desc: 'Victory Medal fondidan passiv oqim',
    icon: 'award',
    baseCost: 30_000,
    baseProfit: 6_800
  },
  {
    id: 'desk_calendar_vault',
    cat: 'vip',
    name: 'Calendar Vault',
    desc: 'Desk Calendar fondidan passiv oqim',
    icon: 'calendar',
    baseCost: 60_000,
    baseProfit: 13_200
  },
  {
    id: 'obsidian_genesis',
    cat: 'vip',
    name: 'Obsidian Pass',
    desc: 'Elit klubning eng yuqori daromad kartasi',
    icon: 'diamond',
    baseCost: 150_000,
    baseProfit: 32_000
  }
];

export const SECRET_BONUS_CODES = {
  WAKEUP:   { reward: 500_000,   title: 'WAKEUP kodi ochildi', skin: 'obsidian' },
  PAXTA:    { reward: 600_000,   title: 'PAXTA kodi ochildi' },
  MEDAL:    { reward: 750_000,   title: 'MEDAL kodi ochildi' },
  OBSIDIAN: { reward: 1_000_000, title: 'OBSIDIAN kodi ochildi' },
  MOON:     { reward: 888_888,   title: 'MOON kodi ochildi' }
};

export const HOLD_QUESTS = [
  { id: 'daily_checkin',     title: 'Kunlik kirish bonusi',          reward: 50_000,  type: 'instant',      icon: 'calendar' },
  { id: 'solve_first_morse', title: 'Yashirin shifrni topish',       reward: 250_000, type: 'check_morse',  icon: 'radio' },
  { id: 'join_squad',        title: 'Jamoaga qoʻshilish',            reward: 100_000, type: 'check_squad',  icon: 'shield' },
  { id: 'upgrade_3_cards',   title: '3 ta Mine kartani ochish',      reward: 200_000, type: 'check_cards',  icon: 'cpu' },
  { id: 'invite_1_friend',   title: '1 ta doʻstni taklif qilish',    reward: 150_000, type: 'check_ref_1',  icon: 'users' },
  { id: 'invite_3_friends',  title: '3 ta doʻstni taklif qilish',    reward: 500_000, type: 'check_ref_3',  icon: 'users' },
  { id: 'reach_silver',      title: 'Silver darajasiga chiqish',     reward: 300_000, type: 'check_silver', icon: 'trophy' },
  { id: 'reach_gold',        title: 'Gold darajasiga chiqish',       reward: 750_000, type: 'check_gold',   icon: 'trophy' }
];

export const STARS_VIP_PACKS = [
  {
    id: 'starter_hold',
    name: '1,000,000 HOLD + Tap Boost',
    desc: '+1,000,000 HOLD · Multitap +2',
    starsPrice: 49,
    holdGrant: 1_000_000,
    tapBoost: 2,
    enableAutoBot: false,
    badge: 'START'
  },
  {
    id: 'god_mode',
    name: '3,000,000 HOLD + Auto-Bot',
    desc: '+3,000,000 HOLD · Multitap +5 · 24/7 Auto-Bot',
    starsPrice: 99,
    holdGrant: 3_000_000,
    tapBoost: 5,
    enableAutoBot: true,
    badge: 'POPULAR'
  },
  {
    id: 'whale_pack',
    name: '7,500,000 HOLD + Whale Boost',
    desc: '+7,500,000 HOLD · Multitap +10 · 24/7 Auto-Bot',
    starsPrice: 199,
    holdGrant: 7_500_000,
    tapBoost: 10,
    enableAutoBot: true,
    badge: '2X VALUE'
  },
  {
    id: 'obsidian_pack',
    name: '20,000,000 HOLD · Obsidian Max',
    desc: '+20,000,000 HOLD · Multitap +18 · Top-10 Boost',
    starsPrice: 399,
    holdGrant: 20_000_000,
    tapBoost: 18,
    enableAutoBot: true,
    badge: 'VIP MAX'
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

export function computeCardUpgradeCost(cardDef, currentLevel = 0) {
  return Math.round(cardDef.baseCost * Math.pow(1.55, currentLevel));
}

export function computeCardProfit(cardDef, level = 0) {
  if (level <= 0) return 0;
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += Math.round(cardDef.baseProfit * Math.pow(1.22, i - 1));
  }
  return total;
}

export function computeUserProfitPerHour(u) {
  const cards = u.cards || {};
  let pph = 0;
  for (const cDef of HOLD_MINE_CARDS) {
    const lvl = cards[cDef.id] || 0;
    if (lvl > 0) pph += computeCardProfit(cDef, lvl);
  }
  return pph;
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
    HOLD_BOT_TOKEN,
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
        dailyCombo: {
          cardIds: ['hold_verify_hub', 'morse_ai_decoder', 'victory_medal_mint'],
          reward: 3_000_000
        }
      },
      squads: {
        insider:  { id: 'insider',  name: 'Insider Official', icon: 'zap',      members: 42, totalHold: 28_500_000 },
        medal:    { id: 'medal',    name: 'MEDAL Collectors', icon: 'award',    members: 31, totalHold: 19_400_000 },
        kalendar: { id: 'kalendar', name: 'Kalendar Whales',  icon: 'calendar', members: 27, totalHold: 16_200_000 },
        hold_vip: { id: 'hold_vip', name: 'Hold Verified Club', icon: 'shield', members: 54, totalHold: 34_800_000 }
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
        holdBalance: 0,
        lifetimeHold: 0,
        ogBonusClaimed: false,
        ogDetails: null,
        energy: 1500,
        maxEnergy: 1500,
        lastEnergyAt: Date.now(),
        tapLevel: 1,
        energyLevel: 1,
        autoBotEnabled: false,
        fullTankCount: 3,
        rocketCount: 3,
        lastBoostResetDay: todayStr(),
        cards: {},
        lastPassiveClaimAt: Date.now(),
        morseSolvedDays: [],
        comboProgress: {},
        comboSolvedDays: [],
        secretCodesClaimed: [],
        referrals: [],
        referredBy: null,
        squadId: null,
        tasksCompleted: [],
        claimedNfts: [],
        skin: 'gold',
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
      const regenRate = 3 + Math.floor((u.energyLevel || 1) / 2);
      u.energy = Math.min(maxE, (u.energy || 0) + elapsedSec * regenRate);
      u.lastEnergyAt = now;
    }

    // Calculate passive profit earned while offline (up to 12 hours)
    const pph = computeUserProfitPerHour(u);
    let passiveEarned = 0;
    const passiveElapsedMs = Math.max(0, now - (u.lastPassiveClaimAt || now));
    if (pph > 0 && passiveElapsedMs >= 15_000) {
      const cappedHours = Math.min(12, passiveElapsedMs / (3600 * 1000));
      passiveEarned = Math.floor(pph * cappedHours);
      if (passiveEarned > 0) {
        u.holdBalance += passiveEarned;
        u.lifetimeHold += passiveEarned;
        if (u.squadId && st.squads[u.squadId]) {
          st.squads[u.squadId].totalHold += passiveEarned;
        }
      }
      u.lastPassiveClaimAt = now;
    } else if (passiveElapsedMs >= 15_000) {
      u.lastPassiveClaimAt = now;
    }

    return { st, u, mainUser: mainUsers[key], passiveEarned };
  }

  function formatHoldUserResponse(st, u, mainUser, passiveEarned = 0) {
    const today = todayStr();
    const pph = computeUserProfitPerHour(u);
    const league = getLeagueForHold(u.lifetimeHold || 0);
    const tapPower = (u.tapLevel || 1) + (league.bonusTap || 0);
    const morseWord = (st.config?.dailyMorse?.word || 'HOLD').toUpperCase();
    const morseOverlay = morseWord.split('').map(ch => ({
      letter: ch,
      morse: MORSE_MAP[ch] || '.-'
    }));

    const comboIds = st.config?.dailyCombo?.cardIds || [];
    const todayComboProgress = u.comboProgress?.[today] || [];

    return {
      username: u.username,
      displayName: u.displayName,
      paxtaId: u.paxtaId,
      isAdmin: Number(u.paxtaId) === ADMIN_PAXTA_ID || u.username === 'moon' || u.username === 'shade',
      stars: mainUser?.stars || 0,
      holdBalance: Math.floor(u.holdBalance || 0),
      lifetimeHold: Math.floor(u.lifetimeHold || 0),
      profitPerHour: pph,
      passiveEarnedJustNow: passiveEarned,
      tapPower,
      tapLevel: u.tapLevel || 1,
      nextTapUpgradeCost: Math.round(2_000 * Math.pow(1.65, (u.tapLevel || 1) - 1)),
      energy: u.energy,
      maxEnergy: u.maxEnergy,
      energyLevel: u.energyLevel || 1,
      nextEnergyUpgradeCost: Math.round(2_000 * Math.pow(1.65, (u.energyLevel || 1) - 1)),
      autoBotEnabled: !!u.autoBotEnabled,
      autoBotCost: 150_000,
      fullTankCount: u.fullTankCount ?? 3,
      rocketCount: u.rocketCount ?? 3,
      ogBonusClaimed: !!u.ogBonusClaimed,
      ogDetails: u.ogDetails,
      league,
      allLeagues: HOLD_LEAGUES,
      skin: u.skin || 'gold',
      morse: {
        wordLength: morseWord.length,
        hint: st.config?.dailyMorse?.hint || 'Maxfiy soʻzni Morze alifbosida tering',
        reward: st.config?.dailyMorse?.reward || 1_000_000,
        solvedToday: (u.morseSolvedDays || []).includes(today),
        lettersGuide: morseOverlay
      },
      combo: {
        reward: st.config?.dailyCombo?.reward || 3_000_000,
        solvedToday: (u.comboSolvedDays || []).includes(today),
        foundCardIds: todayComboProgress,
        totalRequired: 3
      },
      cards: HOLD_MINE_CARDS.map(cDef => {
        const lvl = u.cards?.[cDef.id] || 0;
        return {
          ...cDef,
          level: lvl,
          currentProfit: computeCardProfit(cDef, lvl),
          nextProfitDelta: computeCardProfit(cDef, lvl + 1) - computeCardProfit(cDef, lvl),
          upgradeCost: computeCardUpgradeCost(cDef, lvl)
        };
      }),
      squadId: u.squadId,
      squads: Object.values(st.squads || {}).sort((a, b) => b.totalHold - a.totalHold),
      referrals: u.referrals || [],
      tasksCompleted: u.tasksCompleted || [],
      quests: HOLD_QUESTS,
      vipPacks: STARS_VIP_PACKS,
      claimedNfts: u.claimedNfts || [],
      secretCodesClaimed: u.secretCodesClaimed || []
    };
  }

  // ---- Serve /hold WebApp Page ----
  app.get(['/hold', '/hold/'], (req, res) => {
    res.sendFile(path.join(publicDir, 'hold', 'index.html'));
  });

  // ---- 1. Login / Sync User State ----
  app.post('/api/hold/sync', (req, res) => {
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

  // ---- 2. Claim Initial OG Snapshot Bonus ----
  app.post('/api/hold/claim-og', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    if (u.ogBonusClaimed) {
      return res.json({ ok: true, alreadyClaimed: true, user: formatHoldUserResponse(st, u, mainUser) });
    }

    const pid = Number(u.paxtaId) || 999;
    let tierName = 'Paxta Holder';
    let idBonus = 50_000;
    if (pid <= 150) {
      tierName = 'Genesis OG';
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

  // ---- 4. Boosts (Full Tank, Rocket, Multitap, Energy Limit, Auto-Bot) ----
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
      return res.json({ ok: true, message: 'Energiya 100% toʻldirildi', user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'rocket') {
      if ((u.rocketCount ?? 0) <= 0) {
        return res.status(400).json({ ok: false, error: 'Bugungi Turbo limiti tugadi' });
      }
      u.rocketCount--;
      saveHoldState(st);
      return res.json({ ok: true, turboDurationMs: 10_000, message: '7X Turbo yoqildi (10 soniya)', user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'multitap') {
      const cost = Math.round(2_000 * Math.pow(1.65, (u.tapLevel || 1) - 1));
      if (u.holdBalance < cost) {
        return res.status(400).json({ ok: false, error: `Yetarli HOLD yoʻq (${cost.toLocaleString()} HOLD)` });
      }
      u.holdBalance -= cost;
      u.tapLevel = (u.tapLevel || 1) + 1;
      saveHoldState(st);
      return res.json({ ok: true, message: `Multitap Lv.${u.tapLevel}`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'energy_limit') {
      const cost = Math.round(2_000 * Math.pow(1.65, (u.energyLevel || 1) - 1));
      if (u.holdBalance < cost) {
        return res.status(400).json({ ok: false, error: `Yetarli HOLD yoʻq (${cost.toLocaleString()} HOLD)` });
      }
      u.holdBalance -= cost;
      u.energyLevel = (u.energyLevel || 1) + 1;
      u.maxEnergy = 1000 + u.energyLevel * 500;
      u.energy = u.maxEnergy;
      saveHoldState(st);
      return res.json({ ok: true, message: `Energiya sigʻimi ${u.maxEnergy} ga oshirildi`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'autobot') {
      if (u.autoBotEnabled) {
        return res.status(400).json({ ok: false, error: 'Auto-Bot allaqachon faol' });
      }
      const cost = 150_000;
      if (u.holdBalance < cost) {
        return res.status(400).json({ ok: false, error: `Auto-Bot uchun ${cost.toLocaleString()} HOLD kerak` });
      }
      u.holdBalance -= cost;
      u.autoBotEnabled = true;
      saveHoldState(st);
      return res.json({ ok: true, message: '24/7 Auto-Bot faollashtirildi', user: formatHoldUserResponse(st, u, mainUser) });
    }

    res.status(400).json({ ok: false, error: 'Nomaʼlum boost turi' });
  });

  // ---- 5. Upgrade Mine Card & Check Daily 3-Card Combo ----
  app.post('/api/hold/upgrade-card', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const cardId = req.body?.cardId;
    const cardDef = HOLD_MINE_CARDS.find(c => c.id === cardId);
    if (!cardDef) return res.status(404).json({ ok: false, error: 'Karta topilmadi' });

    if (!u.cards) u.cards = {};
    const curLvl = u.cards[cardId] || 0;
    const cost = computeCardUpgradeCost(cardDef, curLvl);
    if (u.holdBalance < cost) {
      return res.status(400).json({ ok: false, error: `Yetarli HOLD yoʻq (${cost.toLocaleString()} HOLD)` });
    }

    u.holdBalance -= cost;
    u.cards[cardId] = curLvl + 1;

    // Check if this card is part of today's Daily Combo
    const today = todayStr();
    const comboCardIds = st.config?.dailyCombo?.cardIds || [];
    const comboReward = st.config?.dailyCombo?.reward || 3_000_000;
    let comboJustFound = false;
    let comboCompletedJustNow = false;

    if (!u.comboProgress) u.comboProgress = {};
    if (!Array.isArray(u.comboProgress[today])) u.comboProgress[today] = [];
    if (!Array.isArray(u.comboSolvedDays)) u.comboSolvedDays = [];

    if (comboCardIds.includes(cardId) && !u.comboProgress[today].includes(cardId)) {
      u.comboProgress[today].push(cardId);
      comboJustFound = true;

      if (u.comboProgress[today].length >= 3 && !u.comboSolvedDays.includes(today)) {
        u.comboSolvedDays.push(today);
        u.holdBalance += comboReward;
        u.lifetimeHold += comboReward;
        comboCompletedJustNow = true;
      }
    }

    saveHoldState(st);
    res.json({
      ok: true,
      cardId,
      newLevel: u.cards[cardId],
      comboJustFound,
      comboCompletedJustNow,
      comboReward: comboCompletedJustNow ? comboReward : 0,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 6. Solve Daily Morse Cipher & Secret Mystery Codes ----
  app.post('/api/hold/solve-morse', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const wordInput = String(req.body?.word || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!wordInput) {
      return res.status(400).json({ ok: false, error: 'Soʻz kiritilmadi' });
    }

    const today = todayStr();
    const dailyWord = (st.config?.dailyMorse?.word || 'HOLD').toUpperCase();
    const dailyReward = st.config?.dailyMorse?.reward || 1_000_000;

    if (!Array.isArray(u.morseSolvedDays)) u.morseSolvedDays = [];
    if (!Array.isArray(u.secretCodesClaimed)) u.secretCodesClaimed = [];

    // 1. Check Daily Morse Word
    if (wordInput === dailyWord) {
      if (u.morseSolvedDays.includes(today)) {
        return res.status(400).json({ ok: false, error: 'Bugungi shifr allaqachon yechilgan' });
      }
      u.morseSolvedDays.push(today);
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
        message: `Shifr topildi ("${dailyWord}") · +${dailyReward.toLocaleString()} HOLD`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    // 2. Check Secret Bonus Mystery Words (WAKEUP, PAXTA, MEDAL, OBSIDIAN, MOON)
    const secret = SECRET_BONUS_CODES[wordInput];
    if (secret) {
      if (u.secretCodesClaimed.includes(wordInput)) {
        return res.status(400).json({ ok: false, error: `"${wordInput}" kodi allaqachon olingan` });
      }
      u.secretCodesClaimed.push(wordInput);
      u.holdBalance += secret.reward;
      u.lifetimeHold += secret.reward;
      if (secret.skin) u.skin = secret.skin;
      saveHoldState(st);
      return res.json({
        ok: true,
        type: 'secret_code',
        word: wordInput,
        reward: secret.reward,
        message: `${secret.title} · +${secret.reward.toLocaleString()} HOLD`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    res.status(400).json({
      ok: false,
      error: `"${wordInput}" — notoʻgʻri kod`
    });
  });

  // ---- 7. Join Squad ----
  app.post('/api/hold/join-squad', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const squadId = req.body?.squadId;
    if (!st.squads[squadId]) {
      return res.status(404).json({ ok: false, error: 'Jamoa topilmadi' });
    }
    if (u.squadId !== squadId) {
      u.squadId = squadId;
      st.squads[squadId].members = (st.squads[squadId].members || 0) + 1;
      saveHoldState(st);
    }
    res.json({
      ok: true,
      message: `${st.squads[squadId].name} jamoasiga qoʻshildingiz`,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 8. Complete Quests ----
  app.post('/api/hold/claim-quest', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const questId = req.body?.questId;
    const quest = HOLD_QUESTS.find(q => q.id === questId);
    if (!quest) return res.status(404).json({ ok: false, error: 'Vazifa topilmadi' });

    if (!Array.isArray(u.tasksCompleted)) u.tasksCompleted = [];
    if (u.tasksCompleted.includes(questId)) {
      return res.status(400).json({ ok: false, error: 'Mukofot allaqachon olingan' });
    }

    if (quest.type === 'check_morse' && (!u.morseSolvedDays || u.morseSolvedDays.length === 0) && (!u.secretCodesClaimed || u.secretCodesClaimed.length === 0)) {
      return res.status(400).json({ ok: false, error: 'Avval yashirin shifrni toping' });
    }
    if (quest.type === 'check_squad' && !u.squadId) {
      return res.status(400).json({ ok: false, error: 'Avval jamoaga qoʻshiling' });
    }
    if (quest.type === 'check_cards' && Object.keys(u.cards || {}).length < 3) {
      return res.status(400).json({ ok: false, error: 'Avval 3 ta Mine kartani oching' });
    }
    if (quest.type === 'check_ref_1' && (u.referrals || []).length < 1) {
      return res.status(400).json({ ok: false, error: 'Avval 1 ta doʻstingizni taklif qiling' });
    }
    if (quest.type === 'check_ref_3' && (u.referrals || []).length < 3) {
      return res.status(400).json({ ok: false, error: 'Avval 3 ta doʻstingizni taklif qiling' });
    }
    if (quest.type === 'check_silver' && (u.lifetimeHold || 0) < 250_000) {
      return res.status(400).json({ ok: false, error: 'Avval Silver darajasiga (250,000 HOLD) yeting' });
    }
    if (quest.type === 'check_gold' && (u.lifetimeHold || 0) < 1_000_000) {
      return res.status(400).json({ ok: false, error: 'Avval Gold darajasiga (1,000,000 HOLD) yeting' });
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
    if (!pack) return res.status(404).json({ ok: false, error: 'Paket topilmadi' });

    const users = loadJSON(usersFile, {});
    const userRecord = users[u.username];
    const currentStars = userRecord?.stars || 0;

    if (currentStars < pack.starsPrice) {
      return res.status(400).json({
        ok: false,
        needStars: true,
        deficit: pack.starsPrice - currentStars,
        required: pack.starsPrice,
        error: `Hisobingizda yetarli Stars yoʻq (${pack.starsPrice} Stars)`
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
      message: `${pack.name} faollashtirildi · +${pack.holdGrant.toLocaleString()} HOLD`,
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
        const holdRequired = isBlack ? 5_000_000 : 1_500_000;
        const starsFee = isBlack ? 890 : 320;
        const marketValue = isBlack ? 2_200 : 750;
        const soldInfo = soldMedals[m.giftId] || null;

        return {
          vaultId: `medal_${m.giftId}`,
          giftId: Number(m.giftId),
          nftType: 'medal',
          title: `Victory Medal #${m.number}`,
          number: Number(m.number),
          model: m.model || 'Victory',
          backdrop: m.backdrop || 'Classic',
          pattern: m.pattern || '',
          centerColor: m.centerColor || '#3b82f6',
          edgeColor: m.edgeColor || '#1d4ed8',
          textColor: m.textColor || '#ffffff',
          img: m.localImg || m.imageUrl,
          link: m.link || `https://paxta.online/nft/VictoryMedal-${m.number}`,
          isBlack,
          crafted: false,
          tierBadge: isBlack ? 'Black Medal' : 'Victory Medal',
          holdRequired,
          starsFee,
          marketValue,
          sold: !!soldInfo,
          buyer: soldInfo?.buyer || null
        };
      });

    const vaultCalendars = rawCalendars
      .filter(c => !FORBIDDEN_GIFT_IDS.has(Number(c.giftId)))
      .map(c => {
        const bLow = String(c.backdrop || '').toLowerCase();
        const isBlack = bLow.includes('black') || bLow.includes('onyx') || bLow.includes('obsidian');
        const isCraft = !!c.crafted;
        const isTop100 = Number(c.number) < 100;

        let holdRequired = 3_000_000;
        let starsFee = 360;
        let marketValue = 950;
        let tierBadge = 'Desk Calendar';

        if (isBlack && isCraft) {
          holdRequired = 12_000_000;
          starsFee = 1_250;
          marketValue = 2_500;
          tierBadge = 'Black Craft';
        } else if (isCraft) {
          holdRequired = 8_000_000;
          starsFee = 690;
          marketValue = 1_650;
          tierBadge = 'Craft Calendar';
        } else if (isBlack) {
          holdRequired = 10_000_000;
          starsFee = 990;
          marketValue = 1_950;
          tierBadge = 'Black Calendar';
        } else if (isTop100) {
          holdRequired = 5_000_000;
          starsFee = 520;
          marketValue = 1_350;
          tierBadge = 'Top #100';
        }

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
          pattern: c.pattern || '',
          centerColor: c.backdropColors?.center || c.centerColor || '#363738',
          edgeColor: c.backdropColors?.edge || c.edgeColor || '#0e0f0f',
          textColor: c.backdropColors?.text || c.textColor || '#ffffff',
          img: c.image || c.localImg || c.imageUrl,
          link: c.link || `https://paxta.online/nft/DeskCalendar-${c.number}`,
          isBlack,
          crafted: isCraft,
          tierBadge,
          holdRequired,
          starsFee,
          marketValue,
          sold: !!soldInfo,
          buyer: soldInfo?.buyer || null
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
      10_000_000,
      7_500_000,
      5_000_000,
      3_500_000,
      2_500_000,
      2_000_000,
      1_500_000,
      1_000_000,
      750_000,
      500_000
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

  // ---- 11. Claim Real NFT from Vault ($HOLD + Discounted Stars Fee -> Auto PaxtaGram Delivery!) ----
  app.post('/api/hold/claim-nft', async (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const vaultId = req.body?.vaultId;
    const recipientUsername = cleanName(req.body?.recipientUsername || u.username);

    const allItems = getVaultItems();
    const item = allItems.find(x => x.vaultId === vaultId);
    if (!item) return res.status(404).json({ ok: false, error: 'NFT topilmadi' });
    if (item.sold) return res.status(400).json({ ok: false, error: 'Ushbu NFT allaqachon boshqa ishtirokchi tomonidan olingan!' });

    if (u.holdBalance < item.holdRequired) {
      return res.status(400).json({
        ok: false,
        needHold: true,
        deficitHold: item.holdRequired - Math.floor(u.holdBalance),
        error: `Ushbu NFT uchun kamida ${item.holdRequired.toLocaleString()} $HOLD kerak! (Yoki VIP Boost oling)`
      });
    }

    const users = loadJSON(usersFile, {});
    const userRecord = users[u.username];
    const currentStars = userRecord?.stars || 0;

    if (currentStars < item.starsFee) {
      return res.status(400).json({
        ok: false,
        needStars: true,
        deficit: item.starsFee - currentStars,
        required: item.starsFee,
        error: `Transfer va aktivatsiya badali uchun ⭐ ${item.starsFee} kerak (Bozor narxi: ⭐ ${item.marketValue})`
      });
    }

    // Resolve recipient on PaxtaGram
    const activeClient = item.nftType === 'medal' ? milliybekClient : moonClient;
    let targetPaxtaId = u.paxtaId || null;
    if (!targetPaxtaId || recipientUsername.toLowerCase() !== u.username.toLowerCase()) {
      const resolved = await activeClient.resolveUserByUsername(recipientUsername);
      if (resolved && resolved.id) {
        targetPaxtaId = resolved.id;
      }
    }

    if (!targetPaxtaId) {
      return res.status(400).json({
        ok: false,
        error: `@${recipientUsername} PaxtaGram foydalanuvchisi topilmadi. Username toʻgʻriligini tekshiring!`
      });
    }

    // Deduct $HOLD & Stars
    u.holdBalance -= item.holdRequired;
    userRecord.stars -= item.starsFee;
    saveJSON(usersFile, users);

    // Mark as sold
    if (item.nftType === 'medal') {
      st.soldMedals[item.giftId] = {
        buyer: u.username,
        recipientUsername,
        targetPaxtaId,
        claimedAt: new Date().toISOString()
      };
    } else {
      const settingsPath = path.join(path.dirname(usersFile), 'settings.json');
      const settings = loadJSON(settingsPath, { collections: {}, soldCalendars: {} });
      if (!settings.soldCalendars) settings.soldCalendars = {};
      settings.soldCalendars[item.calId] = {
        buyer: u.username,
        recipientUsername,
        targetPaxtaId,
        soldAt: new Date().toISOString()
      };
      saveJSON(settingsPath, settings);
    }

    // Attempt automated transfer on PaxtaGram
    let deliveryStatus = 'pending_admin';
    try {
      const transferRes = await activeClient.transferNftGift({
        giftId: item.giftId,
        targetUserId: targetPaxtaId
      });
      if (transferRes.ok) {
        deliveryStatus = 'delivered';
      }
    } catch {}

    const claimRecord = {
      id: `claim_${Date.now().toString(36)}`,
      vaultId: item.vaultId,
      giftId: item.giftId,
      title: item.title,
      model: item.model,
      backdrop: item.backdrop,
      img: item.img,
      link: item.link,
      buyer: u.username,
      recipientUsername,
      targetPaxtaId,
      holdSpent: item.holdRequired,
      starsSpent: item.starsFee,
      deliveryStatus,
      claimedAt: new Date().toISOString()
    };

    if (!Array.isArray(u.claimedNfts)) u.claimedNfts = [];
    u.claimedNfts.unshift(claimRecord);
    st.nftClaims.unshift(claimRecord);
    saveHoldState(st);

    // Notify Admin (ID 100) via @HOLDbot
    holdBotCall('sendMessage', {
      chat_id: ADMIN_PAXTA_ID,
      text: `🪙 *$HOLD NFT VAULT XARIDI!*\n\n🎁 NFT: *${item.title}* (${item.model} / ${item.backdrop})\n👤 Foydalanuvchi: *@${u.username}* -> *@${recipientUsername}* (ID: \`${targetPaxtaId}\`)\n🪙 Sarflandi: *${item.holdRequired.toLocaleString()} $HOLD* + *⭐ ${item.starsFee}*\n📦 Holat: *${deliveryStatus === 'delivered' ? '✅ Avtomatik yuborildi!' : '⏳ Navbatda (Admin tasdigʻi / Trade lock)'}*`,
      parse_mode: 'Markdown'
    }).catch(() => {});

    res.json({
      ok: true,
      claim: claimRecord,
      message: deliveryStatus === 'delivered'
        ? `🎉 Tabriklaymiz! ${item.title} toʻgʻridan-toʻgʻri @${recipientUsername} PaxtaGram profiliga oʻtkazildi!`
        : `🎉 Tabriklaymiz! ${item.title} sizning nomingizga band qilindi va @${recipientUsername} profiliga yetkazish navbatiga qoʻyildi!`,
      user: formatHoldUserResponse(st, u, userRecord)
    });
  });

  // ---- 12. Create Stars Invoice via @HOLDbot ----
  app.post('/api/hold/create-invoice', async (req, res) => {
    const { st, u } = getOrCreateHoldUser(req.body?.username);
    const amount = Math.max(1, Math.min(100_000, parseInt(req.body?.amount, 10) || 100));
    const title = String(req.body?.title || `$HOLD VIP & NFT Balance (+${amount} ⭐)`).slice(0, 32);

    const invoiceId = `holdinv_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
    const payload = `holdstars:${u.username}:${amount}:${invoiceId}`;

    const apiRes = await holdBotCall('createInvoiceLink', {
      title,
      description: `@${u.username} hisobiga +${amount} PaxtaGram Stars qoʻshish ($HOLD Coin & NFT Vault)`,
      payload,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: `${amount} Stars`, amount }]
    });

    if (!apiRes || !apiRes.ok || !apiRes.result) {
      return res.status(502).json({
        ok: false,
        error: apiRes?.description || 'Stars hisob-fakturasini yaratishda xatolik'
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

  // ---- 13. Admin Config for Daily Morse & Combo (ID 100) ----
  app.post('/api/hold/admin-config', (req, res) => {
    const { st, u } = getOrCreateHoldUser(req.body?.username);
    const isAdmin = isRequestAdmin(req) || Number(u.paxtaId) === ADMIN_PAXTA_ID || u.username === 'moon' || u.username === 'shade';
    if (!isAdmin) return res.status(403).json({ ok: false, error: 'Faqat Admin (ID 100) uchun!' });

    if (req.body?.morseWord) {
      st.config.dailyMorse.word = String(req.body.morseWord).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    if (req.body?.morseHint) {
      st.config.dailyMorse.hint = String(req.body.morseHint).trim();
    }
    if (req.body?.morseReward) {
      st.config.dailyMorse.reward = Math.max(10_000, parseInt(req.body.morseReward, 10) || 1_000_000);
    }
    if (Array.isArray(req.body?.comboCardIds) && req.body.comboCardIds.length === 3) {
      st.config.dailyCombo.cardIds = req.body.comboCardIds;
    }
    saveHoldState(st);
    res.json({ ok: true, config: st.config });
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

            // 1. PreCheckoutQuery
            if (item.pre_checkout_query) {
              await holdBotCall('answerPreCheckoutQuery', {
                pre_checkout_query_id: item.pre_checkout_query.id,
                ok: true
              });
            }

            // 2. Successful Stars Payment in @HOLDbot
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

            // 3. Handle /start (with optional referral parameter)
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

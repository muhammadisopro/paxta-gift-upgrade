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

// Hard-Capped 1,000,000 $HOLD Tokenomics (3 zeros "000" drop: 1,000 pts = 1 $HOLD)
export const HOLD_TOTAL_SUPPLY_TOKENS = 1_000_000;
export const HOLD_DEFAULT_REDENOM_FACTOR = 1_000;

export const HOLD_TOKENOMICS_ALLOCATION = [
  { id: 'mining',    label: 'Community Mining Pool', pct: 45, tokens: 450_000, color: '#38bdf8' },
  { id: 'airdrop',   label: 'Airdrop & The Final',   pct: 20, tokens: 200_000, color: '#4ade80' },
  { id: 'ecosystem', label: 'Squad Wars & Quests',   pct: 10, tokens: 100_000, color: '#a78bfa' },
  { id: 'liquidity', label: 'Likvidlik & Market',    pct: 15, tokens: 150_000, color: '#fbbf24' },
  { id: 'team',      label: 'Jamoa (Vesting 12 oy)', pct: 10, tokens: 100_000, color: '#f472b6' }
];

export const HOLD_HALVING_STAGES = [
  { stage: 1, name: 'Genesis',      minPct: 0,   maxPct: 25,  multiplier: 1.0,  label: '1.0x' },
  { stage: 2, name: 'Halving I',    minPct: 25,  maxPct: 50,  multiplier: 0.5,  label: '0.5x' },
  { stage: 3, name: 'Halving II',   minPct: 50,  maxPct: 75,  multiplier: 0.25, label: '0.25x' },
  { stage: 4, name: 'Final Phase',  minPct: 75,  maxPct: 100, multiplier: 0.1,  label: '0.1x' }
];

export const HOLD_LEAGUES = [
  {
    id: 'bronze',
    name: 'Bronze',
    trophyImg: '/hold/trophies/bronze.png',
    minHold: 0,
    bonusTap: 0,
    nftPoolCount: 5,
    nftGuarantee: '5 ta Bonus NFT',
    nftRule: 'Haftalik Lucky Draw orqali 5 ta tasodifiy faol ishtirokchiga Victory Medal NFT',
    color: '#d97706',
    glow: 'rgba(217, 119, 6, 0.42)'
  },
  {
    id: 'silver',
    name: 'Silver',
    trophyImg: '/hold/trophies/silver.png',
    minHold: 50_000,
    bonusTap: 1,
    nftPoolCount: 10,
    nftGuarantee: '10 ta Silver NFT',
    nftRule: 'Silver liga yetakchilari va faol chipta egalari oʻrtasida 10 ta NFT',
    color: '#cbd5e1',
    glow: 'rgba(203, 213, 225, 0.42)'
  },
  {
    id: 'gold',
    name: 'Gold',
    trophyImg: '/hold/trophies/gold.png',
    minHold: 250_000,
    bonusTap: 2,
    nftPoolCount: 15,
    nftGuarantee: '15 ta Gold NFT',
    nftRule: 'Gold ligadagi top konchilarga 15 ta Victory Medal & Desk Calendar NFT',
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.48)'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    trophyImg: '/hold/trophies/platinum.png',
    minHold: 1_000_000,
    bonusTap: 3,
    nftPoolCount: 20,
    nftGuarantee: '20 ta Platinum NFT',
    nftRule: 'Platinum liga yetakchilariga 20 ta noyob seriyali NFT',
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.46)'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    trophyImg: '/hold/trophies/diamond.png',
    minHold: 5_000_000,
    bonusTap: 5,
    nftPoolCount: 30,
    nftGuarantee: '30 ta Premium NFT',
    nftRule: 'All-Time Top-10 (#1–#10) mutlaq gʻoliblar + Diamond liga fondidan 30 ta eng noyob NFT',
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

export const STARS_SERVICES = [
  {
    id: 'turbo_24h',
    category: 'turbo',
    badge: '⚡ 24h · 2x',
    name: 'Turbo Mining Pass (24h)',
    desc: '24 soat davomida barcha mining daromadi 2x ga oshadi',
    starsPrice: 50,
    durationMs: 24 * 3600 * 1000,
    mult: 2
  },
  {
    id: 'turbo_7d',
    category: 'turbo',
    badge: '🔥 7 kun · 3x',
    name: 'Turbo Mining Pass (7 kun)',
    desc: '7 kun davomida barcha mining daromadi 3x ga oshadi',
    starsPrice: 250,
    durationMs: 7 * 24 * 3600 * 1000,
    mult: 3
  },
  {
    id: 'halving_shield',
    category: 'shield',
    badge: '🛡️ Doimiy',
    name: 'Halving Shield (1.0x)',
    desc: 'Halving bosqichlarida ham 1.0x mining stavkasini saqlab qoladi',
    starsPrice: 500,
    permanent: true
  },
  {
    id: 'pro_bot_lv2',
    category: 'autobot',
    badge: '🤖 Lv.2 · 2x',
    name: 'Pro Auto-Bot Lv.2',
    desc: 'Offline Auto-Botni yoqadi va tezligini 2x ga oshiradi',
    starsPrice: 300,
    botLevel: 2
  },
  {
    id: 'pro_bot_lv3',
    category: 'autobot',
    badge: '🚀 Lv.3 · 3x',
    name: 'Pro Auto-Bot Lv.3',
    desc: 'Offline Auto-Botni yoqadi va maksimal 3x tezlikka chiqaradi',
    starsPrice: 600,
    botLevel: 3
  },
  {
    id: 'squad_buff_24h',
    category: 'squad',
    badge: '👥 24h · 2x',
    name: 'Squad Power-Up (24h)',
    desc: 'Siz aʼzo boʻlgan butun Squadga 24 soatlik 2x mining buff beradi',
    starsPrice: 200,
    durationMs: 24 * 3600 * 1000,
    mult: 2
  },
  {
    id: 'ref_booster_2x',
    category: 'referral',
    badge: '🤝 Doimiy · 2x',
    name: '2x Referral Booster',
    desc: 'Har bir doʻstingiz uchun 10,000 oʻrniga 20,000 HOLD olasiz',
    starsPrice: 150,
    permanent: true
  },
  {
    id: 'streak_restore',
    category: 'streak',
    badge: '🔥 Tiklash',
    name: 'Streak Restore',
    desc: 'Uzilib qolgan kunlik streak zanjiringizni saqlab tiklaydi',
    starsPrice: 30
  },
  {
    id: 'founder_badge',
    category: 'founder',
    badge: '👑 0% Fee',
    name: 'Founder Badge + Priority Claim',
    desc: 'Leaderboardda 👑 Founder nishoni va TGEda 0% komissiya',
    starsPrice: 200,
    permanent: true
  }
];

function validateHoldServicePurchase(u, st, serviceId) {
  const svc = STARS_SERVICES.find(s => s.id === serviceId);
  if (!svc) return { ok: false, status: 404, error: 'Xizmat topilmadi' };
  const today = todayStr();
  const yesterday = yesterdayStr();

  if (svc.id === 'halving_shield' && u.halvingShield) {
    return { ok: false, status: 400, error: 'Halving Shield allaqachon faol!' };
  }
  if (svc.id === 'ref_booster_2x' && u.refBooster2x) {
    return { ok: false, status: 400, error: '2x Referral Booster allaqachon faol!' };
  }
  if (svc.id === 'founder_badge' && u.founderBadge) {
    return { ok: false, status: 400, error: 'Founder Badge allaqachon faol!' };
  }
  if (svc.id === 'pro_bot_lv2' && (u.autoBotLevel || 1) >= 2) {
    return { ok: false, status: 400, error: 'Auto-Bot darajangiz allaqachon Lv.2 yoki yuqori!' };
  }
  if (svc.id === 'pro_bot_lv3' && (u.autoBotLevel || 1) >= 3) {
    return { ok: false, status: 400, error: 'Auto-Bot darajangiz allaqachon Lv.3!' };
  }
  if (svc.id === 'squad_buff_24h' && (!u.squadId || !st?.squads?.[u.squadId])) {
    return { ok: false, status: 400, error: 'Squad Power-Up uchun avval Squadga qoʻshiling!' };
  }
  if (svc.id === 'streak_restore') {
    if (u.lastStreakDate === today || u.lastStreakDate === yesterday) {
      return { ok: false, status: 400, error: 'Kunlik streakingiz uzilmagan!' };
    }
  }
  return { ok: true, service: svc };
}

function applyHoldService(u, st, serviceId) {
  const check = validateHoldServicePurchase(u, st, serviceId);
  if (!check.ok) return check;
  const svc = check.service;
  const now = Date.now();
  let message = `${svc.name} faollashtirildi!`;

  if (svc.category === 'turbo') {
    const active = (u.turboPassUntil || 0) > now;
    u.turboPassUntil = (active ? u.turboPassUntil : now) + svc.durationMs;
    u.turboPassMult = active ? Math.max(u.turboPassMult || 1, svc.mult) : svc.mult;
    message = `⚡ ${svc.name} faol (${u.turboPassMult}x mining)!`;
  } else if (svc.id === 'halving_shield') {
    u.halvingShield = true;
    message = '🛡️ Halving Shield faollashtirildi (doimiy 1.0x stavka)!';
  } else if (svc.category === 'autobot') {
    u.autoBotEnabled = true;
    u.autoBotLevel = Math.max(u.autoBotLevel || 1, svc.botLevel);
    if (!u.lastAutoBotClaimAt) u.lastAutoBotClaimAt = now;
    message = `🤖 Pro Auto-Bot Lv.${u.autoBotLevel} faollashtirildi (${u.autoBotLevel}x offline tezlik)!`;
  } else if (svc.id === 'squad_buff_24h') {
    const sq = st.squads[u.squadId];
    const sqActive = (sq.buffUntil || 0) > now;
    sq.buffUntil = (sqActive ? sq.buffUntil : now) + svc.durationMs;
    sq.buffMult = 2;
    sq.buffBy = u.username;
    message = `👥 "${sq.name}" squadiga 24 soatlik 2x mining buff yoqildi!`;
  } else if (svc.id === 'ref_booster_2x') {
    u.refBooster2x = true;
    message = '🤝 2x Referral Booster faollashtirildi (20,000 HOLD/doʻst)!';
  } else if (svc.id === 'streak_restore') {
    u.lastStreakDate = yesterdayStr();
    u.streakCount = Math.max(1, u.streakCount || 1);
    message = `🔥 Streak tiklandi (${u.streakCount}-kun)! Endi bugungi mukofotni olishingiz mumkin.`;
  } else if (svc.id === 'founder_badge') {
    u.founderBadge = true;
    u.priorityClaimZeroFee = true;
    message = '👑 Founder Badge va 0% Fee Priority Claim faollashtirildi!';
  }

  if (!Array.isArray(u.purchasedServices)) u.purchasedServices = [];
  u.purchasedServices.push({ id: svc.id, starsPrice: svc.starsPrice, at: new Date().toISOString() });
  return { ok: true, service: svc, message };
}

function getUserMiningBoostMultiplier(u, st) {
  const now = Date.now();
  const turboMult = (u?.turboPassUntil || 0) > now ? Math.max(1, Number(u.turboPassMult) || 2) : 1;
  const sq = u?.squadId && st?.squads?.[u.squadId];
  const squadMult = sq && (sq.buffUntil || 0) > now ? Math.max(1, Number(sq.buffMult) || 2) : 1;
  return turboMult * squadMult;
}

export const BETA_CHALLENGE_REWARD = 5_000_000;
export const BETA_CHALLENGE_MAX_WINNERS = 15;

function getBetaChallengeStatus(st, u) {
  if (!st.betaChallenge || typeof st.betaChallenge !== 'object') {
    st.betaChallenge = { winners: [] };
  }
  const winners = Array.isArray(st.betaChallenge.winners) ? st.betaChallenge.winners : [];
  const claimedEntry = u ? winners.find(w => w.username === u.username) : null;
  const remainingSlots = Math.max(0, BETA_CHALLENGE_MAX_WINNERS - winners.length);

  const conditions = u ? [
    {
      id: 'squad',
      label: 'Squadga qoʻshiling',
      done: !!(u.squadId && st?.squads?.[u.squadId])
    },
    {
      id: 'referral',
      label: 'Kamida 1 ta doʻst taklif qiling',
      done: (u.referrals || []).length >= 1
    },
    {
      id: 'streak',
      label: 'Kunlik Streak mukofotini oling',
      done: (u.streakCount || 0) >= 1
    },
    {
      id: 'cipher',
      label: 'Daily Morse yoki Compass yeching',
      done: (u.morseSolvedDays || []).length >= 1 || (u.compassSolvedDays || []).length >= 1
    },
    {
      id: 'skin',
      label: 'Kamida 1 ta Skin oching / sotib oling',
      done: (u.ownedSkins || []).some(s => s && s !== 'basic')
    }
  ] : [];

  return {
    reward: BETA_CHALLENGE_REWARD,
    maxWinners: BETA_CHALLENGE_MAX_WINNERS,
    claimedCount: winners.length,
    remainingSlots,
    isFull: remainingSlots <= 0,
    claimedByMe: !!claimedEntry,
    myRank: claimedEntry?.rank || null,
    allConditionsDone: conditions.length === 5 && conditions.every(c => c.done),
    conditions,
    winners: winners.map(w => ({
      rank: w.rank,
      username: w.username,
      displayName: w.displayName || w.username,
      claimedAt: w.claimedAt
    }))
  };
}

function recordSkinUnlock(st, u, skinId, source = 'buy', pricePaid = 0) {
  if (!u || !skinId) return;
  if (!Array.isArray(u.ownedSkins)) u.ownedSkins = ['basic'];
  if (!u.ownedSkins.includes(skinId)) u.ownedSkins.push(skinId);

  if (skinId === 'basic') return;
  const nowIso = new Date().toISOString();

  if (!Array.isArray(u.skinHistory)) u.skinHistory = [];
  if (!u.skinHistory.some(h => h.skinId === skinId)) {
    u.skinHistory.push({ skinId, source, pricePaid, at: nowIso });
  }

  if (!st.skinOwners || typeof st.skinOwners !== 'object') st.skinOwners = {};
  if (!Array.isArray(st.skinOwners[skinId])) st.skinOwners[skinId] = [];
  if (!st.skinOwners[skinId].some(e => e.username === u.username)) {
    st.skinOwners[skinId].push({
      username: u.username,
      displayName: u.displayName || u.username,
      paxtaId: u.paxtaId || null,
      skinId,
      source,
      pricePaid,
      at: nowIso
    });
  }
}

function syncAllSkinOwners(st) {
  if (!st.skinOwners || typeof st.skinOwners !== 'object') st.skinOwners = {};
  for (const usr of Object.values(st.users || {})) {
    for (const sk of (usr?.ownedSkins || [])) {
      if (sk && sk !== 'basic') {
        const hist = (usr.skinHistory || []).find(h => h.skinId === sk);
        recordSkinUnlock(st, usr, sk, hist?.source || 'legacy', hist?.pricePaid || 0);
      }
    }
  }
  return st.skinOwners;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

export const HOLD_DAILY_MORSE_WORDS = [
  'HOLD', 'PAXTA', 'SHADE', 'MOON', 'INSIDER', 'SQUAD', 'BOT', 'TON', 'STAR',
  'MEDAL', 'DIAMOND', 'PLATINUM', 'SAPPHIRE', 'EMERALD', 'RUBY', 'BRONZE', 'SILVER', 'GOLD', 'CROWN',
  'ENERGY', 'TURBO', 'BOOST', 'ROCKET', 'STREAK', 'LUCKY', 'TICKET', 'BONUS', 'POWER', 'SPARK',
  'CLICK', 'LEVEL', 'SPEED', 'FLASH', 'MINE', 'SUPER', 'MAGIC', 'SHADOW', 'NIGHT',
  'PIONEER', 'WHALE', 'CHAMPION', 'LEGEND', 'MASTER', 'HERO', 'LEADER', 'WINNER', 'KING', 'CHIEF',
  'GENIUS', 'HUNTER', 'WARRIOR', 'SNIPER', 'SCOUT', 'ELITE',
  'CRYPTO', 'TOKEN', 'WALLET', 'VAULT', 'FORGE', 'MARKET', 'AIRDROP', 'BLOCK', 'CHAIN',
  'FUTURE', 'CYBER', 'MATRIX', 'ORBIT', 'SIGNAL', 'RADAR', 'CIPHER', 'SECRET',
  'VICTORY', 'TROPHY', 'MILLION', 'BILLION', 'RICH', 'JACKPOT', 'REWARD', 'PROFIT', 'FORTUNE',
  'TREASURE', 'VIP', 'INFINITY', 'ALPHA', 'OMEGA', 'APEX', 'ZENITH'
];

export function getDailyMorseWord(dateStr = todayStr()) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return HOLD_DAILY_MORSE_WORDS[hash % HOLD_DAILY_MORSE_WORDS.length];
}

export function formatMorseSymbols(word) {
  return word.split('').map(letter => {
    const raw = MORSE_MAP[letter] || '';
    const formatted = raw.split('').map(c => c === '.' ? '•' : '—').join(' ');
    return `**${letter}**: \`${formatted}\``;
  }).join('\n');
}

export function getLeagueForHold(lifetimeHold) {
  let current = HOLD_LEAGUES[0];
  for (const lg of HOLD_LEAGUES) {
    if (lifetimeHold >= lg.minHold) current = lg;
  }
  return current;
}

const VAULT_DIRS = ['up', 'right', 'down', 'left'];
export const VAULT_DIR_ARROWS = { up: '⬆️', right: '➡️', down: '⬇️', left: '⬅️' };
export const VAULT_DIR_LABELS = { up: 'Tepa', right: 'Oʻng', down: 'Past', left: 'Chap' };

export function formatVaultArrows(sequence) {
  return (Array.isArray(sequence) ? sequence : []).map(d => VAULT_DIR_ARROWS[d] || d).join(' ');
}

export function formatVaultLabels(sequence) {
  return (Array.isArray(sequence) ? sequence : []).map(d => VAULT_DIR_LABELS[d] || d).join(' → ');
}

export function buildVaultCombosCatalog(count = 120) {
  const all = [];
  for (const a of VAULT_DIRS) {
    for (const b of VAULT_DIRS) {
      for (const c of VAULT_DIRS) {
        for (const d of VAULT_DIRS) {
          for (const e of VAULT_DIRS) {
            if (a === b && b === c && c === d && d === e) continue;
            const seq = [a, b, c, d, e];
            if (seq.join(',') === 'up,right,down,left,up') continue;
            all.push(seq);
          }
        }
      }
    }
  }
  // Deterministic stride permutation so consecutive days pick varied directions
  const list = [{
    index: 1,
    sequence: ['up', 'right', 'down', 'left', 'up'],
    arrows: formatVaultArrows(['up', 'right', 'down', 'left', 'up']),
    labels: formatVaultLabels(['up', 'right', 'down', 'left', 'up'])
  }];
  let cursor = 17;
  const step = 37;
  const used = new Set(['up,right,down,left,up']);
  while (list.length < count && used.size < all.length) {
    cursor = (cursor + step) % all.length;
    const seq = all[cursor];
    const key = seq.join(',');
    if (used.has(key)) continue;
    used.add(key);
    list.push({
      index: list.length + 1,
      sequence: seq,
      arrows: formatVaultArrows(seq),
      labels: formatVaultLabels(seq)
    });
  }
  return list;
}

export const HOLD_DAILY_VAULT_COMBOS = buildVaultCombosCatalog(120);

export function getDailyVaultCombo(dateStr = todayStr(), catalog = HOLD_DAILY_VAULT_COMBOS) {
  const list = Array.isArray(catalog) && catalog.length >= 100 ? catalog : HOLD_DAILY_VAULT_COMBOS;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 37 + dateStr.charCodeAt(i)) >>> 0;
  }
  const picked = list[hash % list.length];
  return {
    date: dateStr,
    index: picked.index || ((hash % list.length) + 1),
    totalCombos: list.length,
    sequence: [...picked.sequence],
    arrows: picked.arrows || formatVaultArrows(picked.sequence),
    labels: picked.labels || formatVaultLabels(picked.sequence)
  };
}

export function getActiveDailyVault(st, persistFn = null) {
  if (!st.config) st.config = {};
  let dirty = false;
  if (!Array.isArray(st.config.vaultCombos) || st.config.vaultCombos.length < 100) {
    st.config.vaultCombos = HOLD_DAILY_VAULT_COMBOS.map(c => ({ ...c, sequence: [...c.sequence] }));
    dirty = true;
  }
  const today = todayStr();
  if (!st.config.dailyVault || st.config.dailyVault.date !== today || !Array.isArray(st.config.dailyVault.sequence) || st.config.dailyVault.sequence.length !== 5) {
    st.config.dailyVault = getDailyVaultCombo(today, st.config.vaultCombos);
    dirty = true;
  }
  if (dirty && typeof persistFn === 'function') {
    persistFn(st);
  }
  return {
    ...st.config.dailyVault,
    totalCombos: st.config.vaultCombos.length
  };
}

function isSyntheticUsername(uname) {
  const s = String(uname || '').trim().toLowerCase();
  return !s || s === 'holder' || s === 'user' || /^holder_\d+$/.test(s) || /^guest_\d+$/.test(s);
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

  const bootstrappedStates = new WeakSet();
  const pidIndex = new Map();
  const paxtaVerifyCache = new Map();
  const aggCache = {
    squadsList: null,
    warsRanked: null,
    rankMap: null,
    totalLuckyTickets: null,
    vaultResponse: null
  };

  function invalidateHoldAggCache(scope = 'all') {
    if (scope === 'all' || scope === 'squads') {
      aggCache.squadsList = null;
      aggCache.warsRanked = null;
      aggCache.vaultResponse = null;
    }
    if (scope === 'all' || scope === 'ranks') {
      aggCache.rankMap = null;
      aggCache.vaultResponse = null;
    }
    if (scope === 'all' || scope === 'tickets') {
      aggCache.totalLuckyTickets = null;
    }
    if (scope === 'vault') {
      aggCache.vaultResponse = null;
    }
  }

  function rebuildPidIndex(st) {
    pidIndex.clear();
    for (const [k, usr] of Object.entries(st?.users || {})) {
      if (usr && usr.paxtaId) {
        pidIndex.set(Number(usr.paxtaId), k);
      }
    }
  }

  function findUserByPaxtaId(st, pid) {
    const num = Number(pid || 0);
    if (!num) return null;
    const key = pidIndex.get(num);
    if (key && st?.users?.[key] && Number(st.users[key].paxtaId) === num) {
      return st.users[key];
    }
    const found = Object.values(st?.users || {}).find(x => x && Number(x.paxtaId) === num) || null;
    if (found) pidIndex.set(num, found.username);
    return found;
  }

  // Gentle polynomial upgrade curve (lvl 60 costs ~3M, whole path ~60M) instead of exponential billions
  function upgradeCost(level, base) {
    return Math.round(base * Math.pow(Math.max(1, level), 2.1));
  }

  function createFreshTokenomics(st = null) {
    const factor = HOLD_DEFAULT_REDENOM_FACTOR;
    let sumLife = 0;
    let sumBal = 0;
    if (st && st.users) {
      for (const usr of Object.values(st.users)) {
        if (!usr || isSyntheticUsername(usr.username)) continue;
        sumLife += Math.max(0, Math.floor(usr.lifetimeHold || 0));
        sumBal += Math.max(0, Math.floor(usr.holdBalance || 0));
      }
    }
    const burned = Math.max(0, sumLife - sumBal);
    return {
      totalSupplyTokens: HOLD_TOTAL_SUPPLY_TOKENS,
      redenomFactor: factor,
      mintedPoints: sumLife,
      burnedPoints: burned,
      poolPoints: {
        mining: sumLife,
        airdrop: 0,
        ecosystem: 0
      },
      snapshotLocked: false,
      migratedV4: true,
      migratedV5: true
    };
  }

  function ensureTokenomics(st) {
    if (!st.tokenomics || !st.tokenomics.migratedV4) {
      st.tokenomics = createFreshTokenomics(st);
    }
    if (!st.tokenomics.poolPoints || typeof st.tokenomics.poolPoints !== 'object') {
      st.tokenomics.poolPoints = { mining: st.tokenomics.mintedPoints || 0, airdrop: 0, ecosystem: 0 };
    }
    if (!st.tokenomics.migratedV5) {
      st.tokenomics.totalSupplyTokens = HOLD_TOTAL_SUPPLY_TOKENS;
      st.tokenomics.redenomFactor = HOLD_DEFAULT_REDENOM_FACTOR;
      st.tokenomics.migratedV5 = true;
    }
    if (!st.tokenomics.totalSupplyTokens) st.tokenomics.totalSupplyTokens = HOLD_TOTAL_SUPPLY_TOKENS;
    if (!st.tokenomics.redenomFactor) st.tokenomics.redenomFactor = HOLD_DEFAULT_REDENOM_FACTOR;
    return st.tokenomics;
  }

  function getTokenomicsSummary(st) {
    const tk = ensureTokenomics(st);
    const factor = tk.redenomFactor || HOLD_DEFAULT_REDENOM_FACTOR;
    const totalSupplyTokens = tk.totalSupplyTokens || HOLD_TOTAL_SUPPLY_TOKENS;
    const miningPoolTokens = Math.round(totalSupplyTokens * 0.45);
    const airdropPoolTokens = Math.round(totalSupplyTokens * 0.20);
    const ecosystemPoolTokens = Math.round(totalSupplyTokens * 0.10);
    const gameCapTokens = miningPoolTokens + airdropPoolTokens + ecosystemPoolTokens; // 75%

    const miningCapPoints = miningPoolTokens * factor;
    const airdropCapPoints = airdropPoolTokens * factor;
    const ecosystemCapPoints = ecosystemPoolTokens * factor;
    const gameCapPoints = gameCapTokens * factor;

    const miningUsedPoints = Math.max(0, Math.floor(tk.poolPoints?.mining ?? tk.mintedPoints ?? 0));
    const airdropUsedPoints = Math.max(0, Math.floor(tk.poolPoints?.airdrop || 0));
    const ecosystemUsedPoints = Math.max(0, Math.floor(tk.poolPoints?.ecosystem || 0));
    const mintedPoints = Math.max(0, Math.floor(tk.mintedPoints || 0));
    const burnedPoints = Math.max(0, Math.floor(tk.burnedPoints || 0));
    const circulatingPoints = Math.max(0, mintedPoints - burnedPoints);

    const rawMiningPct = miningCapPoints > 0 ? (miningUsedPoints / miningCapPoints) * 100 : 100;
    const miningProgressPct = Number(Math.min(100, rawMiningPct).toFixed(4));
    const miningExhausted = miningUsedPoints >= miningCapPoints;

    let halving;
    if (miningExhausted) {
      halving = { stage: 5, name: 'Pool Tugagan', minPct: 100, maxPct: 100, multiplier: 0, label: '0x' };
    } else {
      halving = HOLD_HALVING_STAGES.find(h => rawMiningPct >= h.minPct && rawMiningPct < h.maxPct) || HOLD_HALVING_STAGES[3];
    }

    const mintedTokens = Number((mintedPoints / factor).toFixed(2));
    const burnedTokens = Number((burnedPoints / factor).toFixed(2));
    const circulatingTokens = Number((circulatingPoints / factor).toFixed(2));
    const miningUsedTokens = Number((miningUsedPoints / factor).toFixed(2));
    const remainingMiningTokens = Math.max(0, Number(((miningCapPoints - miningUsedPoints) / factor).toFixed(2)));
    const effectiveMaxSupplyTokens = Math.max(0, Number((totalSupplyTokens - burnedPoints / factor).toFixed(2)));

    return {
      totalSupplyTokens,
      effectiveMaxSupplyTokens,
      redenomFactor: factor,
      conversionRule: `${factor} in-game = 1 $HOLD`,
      airdropBasis: 'holdBalance',
      snapshotLocked: !!tk.snapshotLocked,
      mintedPoints,
      burnedPoints,
      circulatingPoints,
      mintedTokens,
      burnedTokens,
      circulatingTokens,
      miningCapTokens: miningPoolTokens,
      miningCapPoints,
      miningUsedPoints,
      miningUsedTokens,
      remainingMiningTokens,
      miningProgressPct,
      miningExhausted,
      gameCapPoints,
      poolCaps: {
        mining: miningCapPoints,
        airdrop: airdropCapPoints,
        ecosystem: ecosystemCapPoints
      },
      poolUsed: {
        mining: miningUsedPoints,
        airdrop: airdropUsedPoints,
        ecosystem: ecosystemUsedPoints
      },
      halving,
      stages: HOLD_HALVING_STAGES,
      allocations: HOLD_TOKENOMICS_ALLOCATION
    };
  }

  function scaleByHalving(st, rawAmount) {
    const val = Math.max(0, Number(rawAmount) || 0);
    if (val <= 0) return 0;
    const tk = getTokenomicsSummary(st);
    if (tk.snapshotLocked || tk.halving.multiplier <= 0) return 0;
    return Math.floor(val * tk.halving.multiplier);
  }

  function debitHold(u, st, cost) {
    const c = Math.max(0, Math.floor(Number(cost) || 0));
    if (c <= 0) return false;
    if ((u.holdBalance || 0) < c) return false;
    const tk = ensureTokenomics(st);
    u.holdBalance -= c;
    tk.burnedPoints = Math.max(0, Math.floor(tk.burnedPoints || 0)) + c;
    return true;
  }

  function creditHold(u, st, amount, opts = {}) {
    const raw = Math.max(0, Number(amount) || 0);
    if (raw <= 0) return 0;
    const tk = ensureTokenomics(st);
    if (tk.snapshotLocked && !opts.forceFull) return 0;

    const summary = getTokenomicsSummary(st);
    const pool = ['mining', 'airdrop', 'ecosystem'].includes(opts.pool) ? opts.pool : 'mining';
    const applyHalving = opts.applyHalving !== undefined ? !!opts.applyHalving : true;
    let mult = applyHalving ? (summary.halving?.multiplier ?? 1) : 1;
    if (applyHalving && u?.halvingShield && mult > 0 && mult < 1) {
      mult = 1;
    }
    if (mult <= 0 && !opts.forceFull) return 0;

    const serviceMult = (!opts.skipServiceBoost && pool === 'mining')
      ? getUserMiningBoostMultiplier(u, st)
      : 1;

    const scaled = raw * mult * serviceMult + (Number(u.pendingFrac) || 0);
    let val = Math.floor(scaled);
    u.pendingFrac = Math.max(0, scaled - val);
    if (val <= 0) return 0;

    if (!opts.forceFull) {
      const poolCap = summary.poolCaps[pool] || summary.miningCapPoints;
      const poolUsed = tk.poolPoints?.[pool] || 0;
      const roomPool = Math.max(0, poolCap - poolUsed);
      const roomGame = Math.max(0, summary.gameCapPoints - (tk.mintedPoints || 0));
      const room = Math.min(roomPool, roomGame);
      if (room <= 0) return 0;
      if (val > room) val = room;
    }

    u.holdBalance = (u.holdBalance || 0) + val;
    u.lifetimeHold = (u.lifetimeHold || 0) + val;
    tk.mintedPoints = (tk.mintedPoints || 0) + val;
    if (!tk.poolPoints) tk.poolPoints = { mining: 0, airdrop: 0, ecosystem: 0 };
    tk.poolPoints[pool] = (tk.poolPoints[pool] || 0) + val;

    const today = todayStr();
    if (!u.dailyHold || typeof u.dailyHold !== 'object') u.dailyHold = {};
    u.dailyHold[today] = (u.dailyHold[today] || 0) + val;
    const wk = warWeekInfo().key;
    if (u.warWeek !== wk) { u.warWeek = wk; u.warEarned = 0; u.warSquadId = null; }
    u.warEarned = (u.warEarned || 0) + val;
    if (u.squadId) u.warSquadId = u.squadId;
    if (u.squadId && st?.squads?.[u.squadId]) {
      const sq = st.squads[u.squadId];
      sq.totalHold = (sq.totalHold || 0) + val;
      if (sq.weekKey !== wk) { sq.weekKey = wk; sq.weekScore = 0; }
      sq.weekScore = (sq.weekScore || 0) + val;
    }
    return val;
  }

  function creditReferralInviter(inviter, st) {
    const baseAmt = inviter?.refBooster2x ? 20_000 : 10_000;
    return creditHold(inviter, st, baseAmt, { pool: 'ecosystem', applyHalving: true });
  }

  // ================= SQUAD WARS (weekly) + FARM ENGINE HELPERS =================
  function warWeekInfo() {
    const OFFSET = 5 * 3600_000; // UTC+5 (Tashkent)
    const d = new Date(Date.now() + OFFSET);
    const dayIdx = (d.getUTCDay() + 6) % 7; // Monday = 0
    const startTz = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - dayIdx * 86400_000;
    return {
      key: new Date(startTz).toISOString().slice(0, 10),
      endsAt: startTz + 7 * 86400_000 - OFFSET
    };
  }

  function getCachedWarsRanked(st, wKey = warWeekInfo().key) {
    const now = Date.now();
    if (
      aggCache.warsRanked &&
      aggCache.warsRanked.week === wKey &&
      now - aggCache.warsRanked.builtAt < 2000
    ) {
      return aggCache.warsRanked.list;
    }
    const list = Object.values(st.squads || {}).map(sq => ({
      id: sq.id,
      name: sq.name,
      members: sq.members || 0,
      verified: !!sq.verified,
      ownerId: sq.ownerId || null,
      owner: sq.ownerUsername || null,
      score: sq.weekKey === wKey ? Math.floor(sq.weekScore || 0) : 0
    })).sort((a, b) => b.score - a.score);
    aggCache.warsRanked = { week: wKey, list, builtAt: now };
    return list;
  }

  function getWarsInfo(st, u) {
    const w = warWeekInfo();
    const prize = st.config?.squadWarPrize || 25_000;
    const ranked = getCachedWarsRanked(st, w.key);
    const uid = Number(u.paxtaId || 0);
    const uname = u.username;
    const myIdx = u.squadId ? ranked.findIndex(s => s.id === u.squadId) : -1;
    const top = ranked.slice(0, 10).map(sq => ({
      id: sq.id,
      name: sq.name,
      members: sq.members,
      verified: sq.verified,
      owner: sq.owner,
      isOwner: !!((sq.ownerId && uid && Number(sq.ownerId) === uid) || (sq.owner && sq.owner === uname)),
      score: sq.score
    }));
    const myRow = myIdx >= 0 ? ranked[myIdx] : null;
    return {
      weekKey: w.key,
      endsAt: w.endsAt,
      prize,
      leaderBonusPct: 20,
      top,
      totalSquads: ranked.length,
      mySquadId: myRow ? myRow.id : null,
      mySquadName: myRow ? myRow.name : null,
      myRank: myIdx >= 0 ? myIdx + 1 : null,
      myScore: myRow ? myRow.score : 0,
      myEarned: u.warWeek === w.key ? Math.floor(u.warEarned || 0) : 0,
      isLeader: myIdx === 0 && ranked[0].score > 0,
      lastWinner: st.config?.lastWarWinner || null
    };
  }

  function getFarmParams(st, u, precomputedWars = null) {
    const speedLevel = Math.min(15, Math.max(1, u.farmSpeedLevel || 1));
    const capLevel = Math.min(5, Math.max(1, u.farmCapLevel || 1));
    const baseRate = 300 + (speedLevel - 1) * 150;
    const today = todayStr();
    const yesterday = yesterdayStr();
    const streakAlive = u.lastStreakDate === today || u.lastStreakDate === yesterday;
    const streakPct = Math.min(7, streakAlive ? (u.streakCount || 0) : 0) * 2;
    const wars = precomputedWars || getWarsInfo(st, u);
    const warPct = wars.isLeader ? wars.leaderBonusPct : 0;
    const rate = Math.round(baseRate * (1 + (streakPct + warPct) / 100));
    const durationHours = 8 + (capLevel - 1) * 2;
    const durationMs = durationHours * 3600_000;
    return {
      speedLevel, capLevel, speedMax: 15, capMax: 5,
      baseRate, streakPct, warPct, rate,
      durationHours, durationMs,
      reward: Math.round(durationHours * rate),
      nextSpeedCost: speedLevel >= 15 ? 0 : upgradeCost(speedLevel, 2500),
      nextCapCost: capLevel >= 5 ? 0 : Math.round(6000 * capLevel * capLevel)
    };
  }

  function buildSquadsList(st) {
    const today = todayStr();
    const wk = warWeekInfo().key;
    const now = Date.now();
    if (
      aggCache.squadsList &&
      aggCache.squadsList.day === today &&
      aggCache.squadsList.week === wk &&
      now - aggCache.squadsList.builtAt < 2000
    ) {
      return aggCache.squadsList.data;
    }
    const dayBySquad = {};
    for (const usr of Object.values(st.users || {})) {
      if (usr?.squadId && st.squads?.[usr.squadId]) {
        dayBySquad[usr.squadId] = (dayBySquad[usr.squadId] || 0) + Math.floor(usr.dailyHold?.[today] || 0);
      }
    }
    const list = Object.values(st.squads || {})
      .map(sq => {
        const totalHold = Math.floor(sq.totalHold || 0);
        const lg = getLeagueForHold(totalHold);
        return {
          ...sq,
          totalHold,
          members: sq.members || 0,
          dailyHoldToday: dayBySquad[sq.id] || 0,
          weekScore: sq.weekKey === wk ? Math.floor(sq.weekScore || 0) : 0,
          league: {
            id: lg.id,
            name: lg.name,
            color: lg.color,
            trophyImg: lg.trophyImg
          }
        };
      })
      .sort((a, b) => b.totalHold - a.totalHold);
    aggCache.squadsList = { day: today, week: wk, data: list, builtAt: now };
    return list;
  }

  function runLuckyDraw(st, weekKey = warWeekInfo().key) {
    if (!st.config) st.config = {};
    const participants = Object.values(st.users || {}).filter(
      usr => usr && !isSyntheticUsername(usr.username) && (usr.luckyTickets || 0) > 0
    );
    const pool = [];
    for (const usr of participants) {
      const t = Math.floor(usr.luckyTickets || 0);
      for (let i = 0; i < t; i++) pool.push(usr);
    }
    if (!pool.length) return null;

    const winner = pool[crypto.randomInt(0, pool.length)];
    const winnerTickets = Math.floor(winner.luckyTickets || 0);
    const rewardHold = creditHold(winner, st, 100_000, { pool: 'ecosystem', applyHalving: false }) || 0;

    const allItems = getVaultItems(st);
    const top10Ids = new Set(getTop10PrizeAllocation(allItems, st).map(p => p.nft?.vaultId).filter(Boolean));
    const claimedIds = new Set((st.nftClaims || []).map(c => c.vaultId).filter(Boolean));
    const medalPool = allItems
      .filter(i => i.nftType === 'medal' && !i.sold && !top10Ids.has(i.vaultId) && !claimedIds.has(i.vaultId))
      .sort((a, b) => (Number(b.isBlack) - Number(a.isBlack)) || (a.number - b.number));
    const pickedMedal = medalPool[0] || allItems.find(i => i.nftType === 'medal' && !i.sold) || null;
    const prizeNftTitle = pickedMedal ? pickedMedal.title : 'Victory Medal NFT';

    if (pickedMedal) {
      if (!Array.isArray(winner.claimedNfts)) winner.claimedNfts = [];
      if (!winner.claimedNfts.includes(pickedMedal.vaultId)) winner.claimedNfts.push(pickedMedal.vaultId);
      if (!Array.isArray(st.nftClaims)) st.nftClaims = [];
      st.nftClaims.push({
        type: 'lucky_draw',
        weekKey,
        username: winner.username,
        displayName: winner.displayName || winner.username,
        paxtaId: winner.paxtaId || null,
        vaultId: pickedMedal.vaultId,
        title: prizeNftTitle,
        link: pickedMedal.link || null,
        rewardHold,
        awardedAt: new Date().toISOString()
      });
    }

    st.config.lastLuckyWinner = {
      username: winner.username,
      displayName: winner.displayName || winner.username,
      ticketCount: winnerTickets,
      poolSize: pool.length,
      rewardHold,
      prizeNft: prizeNftTitle,
      vaultId: pickedMedal?.vaultId || null,
      nftLink: pickedMedal?.link || null,
      weekKey,
      drawnAt: new Date().toISOString()
    };
    st.config.pendingLuckyNotify = {
      username: winner.username,
      paxtaId: winner.paxtaId || null,
      rewardHold,
      prizeNft: prizeNftTitle,
      poolSize: pool.length
    };

    // Reset weekly tickets after each completed weekly draw
    for (const usr of Object.values(st.users || {})) {
      if (usr && (usr.luckyTickets || 0) > 0) usr.luckyTickets = 0;
    }
    return st.config.lastLuckyWinner;
  }

  function settleWars(st) {
    if (!st.config) st.config = {};
    const cur = warWeekInfo();
    const prev = st.config.warsWeekKey;
    if (prev && prev !== cur.key) {
      const ranked = Object.values(st.squads || {})
        .filter(s => s.weekKey === prev && (s.weekScore || 0) > 0)
        .sort((a, b) => (b.weekScore || 0) - (a.weekScore || 0));
      const win = ranked[0];
      if (win) {
        const prize = st.config.squadWarPrize || 25_000;
        let n = 0;
        const winnerKeys = [];
        for (const usr of Object.values(st.users || {})) {
          if (usr.squadId === win.id && usr.warSquadId === win.id && usr.warWeek === prev && (usr.warEarned || 0) > 0) {
            creditHold(usr, st, prize, { pool: 'ecosystem', applyHalving: false });
            winnerKeys.push(usr.username);
            n++;
          }
        }
        st.config.lastWarWinner = { name: win.name, weekKey: prev, prize, members: n, score: Math.floor(win.weekScore || 0) };
        if (winnerKeys.length > 0) {
          st.config.pendingWarNotify = { weekKey: prev, squadName: win.name, prize, userKeys: winnerKeys };
        }
      }
      // Run automatic weekly Lucky Draw alongside week rollover
      runLuckyDraw(st, prev);
      invalidateHoldAggCache('all');
    }
    st.config.warsWeekKey = cur.key;
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
    u.pendingFrac = 0;
    u.farmSpeedLevel = 1;
    u.farmCapLevel = 1;
    u.farmClaimedHold = 0;
    u.farmRefEarnings = 0;
    u.farmStartedAt = Date.now();
    delete u.farmNotifiedFor;
    u.footprintClaimed = false;
    u.footprintDetails = null;
    u.warWeek = null;
    u.warEarned = 0;
    u.warSquadId = null;
  }

  function getDefaultSquads() {
    return {
      insider:  { id: 'insider',  handle: 'insider',  name: 'Insider Official',   members: 0, totalHold: 0, verified: true, link: 'https://paxta.online/insider' },
      medal:    { id: 'medal',    handle: 'MEDAL',    name: 'MEDAL Collectors',   members: 0, totalHold: 0, verified: true, link: 'https://paxta.online/MEDAL' },
      kalendar: { id: 'kalendar', handle: 'Kalendar', name: 'Kalendar Whales',    members: 0, totalHold: 0, verified: true, link: 'https://paxta.online/Kalendar' },
      hold_vip: { id: 'hold_vip', handle: 'HOLDbot',  name: 'Hold Verified Club', members: 0, totalHold: 0, verified: true, link: 'https://paxta.online/u/HOLDbot' }
    };
  }

  function normSquadName(n) {
    const stripped = String(n || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    return stripped || String(n || '').trim().toLowerCase();
  }

  function findSquadByName(st, name, exceptId) {
    const k = normSquadName(name);
    if (!k) return null;
    return Object.values(st.squads || {}).find(s => s.id !== exceptId && normSquadName(s.name) === k) || null;
  }

  // Merge and remove duplicate-named squads: keep strongest squad and reassign members cleanly
  function dedupeSquads(st) {
    const groups = {};
    for (const sq of Object.values(st.squads || {})) {
      const k = normSquadName(sq.name);
      if (!k) continue;
      (groups[k] = groups[k] || []).push(sq);
    }
    let changed = false;
    const curWk = warWeekInfo().key;
    for (const list of Object.values(groups)) {
      if (list.length < 2) continue;
      const cnt = id => Object.values(st.users || {}).filter(x => x && x.squadId === id).length;
      list.sort((a, b) =>
        (cnt(b.id) - cnt(a.id)) ||
        ((b.verified ? 1 : 0) - (a.verified ? 1 : 0)) ||
        ((b.ownerId ? 1 : 0) - (a.ownerId ? 1 : 0)) ||
        ((b.weekScore || 0) - (a.weekScore || 0))
      );
      const keep = list[0];
      for (const drop of list.slice(1)) {
        for (const usr of Object.values(st.users || {})) {
          if (usr && usr.squadId === drop.id) usr.squadId = keep.id;
          if (usr && usr.warSquadId === drop.id) usr.warSquadId = keep.id;
        }
        const keepScore = keep.weekKey === curWk ? (keep.weekScore || 0) : 0;
        const dropScore = drop.weekKey === curWk ? (drop.weekScore || 0) : 0;
        if (keepScore + dropScore > 0 || keep.weekKey === curWk) {
          keep.weekKey = curWk;
          keep.weekScore = keepScore + dropScore;
        }
        if (!keep.ownerId && drop.ownerId) {
          keep.ownerId = drop.ownerId;
          keep.ownerUsername = drop.ownerUsername;
        }
        delete st.squads[drop.id];
        changed = true;
      }
    }
    return changed;
  }

  // Squad totals are always derived from real members (no drift / double counting on join-leave)
  function reconcileSquads(st) {
    let changed = false;
    const members = {};
    const totals = {};
    for (const usr of Object.values(st.users || {})) {
      if (usr?.squadId && st.squads?.[usr.squadId]) {
        members[usr.squadId] = (members[usr.squadId] || 0) + 1;
        totals[usr.squadId] = (totals[usr.squadId] || 0) + Math.floor(usr.lifetimeHold || 0);
      }
    }
    for (const sq of Object.values(st.squads || {})) {
      const m = members[sq.id] || 0;
      const t = totals[sq.id] || 0;
      if (sq.members !== m || sq.totalHold !== t) {
        sq.members = m;
        sq.totalHold = t;
        changed = true;
      }
    }
    return changed;
  }

  // Merge accounts that share the same PaxtaGram ID (created after a username change)
  function mergeDuplicateUsers(st) {
    const byPid = {};
    for (const [k, usr] of Object.entries(st.users || {})) {
      const pid = Number(usr?.paxtaId) || 0;
      if (!pid) continue;
      (byPid[pid] = byPid[pid] || []).push(k);
    }
    let changed = false;
    if (!st.aliases || typeof st.aliases !== 'object') st.aliases = {};
    for (const keys of Object.values(byPid)) {
      if (keys.length < 2) continue;
      keys.sort((a, b) => (st.users[b].lifetimeHold || 0) - (st.users[a].lifetimeHold || 0));
      const keep = keys[0];
      for (const drop of keys.slice(1)) {
        const d = st.users[drop];
        const kp = st.users[keep];
        if (!kp.squadId && d.squadId) kp.squadId = d.squadId;
        if (!kp.referredBy && d.referredBy && d.referredBy !== keep) kp.referredBy = d.referredBy;
        kp.referrals = Array.from(new Set([...(kp.referrals || []), ...(d.referrals || [])])).filter(r => r !== keep);
        st.aliases[drop] = keep;
        delete st.users[drop];
        for (const o of Object.values(st.users)) {
          if (o.referredBy === drop) o.referredBy = keep;
          if (Array.isArray(o.referrals) && o.referrals.includes(drop)) {
            o.referrals = Array.from(new Set(o.referrals.map(r => (r === drop ? keep : r)))).filter(r => r !== o.username);
          }
        }
        changed = true;
      }
    }
    return changed;
  }

  // Resolve a referral code: @username, old username (alias) or numeric PaxtaGram ID -> canonical HOLD username
  function resolveRefKey(st, mainUsers, raw) {
    const s = cleanKey(String(raw || '').replace(/^ref_/i, '').replace(/^@/, ''));
    if (!s) return null;
    if (/^\d{1,12}$/.test(s)) {
      const pid = Number(s);
      const byId = Object.values(st.users || {}).find(x => x && Number(x.paxtaId) === pid);
      if (byId) return byId.username;
      const mu = Object.values(mainUsers || {}).find(x => x && Number(x.paxtaId) === pid);
      return mu ? cleanKey(mu.username) : null;
    }
    if (st.users?.[s]) return s;
    if (st.aliases?.[s] && st.users?.[st.aliases[s]]) return st.aliases[s];
    return s;
  }

  function loadHoldState() {
    const st = loadJSON(holdStateFile, null);
    if (st && st.users && st.config && st.squads) {
      if (bootstrappedStates.has(st)) {
        const todayV = todayStr();
        if (!st.config.dailyVault || st.config.dailyVault.date !== todayV) {
          st.config.dailyVault = getDailyVaultCombo(todayV, st.config.vaultCombos);
          saveJSON(holdStateFile, st);
          invalidateHoldAggCache('vault');
        }
        return st;
      }

      const merged = mergeDuplicateUsers(st);
      const dedup = dedupeSquads(st);
      const recon = reconcileSquads(st);
      if (merged || dedup || recon) saveJSON(holdStateFile, st);
      if (!st.soldMedals) st.soldMedals = {};
      if (!Array.isArray(st.nftClaims)) st.nftClaims = [];
      if (!st.payments) st.payments = { invoices: {}, charges: {}, lastUpdateId: 0 };
      if (!st.config.secretCodes) st.config.secretCodes = { ...DEFAULT_SECRET_CODES };
      if (!Array.isArray(st.config.customQuests)) st.config.customQuests = [...DEFAULT_HOLD_QUESTS];
      let vaultDirty = false;
      if (!Array.isArray(st.config.vaultCombos) || st.config.vaultCombos.length < 100) {
        st.config.vaultCombos = HOLD_DAILY_VAULT_COMBOS.map(c => ({ ...c, sequence: [...c.sequence] }));
        vaultDirty = true;
      }
      const todayV = todayStr();
      if (!st.config.dailyVault || st.config.dailyVault.date !== todayV) {
        st.config.dailyVault = getDailyVaultCombo(todayV, st.config.vaultCombos);
        vaultDirty = true;
      }
      if (vaultDirty) saveJSON(holdStateFile, st);

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
        st.tokenomics = createFreshTokenomics(st);
        saveJSON(holdStateFile, st);
      }
      if (!st.tokenomics || !st.tokenomics.migratedV4) {
        ensureTokenomics(st);
        saveJSON(holdStateFile, st);
      }
      bootstrappedStates.add(st);
      rebuildPidIndex(st);
      return st;
    }

    const initialVaultCatalog = HOLD_DAILY_VAULT_COMBOS.map(c => ({ ...c, sequence: [...c.sequence] }));
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
        vaultCombos: initialVaultCatalog,
        dailyVault: getDailyVaultCombo(todayStr(), initialVaultCatalog),
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
      payments: { invoices: {}, charges: {}, lastUpdateId: 0 },
      tokenomics: createFreshTokenomics(null)
    };
    saveJSON(holdStateFile, initial);
    bootstrappedStates.add(initial);
    rebuildPidIndex(initial);
    return initial;
  }

  function saveHoldState(st) {
    saveJSON(holdStateFile, st);
  }

  function getActiveDailyMorse(st) {
    const today = todayStr();
    if (!st.config) st.config = {};
    if (!st.config.dailyMorse) st.config.dailyMorse = {};
    if (!st.config.dailyMorse.date || st.config.dailyMorse.date !== today) {
      st.config.dailyMorse.date = today;
      st.config.dailyMorse.word = getDailyMorseWord(today);
      st.config.dailyMorse.reward = 50_000;
      st.config.dailyMorse.hint = `Bugungi kunlik maxfiy soʻz (${st.config.dailyMorse.word.length} ta harf)`;
      saveHoldState(st);
    }
    return st.config.dailyMorse;
  }

  async function broadcastDailyMorseToChannel(word, reward = 50_000) {
    const breakdown = formatMorseSymbols(word);
    const text =
      `🕵️‍♂️ **BUGUNGI KUNLIK MORZE KODI**\n\n` +
      `Bugungi maxfiy soʻz: **${word}**\n\n` +
      `Harflar Morze alifbosida:\n${breakdown}\n\n` +
      `🎁 **Mukofot:** +${reward.toLocaleString('en-US')} $HOLD + 1 🎟 Lucky Ticket\n\n` +
      `_Tangani qisqa bosish: • (nuqta)_\n` +
      `_Tangani ushlab turish: — (chiziq)_\n\n` +
      `👉 Mini App: @HOLDbot`;

    return await holdBotCall('sendMessage', {
      chat_id: '@insider',
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🪙 HOLD botga kirish', url: 'https://paxta.online/u/HOLDbot' }]
        ]
      }
    });
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
  function normalizePaxtaMediaUrl(u) {
    if (!u) return null;
    const raw = typeof u === 'string' ? u : (u.url || u.thumb || u.photo || null);
    if (!raw || typeof raw !== 'string') return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://paxta.online${raw.startsWith('/') ? '' : '/'}${raw}`;
  }

  async function verifyOnPaxtaGram(handleRaw) {
    const clean = String(handleRaw || '')
      .replace(/^https?:\/\/(www\.)?paxta\.online\//i, '')
      .replace(/^@/, '')
      .replace(/[/?#].*$/, '')
      .trim();
    if (!clean || isSyntheticUsername(clean)) return null;

    const cacheKey = clean.toLowerCase();
    const cached = paxtaVerifyCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const storeCache = (val, ttlMs) => {
      if (paxtaVerifyCache.size >= 500) {
        const firstKey = paxtaVerifyCache.keys().next().value;
        if (firstKey !== undefined) paxtaVerifyCache.delete(firstKey);
      }
      paxtaVerifyCache.set(cacheKey, { value: val, expiresAt: Date.now() + ttlMs });
      return val;
    };

    // 1. Official PaxtaGram Search API (/api/search?q=) — resolves channels, groups & users with real titles
    try {
      if (typeof moonClient?.resolveChatByUsername === 'function') {
        const ch = await moonClient.resolveChatByUsername(clean);
        if (ch && (ch.id || ch.title || ch.username)) {
          return storeCache({
            id: ch.id ? Number(ch.id) : null,
            username: ch.username || clean,
            title: ch.title || ch.name || ch.username || clean,
            avatar: normalizePaxtaMediaUrl(ch.photo || ch.avatar_url || null),
            membersCount: Number(ch.members_count || 0),
            isVerified: !!ch.verified,
            type: ch.type || 'channel',
            verified: true
          }, 5 * 60_000);
        }
      }
    } catch {}

    // 2. Fallback Bot API getChat (if supported)
    try {
      const chatRes = await holdBotCall('getChat', { chat_id: `@${clean}` });
      if (chatRes && chatRes.ok && chatRes.result) {
        const ch = chatRes.result;
        return storeCache({
          id: ch.id,
          username: ch.username || clean,
          title: ch.title || ch.first_name || clean,
          type: ch.type || 'channel',
          verified: true
        }, 5 * 60_000);
      }
    } catch {}

    // 3. Fallback MoonClient resolveUserByUsername
    try {
      const u = await moonClient.resolveUserByUsername(clean);
      if (u && u.id) {
        return storeCache({
          id: Number(u.id),
          username: u.username || clean,
          title: u.name || u.first_name || u.username || clean,
          avatar: normalizePaxtaMediaUrl(u.avatar_url || null),
          isVerified: !!u.is_verified,
          isPremium: !!u.is_premium,
          createdAt: u.created_at || null,
          type: 'user',
          verified: true
        }, 5 * 60_000);
      }
    } catch {}

    // 4. Only accept public page if explicit non-generic og:title exists (never match SPA shell <title>PaxtaGram</title>)
    try {
      const res = await fetch(`https://paxta.online/${encodeURIComponent(clean)}`, {
        method: 'GET',
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const html = await res.text();
        const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
        const ogTitle = ogMatch ? ogMatch[1].replace(/\s*[-|]\s*PaxtaGram.*/i, '').trim() : '';
        if (ogTitle && ogTitle.toLowerCase() !== 'paxtagram') {
          return storeCache({
            id: null,
            username: clean,
            title: ogTitle,
            type: 'channel',
            verified: true
          }, 5 * 60_000);
        }
      }
    } catch {}

    return storeCache(null, 60_000);
  }

  function getCachedRankMap(st) {
    const now = Date.now();
    if (aggCache.rankMap && now - aggCache.rankMap.builtAt < 2000) {
      return aggCache.rankMap.map;
    }
    const sorted = Object.values(st.users || {}).sort((a, b) => (b.lifetimeHold || 0) - (a.lifetimeHold || 0));
    const map = new Map();
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i]?.username) map.set(sorted[i].username, i + 1);
    }
    aggCache.rankMap = { map, size: sorted.length, builtAt: now };
    return map;
  }

  function computeUserRank(st, usernameKey) {
    const map = getCachedRankMap(st);
    const r = map.get(usernameKey);
    return r || (map.size + 1);
  }

  function getCachedTotalLuckyTickets(st) {
    const now = Date.now();
    if (aggCache.totalLuckyTickets && now - aggCache.totalLuckyTickets.builtAt < 5000) {
      return aggCache.totalLuckyTickets.value;
    }
    let total = 0;
    for (const usr of Object.values(st.users || {})) {
      if (usr && !isSyntheticUsername(usr.username)) {
        total += Math.floor(usr.luckyTickets || 0);
      }
    }
    aggCache.totalLuckyTickets = { value: total, builtAt: now };
    return total;
  }

  function getOrCreateHoldUser(usernameRaw, displayNameRaw, paxtaId = null, refCode = null, avatarUrl = null) {
    const st = loadHoldState();
    let key = cleanKey(usernameRaw);
    const mainUsers = loadJSON(usersFile, {});

    // Identity is bound to PaxtaGram ID, not to @username (users may rename themselves)
    if (!st.aliases || typeof st.aliases !== 'object') st.aliases = {};
    if (!st.users[key] && st.aliases[key] && st.users[st.aliases[key]]) {
      key = st.aliases[key];
    }
    const earlyPid = Number(paxtaId || mainUsers[key]?.paxtaId || 0) || null;
    if (earlyPid) {
      const owner = findUserByPaxtaId(st, earlyPid);
      if (owner && owner.username !== key) {
        st.aliases[cleanKey(usernameRaw)] = owner.username;
        st.aliases[key] = owner.username;
        key = owner.username;
        saveHoldState(st);
      }
    }

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
        const refKey = resolveRefKey(st, mainUsers, refCode);
        if (refKey && refKey !== key) {
          if (!st.users[refKey] && mainUsers[refKey]) {
            st.users[refKey] = {
              username: refKey,
              displayName: cleanName(mainUsers[refKey]?.displayName || refKey),
              paxtaId: mainUsers[refKey]?.paxtaId || null,
              avatarUrl: mainUsers[refKey]?.avatarUrl || null,
              paxtaVerified: !!mainUsers[refKey]?.paxtaId,
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
          }
          if (st.users[refKey]) {
            st.users[key].referredBy = refKey;
            creditHold(st.users[key], st, 5_000, { pool: 'ecosystem', applyHalving: true });
            if (!st.users[refKey].referrals.includes(key)) {
              st.users[refKey].referrals.push(key);
              creditReferralInviter(st.users[refKey], st);
            }
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
        const refKey = resolveRefKey(st, mainUsers, refCode);
        if (refKey && refKey !== key) {
          if (!st.users[refKey] && mainUsers[refKey]) {
            st.users[refKey] = {
              username: refKey,
              displayName: cleanName(mainUsers[refKey]?.displayName || refKey),
              paxtaId: mainUsers[refKey]?.paxtaId || null,
              avatarUrl: mainUsers[refKey]?.avatarUrl || null,
              paxtaVerified: !!mainUsers[refKey]?.paxtaId,
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
          }
          if (st.users[refKey] && !st.users[refKey].referrals.includes(key)) {
            st.users[key].referredBy = refKey;
            creditHold(st.users[key], st, 5_000, { pool: 'ecosystem', applyHalving: true });
            st.users[refKey].referrals.push(key);
            creditReferralInviter(st.users[refKey], st);
          }
        }
      }
    }

    const u = st.users[key];
    if (u?.paxtaId) pidIndex.set(Number(u.paxtaId), key);
    const now = Date.now();
    const today = todayStr();
    settleWars(st);

    // Daily free boosts reset
    if (u.lastBoostResetDay !== today) {
      u.fullTankCount = 3;
      u.rocketCount = 3;
      u.lastBoostResetDay = today;
    }

    // Initialize 8-Hour Farm and Footprint if missing
    if (!u.farmStartedAt) u.farmStartedAt = now - 3600_000;
    if (!u.farmDurationMs) u.farmDurationMs = 8 * 3600 * 1000;
    if (!u.farmRatePerHour) u.farmRatePerHour = 300;
    if (u.farmClaimedHold === undefined) u.farmClaimedHold = 0;
    if (u.farmRefEarnings === undefined) u.farmRefEarnings = 0;

    // Regenerate energy (fractional ms precision so rapid taps <1s still accumulate regen)
    const maxE = 1000 + (u.energyLevel || 1) * 500;
    u.maxEnergy = maxE;
    const elapsedMs = Math.max(0, now - (u.lastEnergyAt || now));
    if (elapsedMs > 0) {
      const regenRate = 3 + Math.floor((u.energyLevel || 1) / 2) + ((u.rechargingSpeedLevel || 1) - 1) * 2;
      u.energy = Math.min(maxE, (u.energy || 0) + (elapsedMs / 1000) * regenRate);
    }
    u.lastEnergyAt = now;

    // Auto Tap Bot offline earnings (capped hourly & halved by active epoch)
    let passiveEarned = 0;
    const botElapsedMs = Math.max(0, now - (u.lastAutoBotClaimAt || now));
    if (u.autoBotEnabled && botElapsedMs >= 30_000) {
      const cappedHours = Math.min(8, botElapsedMs / (3600 * 1000));
      const botMult = (u.autoBotLevel || 1) >= 3 ? 3 : ((u.autoBotLevel || 1) === 2 ? 2 : 1);
      const hourlyRate = Math.min(5_000, (u.tapLevel || 1) * 350) * botMult;
      const rawPassive = Math.floor(hourlyRate * cappedHours);
      if (rawPassive > 0) {
        passiveEarned = creditHold(u, st, rawPassive, { pool: 'mining', applyHalving: true });
      }
      u.lastAutoBotClaimAt = now;
    } else if (botElapsedMs >= 30_000) {
      u.lastAutoBotClaimAt = now;
    }

    return { st, u, mainUser: mainUsers[key], passiveEarned };
  }

  function formatHoldUserResponse(st, u, mainUser, passiveEarned = 0) {
    const now = Date.now();
    const today = todayStr();
    const yesterday = yesterdayStr();
    const league = getLeagueForHold(u.lifetimeHold || 0);
    const happyHour = getHappyHourStatus(st);
    const baseTapPower = (u.tapLevel || 1) + (league.bonusTap || 0);
    const tapPower = baseTapPower * (happyHour.active ? happyHour.multiplier : 1);

    const dailyMorseObj = getActiveDailyMorse(st);
    const morseWord = (dailyMorseObj.word || 'HOLD').toUpperCase();
    const morseReward = dailyMorseObj.reward || 50_000;
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

    const tkSummary = getTokenomicsSummary(st);
    const halvingMult = tkSummary.halving?.multiplier ?? 1;

    // 8-Hour Farming calculation (reuse single getWarsInfo computation)
    const warsInfo = getWarsInfo(st, u);
    const fpm = getFarmParams(st, u, warsInfo);
    const farmDuration = fpm.durationMs;
    const farmRate = Math.floor(fpm.rate * halvingMult);
    const farmRewardMax = Math.floor(fpm.reward * halvingMult);
    const farmElapsed = Math.max(0, now - (u.farmStartedAt || (now - 3600_000)));
    const farmRatio = Math.min(1, farmElapsed / farmDuration);
    const currentFarmed = Math.min(farmRewardMax, Math.floor(farmRewardMax * farmRatio));
    const farmRemainingMs = Math.max(0, farmDuration - farmElapsed);
    const farmCanClaim = farmElapsed >= farmDuration;

    // Footprint stats calculation
    const fpAgeBonus = (pid <= 150 ? 25000 : pid <= 600 ? 15000 : pid <= 1500 ? 10000 : 5000);
    const fpTierName = (pid <= 150 ? 'Pioneer Genesis' : pid <= 600 ? 'Early Pioneer' : pid <= 1500 ? 'Veteran Holder' : 'Verified Member');
    const fpMedalsCount = Array.isArray(mainUser?.medals) ? mainUser.medals.length : (Array.isArray(u.claimedNfts) ? u.claimedNfts.length : 1);
    const fpNftBonus = Math.min(45000, Math.max(15000, fpMedalsCount * 15000));
    const fpCommunityBonus = 10000;
    const fpTotalAirdrop = fpAgeBonus + fpNftBonus + fpCommunityBonus;

    // Streak calculation
    const streakClaimedToday = u.lastStreakDate === today;
    const streakAlive = u.lastStreakDate === today || u.lastStreakDate === yesterday;
    const currentStreakDay = streakClaimedToday
      ? (u.streakCount || 1)
      : streakAlive
        ? ((u.streakCount || 0) % 7) + 1
        : 1;

    // Total lucky tickets in pool + active daily vault
    const totalLuckyTickets = getCachedTotalLuckyTickets(st);
    const myTickets = Math.floor(u.luckyTickets || 0);
    const winChancePct = totalLuckyTickets > 0 && myTickets > 0
      ? Number(((myTickets / totalLuckyTickets) * 100).toFixed(1))
      : 0;
    const wkInfo = warWeekInfo();
    const dailyVaultObj = getActiveDailyVault(st, saveHoldState);
    const compassSolvedToday = (u.compassSolvedDays || []).includes(today);

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
      stars: 0,
      holdBalance: Math.floor(u.holdBalance || 0),
      holdTokens: Number((Math.floor(u.holdBalance || 0) / tkSummary.redenomFactor).toFixed(2)),
      lifetimeHold: Math.floor(u.lifetimeHold || 0),
      dailyHoldToday: Math.floor(u.dailyHold?.[today] || 0),
      passiveEarnedJustNow: passiveEarned,
      tokenomics: {
        ...tkSummary,
        userHoldTokens: Number((Math.floor(u.holdBalance || 0) / tkSummary.redenomFactor).toFixed(2))
      },
      tapPower,
      baseTapPower,
      tapLevel: u.tapLevel || 1,
      nextTapUpgradeCost: upgradeCost(u.tapLevel || 1, 600),
      energy: Math.floor(u.energy || 0),
      maxEnergy: u.maxEnergy,
      energyLevel: u.energyLevel || 1,
      nextEnergyUpgradeCost: upgradeCost(u.energyLevel || 1, 400),
      rechargingSpeedLevel: rSpeedLvl,
      rechargingSpeedMax: 10,
      nextRechargingUpgradeCost: rSpeedLvl >= 10 ? 0 : upgradeCost(rSpeedLvl, 1200),
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
        canClaimToday: !streakClaimedToday,
        currentDay: streakClaimedToday ? (u.streakCount || 1) : (streakAlive ? (u.streakCount || 0) : 0),
        nextDay: currentStreakDay,
        nextRewardHold: scaleByHalving(st, DAILY_STREAK_REWARDS[currentStreakDay - 1] || 1_000),
        streakCount: streakAlive ? (u.streakCount || 0) : 0,
        rewards: DAILY_STREAK_REWARDS.map((hold, i) => ({ day: i + 1, hold: scaleByHalving(st, hold) })),
        todayReward: scaleByHalving(st, DAILY_STREAK_REWARDS[currentStreakDay - 1] || 1_000)
      },
      luckyDraw: {
        myTickets,
        totalPoolTickets: totalLuckyTickets,
        winChancePct,
        endsAt: wkInfo.endsAt,
        weekKey: wkInfo.key,
        prizeTitle: 'Victory Medal NFT + 100,000 HOLD',
        lastWinner: st.config?.lastLuckyWinner || null
      },
      vault: {
        date: dailyVaultObj.date,
        index: dailyVaultObj.index,
        totalCombos: dailyVaultObj.totalCombos,
        sequence: dailyVaultObj.sequence,
        arrows: dailyVaultObj.arrows,
        reward: scaleByHalving(st, 30_000),
        solvedToday: compassSolvedToday
      },
      squadWarPrize: st.config?.squadWarPrize || 25_000,
      morse: {
        wordLength: morseWord.length,
        word: morseWord,
        secretWords: Object.keys(st.config?.secretCodes || DEFAULT_SECRET_CODES),
        secretCodesMap: st.config?.secretCodes || DEFAULT_SECRET_CODES,
        hint: dailyMorseObj?.hint || 'Maxfiy soʻzni Morze alifbosida tering',
        reward: scaleByHalving(st, morseReward),
        solvedToday,
        lettersGuide: morseOverlay
      },
      squadId: u.squadId,
      squads: buildSquadsList(st),
      referredBy: u.referredBy || null,
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
      starsServices: STARS_SERVICES,
      services: {
        turboPassUntil: u.turboPassUntil || 0,
        turboPassMult: (u.turboPassUntil || 0) > now ? (u.turboPassMult || 2) : 1,
        halvingShield: !!u.halvingShield,
        autoBotLevel: u.autoBotLevel || (u.autoBotEnabled ? 1 : 0),
        refBooster2x: !!u.refBooster2x,
        founderBadge: !!u.founderBadge,
        priorityClaimZeroFee: !!u.priorityClaimZeroFee,
        squadBuffUntil: (u.squadId && st?.squads?.[u.squadId]?.buffUntil) || 0,
        canRestoreStreak: u.lastStreakDate !== todayStr() && u.lastStreakDate !== yesterdayStr(),
        activeMiningMultiplier: getUserMiningBoostMultiplier(u, st)
      },
      betaChallenge: getBetaChallengeStatus(st, u),
      claimedNfts: u.claimedNfts || [],
      secretCodesClaimed: u.secretCodesClaimed || [],
      compassSolvedToday: (u.compassSolvedDays || []).includes(todayStr()),
      turboActiveUntil: u.turboActiveUntil || 0,
      farm: {
        startedAt: u.farmStartedAt || (now - 3600_000),
        durationMs: farmDuration,
        ratePerHour: farmRate,
        totalFarmReward: farmRewardMax,
        currentFarmed,
        elapsedMs: farmElapsed,
        remainingMs: farmRemainingMs,
        canClaim: farmCanClaim,
        claimedTotal: u.farmClaimedHold || 0,
        refEarnings: u.farmRefEarnings || 0,
        speedLevel: fpm.speedLevel,
        capLevel: fpm.capLevel,
        speedMax: fpm.speedMax,
        capMax: fpm.capMax,
        nextSpeedCost: fpm.nextSpeedCost,
        nextCapCost: fpm.nextCapCost,
        baseRate: fpm.baseRate,
        streakPct: fpm.streakPct,
        warPct: fpm.warPct,
        durationHours: fpm.durationHours
      },
      wars: warsInfo,
      footprint: {
        claimed: !!u.footprintClaimed,
        details: u.footprintDetails || null,
        listingDate: '2026-12-15T00:00:00.000Z',
        paxtaId: u.paxtaId,
        tierName: fpTierName,
        ageBonus: fpAgeBonus,
        nftCount: fpMedalsCount,
        nftBonus: fpNftBonus,
        communityBonus: fpCommunityBonus,
        totalAirdrop: fpTotalAirdrop
      },
      listingDate: '2026-12-15T00:00:00.000Z'
    };
  }

  // ---- Auth guard: game actions are bound to the authenticated PaxtaGram account (never trust body.username) ----
  const AUTH_POSTS = new Set([
    '/claim-ref', '/claim-og', '/farm-claim', '/farm-upgrade', '/farm-claim-ref', '/footprint-claim',
    '/claim-streak', '/tap', '/boost', '/skin', '/solve-morse', '/join-squad', '/start-quest',
    '/claim-quest', '/buy-vip-pack', '/buy-service', '/create-invoice', '/solve-compass', '/claim-beta-challenge',
    '/squad-rename', '/squad-claim', '/squad-members'
  ]);
  app.use('/api/hold', (req, res, next) => {
    if (req.method !== 'POST' || !AUTH_POSTS.has(req.path)) return next();
    let uname = null;
    let pid = null;
    const session = verifySessionToken(req.headers['x-auth-token'] || req.body?.authToken);
    if (session && !isSyntheticUsername(session.username)) {
      uname = session.username;
      pid = Number(session.paxtaId) || null;
    } else {
      const iu = verifyWebAppInitData(req.headers['x-init-data'] || req.body?.initData);
      if (iu && iu.verified) {
        uname = iu.username || iu.first_name || `paxta_${iu.id}`;
        pid = Number(iu.id) || null;
      }
    }
    if (!uname) {
      return res.status(401).json({ ok: false, error: 'Avtorizatsiya talab qilinadi. Ilovani qayta oching.' });
    }
    try {
      if (pid) {
        const st0 = loadHoldState();
        const owner = findUserByPaxtaId(st0, pid);
        if (owner) uname = owner.username;
      }
    } catch {}
    req.body = req.body || {};
    req.body.username = uname;
    next();
  });

  // ---- Serve /hold WebApp Page ----
  app.get(['/hold', '/hold/'], (req, res) => {
    res.sendFile(path.join(publicDir, 'hold', 'index.html'));
  });

  // Unverified (client-claimed) identity may only create brand-new accounts - never enter an existing/admin one
  function isTakeoverRisk(usernameRaw, pid) {
    const k = cleanKey(usernameRaw);
    if (!k) return true;
    if (['moon', 'shade', 'muhammadiso'].includes(k)) return true;
    if (pid && Number(pid) === Number(ADMIN_PAXTA_ID)) return true;
    const s0 = loadHoldState();
    if (s0.users?.[k] || s0.aliases?.[k]) return true;
    if (pid && Object.values(s0.users || {}).some(x => x && Number(x.paxtaId) === Number(pid))) return true;
    return false;
  }

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
    let identityVerified = false;
    if (session && !isSyntheticUsername(session.username)) {
      resolvedUsername = session.username;
      if (session.paxtaId) resolvedPaxtaId = Number(session.paxtaId);
      identityVerified = true;
    }

    // 2. Check PaxtaGram WebApp initData (#tgWebAppData or window.Telegram.WebApp.initData)
    const initData = req.headers['x-init-data'] || req.body?.initData;
    const webAppUser = verifyWebAppInitData(initData);
    if (webAppUser && webAppUser.verified) {
      identityVerified = true;
      resolvedUsername = webAppUser.username || webAppUser.first_name || `paxta_${webAppUser.id}`;
      resolvedDisplayName = [webAppUser.first_name, webAppUser.last_name].filter(Boolean).join(' ') || resolvedUsername;
      resolvedPaxtaId = Number(webAppUser.id);
      if (webAppUser.photo_url) resolvedAvatar = webAppUser.photo_url;
    } else if (webAppUser && !resolvedUsername) {
      resolvedUsername = webAppUser.username || webAppUser.first_name || null;
    }
    // Client-claimed PaxtaGram ID is never trusted without cryptographic proof
    if (!identityVerified) resolvedPaxtaId = null;

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

    if (!identityVerified && isTakeoverRisk(resolvedUsername, resolvedPaxtaId)) {
      return res.json({ ok: false, needsPaxtaLogin: true, error: 'Bu akkaunt himoyalangan. @HOLDbot ga /start yozib, bot bergan tugma orqali kiring.' });
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

    {
      const sess = verifySessionToken(req.headers['x-auth-token'] || req.body?.authToken);
      const iu = verifyWebAppInitData(req.headers['x-init-data'] || req.body?.initData);
      const proven = !!((sess && (cleanKey(sess.username) === cleanKey(resolvedUsername) || (resolvedPaxtaId && Number(sess.paxtaId) === Number(resolvedPaxtaId)))) ||
        (iu && iu.verified && resolvedPaxtaId && Number(iu.id) === Number(resolvedPaxtaId)));
      if (!proven && isTakeoverRisk(resolvedUsername, resolvedPaxtaId)) {
        return res.status(403).json({ ok: false, error: 'Bu akkaunt mavjud. Kirish uchun @HOLDbot ga /start yozing va bot bergan tugmani bosing.' });
      }
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

  // ---- 1C. Claim Referral by Friend's @username Inside App (Zero External Redirect!) ----
  app.post('/api/hold/claim-ref', async (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    if (u.referredBy) {
      return res.status(400).json({ ok: false, error: `Siz allaqachon @${u.referredBy} tomonidan taklif qilingansiz` });
    }
    const rawFriend = req.body?.friendUsername || req.body?.refUsername || req.body?.refCode || '';
    const friendKey0 = cleanKey(String(rawFriend).replace(/^ref_/i, '').replace(/^@/, ''));
    const friendKey = resolveRefKey(st, loadJSON(usersFile, {}), rawFriend) || friendKey0;
    if (!friendKey || friendKey === u.username) {
      return res.status(400).json({ ok: false, error: 'Doʻstingizning @username manzilini kiriting' });
    }
    const friendUser = st.users[friendKey];
    if (!friendUser) {
      return res.status(404).json({ ok: false, error: `@${friendKey0} HOLD'da topilmadi. Avval u botga kirishi kerak` });
    }
    if (friendUser.referredBy === u.username) {
      return res.status(400).json({ ok: false, error: 'Bu foydalanuvchi sizni allaqachon taklif qilgan' });
    }
    if (!Array.isArray(friendUser.referrals)) friendUser.referrals = [];

    u.referredBy = friendKey;
    const inviteeAward = creditHold(u, st, 5_000, { pool: 'ecosystem', applyHalving: true });
    let inviterAward = 0;
    if (!friendUser.referrals.includes(u.username)) {
      friendUser.referrals.push(u.username);
      inviterAward = creditReferralInviter(friendUser, st);
    }
    saveHoldState(st);

    if (friendUser.paxtaId && String(friendUser.paxtaId) !== String(u.paxtaId) && inviterAward > 0) {
      try {
        await holdBotCall('sendMessage', {
          chat_id: friendUser.paxtaId,
          text: `🎉 <b>Yangi doʻstingiz qoʻshildi!</b>\n\n<b>@${escHtml(u.username)}</b> ilovada sizni taklif qiluvchi deb kiritdi!\n💰 Hisobingizga <b>+${inviterAward.toLocaleString()} $HOLD</b> qoʻshildi! 🚀`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🪙 $HOLD ga kirish', url: 'https://paxta.online/u/HOLDbot' }]
            ]
          }
        });
      } catch (err) {}
    }

    res.json({
      ok: true,
      message: `🎉 @${friendKey} taklifi qabul qilindi · +${inviteeAward.toLocaleString()} HOLD!`,
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
    const ogCredited = creditHold(u, st, totalBonus, { pool: 'airdrop', applyHalving: false });
    u.ogDetails = {
      paxtaId: pid,
      tierName,
      idBonus,
      activityBonus,
      totalBonus: ogCredited
    };
    saveHoldState(st);

    res.json({
      ok: true,
      ogDetails: u.ogDetails,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 2B1. Claim 8-Hour Farm Yield ----
  app.post('/api/hold/farm-claim', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const now = Date.now();
    const fpm = getFarmParams(st, u);
    const duration = fpm.durationMs;
    const totalFarmReward = fpm.reward;

    const elapsed = Math.max(0, now - (u.farmStartedAt || (now - 3600_000)));
    if (elapsed < duration) {
      const remainingSec = Math.ceil((duration - elapsed) / 1000);
      return res.status(400).json({
        ok: false,
        error: `Fermerlik hali to'lmadi. Qolgan vaqt: ${Math.floor(remainingSec / 60)} daqiqa`
      });
    }

    // Award farmed HOLD (subject to active halving + mining pool hard cap)
    const creditedFarm = creditHold(u, st, totalFarmReward, { pool: 'mining', applyHalving: true });
    if (creditedFarm <= 0) {
      return res.status(400).json({ ok: false, error: 'Mining Pool toʻldi yoki Snapshot muzlatilgan!' });
    }
    u.farmClaimedHold = (u.farmClaimedHold || 0) + creditedFarm;
    u.farmStartedAt = now; // Restart farming timer immediately!
    delete u.farmNotifiedFor;

    // 10% referral kickback to inviter
    if (u.referredBy && st.users[u.referredBy]) {
      const inviter = st.users[u.referredBy];
      const refShare = Math.floor(creditedFarm * 0.10);
      inviter.farmRefEarnings = (inviter.farmRefEarnings || 0) + refShare;
    }

    saveHoldState(st);

    res.json({
      ok: true,
      reward: creditedFarm,
      message: `🌾 +${creditedFarm.toLocaleString()} $HOLD hosili yig'ib olindi!`,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 2B1b. Upgrade Farm (speed / storage -> BURNED) ----
  app.post('/api/hold/farm-upgrade', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const type = req.body?.type;
    const p = getFarmParams(st, u);
    if (type === 'speed') {
      if (p.speedLevel >= p.speedMax) return res.status(400).json({ ok: false, error: 'Maksimal darajaga yetgan' });
      if (!debitHold(u, st, p.nextSpeedCost)) return res.status(400).json({ ok: false, error: 'Balans yetarli emas' });
      u.farmSpeedLevel = p.speedLevel + 1;
    } else if (type === 'cap') {
      if (p.capLevel >= p.capMax) return res.status(400).json({ ok: false, error: 'Maksimal darajaga yetgan' });
      if (!debitHold(u, st, p.nextCapCost)) return res.status(400).json({ ok: false, error: 'Balans yetarli emas' });
      u.farmCapLevel = p.capLevel + 1;
    } else {
      return res.status(400).json({ ok: false, error: 'Notoʻgʻri tur' });
    }
    saveHoldState(st);
    res.json({
      ok: true,
      message: type === 'speed' ? '⚡ Farm tezligi oshirildi! (🔥 Burn)' : '📦 Farm sigʻimi oshirildi! (🔥 Burn)',
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 2B2. Claim Referral Farming Kickback ----
  app.post('/api/hold/farm-claim-ref', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const refEarnings = u.farmRefEarnings || 0;
    if (refEarnings <= 0) {
      return res.status(400).json({ ok: false, error: 'Do\'stlar hosilidan ulush mavjud emas' });
    }

    const creditedRef = creditHold(u, st, refEarnings, { pool: 'ecosystem', applyHalving: false });
    u.farmRefEarnings = 0;
    saveHoldState(st);

    res.json({
      ok: true,
      reward: creditedRef,
      message: `🎉 Do'stlaringizdan +${creditedRef.toLocaleString()} $HOLD ulush olindi!`,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 2B3. Claim 5-Slide PAWS-Style Identity Footprint Airdrop ----
  app.post('/api/hold/footprint-claim', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    if (!st.config?.finalEnabled) {
      return res.status(403).json({ ok: false, error: 'The Final hali ochilmagan. Listing kuni ochiladi 🎁' });
    }
    if (u.footprintClaimed) {
      return res.json({ ok: true, alreadyClaimed: true, user: formatHoldUserResponse(st, u, mainUser) });
    }

    const pid = Number(u.paxtaId) || 999;
    let tierName = 'Verified Member';
    let ageBonus = 5_000;
    if (pid <= 150) {
      tierName = 'Pioneer Genesis';
      ageBonus = 25_000;
    } else if (pid <= 600) {
      tierName = 'Early Pioneer';
      ageBonus = 15_000;
    } else if (pid <= 1500) {
      tierName = 'Veteran Holder';
      ageBonus = 10_000;
    }

    const medalsCount = Array.isArray(mainUser?.medals) ? mainUser.medals.length : (Array.isArray(u.claimedNfts) ? u.claimedNfts.length : 1);
    const nftBonus = Math.min(45_000, Math.max(15_000, medalsCount * 15_000));
    const communityBonus = 10_000;
    const totalAirdrop = ageBonus + nftBonus + communityBonus;

    u.footprintClaimed = true;
    const creditedFp = creditHold(u, st, totalAirdrop, { pool: 'airdrop', applyHalving: false });
    u.footprintDetails = {
      paxtaId: pid,
      tierName,
      ageBonus,
      nftBonus,
      communityBonus,
      totalAirdrop: creditedFp,
      claimedAt: new Date().toISOString()
    };
    saveHoldState(st);

    res.json({
      ok: true,
      message: `🎉 +${creditedFp.toLocaleString()} $HOLD qadriyat bonusi berildi!`,
      footprintDetails: u.footprintDetails,
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

    const rewardRaw = DAILY_STREAK_REWARDS[u.streakCount - 1] || 1_000;
    const reward = creditHold(u, st, rewardRaw, { pool: 'mining', applyHalving: true });

    let bonusMsg = `🔥 Kun ${u.streakCount}/7 · +${reward.toLocaleString()} HOLD!`;
    if (u.streakCount === 7) {
      u.luckyTickets = (u.luckyTickets || 0) + 1;
      if (!Array.isArray(u.ownedSkins)) u.ownedSkins = ['basic'];
      if (!u.ownedSkins.includes('cookie')) {
        recordSkinUnlock(st, u, 'cookie', 'streak_7', 0);
        bonusMsg = `🔥 7-Kunlik Streak! +${reward.toLocaleString()} HOLD + Cookie Skin + 1 🎟️ Lucky Ticket!`;
      } else {
        bonusMsg = `🔥 7-Kunlik Streak! +${reward.toLocaleString()} HOLD + 1 🎟️ Lucky Ticket!`;
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
    const { st, u, mainUser, passiveEarned } = getOrCreateHoldUser(req.body?.username);
    const taps0 = Math.max(1, Math.min(100, parseInt(req.body?.taps, 10) || 1));
    // Anti-cheat: token bucket (max ~25 taps/sec, burst 150) so scripts can't spam huge tap counts
    const nowT = Date.now();
    const dtSec = Math.max(0, nowT - (u.tapBucketAt || nowT - 2000)) / 1000;
    const bucket = Math.min(150, (u.tapBucket ?? 150) + dtSec * 25);
    const taps = Math.max(0, Math.min(taps0, Math.floor(bucket)));
    u.tapBucket = bucket - taps;
    u.tapBucketAt = nowT;
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

    const rawEarned = actualTaps * perTap;
    const earned = rawEarned > 0 ? creditHold(u, st, rawEarned, { pool: 'mining', applyHalving: true }) : 0;

    if (actualTaps > 0 || passiveEarned > 0) {
      saveHoldState(st);
    }
    res.json({
      ok: true,
      earned,
      user: formatHoldUserResponse(st, u, mainUser, passiveEarned)
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
      const cost = upgradeCost(u.tapLevel || 1, 600);
      if (!debitHold(u, st, cost)) {
        return res.status(400).json({ ok: false, error: `Need ${cost.toLocaleString()} HOLD` });
      }
      u.tapLevel = (u.tapLevel || 1) + 1;
      saveHoldState(st);
      return res.json({ ok: true, message: `☝️ Multitap · ${u.tapLevel} level (🔥 Burn)`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'energy_limit') {
      const cost = upgradeCost(u.energyLevel || 1, 400);
      if (!debitHold(u, st, cost)) {
        return res.status(400).json({ ok: false, error: `Need ${cost.toLocaleString()} HOLD` });
      }
      u.energyLevel = (u.energyLevel || 1) + 1;
      u.maxEnergy = 1000 + u.energyLevel * 500;
      u.energy = u.maxEnergy;
      saveHoldState(st);
      return res.json({ ok: true, message: `🔋 Energy Limit · ${u.energyLevel} level (🔥 Burn)`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'recharging_speed') {
      const curLvl = u.rechargingSpeedLevel || 1;
      if (curLvl >= 10) {
        return res.status(400).json({ ok: false, error: 'Max level reached' });
      }
      const cost = upgradeCost(curLvl, 1200);
      if (!debitHold(u, st, cost)) {
        return res.status(400).json({ ok: false, error: `Need ${cost.toLocaleString()} HOLD` });
      }
      u.rechargingSpeedLevel = curLvl + 1;
      saveHoldState(st);
      return res.json({ ok: true, message: `⚡ Recharging speed · ${u.rechargingSpeedLevel} level (🔥 Burn)`, user: formatHoldUserResponse(st, u, mainUser) });
    }

    if (type === 'autobot') {
      if (u.autoBotEnabled) {
        return res.status(400).json({ ok: false, error: 'Auto tap bot already active' });
      }
      const cost = 50_000;
      if (!debitHold(u, st, cost)) {
        return res.status(400).json({ ok: false, error: `Need ${cost.toLocaleString()} HOLD` });
      }
      u.autoBotEnabled = true;
      u.lastAutoBotClaimAt = Date.now();
      saveHoldState(st);
      return res.json({ ok: true, message: '🤖 Auto tap bot enabled! (🔥 Burn)', user: formatHoldUserResponse(st, u, mainUser) });
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
    if (cost > 0 && !debitHold(u, st, cost)) {
      return res.status(400).json({
        ok: false,
        error: `Need ${cost.toLocaleString()} HOLD for ${skinDef.name}`
      });
    }

    recordSkinUnlock(st, u, skinId, 'buy', cost);
    u.skin = skinId;
    saveHoldState(st);

    res.json({
      ok: true,
      message: `${skinDef.name} unlocked${cost > 0 ? ' (🔥 Burn)' : ''}!`,
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
    const dailyMorseObj = getActiveDailyMorse(st);
    const dailyWord = (dailyMorseObj.word || 'HOLD').toUpperCase();
    const dailyReward = dailyMorseObj.reward || 50_000;
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
      const morseCredited = creditHold(u, st, dailyReward, { pool: 'mining', applyHalving: true });
      saveHoldState(st);
      return res.json({
        ok: true,
        type: 'daily_morse',
        word: dailyWord,
        reward: morseCredited,
        message: `✨ "${dailyWord}" · +${morseCredited.toLocaleString()} HOLD + 🎟️ 1 Lucky Ticket!`,
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
      const secCredited = creditHold(u, st, secret.reward, { pool: 'mining', applyHalving: true });
      if (secret.skin) {
        recordSkinUnlock(st, u, secret.skin, 'secret_code', 0);
        u.skin = secret.skin;
      }
      saveHoldState(st);
      return res.json({
        ok: true,
        type: 'secret_code',
        word: wordInput,
        reward: secCredited,
        message: `✨ ${secret.title || wordInput} · +${secCredited.toLocaleString()} HOLD!`,
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
      const cleanH = cleanKey(
        String(channelHandle)
          .replace(/^https?:\/\/(www\.)?paxta\.online\//i, '')
          .replace(/^@/, '')
          .replace(/[/?#].*$/, '')
      );
      if (!cleanH || cleanH.length < 2) {
        return res.status(400).json({ ok: false, error: 'Kanal @username manzilini toʻgʻri kiriting' });
      }
      const existingByHandle = st.squads[cleanH] || Object.values(st.squads || {}).find(
        s => cleanKey(s?.handle || '') === cleanH || cleanKey(s?.id || '') === cleanH
      );
      if (existingByHandle) {
        squadId = existingByHandle.id;
        if (!existingByHandle.name || existingByHandle.name === `@${cleanH}` || normSquadName(existingByHandle.name) === 'paxtagram') {
          try {
            const vc = await verifyOnPaxtaGram(cleanH);
            const vcTitle = vc?.title ? cleanSquadName(vc.title) : '';
            if (vcTitle && normSquadName(vcTitle) !== 'paxtagram' && !findSquadByName(st, vcTitle, existingByHandle.id)) {
              existingByHandle.name = vcTitle;
            }
            if (vc?.avatar && !existingByHandle.avatarUrl) existingByHandle.avatarUrl = vc.avatar;
          } catch {}
        }
      } else {
        const verifiedCh = await verifyOnPaxtaGram(cleanH);
        if (!verifiedCh) {
          return res.status(404).json({ ok: false, error: `@${cleanH} kanali yoki guruhi PaxtaGramda topilmadi` });
        }
        let sqName = cleanSquadName(verifiedCh.title) || `@${cleanH}`;
        if (normSquadName(sqName) === 'paxtagram' && cleanH !== 'xaydarov') {
          sqName = `@${verifiedCh.username || cleanH}`;
        }
        const dupSq = findSquadByName(st, sqName, cleanH);
        if (dupSq) {
          return res.status(409).json({
            ok: false,
            existingSquadId: dupSq.id,
            error: `Bu nomdagi squad allaqachon mavjud: ${dupSq.name} (@${dupSq.handle || dupSq.id}).`
          });
        }
        const creatorCheck = await checkChannelOwnership(verifiedCh.username || cleanH, u.paxtaId, null);
        st.squads[cleanH] = {
          id: cleanH,
          handle: verifiedCh.username || cleanH,
          name: sqName,
          avatarUrl: verifiedCh.avatar || null,
          members: 0,
          totalHold: 0,
          verified: true,
          ownerId: creatorCheck.verified ? Number(u.paxtaId) : null,
          ownerUsername: creatorCheck.verified ? u.username : null,
          ownerVerified: !!creatorCheck.verified,
          addedBy: u.username,
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
      u.warEarned = 0;
      u.warSquadId = squadId;
    }
    reconcileSquads(st);
    invalidateHoldAggCache('squads');
    saveHoldState(st);
    res.json({
      ok: true,
      joinedSquadId: squadId,
      message: `🛡️ ${st.squads[squadId].name} jamoasiga qoʻshildingiz!`,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 7A. Search Existing Squads + Direct PaxtaGram Channel Lookup ----
  app.get('/api/hold/search-squad', async (req, res) => {
    const st = loadHoldState();
    const raw = String(req.query?.q || '').trim();
    const qClean = raw.replace(/^https?:\/\/(www\.)?paxta\.online\//i, '').replace(/^@/, '').trim();
    const qNorm = normSquadName(qClean);
    const qHandle = cleanKey(qClean.replace(/[/?#].*$/, ''));
    const all = buildSquadsList(st);

    const matches = qNorm
      ? all.filter(sq =>
          normSquadName(sq.name).includes(qNorm) ||
          cleanKey(sq.handle || sq.id).includes(qHandle)
        )
      : all;

    let paxtaMatch = null;
    const looksLikeHandle = qHandle.length >= 2 && !/\s/.test(qClean);
    const alreadyExact = matches.some(sq => cleanKey(sq.handle || sq.id) === qHandle);
    if (looksLikeHandle && !alreadyExact) {
      try {
        const v = await verifyOnPaxtaGram(qHandle);
        if (v) {
          let title = cleanSquadName(v.title) || `@${qHandle}`;
          if (normSquadName(title) === 'paxtagram' && qHandle !== 'xaydarov') title = `@${v.username || qHandle}`;
          paxtaMatch = {
            id: qHandle,
            handle: v.username || qHandle,
            name: title,
            avatarUrl: v.avatar || null,
            membersCount: Number(v.membersCount || 0),
            type: v.type || 'channel',
            verified: !!v.isVerified,
            isNew: true
          };
        }
      } catch {}
    }

    res.json({
      ok: true,
      query: raw,
      squads: matches.slice(0, 50),
      paxtaMatch
    });
  });

  // ---- 7B. Squad ownership, rename & members ----
  function cleanSquadName(raw) {
    return String(raw || '')
      .replace(/[\u0000-\u001f\u007f<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 28);
  }

  async function checkChannelOwnership(handle, paxtaId, claimCode = null) {
    if (!handle || !paxtaId) return { verified: false, canProof: false };
    try {
      if (typeof moonClient?.checkChatOwnership === 'function') {
        const res = await moonClient.checkChatOwnership(handle, paxtaId, claimCode);
        if (res?.verified) return res;
        if (res?.canProof) return res;
      }
    } catch {}
    try {
      const r = await holdBotCall('getChatMember', { chat_id: `@${String(handle).replace(/^@/, '')}`, user_id: Number(paxtaId) });
      const status = r?.result?.status;
      if (r?.ok && (status === 'creator' || status === 'administrator')) {
        return { verified: true, method: 'bot_getChatMember' };
      }
    } catch {}
    return { verified: false, canProof: false };
  }

  function makeSquadClaimCode(sqId, paxtaId) {
    const digest = crypto.createHash('sha256').update(`claim:${sqId}:${paxtaId}:paxtahold`).digest('hex').slice(0, 6).toUpperCase();
    return `HOLD-${digest}`;
  }

  function canManageSquad(req, st, u, sq) {
    if (!sq) return false;
    if (sq.ownerId && Number(sq.ownerId) === Number(u.paxtaId)) return true;
    if (sq.ownerUsername && sq.ownerUsername === u.username) return true;
    try { return !!checkAdminAccess(req, u); } catch { return false; }
  }

  app.post('/api/hold/squad-rename', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const sq = st.squads[req.body?.squadId];
    if (!sq) return res.status(404).json({ ok: false, error: 'Squad topilmadi' });
    if (!canManageSquad(req, st, u, sq)) {
      return res.status(403).json({ ok: false, error: 'Faqat squad egasi nomni oʻzgartira oladi' });
    }
    const name = cleanSquadName(req.body?.name);
    if (name.length < 2) return res.status(400).json({ ok: false, error: 'Nom kamida 2 ta belgi boʻlsin' });
    const dupRename = findSquadByName(st, name, sq.id);
    if (dupRename) return res.status(409).json({ ok: false, error: `Bu nomdagi squad allaqachon mavjud: ${dupRename.name}` });
    sq.name = name;
    saveHoldState(st);
    res.json({ ok: true, message: `✅ Squad nomi: ${name}`, user: formatHoldUserResponse(st, u, mainUser) });
  });

  app.post('/api/hold/squad-claim', async (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const sq = st.squads[req.body?.squadId];
    if (!sq) return res.status(404).json({ ok: false, error: 'Squad topilmadi' });
    if (sq.ownerId && Number(sq.ownerId) === Number(u.paxtaId) && sq.ownerVerified) {
      return res.json({ ok: true, message: 'Siz allaqachon egasisiz', user: formatHoldUserResponse(st, u, mainUser) });
    }
    const pid = Number(u.paxtaId || mainUser?.paxtaId) || 0;
    if (!pid) {
      return res.status(400).json({ ok: false, error: 'Avval @HOLDbot orqali kirib PaxtaGram ID tasdiqlang' });
    }
    const expectedCode = makeSquadClaimCode(sq.id, pid);
    const check = await checkChannelOwnership(sq.handle || sq.id, pid, expectedCode);
    if (!check.verified) {
      if (check.canProof) {
        return res.status(403).json({
          ok: false,
          needProof: true,
          claimCode: expectedCode,
          channelHandle: sq.handle || sq.id,
          error: `Kanalga yoki bioʻsiga ${expectedCode} kodini yozing va Tekshirish tugmasini bosing.`
        });
      }
      return res.status(403).json({ ok: false, error: 'Kanal egasi ekaningiz tasdiqlanmadi' });
    }
    sq.ownerId = pid;
    sq.ownerUsername = u.username;
    sq.ownerVerified = true;
    saveHoldState(st);
    res.json({ ok: true, message: '👑 Kanal egaligi tasdiqlandi — endi siz squad egasisiz!', user: formatHoldUserResponse(st, u, mainUser) });
  });

  app.post('/api/hold/squad-members', (req, res) => {
    const { st, u } = getOrCreateHoldUser(req.body?.username);
    const sq = st.squads[req.body?.squadId];
    if (!sq) return res.status(404).json({ ok: false, error: 'Squad topilmadi' });
    const wk = warWeekInfo().key;
    const isOwnerSelf = canManageSquad(req, st, u, sq);
    const members = Object.values(st.users || {})
      .filter(x => x && x.squadId === sq.id)
      .sort((a, b) => (b.lifetimeHold || 0) - (a.lifetimeHold || 0))
      .slice(0, 50)
      .map(x => ({
        username: x.username,
        displayName: x.displayName || x.username,
        avatarUrl: x.avatarUrl || null,
        lifetimeHold: Math.floor(x.lifetimeHold || 0),
        weekEarned: x.warWeek === wk ? Math.floor(x.warEarned || 0) : 0,
        isOwner: !!(sq.ownerId && Number(sq.ownerId) === Number(x.paxtaId)) || sq.ownerUsername === x.username
      }));
    res.json({
      ok: true,
      squad: {
        id: sq.id,
        name: sq.name,
        handle: sq.handle || sq.id,
        link: sq.link || null,
        ownerUsername: sq.ownerUsername || null,
        ownerVerified: !!sq.ownerVerified,
        count: Object.values(st.users || {}).filter(x => x && x.squadId === sq.id).length,
        canManage: isOwnerSelf,
        canClaim: !isOwnerSelf && !(sq.ownerId && sq.ownerVerified)
      },
      members
    });
  });

  // ---- Shareable invite landing page (works in any browser; opens HOLDbot in PaxtaGram) ----
  app.get('/r/:code', (req, res) => {
    const code = String(req.params.code || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 32);
    const cmd = `/start ${code}`;
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>HOLD — taklif</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
.c{width:min(380px,92vw);text-align:center;padding:28px 22px}
h1{font-size:26px;margin:0 0 6px}p{color:#9aa0aa;font-size:14px;line-height:1.5;margin:6px 0 18px}
code{display:block;background:#15171c;border:1px solid #262a33;border-radius:12px;padding:12px;font-size:16px;margin:0 0 14px}
a,button{display:block;width:100%;box-sizing:border-box;border:0;border-radius:14px;padding:14px;font-size:16px;font-weight:700;margin:8px 0;cursor:pointer;text-decoration:none}
a{background:#fff;color:#000}button{background:#1c1f26;color:#fff}
</style></head><body><div class="c">
<h1>🪙 $HOLD</h1>
<p>Doʻstingiz sizni taklif qildi. Ikkalangizga ham bepul HOLD beriladi!</p>
<code id="cmd">${cmd}</code>
<a href="https://paxta.online/u/HOLDbot" id="open">@HOLDbot ni ochish</a>
<button id="copy">Buyruqni nusxalash</button>
<p>1. Buyruqni nusxalang<br>2. @HOLDbot ga kirib yuboring</p>
</div>
<script>
const t=document.getElementById('cmd').textContent;
function cp(){try{navigator.clipboard.writeText(t)}catch(e){}}
document.getElementById('copy').onclick=function(){cp();this.textContent='Nusxalandi ✓'};
document.getElementById('open').onclick=cp;
cp();
</script></body></html>`);
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

    if (u.tasksCompleted.includes(questId)) {
      return res.status(400).json({ ok: false, error: 'Completed' });
    }
    u.tasksCompleted.push(questId);
    const questCredited = creditHold(u, st, quest.reward, { pool: 'ecosystem', applyHalving: true });
    saveHoldState(st);

    res.json({
      ok: true,
      reward: questCredited,
      message: `✅ Vazifa tasdiqlandi · +${questCredited.toLocaleString()} HOLD!`,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 9. Buy VIP Pack / Stars Services ----
  function chargeLocalStars(username, starsPrice) {
    const users = loadJSON(usersFile, {});
    const userRecord = users[username];
    const currentStars = userRecord?.stars || 0;
    if (currentStars < starsPrice) {
      return {
        ok: false,
        needStars: true,
        deficit: starsPrice - currentStars,
        required: starsPrice,
        error: `Need ${starsPrice} Stars`
      };
    }
    userRecord.stars -= starsPrice;
    saveJSON(usersFile, users);
    return { ok: true, userRecord };
  }

  app.post('/api/hold/buy-vip-pack', (req, res) => {
    const { st, u } = getOrCreateHoldUser(req.body?.username);
    const packId = req.body?.packId;
    const pack = STARS_VIP_PACKS.find(p => p.id === packId);
    if (!pack) return res.status(404).json({ ok: false, error: 'Pack not found' });

    const charge = chargeLocalStars(u.username, pack.starsPrice);
    if (!charge.ok) return res.status(400).json(charge);

    const granted = creditHold(u, st, pack.holdGrant, { pool: 'mining', applyHalving: false, skipServiceBoost: true });
    u.tapLevel = (u.tapLevel || 1) + (pack.tapBoost || 0);
    if (pack.enableAutoBot) u.autoBotEnabled = true;
    saveHoldState(st);

    res.json({
      ok: true,
      message: `${pack.name} · +${granted.toLocaleString()} HOLD`,
      user: formatHoldUserResponse(st, u, charge.userRecord)
    });
  });

  app.post('/api/hold/buy-service', (req, res) => {
    const { st, u } = getOrCreateHoldUser(req.body?.username);
    const serviceId = String(req.body?.serviceId || '').trim();
    const check = validateHoldServicePurchase(u, st, serviceId);
    if (!check.ok) return res.status(check.status || 400).json({ ok: false, error: check.error });

    const charge = chargeLocalStars(u.username, check.service.starsPrice);
    if (!charge.ok) return res.status(400).json(charge);

    const applied = applyHoldService(u, st, serviceId);
    if (!applied.ok) return res.status(400).json({ ok: false, error: applied.error });

    invalidateHoldAggCache('all');
    saveHoldState(st);

    res.json({
      ok: true,
      serviceId,
      message: applied.message,
      user: formatHoldUserResponse(st, u, charge.userRecord)
    });
  });

  // ---- 9B. 5,000,000 HOLD Beta Challenge (First 15 Winners, 5 Conditions) ----
  app.post('/api/hold/claim-beta-challenge', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const status = getBetaChallengeStatus(st, u);

    if (status.claimedByMe) {
      return res.status(400).json({ ok: false, error: `Siz allaqachon #${status.myRank}-oʻrinda 5,000,000 HOLD olgansiz!` });
    }
    if (status.isFull) {
      return res.status(400).json({ ok: false, error: 'Ilk 15 kishilik oʻrin allaqachon toʻldi (15/15)!' });
    }
    if (!status.allConditionsDone) {
      const missing = status.conditions.filter(c => !c.done).map(c => c.label).join(', ');
      return res.status(400).json({ ok: false, error: `Barcha 5 ta shart bajarilmagan: ${missing}` });
    }

    const rank = st.betaChallenge.winners.length + 1;
    const credited = creditHold(u, st, BETA_CHALLENGE_REWARD, { pool: 'airdrop', applyHalving: false, skipServiceBoost: true });
    if (credited <= 0) {
      return res.status(400).json({ ok: false, error: 'Airdrop fondi limiti tugadi' });
    }

    u.betaChallengeRank = rank;
    st.betaChallenge.winners.push({
      rank,
      username: u.username,
      displayName: u.displayName || u.username,
      paxtaId: u.paxtaId || null,
      reward: credited,
      claimedAt: new Date().toISOString()
    });
    invalidateHoldAggCache('all');
    saveHoldState(st);

    res.json({
      ok: true,
      rank,
      reward: credited,
      message: `🏆 Tabriklaymiz! Siz #${rank}/15-oʻrinda +${credited.toLocaleString()} HOLD oldingiz!`,
      user: formatHoldUserResponse(st, u, mainUser)
    });
  });

  // ---- 9C. Skin Owners Registry (Future Utility & Rewards) ----
  app.get('/api/hold/skin-owners', (req, res) => {
    const st = loadHoldState();
    const skinOwners = syncAllSkinOwners(st);
    const skinFilter = req.query?.skinId ? String(req.query.skinId).trim() : null;
    saveHoldState(st);

    if (skinFilter) {
      return res.json({
        ok: true,
        skinId: skinFilter,
        count: (skinOwners[skinFilter] || []).length,
        owners: skinOwners[skinFilter] || []
      });
    }

    const summary = {};
    for (const [sid, list] of Object.entries(skinOwners)) {
      summary[sid] = { count: list.length, owners: list };
    }
    res.json({ ok: true, skins: summary });
  });

  // ---- 10. Top-10 Leaderboard & Allocated NFT / HOLD Prizes ----
  function getVaultItems(existingSt = null) {
    const st = existingSt || loadHoldState();
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

  function getTop10PrizeAllocation(allItems, existingSt = null) {
    const claimedIds = new Set(((existingSt && existingSt.nftClaims) || []).map(c => c.vaultId).filter(Boolean));
    const avail = allItems.filter(i => !i.sold && !claimedIds.has(i.vaultId));
    const sortCatalog = (a, b) => (Number(b.isBlack) - Number(a.isBlack)) || ((a.number || 99999) - (b.number || 99999));
    const calendars = avail.filter(x => x.nftType === 'calendar').sort(sortCatalog);
    const medals = avail.filter(x => x.nftType === 'medal').sort(sortCatalog);
    const allSorted = [...avail].sort(sortCatalog);

    const usedIds = new Set();
    const takeFrom = (pool) => {
      const found = pool.find(x => !usedIds.has(x.vaultId));
      if (found) {
        usedIds.add(found.vaultId);
        return found;
      }
      const fallback = allSorted.find(x => !usedIds.has(x.vaultId));
      if (fallback) usedIds.add(fallback.vaultId);
      return fallback || null;
    };

    const holdBonusByRank = [
      500_000, 350_000, 250_000, 175_000, 125_000,
      100_000, 75_000, 50_000, 35_000, 25_000
    ];

    const slotPlan = [
      { kind: 'calendar', reason: 'Mutlaq #1 All-Time chempion' },
      { kind: 'calendar', reason: '#2 All-Time vitse-chempion' },
      { kind: 'medal', reason: '#3 All-Time bronza podiumi' },
      { kind: 'calendar', reason: '#4 All-Time reyting' },
      { kind: 'medal', reason: '#5 All-Time reyting' },
      { kind: 'calendar', reason: '#6 All-Time reyting' },
      { kind: 'medal', reason: '#7 All-Time reyting' },
      { kind: 'calendar', reason: '#8 All-Time reyting' },
      { kind: 'medal', reason: '#9 All-Time reyting' },
      { kind: 'calendar', reason: '#10 All-Time reyting' }
    ];

    return slotPlan.map((slot, idx) => {
      const nft = takeFrom(slot.kind === 'medal' ? medals : calendars);
      return {
        rank: idx + 1,
        holdBonus: holdBonusByRank[idx],
        reason: slot.reason,
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
      };
    });
  }

  app.get('/api/hold/vault', (req, res) => {
    const today = todayStr();
    const now = Date.now();
    if (
      aggCache.vaultResponse &&
      aggCache.vaultResponse.day === today &&
      now - aggCache.vaultResponse.builtAt < 2000
    ) {
      return res.json(aggCache.vaultResponse.data);
    }

    const st = loadHoldState();
    const allItems = getVaultItems(st);
    const top10Prizes = getTop10PrizeAllocation(allItems, st);
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
          founderBadge: !!u.founderBadge,
          prize
        };
      });

    const sortedDayUsers = [...allUsers]
      .sort((a, b) => (b.dailyHold?.[today] || 0) - (a.dailyHold?.[today] || 0));

    // NOTE: Top-10 NFT prizes strictly follow All-Time rank, never daily rank
    const leaderboardDay = sortedDayUsers
      .slice(0, 100)
      .map((u, idx) => {
        const rank = idx + 1;
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
          founderBadge: !!u.founderBadge,
          prize: null
        };
      });

    const availNfts = allItems.filter(i => !i.sold);
    const nftPoolSummary = {
      totalAvailable: availNfts.length,
      medalsAvailable: availNfts.filter(i => i.nftType === 'medal').length,
      calendarsAvailable: availNfts.filter(i => i.nftType === 'calendar').length,
      top10AllTimeCount: 10,
      weeklyLuckyDrawCount: 1,
      leagueQuotas: HOLD_LEAGUES.map(lg => ({
        id: lg.id,
        name: lg.name,
        minHold: lg.minHold,
        nftPoolCount: lg.nftPoolCount,
        nftGuarantee: lg.nftGuarantee,
        nftRule: lg.nftRule,
        color: lg.color
      }))
    };

    const payload = {
      ok: true,
      totalPlayers: sortedUsers.length,
      tokenomics: getTokenomicsSummary(st),
      top10Prizes,
      nftPoolSummary,
      squads: buildSquadsList(st),
      leaderboard,
      leaderboardDay
    };
    aggCache.vaultResponse = { day: today, builtAt: now, data: payload };
    res.json(payload);
  });

  app.get('/api/hold/tokenomics', (req, res) => {
    const st = loadHoldState();
    res.json({
      ok: true,
      tokenomics: getTokenomicsSummary(st)
    });
  });

  // ---- 12. Create Stars Invoice via @HOLDbot (In-App Slug + Polling) ----
  app.post('/api/hold/create-invoice', async (req, res) => {
    const { st, u } = getOrCreateHoldUser(req.body?.username);
    const serviceId = req.body?.serviceId ? String(req.body.serviceId).trim() : null;
    let amount = Math.max(1, Math.min(100_000, parseInt(req.body?.amount, 10) || 100));
    let title = String(req.body?.title || `HOLD Boost (+${amount} ⭐)`).slice(0, 32);
    let description = `@${u.username} hisobiga +${amount} Stars qoʻshish (HOLD)`;

    if (serviceId) {
      const check = validateHoldServicePurchase(u, st, serviceId);
      if (!check.ok) return res.status(check.status || 400).json({ ok: false, error: check.error });
      amount = check.service.starsPrice;
      title = check.service.name.slice(0, 32);
      description = `${check.service.name} — ${check.service.desc}`.slice(0, 255);
    }

    const invoiceId = `holdinv_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
    const payload = `holdstars:${u.username}:${amount}:${invoiceId}`;

    const apiRes = await holdBotCall('createInvoiceLink', {
      title,
      description,
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
      serviceId: serviceId || null,
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
    if (initUser && initUser.verified) {
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
    const hh = getHappyHourStatus(st);
    const list = Object.values(st.users || {})
      .filter(usr => !isSyntheticUsername(usr.username))
      .sort((a, b) => (b.lifetimeHold || 0) - (a.lifetimeHold || 0))
      .map((usr, idx) => ({
        rank: idx + 1,
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
        streakDays: usr.streakCount || 0,
        luckyTickets: usr.luckyTickets || 0,
        referralsCount: (usr.referrals || []).length,
        squadId: usr.squadId || null
      }));

    const totalHoldCirculation = list.reduce((s, x) => s + x.holdBalance, 0);
    res.json({
      ok: true,
      totalUsers: list.length,
      totalHoldCirculation,
      stats: {
        totalPlayers: list.length,
        totalHoldInCirculation: totalHoldCirculation,
        happyHourActive: hh.active,
        happyHourForceEnabled: !!st.config?.happyHourForced,
        lastLuckyWinner: st.config?.lastLuckyWinner || null
      },
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
      const admSqName = cleanSquadName(customName || verified?.title) || `@${cleanH}`;
      const dupAdm = findSquadByName(st, admSqName, cleanH);
      if (dupAdm) return res.status(409).json({ ok: false, error: `Bu nomdagi squad allaqachon mavjud: ${dupAdm.name}` });
      st.squads[cleanH] = {
        id: cleanH,
        handle: verified?.username || cleanH,
        name: admSqName,
        members: st.squads[cleanH]?.members || 0,
        totalHold: st.squads[cleanH]?.totalHold || 0,
        verified: !!verified,
        link: `https://paxta.online/${verified?.username || cleanH}`
      };
      invalidateHoldAggCache('squads');
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
        for (const usr of Object.values(st.users || {})) {
          if (usr && usr.squadId === sqId) usr.squadId = null;
        }
        invalidateHoldAggCache('squads');
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
      const wk = warWeekInfo().key;
      const allSquads = Object.values(st.squads || {});
      const hasWeekScore = allSquads.some(sq => sq.weekKey === wk && (sq.weekScore || 0) > 0);
      const sortedSquads = allSquads.sort((a, b) => hasWeekScore
        ? ((b.weekKey === wk ? (b.weekScore || 0) : 0) - (a.weekKey === wk ? (a.weekScore || 0) : 0))
        : ((b.totalHold || 0) - (a.totalHold || 0)));
      const topSq = sortedSquads[0];
      if (!topSq) return res.status(400).json({ ok: false, error: 'Squadlar topilmadi' });
      const requestedPrize = parseInt(req.body?.rewardAmount, 10);
      const prize = Number.isFinite(requestedPrize) && requestedPrize > 0 ? requestedPrize : (st.config.squadWarPrize || 25_000);
      let rewardedCount = 0;
      for (const usr of Object.values(st.users || {})) {
        if (usr.squadId === topSq.id) {
          creditHold(usr, st, prize, { pool: 'ecosystem', applyHalving: false });
          rewardedCount++;
        }
      }
      invalidateHoldAggCache('all');
      saveHoldState(st);
      return res.json({
        ok: true,
        message: `🏆 #1 Squad (${topSq.name}) aʼzolariga (${rewardedCount} kishi) +${prize.toLocaleString()} HOLD tarqatildi!`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    if (action === 'toggle_snapshot') {
      const tk = ensureTokenomics(st);
      tk.snapshotLocked = req.body?.locked !== undefined ? !!req.body.locked : !tk.snapshotLocked;
      saveHoldState(st);
      return res.json({
        ok: true,
        message: tk.snapshotLocked ? '🔒 TGE Snapshot muzlatildi (emissiya toʻxtatildi)' : '🔓 TGE Snapshot ochildi (emissiya davom etadi)',
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    if (action === 'draw_lucky_winner') {
      const winnerInfo = runLuckyDraw(st);
      if (!winnerInfo) {
        return res.status(400).json({ ok: false, error: 'Hozircha hech kimda Lucky Ticket yoʻq (Kunlik Vault/Morze yoki 7-kunlik Streak orqali olinadi)' });
      }
      delete st.config.pendingLuckyNotify;
      invalidateHoldAggCache('all');
      saveHoldState(st);
      const winUser = st.users?.[winnerInfo.username];
      if (winUser?.paxtaId) {
        holdBotCall('sendMessage', {
          chat_id: winUser.paxtaId,
          text: `🎟️ <b>Lucky Draw gʻolibi boʻldingiz!</b>\n\nTabriklaymiz @${escHtml(winnerInfo.username)}! Siz <b>+${winnerInfo.rewardHold.toLocaleString()} $HOLD</b> va <b>${escHtml(winnerInfo.prizeNft)}</b> yutdingiz! 🎉`,
          parse_mode: 'HTML',
          reply_markup: botOpenHoldMarkup(winUser, '🎟️ Natijani koʻrish')
        }).catch(() => {});
      }
      return res.json({
        ok: true,
        message: `🎟️ Omadli Chipta Gʻolibi: @${winnerInfo.username} (+${winnerInfo.rewardHold.toLocaleString()} HOLD + ${winnerInfo.prizeNft})!`,
        user: formatHoldUserResponse(st, u, mainUser)
      });
    }

    if (action === 'reset_user') {
      const targetKey = cleanKey(req.body?.targetUsername || u.username);
      const targetUser = st.users[targetKey];
      if (!targetUser) return res.status(404).json({ ok: false, error: `@${targetKey} topilmadi` });
      resetSingleUserObject(targetUser);
      reconcileSquads(st);
      invalidateHoldAggCache('all');
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
      st.tokenomics = createFreshTokenomics(st);
      rebuildPidIndex(st);
      invalidateHoldAggCache('all');
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
      const deletedUser = st.users[targetKey];
      if (deletedUser?.paxtaId) {
        pidIndex.delete(Number(deletedUser.paxtaId));
      }
      delete st.users[targetKey];
      reconcileSquads(st);
      invalidateHoldAggCache('all');
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
      const starsDelta = parseInt(req.body?.starsDelta, 10) || 0;
      const grantSkin = String(req.body?.grantSkin || '').trim();
      const targetUser = st.users[targetKey];
      if (!targetUser) return res.status(404).json({ ok: false, error: `@${targetKey} topilmadi` });

      if (holdDelta > 0) {
        creditHold(targetUser, st, holdDelta, { pool: 'airdrop', applyHalving: false, forceFull: true });
      } else if (holdDelta < 0) {
        const deduct = Math.min(targetUser.holdBalance || 0, Math.abs(holdDelta));
        debitHold(targetUser, st, deduct);
      }
      if (starsDelta !== 0) {
        const mainUsers = loadJSON(usersFile, {});
        if (mainUsers[targetKey]) {
          mainUsers[targetKey].stars = Math.max(0, (mainUsers[targetKey].stars || 0) + starsDelta);
          saveJSON(usersFile, mainUsers);
        }
      }
      if (grantSkin && HOLD_SKINS.some(s => s.id === grantSkin)) {
        recordSkinUnlock(st, targetUser, grantSkin, 'admin', 0);
        targetUser.skin = grantSkin;
      }
      if (req.body?.grantAllSkins) {
        for (const s of HOLD_SKINS) recordSkinUnlock(st, targetUser, s.id, 'admin', 0);
      }
      if (req.body?.resetOnboarding) {
        targetUser.ogBonusClaimed = false;
      }
      if (req.body?.resetMorse) {
        targetUser.morseSolvedDays = [];
        targetUser.lastSolvedMorseWord = '';
        targetUser.secretCodesClaimed = [];
      }
      invalidateHoldAggCache('all');
      saveHoldState(st);
      const refreshedMainUser = loadJSON(usersFile, {})[u.username] || mainUser;
      return res.json({ ok: true, message: `@${targetKey} yangilandi`, user: formatHoldUserResponse(st, u, refreshedMainUser) });
    }

    res.json({ ok: true, user: formatHoldUserResponse(st, u, mainUser) });
  });

  // ---- 14. Daily Vault Secret Combo Mystery (/api/hold/solve-compass) ----
  app.post('/api/hold/solve-compass', (req, res) => {
    const { st, u, mainUser } = getOrCreateHoldUser(req.body?.username);
    const seq = req.body?.sequence;
    const activeVault = getActiveDailyVault(st, saveHoldState);
    const expected = activeVault.sequence;
    if (!Array.isArray(seq) || seq.length !== expected.length || !seq.every((v, i) => v === expected[i])) {
      return res.status(400).json({ ok: false, error: 'Bugungi Vault kombinatsiyasi xato! @HOLDbot dan Bugungi Vault kodini tekshiring.' });
    }

    const today = todayStr();
    if (!Array.isArray(u.compassSolvedDays)) u.compassSolvedDays = [];
    if (u.compassSolvedDays.includes(today)) {
      return res.status(400).json({ ok: false, error: 'Bugungi Vault kodi allaqachon ochilgan! Ertaga yangi kod chiqadi.' });
    }

    u.compassSolvedDays.push(today);
    const reward = creditHold(u, st, 30_000, { pool: 'mining', applyHalving: true });
    u.luckyTickets = (u.luckyTickets || 0) + 1;
    invalidateHoldAggCache('all');
    saveHoldState(st);

    res.json({
      ok: true,
      reward,
      message: `🔐 Kunlik Vault ochildi (#${activeVault.index}/${activeVault.totalCombos})! +${reward.toLocaleString()} HOLD va +1 Lucky Ticket!`,
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
    const btnUrl = String(req.body?.buttonUrl || '').trim() || 'https://paxta.online/u/HOLDbot';

    let btnObj = { text: btnText, url: btnUrl };
    if (btnUrl.startsWith('http') && btnUrl.includes('/hold') && !btnUrl.includes('paxta.online/u/')) {
      btnObj = { text: btnText, web_app: { url: btnUrl } };
    }

    const reply_markup = btnText ? {
      inline_keyboard: [[btnObj]]
    } : undefined;

    const allUsers = Object.values(st.users || {});
    const targetIds = Array.from(new Set(allUsers.map(usr => usr.paxtaId).filter(Boolean)));

    if (!targetIds.length) {
      return res.status(400).json({ ok: false, error: 'Foydalanuvchilar topilmadi' });
    }

    let sent = 0;
    let failed = 0;

    const BATCH_SIZE = 10;
    for (let i = 0; i < targetIds.length; i += BATCH_SIZE) {
      const batch = targetIds.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(pid => holdBotCall('sendMessage', {
          chat_id: pid,
          text,
          parse_mode: 'HTML',
          reply_markup
        }))
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value && r.value.ok) sent++;
        else failed++;
      }
      if (i + BATCH_SIZE < targetIds.length) {
        await new Promise(r => setTimeout(r, 40));
      }
    }

    res.json({
      ok: true,
      sent,
      failed,
      total: targetIds.length,
      message: `E'lon yuborildi! Muvaffaqiyatli: ${sent} ta, Xatolik: ${failed} ta.`
    });
  });

  // ---- 15b. Admin Publish Morse to @insider Channel (/api/hold/admin-post-morse-channel) ----
  app.post('/api/hold/admin-post-morse-channel', async (req, res) => {
    const { st, u } = getOrCreateHoldUser(req.body?.username);
    if (!checkAdminAccess(req, u)) {
      return res.status(403).json({ ok: false, error: 'Faqat Admin uchun!' });
    }

    const morseObj = getActiveDailyMorse(st);
    const word = String(req.body?.word || morseObj.word || 'HOLD').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const reward = parseInt(req.body?.reward, 10) || morseObj.reward || 50_000;

    // Update active word & reward
    st.config.dailyMorse.word = word;
    st.config.dailyMorse.reward = reward;
    saveHoldState(st);

    try {
      const resp = await broadcastDailyMorseToChannel(word, reward);
      if (resp && resp.ok) {
        return res.json({
          ok: true,
          word,
          reward,
          message: `Kunlik Morze shifri ("${word}") @insider kanaliga post qilindi! 🚀`
        });
      } else {
        return res.status(500).json({
          ok: false,
          error: resp?.description || 'Kanalga yuborishda xatolik yuz berdi'
        });
      }
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  function botOpenHoldMarkup(usr, btnLabel = '🪙 HOLD ni ochish') {
    const token = createSessionToken(usr.username, usr.paxtaId || '');
    if (String(PUBLIC_APP_URL || '').startsWith('http')) {
      return { inline_keyboard: [[{ text: btnLabel, web_app: { url: `${PUBLIC_APP_URL}/hold?auth=${encodeURIComponent(token)}` } }]] };
    }
    return { inline_keyboard: [[{ text: btnLabel, url: 'https://paxta.online/u/HOLDbot' }]] };
  }

  // ---- 16. Automated Push Notifications Ticker (Farm Ready, Wars Winner, Happy Hour & Streak) ----
  let notifTickerRunning = false;
  setInterval(async () => {
    if (notifTickerRunning) return;
    notifTickerRunning = true;
    try {
      const st = loadHoldState();
      const now = new Date();
      const nowMs = now.getTime();
      // Tashkent UTC+5
      const tashkentTime = new Date(nowMs + 5 * 3600 * 1000);
      const hour = tashkentTime.getUTCHours();
      const minute = tashkentTime.getUTCMinutes();
      const today = todayStr();

      if (!st.config.notifs) st.config.notifs = {};

      // Settle Squad Wars & Weekly Lucky Draw on week rollover and notify winners
      const prevWk = st.config.warsWeekKey;
      settleWars(st);
      if (prevWk !== st.config.warsWeekKey || st.config.pendingWarNotify?.userKeys?.length || st.config.pendingLuckyNotify) {
        const warNote = st.config.pendingWarNotify;
        const luckyNote = st.config.pendingLuckyNotify;
        delete st.config.pendingWarNotify;
        delete st.config.pendingLuckyNotify;
        saveHoldState(st);
        if (warNote?.userKeys?.length) {
          for (const k of warNote.userKeys) {
            const usr = st.users?.[k];
            if (!usr?.paxtaId) continue;
            try {
              await holdBotCall('sendMessage', {
                chat_id: usr.paxtaId,
                text: `🏆 <b>Squad Wars gʻolibi — ${escHtml(warNote.squadName)}!</b>\n\nSizning jamoangiz haftalik jangda #1 oʻrinni oldi! Hisobingizga <b>+${Number(warNote.prize || 0).toLocaleString()} $HOLD</b> qoʻshildi va +20% farm tezligi faol! 👑`,
                parse_mode: 'HTML',
                reply_markup: botOpenHoldMarkup(usr, '⚔️ Mukofotni koʻrish')
              });
              await new Promise(r => setTimeout(r, 45));
            } catch {}
          }
        }
        if (luckyNote?.paxtaId) {
          try {
            const luckyUsr = st.users?.[luckyNote.username];
            await holdBotCall('sendMessage', {
              chat_id: luckyNote.paxtaId,
              text: `🎟️ <b>Haftalik Lucky Draw gʻolibi boʻldingiz!</b>\n\nTabriklaymiz @${escHtml(luckyNote.username)}! ${luckyNote.poolSize} ta chipta ichidan sizning chiptangiz yutdi:\n🎁 <b>+${Number(luckyNote.rewardHold || 100_000).toLocaleString()} $HOLD</b> va <b>${escHtml(luckyNote.prizeNft)}</b>! 🎉`,
              parse_mode: 'HTML',
              reply_markup: luckyUsr ? botOpenHoldMarkup(luckyUsr, '🎟️ Mukofotni koʻrish') : undefined
            });
          } catch {}
        }
      }

      // Farm Ready Alert: precompute weekly war leader once per tick instead of sorting squads per user
      const rankedWars = getCachedWarsRanked(st, warWeekInfo().key);
      const leaderSquadId = rankedWars.length > 0 && rankedWars[0].score > 0 ? rankedWars[0].id : null;
      const farmReadyTargets = [];
      const seenFarmPids = new Set();
      for (const usr of Object.values(st.users || {})) {
        if (!usr?.paxtaId || isSyntheticUsername(usr.username) || !usr.farmStartedAt) continue;
        if (seenFarmPids.has(usr.paxtaId)) continue;
        const fpm = getFarmParams(st, usr, {
          isLeader: !!(leaderSquadId && usr.squadId === leaderSquadId),
          leaderBonusPct: 20
        });
        if ((nowMs - usr.farmStartedAt) >= fpm.durationMs && usr.farmNotifiedFor !== usr.farmStartedAt) {
          usr.farmNotifiedFor = usr.farmStartedAt;
          seenFarmPids.add(usr.paxtaId);
          farmReadyTargets.push({ usr, reward: fpm.reward });
        }
      }
      if (farmReadyTargets.length > 0) {
        saveHoldState(st);
        for (const item of farmReadyTargets) {
          try {
            await holdBotCall('sendMessage', {
              chat_id: item.usr.paxtaId,
              text: `🌾 <b>Ferma toʻldi — +${item.reward.toLocaleString()} $HOLD tayyor!</b>\n\nHosilni yigʻib oling, aks holda keyingi sikl boshlanmaydi! 🚀`,
              parse_mode: 'HTML',
              reply_markup: botOpenHoldMarkup(item.usr, '🌾 Hosilni yigʻib olish')
            });
            await new Promise(r => setTimeout(r, 45));
          } catch {}
        }
      }

      // 0. Daily Morse Broadcast to @insider Channel at 12:00 (UTC+5)
      if (hour === 12 && minute <= 5 && st.config.notifs.lastMorseBroadcastDay !== today) {
        st.config.notifs.lastMorseBroadcastDay = today;
        const morseObj = getActiveDailyMorse(st);
        saveHoldState(st);
        try {
          await broadcastDailyMorseToChannel(morseObj.word, morseObj.reward);
        } catch (err) {
          console.error('Auto-broadcast Morse to @insider failed:', err);
        }
      }

      // 1. Happy Hour announcement at 20:00 (UTC+5)
      if (hour === 20 && minute <= 5 && st.config.notifs.lastHappyHourDay !== today) {
        st.config.notifs.lastHappyHourDay = today;
        saveHoldState(st);
        const sentHh = new Set();
        for (const usr of Object.values(st.users || {})) {
          if (!usr?.paxtaId || sentHh.has(usr.paxtaId)) continue;
          sentHh.add(usr.paxtaId);
          try {
            await holdBotCall('sendMessage', {
              chat_id: usr.paxtaId,
              text: '⚡ <b>Happy Hour boshlandi!</b>\n\nKeyingi 1 soat (20:00 – 21:00) davomida har bir bosish <b>2 barobar (2x)</b> koʻproq $HOLD beradi! 🚀',
              parse_mode: 'HTML',
              reply_markup: botOpenHoldMarkup(usr, '⚡ 2x Tapni boshlash')
            });
            await new Promise(r => setTimeout(r, 45));
          } catch {}
        }
      }

      // 2. Daily Streak Reminder at 19:00 (UTC+5)
      if (hour === 19 && minute <= 5 && st.config.notifs.lastStreakReminderDay !== today) {
        st.config.notifs.lastStreakReminderDay = today;
        saveHoldState(st);
        const sentSt = new Set();
        for (const usr of Object.values(st.users || {})) {
          if (!usr?.paxtaId || usr.lastStreakDate === today || sentSt.has(usr.paxtaId)) continue;
          sentSt.add(usr.paxtaId);
          try {
            await holdBotCall('sendMessage', {
              chat_id: usr.paxtaId,
              text: '🔥 <b>Kunlik bonus kutmoqda!</b>\n\nBugungi zanjir mukofotingizni olishni unutmang — har kun farm tezligiga +2% beradi, 7-kuni Cookie skin! 🍪',
              parse_mode: 'HTML',
              reply_markup: botOpenHoldMarkup(usr, '🎁 Bonusni olish')
            });
            await new Promise(r => setTimeout(r, 45));
          } catch {}
        }
      }
    } catch {} finally {
      notifTickerRunning = false;
    }
  }, 60_000);

  // ---- 17. @HOLDbot Polling Loop (Handles /start, /vault, /tickets, Referrals & Stars Payments) ----
  async function startHoldBotLoop() {
    const holdWebAppUrl = `${PUBLIC_APP_URL}/hold`;
    holdBotCall('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'HOLD',
        web_app: { url: holdWebAppUrl }
      }
    }).catch(() => {});

    holdBotCall('setMyCommands', {
      commands: [
        { command: 'start', description: 'HOLD boshlash va referal' },
        { command: 'vault', description: 'Bugungi Vault kodi' },
        { command: 'tickets', description: 'Lucky Ticket va shanslar' }
      ]
    }).catch(() => {});

    function formatBotVaultReply(stObj, usr) {
      const v = getActiveDailyVault(stObj, saveHoldState);
      const solved = (usr?.compassSolvedDays || []).includes(v.date);
      return (
        `🔐 <b>Bugungi Vault kodi (${escHtml(v.date)})</b> · #${v.index}/${v.totalCombos}\n\n` +
        `Yoʻnalish: ${escHtml(v.arrows)}\n` +
        `Tartib: <b>${escHtml(v.labels)}</b>\n\n` +
        `🎁 Mukofot: <b>+30,000 $HOLD + 1 🎟️ Lucky Ticket</b>\n` +
        `Holat: ${solved ? '✅ Bugungi kod allaqachon ochildi!' : '⏳ Hali ochilmagan'}\n\n` +
        `<i>Ilova ichida markaziy tanga chetlarini (Tepa / Oʻng / Past / Chap) shu ketma-ketlikda bosing.</i>`
      );
    }

    function formatBotTicketsReply(stObj, usr) {
      const myT = Math.floor(usr?.luckyTickets || 0);
      const totalT = getCachedTotalLuckyTickets(stObj);
      const chance = totalT > 0 && myT > 0 ? ((myT / totalT) * 100).toFixed(1) : '0';
      const last = stObj.config?.lastLuckyWinner;
      const lastLine = last
        ? `🏆 Oxirgi gʻolib: <b>@${escHtml(last.username)}</b> (${escHtml(last.prizeNft)} + ${Number(last.rewardHold || 100_000).toLocaleString()} $HOLD)`
        : '🏆 Birinchi haftalik gʻolib shu dushanba aniqlanadi';
      return (
        `🎟️ <b>Weekly Lucky Draw — Chiptalarim</b>\n\n` +
        `🎫 Sizda: <b>${myT} ta chipta</b>\n` +
        `🌍 Umumiy pul: <b>${totalT} ta chipta</b>\n` +
        `📊 Yutish ehtimoli: <b>${chance}%</b>\n` +
        `🎁 Haftalik sovrin: <b>Victory Medal NFT + 100,000 $HOLD</b>\n\n` +
        `📌 <b>Qayerdan olinadi:</b>\n` +
        `• 🔐 Bugungi Vault kodini ochish: <b>+1 chipta</b>\n` +
        `• 🕵️ Kunlik Morze kodini yechish: <b>+1 chipta</b>\n` +
        `• 🔥 7-kunlik Daily Streak: <b>+1 chipta</b>\n\n` +
        `⏰ Har dushanba (00:00 UTC+5) avtomatik oʻynaladi.\n${lastLine}`
      );
    }

    let st = loadHoldState();
    let offset = (st.payments?.lastUpdateId || 0) + 1;

    while (true) {
      let hadUpdates = false;
      try {
        const u = await holdBotCall('getUpdates', { offset, timeout: 2 });
        if (u && u.ok && Array.isArray(u.result) && u.result.length > 0) {
          hadUpdates = true;
          st = loadHoldState();
          try {
            for (const item of u.result) {
              offset = item.update_id + 1;
              const fromUser = item.pre_checkout_query?.from || item.callback_query?.from || item.message?.from;
              const uKey = fromUser ? cleanKey(fromUser.username || fromUser.first_name || `paxta_${fromUser.id}`) : null;

              if (item.pre_checkout_query) {
                await holdBotCall('answerPreCheckoutQuery', {
                  pre_checkout_query_id: item.pre_checkout_query.id,
                  ok: true
                });
              }

              if (item.callback_query) {
                const cq = item.callback_query;
                const cqFrom = cq.from || {};
                const cqKey = cleanKey(cqFrom.username || cqFrom.first_name || `paxta_${cqFrom.id}`);
                await holdBotCall('answerCallbackQuery', { callback_query_id: cq.id }).catch(() => {});
                if (cqKey) {
                  const cqRes = getOrCreateHoldUser(cqKey, cqFrom.first_name || cqFrom.username, cqFrom.id, null, null);
                  st = cqRes.st;
                  const cqUser = cqRes.u;
                  const cqChatId = cq.message?.chat?.id || cqFrom.id;
                  const cqChatType = cq.message?.chat?.type;
                  const token = createSessionToken(cqUser.username, cqFrom.id);
                  const personalUrl = `${holdWebAppUrl}?auth=${encodeURIComponent(token)}`;
                  if (cq.data === 'daily_vault' && !['channel', 'group', 'supergroup'].includes(cqChatType) && cqChatId) {
                    await holdBotCall('sendMessage', {
                      chat_id: cqChatId,
                      text: formatBotVaultReply(st, cqUser),
                      parse_mode: 'HTML',
                      reply_markup: {
                        inline_keyboard: [
                          [{ text: 'HOLD', web_app: { url: personalUrl } }],
                          [{ text: '🎟️ Lucky Tickets', callback_data: 'lucky_info' }]
                        ]
                      }
                    });
                  } else if (cq.data === 'lucky_info' && cqChatId) {
                    await holdBotCall('sendMessage', {
                      chat_id: cqChatId,
                      text: formatBotTicketsReply(st, cqUser),
                      parse_mode: 'HTML',
                      reply_markup: {
                        inline_keyboard: [
                          [{ text: 'HOLD', web_app: { url: personalUrl } }],
                          [{ text: '🔐 Bugungi Vault kodi', callback_data: 'daily_vault' }]
                        ]
                      }
                    });
                  }
                }
              }

              if (item.message?.successful_payment) {
                const sp = item.message.successful_payment;
                const chargeId = sp.telegram_payment_charge_id;
                if (!st.payments.charges[chargeId]) {
                  const parts = String(sp.invoice_payload || '').split(':');
                  let targetKey = cleanKey(parts[1] || uKey || '');
                  if (targetKey && !st.users[targetKey] && st.aliases?.[targetKey] && st.users[st.aliases[targetKey]]) {
                    targetKey = st.aliases[targetKey];
                  }
                  if (!targetKey && fromUser?.id) {
                    const owner = findUserByPaxtaId(st, fromUser.id);
                    if (owner) targetKey = owner.username;
                  }
                  const starsAdded = parseInt(sp.total_amount, 10) || parseInt(parts[2], 10) || 0;
                  const invId = parts[3] || '';

                  if (invId && st.payments.invoices[invId]) {
                    st.payments.invoices[invId].status = 'paid';
                  }

                  let targetHoldUser = targetKey ? st.users[targetKey] : null;
                  if (!targetHoldUser && (targetKey || fromUser?.id)) {
                    const created = getOrCreateHoldUser(
                      targetKey || `paxta_${fromUser.id}`,
                      fromUser?.first_name || fromUser?.username,
                      fromUser?.id || null,
                      null,
                      null
                    );
                    st = created.st;
                    targetHoldUser = created.u;
                    targetKey = targetHoldUser.username;
                  }

                  const paidServiceId = invId ? st.payments.invoices[invId]?.serviceId : null;
                  st.payments.charges[chargeId] = {
                    username: targetKey || 'holder',
                    amount: starsAdded,
                    serviceId: paidServiceId || null,
                    paidAt: new Date().toISOString()
                  };

                  let paymentNotice = '';
                  if (paidServiceId && targetHoldUser) {
                    const applied = applyHoldService(targetHoldUser, st, paidServiceId);
                    paymentNotice = applied.ok
                      ? `✅ Toʻlov qabul qilindi!\n\n${applied.message}`
                      : `✅ Toʻlov qabul qilindi (${starsAdded} ⭐).`;
                    invalidateHoldAggCache('all');
                  } else {
                    const matchedPack = STARS_VIP_PACKS.find(p => p.starsPrice === starsAdded) || null;
                    let holdAward = matchedPack ? matchedPack.holdGrant : (starsAdded * 1_000);
                    if (targetHoldUser) {
                      holdAward = creditHold(targetHoldUser, st, holdAward, { pool: 'mining', applyHalving: false, skipServiceBoost: true });
                      if (matchedPack) {
                        if (matchedPack.tapBoost > 0) {
                          targetHoldUser.tapLevel = (targetHoldUser.tapLevel || 1) + matchedPack.tapBoost;
                        }
                        if (matchedPack.enableAutoBot) {
                          targetHoldUser.autoBotEnabled = true;
                        }
                      } else {
                        if (starsAdded >= 100) {
                          targetHoldUser.tapLevel = (targetHoldUser.tapLevel || 1) + Math.floor(starsAdded / 100);
                        }
                        if (starsAdded >= 500) {
                          targetHoldUser.autoBotEnabled = true;
                        }
                      }
                      invalidateHoldAggCache('all');
                    }
                    paymentNotice = `✅ Toʻlov qabul qilindi!\n\nHisobingizga +${holdAward.toLocaleString()} HOLD qoʻshildi!`;
                  }
                  saveHoldState(st);

                  if (item.message.chat?.id) {
                    const token = createSessionToken(targetKey || 'holder', fromUser?.id);
                    await holdBotCall('sendMessage', {
                      chat_id: item.message.chat.id,
                      text: paymentNotice,
                      reply_markup: {
                        inline_keyboard: [
                          [{ text: '🪙 HOLD ni ochish', web_app: { url: `${holdWebAppUrl}?auth=${encodeURIComponent(token)}` } }]
                        ]
                      }
                    });
                  }
                }
              }

              const txt = (item.message?.text || '').trim();
              if (txt) {
                const sender = item.message.from || {};
                const senderKey = cleanKey(sender.username || sender.first_name || `paxta_${sender.id}`);
                if (!senderKey) continue;

                const chatType = item.message?.chat?.type;
                const isPrivate = !['channel', 'group', 'supergroup'].includes(chatType);

                const isVaultCmd = txt === '/vault' || txt.startsWith('/vault@') || (isPrivate && (txt.toLowerCase() === 'bugungi vault kodi' || txt.toLowerCase() === 'vault'));
                const isTicketsCmd = txt === '/tickets' || txt.startsWith('/tickets@') || txt === '/lucky' || txt.startsWith('/lucky@');
                const isSlashCmd = txt.startsWith('/start') || txt.startsWith('/hold') || txt.startsWith('/play') || txt.startsWith('/ref');

                // Never treat normal group/channel chatter as bot commands or referrals
                if (!isPrivate && !isSlashCmd && !isTicketsCmd) {
                  continue;
                }

                const parts = txt.split(/\s+/);
                let rawRef = '';
                if (isSlashCmd && parts.length > 1) {
                  rawRef = parts.slice(1).join(' ').trim();
                } else if (
                  isPrivate &&
                  !txt.startsWith('/') &&
                  !isVaultCmd &&
                  !isTicketsCmd &&
                  (txt.startsWith('@') || /^(?:ref_|start=|https?:\/\/(?:www\.)?paxta\.online\/)/i.test(txt) || /^\d{1,12}$/.test(txt))
                ) {
                  rawRef = txt;
                }

                let refKey = null;
                if (rawRef) {
                  const match = String(rawRef)
                    .replace(/https?:\/\/(?:www\.)?paxta\.online\/(?:u\/)?/i, '')
                    .match(/^(?:ref_|start=)?@?(\d{1,12}|[A-Za-z0-9_]{3,32})/i);
                  if (match) {
                    const candidate = cleanKey(match[1]);
                    if (candidate && candidate !== senderKey && candidate.toLowerCase() !== 'holdbot' && candidate.toLowerCase() !== 'hold') {
                      refKey = candidate;
                    }
                  }
                }

                {
                  const mu0 = loadJSON(usersFile, {});
                  if (refKey) {
                    const rr = resolveRefKey(st, mu0, refKey);
                    refKey = rr && rr !== senderKey ? rr : null;
                  }
                  // Real PaxtaGram inviter who never opened HOLD yet -> create once (persisted)
                  if (refKey && !st.users[refKey] && mu0[refKey]) getOrCreateHoldUser(refKey);
                }

                // IMPORTANT: always continue on the SAME state object that getOrCreateHoldUser loaded/saved
                const senderRes = getOrCreateHoldUser(senderKey, sender.first_name || sender.username, sender.id, null, null);
                st = senderRes.st;
                const senderUser = senderRes.u;
                let refAttributed = false;
                let alreadyReferred = !!senderUser.referredBy;
                let inviterUser = null;

                if (refKey && (refKey === senderUser.username || (st.users[refKey] && st.users[refKey].referredBy === senderUser.username))) refKey = null;

                if (refKey && st.users[refKey]) {
                  if (!senderUser.referredBy) {
                    inviterUser = st.users[refKey];
                    if (!Array.isArray(inviterUser.referrals)) inviterUser.referrals = [];
                    senderUser.referredBy = refKey;
                    creditHold(senderUser, st, 5_000, { pool: 'ecosystem', applyHalving: true });
                    refAttributed = true;

                    let botInviterAward = inviterUser.refBooster2x ? 20_000 : 10_000;
                    if (!inviterUser.referrals.includes(senderUser.username)) {
                      inviterUser.referrals.push(senderUser.username);
                      botInviterAward = creditReferralInviter(inviterUser, st);
                    }
                    invalidateHoldAggCache('all');
                    saveHoldState(st);

                    if (inviterUser.paxtaId && String(inviterUser.paxtaId) !== String(sender.id) && botInviterAward > 0) {
                      try {
                        await holdBotCall('sendMessage', {
                          chat_id: inviterUser.paxtaId,
                          text: `🎉 <b>Yangi doʻstingiz qoʻshildi!</b>\n\n<b>@${escHtml(senderKey)}</b> sizning taklifingiz bilan $HOLD ga kirdi!\n💰 Hisobingizga <b>+${botInviterAward.toLocaleString()} $HOLD</b> qoʻshildi! 🚀`,
                          parse_mode: 'HTML',
                          reply_markup: {
                            inline_keyboard: [
                              [{ text: '🪙 HOLD ni ochish', web_app: { url: holdWebAppUrl } }]
                            ]
                          }
                        });
                      } catch (err) {
                        console.error('Failed to notify inviter via bot:', err?.message);
                      }
                    }
                  }
                }

                const token = createSessionToken(senderUser.username, sender.id);
                const personalUrl = `${holdWebAppUrl}?auth=${encodeURIComponent(token)}${refKey ? `&ref=${encodeURIComponent(refKey)}` : ''}`;
                const myRefCode = sender.id || senderUser.username;

                if (item.message?.chat?.id) {
                  if (isVaultCmd && isPrivate) {
                    await holdBotCall('sendMessage', {
                      chat_id: item.message.chat.id,
                      text: formatBotVaultReply(st, senderUser),
                      parse_mode: 'HTML',
                      reply_markup: {
                        inline_keyboard: [
                          [{ text: 'HOLD', web_app: { url: personalUrl } }],
                          [{ text: '🎟️ Lucky Tickets', callback_data: 'lucky_info' }]
                        ]
                      }
                    });
                  } else if (isTicketsCmd) {
                    await holdBotCall('sendMessage', {
                      chat_id: item.message.chat.id,
                      text: formatBotTicketsReply(st, senderUser),
                      parse_mode: 'HTML',
                      reply_markup: {
                        inline_keyboard: [
                          [{ text: 'HOLD', web_app: { url: personalUrl } }],
                          [{ text: '🔐 Bugungi Vault kodi', callback_data: 'daily_vault' }]
                        ]
                      }
                    });
                  } else {
                    const v = getActiveDailyVault(st, saveHoldState);
                    const vaultSolved = (senderUser.compassSolvedDays || []).includes(v.date);
                    const vaultLine = isPrivate
                      ? `\n\n🔐 <b>Bugungi Vault kodi (${escHtml(v.date)}):</b> ${escHtml(v.arrows)}\n<i>${vaultSolved ? '✅ Bugungi Vault ochildi!' : 'Tangani shu yoʻnalishda bosing: +30,000 $HOLD + 1 🎟️'}</i>`
                      : '';
                    let replyText = '';
                    if (refAttributed) {
                      replyText = `🎉 <b>Doʻstingiz @${escHtml(refKey)} taklifi muvaffaqiyatli qabul qilindi!</b>\n\n💰 Sizga <b>+5,000 $HOLD</b> bonusi berildi!${vaultLine}\n\nNothing to sell. Just hold. @hold`;
                    } else if (alreadyReferred && refKey && refKey !== senderUser.referredBy) {
                      replyText = `ℹ️ Siz allaqachon <b>@${escHtml(senderUser.referredBy)}</b> ning taklifi bilan roʻyxatdan oʻtgansiz.${vaultLine}\n\nNothing to sell. Just hold. @hold`;
                    } else {
                      replyText = `🪙 <b>HOLD — Nothing to sell. Just hold.</b>${vaultLine}\n\n👥 <b>Doʻstlaringizni taklif qiling:</b>\nDoʻstingizga @HOLDbot ga kirib quyidagi buyruqni yuborishini ayting:\n<code>/start ${escHtml(myRefCode)}</code>\n\n👉 Bot: https://paxta.online/u/HOLDbot\n\nHar bir doʻstingiz uchun sizga <b>+10,000 $HOLD</b>, doʻstingizga esa <b>+5,000 $HOLD</b> beriladi! 🚀`;
                    }

                    await holdBotCall('sendMessage', {
                      chat_id: item.message.chat.id,
                      text: replyText,
                      parse_mode: 'HTML',
                      reply_markup: {
                        inline_keyboard: [
                          [{ text: 'HOLD', web_app: { url: personalUrl } }],
                          [
                            { text: '🔐 Bugungi Vault kodi', callback_data: 'daily_vault' },
                            { text: '🎟️ Lucky Tickets', callback_data: 'lucky_info' }
                          ]
                        ]
                      }
                    });
                  }
                }
              }
            }
          } finally {
            st.payments.lastUpdateId = offset - 1;
            saveHoldState(st);
          }
        }
      } catch {}
      await new Promise(r => setTimeout(r, hadUpdates ? 250 : 900));
    }
  }

  return { startHoldBotLoop };
}


// ==================== 8-HOUR PASSIVE FARMING ENGINE ====================
let farmTickerInterval = null;

function renderFarmSheet() {
  const u = STATE.user;
  if (!u) return;
  renderFarmExtras();

  const updateFarmUI = () => {
    const curU = STATE.user;
    if (!curU) return;
    const farm = curU.farm || {
      startedAt: Date.now() - 3600_000,
      durationMs: 8 * 3600 * 1000,
      ratePerHour: 300,
      totalFarmReward: 2400,
      currentFarmed: 300,
      elapsedMs: 3600_000,
      remainingMs: 7 * 3600 * 1000,
      canClaim: false,
      refEarnings: 0
    };

    const now = Date.now();
    const duration = farm.durationMs || (8 * 3600 * 1000);
    const elapsed = Math.max(0, now - (farm.startedAt || now));
    const ratio = Math.min(1, elapsed / duration);
    const maxReward = farm.totalFarmReward || 2400;
    const currentFarmed = Math.min(maxReward, Math.floor(maxReward * ratio));
    const remainingMs = Math.max(0, duration - elapsed);
    const canClaim = elapsed >= duration;

    const elAmount = document.getElementById('uiFarmLiveAmount');
    const elFill = document.getElementById('uiFarmProgressFill');
    const elTimer = document.getElementById('uiFarmTimerText');
    const elRate = document.getElementById('uiFarmRateText');
    const elBtn = document.getElementById('btnClaimFarm');
    const elBtnLabel = document.getElementById('uiFarmBtnLabel');
    const elDot = document.getElementById('uiDockFarmDot');

    if (elAmount) elAmount.textContent = fmtInt(currentFarmed);
    if (elFill) elFill.style.width = `${Math.min(100, Math.round(ratio * 100))}%`;
    if (elRate) elRate.textContent = `⚡ ${farm.ratePerHour || 300} / soat`;

    if (canClaim) {
      if (elTimer) elTimer.textContent = '✨ Hosil yigʻishga tayyor!';
      if (elBtn) {
        if (!STATE.farmClaimBusy) elBtn.disabled = false;
        elBtn.classList.add('ready-claim');
      }
      if (elBtnLabel) elBtnLabel.textContent = `🌾 Claim +${maxReward.toLocaleString()} $HOLD`;
      if (elDot) elDot.hidden = false;
    } else {
      const h = String(Math.floor(remainingMs / 3600_000)).padStart(2, '0');
      const m = String(Math.floor((remainingMs % 3600_000) / 60_000)).padStart(2, '0');
      const s = String(Math.floor((remainingMs % 60_000) / 1000)).padStart(2, '0');
      if (elTimer) elTimer.textContent = `⏳ ${h}:${m}:${s} qoldi`;
      if (elBtn) {
        elBtn.disabled = true;
        elBtn.classList.remove('ready-claim');
      }
      if (elBtnLabel) elBtnLabel.textContent = `⏳ Farming in progress... (${h}:${m})`;
      if (elDot) elDot.hidden = true;
    }

    // Referral kickback farm stats
    const refEarnings = farm.refEarnings || 0;
    const elRefAmount = document.getElementById('uiFarmRefAmount');
    const elBtnRef = document.getElementById('btnClaimFarmRef');
    if (elRefAmount) elRefAmount.textContent = `+${refEarnings.toLocaleString()} $HOLD`;
    if (elBtnRef && !STATE.farmRefClaimBusy) elBtnRef.disabled = refEarnings <= 0;
  };

  updateFarmUI();
  if (farmTickerInterval) clearInterval(farmTickerInterval);
  farmTickerInterval = setInterval(updateFarmUI, 1000);
}

async function claimFarmYield() {
  if (STATE.farmClaimBusy) return;
  const btn = document.getElementById('btnClaimFarm');
  STATE.farmClaimBusy = true;
  if (btn) btn.disabled = true;
  haptic('medium');
  try {
    const res = await api('/api/hold/farm-claim', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username })
    });
    if (res.ok && res.user) {
      mergeUserState(res.user);
      haptic('heavy');
      renderAll();
      renderFarmSheet();
      showToast(res.message || 'Hosil muvaffaqiyatli olindi!');
    } else {
      showToast(res?.error || 'Hosil hali toʻlmadi');
      renderFarmSheet();
    }
  } catch (err) {
    showToast('Tarmoqda xatolik yuz berdi');
  } finally {
    STATE.farmClaimBusy = false;
    renderFarmSheet();
  }
}

async function claimFarmRefYield() {
  if (STATE.farmRefClaimBusy) return;
  const btn = document.getElementById('btnClaimFarmRef');
  STATE.farmRefClaimBusy = true;
  if (btn) btn.disabled = true;
  haptic('medium');
  try {
    const res = await api('/api/hold/farm-claim-ref', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username })
    });
    if (res.ok && res.user) {
      mergeUserState(res.user);
      haptic('heavy');
      renderAll();
      renderFarmSheet();
      showToast(res.message || 'Ulush olindi!');
    } else {
      showToast(res?.error || 'Ulush mavjud emas');
    }
  } catch (err) {
    showToast('Tarmoqda xatolik yuz berdi');
  } finally {
    STATE.farmRefClaimBusy = false;
    renderFarmSheet();
  }
}

// ==================== PAWS-STYLE 5-SLIDE IDENTITY STORY ====================
let fpCurrentSlide = 0;

function openFootprintStoryModal() {
  const u = STATE.user || {};
  const fp = u.footprint || {
    claimed: false,
    tierName: 'Pioneer Genesis',
    ageBonus: 25000,
    nftCount: 2,
    nftBonus: 30000,
    communityBonus: 10000,
    totalAirdrop: 65000,
    paxtaId: u.paxtaId || 142
  };

  const slides = [
    {
      icon: '🆔',
      title: 'PaxtaGram Tarixingiz',
      sub: `Siz PaxtaGramga dastlabki toʻlqinda qoʻshilgansiz. Sizning ID raqamingiz: <b>#${fp.paxtaId || 999}</b>!`,
      valLabel: 'Pioneer Maqomi',
      val: `${fp.tierName} (+${fp.ageBonus.toLocaleString()} $HOLD)`
    },
    {
      icon: '💎',
      title: 'NFT & Nufuz Portfeli',
      sub: `Profilingizdagi rasmiy Victory Medal va Desk Kalendarlar aniqlandi (${fp.nftCount} ta)!`,
      valLabel: 'Kolleksiya Nufuzi',
      val: `+${fp.nftBonus.toLocaleString()} $HOLD`
    },
    {
      icon: '🐾',
      title: 'Hamjamiyat Sodiqligi',
      sub: `Siz shunchaki oʻyinchi emassiz. Siz $HOLD oilasining rasmiy va qadrli aʼzosisiz!`,
      valLabel: 'Hamjamiyat Bonusi',
      val: `+${fp.communityBonus.toLocaleString()} $HOLD`
    },
    {
      icon: '🎯',
      title: 'The Final & Listing Sanasi',
      sub: 'Hech qanday noaniqlik yoʻq! Listing sanasi va mehnatlar mukofoti aniq belgilangan.',
      valLabel: 'Rasmiy Listing Sanasi',
      val: '15 · Dekabr · 2026'
    },
    {
      icon: '🎁',
      title: 'The Final Sovgʻasi',
      sub: 'Barcha mehnatingiz va sodiqligingiz uchun rasmiy final sovgʻangiz taqdim etiladi:',
      valLabel: 'Final Sovgʻa Ulushi',
      val: `+${fp.totalAirdrop.toLocaleString()} $HOLD`
    }
  ];

  fpCurrentSlide = 0;
  const modal = document.getElementById('footprintStoryModal');
  if (!modal) return;
  modal.hidden = false;

  const renderCurrentSlide = () => {
    // Fill story bars
    for (let i = 0; i < 5; i++) {
      const bar = document.getElementById(`fsmFill${i}`);
      if (bar) {
        bar.style.width = i < fpCurrentSlide ? '100%' : (i === fpCurrentSlide ? '100%' : '0%');
      }
    }

    const slideData = slides[fpCurrentSlide];
    const container = document.getElementById('fsmSlidesWrap');
    if (container) {
      container.innerHTML = `
        <div class="fsm-slide">
          <div class="fsm-slide-icon">${slideData.icon}</div>
          <div class="fsm-slide-title">${slideData.title}</div>
          <div class="fsm-slide-sub">${slideData.sub}</div>
          <div class="fsm-stat-box">
            <span class="fsm-stat-label">${slideData.valLabel}</span>
            <span class="fsm-stat-val">${slideData.val}</span>
          </div>
        </div>
      `;
    }

    const nextBtn = document.getElementById('btnFootprintNext');
    if (nextBtn) {
      if (fpCurrentSlide < 4) {
        nextBtn.textContent = 'Davom etish ➔';
      } else {
        if (!fp.claimed) {
          nextBtn.textContent = `🎁 Final Sovgʻasini Olish (+${fp.totalAirdrop.toLocaleString()} $HOLD)`;
        } else {
          nextBtn.textContent = '🚀 Natijani Telegramda Ulashish';
        }
      }
    }
  };

  renderCurrentSlide();

  const nextBtn = document.getElementById('btnFootprintNext');
  if (nextBtn) {
    nextBtn.onclick = async () => {
      haptic('light');
      if (fpCurrentSlide < 4) {
        fpCurrentSlide++;
        renderCurrentSlide();
      } else {
        if (!fp.claimed) {
          const res = await api('/api/hold/footprint-claim', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username })
          });
          if (res.ok && res.user) {
            STATE.user = res.user;
            haptic('heavy');
            renderAll();
            showToast(res.message);
            modal.hidden = true;
          }
        } else {
          // Share footprint in Telegram
          const shareText = `🐾 *$HOLD da mening PaxtaGram Raqamli Izim aniqlandi!*\n\nID: #${fp.paxtaId || 999}\nKafolatlangan Airdrop: +${fp.totalAirdrop.toLocaleString()} $HOLD\n\nO'zing ham tekshir: https://paxta.online/u/HOLDbot`;
          try {
            await navigator.clipboard.writeText(shareText);
            showToast('Natijangiz nusxalandi! Doʻstlaringizga yuboring');
          } catch {
            showToast('Natijangiz saqlandi');
          }
          modal.hidden = true;
        }
      }
    };
  }

  document.getElementById('btnCloseFootprintStory').onclick = () => { modal.hidden = true; };
  document.getElementById('fsmBackdrop').onclick = () => { modal.hidden = true; };
}

// ==================== SOLAR ECLIPSE SECRET EASTER EGG ====================
let eclipseCountdownTimer = null;

function triggerSolarEclipseEasterEgg() {
  const modal = document.getElementById('eclipseSecretModal');
  if (!modal) return;
  const coinBtn = document.getElementById('holdCoinBtn');

  haptic('heavy');
  if (coinBtn) {
    coinBtn.style.transition = 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
    coinBtn.style.transform = 'rotateY(180deg) scale(1.05)';
  }

  const timers = [];
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
  later(() => haptic('light'), 700);
  later(() => haptic('medium'), 1900);
  later(() => haptic('heavy'), 3500);
  later(() => haptic('heavy'), 3750);

  const dateEl = document.getElementById('eclipseDateText');
  const finalText = '15 \u00b7 12 \u00b7 2026';
  if (dateEl) dateEl.textContent = '?? \u00b7 ?? \u00b7 ????';
  later(() => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / 1500);
      let out = '';
      for (let i = 0; i < finalText.length; i++) {
        const ch = finalText[i];
        if (!/\d/.test(ch)) { out += ch; continue; }
        out += (i / finalText.length < p) ? ch : String(Math.floor(Math.random() * 10));
      }
      if (dateEl) dateEl.textContent = out;
      if (p >= 1) clearInterval(iv);
    }, 50);
    timers.push(iv);
  }, 4300);

  modal.hidden = false;

  const updateCountdown = () => {
    const target = new Date('2026-12-15T00:00:00+05:00').getTime();
    const diff = Math.max(0, target - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff / 3600000) % 24);
    const minutes = Math.floor((diff / 60000) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v).padStart(2, '0'); };
    set('eclipseDays', days);
    set('eclipseHours', hours);
    set('eclipseMinutes', minutes);
    set('eclipseSeconds', seconds);
  };
  updateCountdown();
  if (eclipseCountdownTimer) clearInterval(eclipseCountdownTimer);
  eclipseCountdownTimer = setInterval(updateCountdown, 1000);

  const shareBtn = document.getElementById('btnShareEclipse');
  if (shareBtn) shareBtn.onclick = async () => {
    const text = 'THE DAY: 15.12.2026. Tangani chetidan 3 marta aylantirib, sirni oching: https://paxta.online/u/HOLDbot';
    try {
      await navigator.clipboard.writeText(text);
      showToast('Sir nusxalandi. Doʻstlaringizga yuboring');
    } catch {
      showToast('15.12.2026');
    }
  };

  const closeEclipseModal = () => {
    modal.hidden = true;
    timers.forEach(t => { clearTimeout(t); clearInterval(t); });
    if (eclipseCountdownTimer) clearInterval(eclipseCountdownTimer);
    if (coinBtn) {
      coinBtn.style.transition = 'transform 0.08s cubic-bezier(0.2, 0.8, 0.2, 1)';
      coinBtn.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };
  const btnClose = document.getElementById('btnCloseEclipse');
  if (btnClose) btnClose.onclick = closeEclipseModal;
}


// ==================== SQUAD WARS + FARM EXTRAS ====================
function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return (d > 0 ? d + 'd ' : '') + h + ':' + m + ':' + sec;
}

function renderWarsSheet() {
  const u = STATE.user;
  if (!u || !u.wars) return;
  const w = u.wars;
  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  const prizeEl = document.getElementById('uiWarsPrize');
  if (prizeEl) prizeEl.textContent = 'Winner squad: +' + fmtInt(w.prize) + ' HOLD each · +' + w.leaderBonusPct + '% farm speed';

  const my = document.getElementById('uiWarsMyCard');
  if (my) {
    if (!w.mySquadName) {
      my.innerHTML = `
        <button type="button" class="not-row-item" id="btnWarsJoin">
          <div class="nri-icon-box">⚔️</div>
          <div class="nri-center">
            <div class="nri-title">Squadga qoʻshiling</div>
            <div class="nri-sub">Jangda qatnashish uchun jamoa tanlang</div>
          </div>
          <span class="nri-chevron">›</span>
        </button>`;
      document.getElementById('btnWarsJoin')?.addEventListener('click', () => openSheet('frens'));
    } else {
      my.innerHTML = `
        <button type="button" class="not-row-item" id="btnWarsMySquad">
          <div class="cp-avatar" style="width:44px;height:44px;border-radius:12px;">${esc((w.mySquadName || 'S').charAt(0).toUpperCase())}</div>
          <div class="nri-center">
            <div class="nri-title">${esc(w.mySquadName)} ${w.isLeader ? '👑' : ''}</div>
            <div class="nri-sub">#${w.myRank} · <img src="${esc(coinImg)}" class="inline-c" alt="" /> ${fmtInt(w.myScore)} · siz: ${fmtInt(w.myEarned)}</div>
          </div>
          <span class="war-rank-badge">#${w.myRank}</span>
        </button>`;
      document.getElementById('btnWarsMySquad')?.addEventListener('click', () => openSquadModal(w.mySquadId));
    }
  }

  const list = document.getElementById('uiWarsList');
  if (list) {
    const topList = Array.isArray(w.top) ? w.top : [];
    if (!topList.length) {
      list.innerHTML = '<div class="not-row-item"><div class="nri-center"><div class="nri-sub">Hali squadlar yoʻq</div></div></div>';
    } else {
      list.innerHTML = topList.map((sq, i) => `
        <button type="button" class="not-row-item ${sq.id === w.mySquadId ? 'war-row-me' : ''}" data-squad-id="${esc(sq.id)}">
          <span class="war-rank-num">${i + 1}</span>
          <div class="nri-center">
            <div class="nri-title">${esc(sq.name)} ${sq.verified ? '<span style="color:#38b6ff;">✓</span>' : ''} ${sq.isOwner ? '👑' : ''}</div>
            <div class="nri-sub">${fmtInt(sq.members)} a'zo${sq.owner ? ' · @' + esc(sq.owner) : ''}</div>
          </div>
          <span class="war-score"><img src="${esc(coinImg)}" class="inline-c" alt="" /> ${fmtInt(sq.score)}</span>
        </button>`).join('');
      list.querySelectorAll('[data-squad-id]').forEach(b => {
        b.addEventListener('click', () => openSquadModal(b.dataset.squadId));
      });
    }
  }

  const last = document.getElementById('uiWarsLast');
  if (last) {
    last.textContent = w.lastWinner
      ? 'Oʻtgan hafta gʻolibi: ' + w.lastWinner.name + ' (+' + fmtInt(w.lastWinner.prize) + ' × ' + w.lastWinner.members + ')'
      : 'Birinchi haftalik jang davom etmoqda';
  }
  tickWars();
}

async function openSquadModal(squadId) {
  if (!squadId || STATE.squadModalBusy) return;
  STATE.squadModalBusy = true;
  let res;
  try {
    res = await api('/api/hold/squad-members', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username, squadId })
    });
  } finally {
    STATE.squadModalBusy = false;
  }
  if (!res || !res.ok) { showToast(res?.error || 'Squad yuklanmadi'); return; }
  const sq = res.squad;
  const rows = res.members.length ? res.members.map((m, i) => `
    <div class="not-row-item" style="padding:8px 6px;">
      <span class="war-rank-num">${i + 1}</span>
      <div class="nri-center">
        <div class="nri-title">${esc(m.displayName)} ${m.isOwner ? '👑' : ''}</div>
        <div class="nri-sub">@${esc(m.username)} · hafta: ${fmtInt(m.weekEarned)}</div>
      </div>
      <span class="war-score">${fmtInt(m.lifetimeHold)}</span>
    </div>`).join('') : '<div class="nri-sub" style="padding:10px;">Hali a\'zolar yo\'q</div>';
  const manage = sq.canManage ? `
    <div style="display:flex;gap:8px;margin:10px 0;">
      <input id="squadRenameInput" maxlength="28" value="${esc(sq.name)}" style="flex:1;min-width:0;background:#15171c;border:1px solid #262a33;border-radius:12px;color:#fff;padding:10px 12px;font-size:15px;" />
      <button type="button" class="skin-pill-btn" id="btnSquadRename">Saqlash</button>
    </div>` : '';
  const claim = (!sq.canManage && sq.canClaim) ? `
    <div id="squadClaimWrap" style="margin:10px 0;">
      <button type="button" class="btn-sapphire-primary" id="btnSquadClaim">👑 Men kanal adminiman — egalik qilish</button>
      <div id="squadClaimProofBox" hidden style="margin-top:8px;padding:10px 12px;border-radius:12px;background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.35);font-size:12.5px;line-height:1.45;">
        <div style="font-weight:700;color:#fff;margin-bottom:4px;">🔐 Egalikni tasdiqlash</div>
        <div style="color:var(--text-2);">Kanalingizga yoki bioʻsiga quyidagi kodni yozing va <b>Tekshirish</b> tugmasini bosing (tasdiqlangach oʻchirishingiz mumkin):</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;background:rgba(0,0,0,0.3);padding:8px 10px;border-radius:10px;">
          <code id="uiSquadClaimCode" style="font-size:15px;font-weight:800;color:#7dd3fc;">HOLD-000000</code>
          <button type="button" class="skin-pill-btn" id="btnCopyClaimCode" style="padding:4px 10px;">Nusxalash</button>
        </div>
        <button type="button" class="btn-sapphire-primary" id="btnVerifyClaimProof" style="margin-top:8px;">✅ Tekshirish va Egalik qilish</button>
      </div>
    </div>` : '';
  const chBtn = (sq.handle || sq.link)
    ? `<button type="button" class="btn-sapphire-primary" id="btnOpenSquadCh" style="margin-top:10px;">PaxtaGram ichida kanalga oʻtish</button>`
    : '';
  openModal(sq.name, `
    <div class="nri-sub" style="margin-bottom:4px;">@${esc(sq.handle || sq.id)} · ${fmtInt(sq.count)} a'zo${sq.ownerUsername ? ' · ega: @' + esc(sq.ownerUsername) : ''}</div>
    ${manage}${claim}
    <div class="dark-group-box" style="max-height:42vh;overflow:auto;">${rows}</div>${chBtn}`,
  () => {
    document.getElementById('btnOpenSquadCh')?.addEventListener('click', () => {
      openInternalPaxtaChannel(sq.handle || sq.link || sq.id);
      closeModal();
    });
    const renameBtn = document.getElementById('btnSquadRename');
    renameBtn?.addEventListener('click', async () => {
      if (renameBtn.disabled) return;
      const name = document.getElementById('squadRenameInput')?.value || '';
      renameBtn.disabled = true;
      const r = await api('/api/hold/squad-rename', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, squadId, name })
      });
      renameBtn.disabled = false;
      if (r?.ok && r.user) {
        mergeUserState(r.user);
        if (Array.isArray(r.user.squads)) STATE.squads = r.user.squads;
        STATE.lastVaultFetchedAt = 0;
        renderAll(); closeModal(); showToast(r.message);
      } else showToast(r?.error || 'Xatolik');
    });
    const doClaim = async (btnEl) => {
      if (btnEl?.disabled) return;
      if (btnEl) btnEl.disabled = true;
      const r = await api('/api/hold/squad-claim', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, squadId })
      });
      if (btnEl) btnEl.disabled = false;
      if (r?.ok && r.user) {
        mergeUserState(r.user);
        if (Array.isArray(r.user.squads)) STATE.squads = r.user.squads;
        STATE.lastVaultFetchedAt = 0;
        renderAll(); closeModal(); showToast(r.message);
      } else if (r?.needProof && r?.claimCode) {
        const box = document.getElementById('squadClaimProofBox');
        const codeEl = document.getElementById('uiSquadClaimCode');
        const claimBtn = document.getElementById('btnSquadClaim');
        if (codeEl) codeEl.textContent = r.claimCode;
        if (box) box.hidden = false;
        if (claimBtn) claimBtn.hidden = true;
      } else {
        showToast(r?.error || 'Tasdiqlanmadi');
      }
    };
    document.getElementById('btnSquadClaim')?.addEventListener('click', (e) => doClaim(e.currentTarget));
    document.getElementById('btnVerifyClaimProof')?.addEventListener('click', (e) => doClaim(e.currentTarget));
    document.getElementById('btnCopyClaimCode')?.addEventListener('click', async () => {
      const code = document.getElementById('uiSquadClaimCode')?.textContent || '';
      if (!code) return;
      try { await navigator.clipboard.writeText(code); } catch {}
      showToast('📋 Kod nusxalandi: ' + code);
    });
  });
}

function tickWars() {
  const w = STATE.user?.wars;
  const el = document.getElementById('uiWarsTimer');
  if (w && el) el.textContent = fmtClock(w.endsAt - Date.now());
}

function renderFarmExtras() {
  const u = STATE.user;
  if (!u || !u.farm) return;
  const f = u.farm;
  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  const up = document.getElementById('farmUpgradesList');
  if (up) {
    const sMax = f.speedLevel >= f.speedMax;
    const cMax = f.capLevel >= f.capMax;
    up.innerHTML = `
      <button type="button" class="not-row-item" data-farm-upg="speed" ${sMax ? 'disabled' : ''}>
        <div class="nri-icon-box">⚡</div>
        <div class="nri-center">
          <div class="nri-title">Farm speed</div>
          <div class="nri-sub">${sMax ? 'Max level reached' : '<img src="' + esc(coinImg) + '" class="inline-c" alt="" /> <b>' + fmtInt(f.nextSpeedCost) + '</b> · lvl ' + f.speedLevel + ' · ' + f.baseRate + '/h'}</div>
        </div>
        <span class="nri-chevron">${sMax ? '✓' : '›'}</span>
      </button>
      <button type="button" class="not-row-item" data-farm-upg="cap" ${cMax ? 'disabled' : ''}>
        <div class="nri-icon-box">📦</div>
        <div class="nri-center">
          <div class="nri-title">Farm storage</div>
          <div class="nri-sub">${cMax ? 'Max level reached' : '<img src="' + esc(coinImg) + '" class="inline-c" alt="" /> <b>' + fmtInt(f.nextCapCost) + '</b> · lvl ' + f.capLevel + ' · ' + f.durationHours + 'h'}</div>
        </div>
        <span class="nri-chevron">${cMax ? '✓' : '›'}</span>
      </button>`;
    up.querySelectorAll('[data-farm-upg]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        btn.disabled = true;
        haptic('medium');
        try {
          const res = await api('/api/hold/farm-upgrade', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, type: btn.dataset.farmUpg })
          });
          if (res.ok && res.user) {
            mergeUserState(res.user);
            renderAll();
            renderFarmSheet();
            showToast(res.message);
          } else {
            btn.disabled = false;
            showToast(res?.error || 'Xatolik');
          }
        } catch {
          btn.disabled = false;
          showToast('Tarmoqda xatolik');
        }
      });
    });
  }

  const durNote = document.getElementById('uiFarmDurationNote');
  if (durNote) durNote.textContent = 'Auto-farm · har ' + (f.durationHours || 8) + ' soatda bir marta yigʻib oling';
  const stTitle = document.getElementById('uiFarmStorageTitle');
  if (stTitle) stTitle.textContent = (f.durationHours || 8) + ' soatlik zaxira';

  const bn = document.getElementById('farmBonusList');
  if (bn) {
    bn.innerHTML = `
      <div class="not-row-item">
        <div class="nri-icon-box">🔥</div>
        <div class="nri-center">
          <div class="nri-title">Daily streak</div>
          <div class="nri-sub">${f.streakPct > 0 ? '+' + f.streakPct + '% farm speed active' : 'Har kuni kiring: +2% kuniga (max +14%)'}</div>
        </div>
      </div>
      <button type="button" class="not-row-item" id="btnFarmWarsRow">
        <div class="nri-icon-box">⚔️</div>
        <div class="nri-center">
          <div class="nri-title">Squad Wars leader</div>
          <div class="nri-sub">${f.warPct > 0 ? '+' + f.warPct + '% farm speed active 👑' : 'Squadingiz #1 boʻlsa +20% farm speed'}</div>
        </div>
        <span class="nri-chevron">›</span>
      </button>`;
    document.getElementById('btnFarmWarsRow')?.addEventListener('click', () => openSheet('wars'));
  }
}

function updateArenaFarmChip() {
  const f = STATE.user?.farm;
  const chip = document.getElementById('btnArenaFarmChip');
  const txt = document.getElementById('uiArenaFarmText');
  const dot = document.getElementById('uiDockFarmDot');
  if (!f) return;
  const dur = f.durationMs || 8 * 3600_000;
  const elapsed = Math.max(0, Date.now() - (f.startedAt || Date.now()));
  const ready = elapsed >= dur;
  if (dot) dot.hidden = !ready;
  if (!chip || !txt) return;
  if (ready) {
    chip.classList.add('ready');
    const nextTxt = 'Farm ready · Claim +' + fmtInt(f.totalFarmReward);
    if (txt.textContent !== nextTxt) txt.textContent = nextTxt;
  } else {
    chip.classList.remove('ready');
    const nextTxt = 'Farming ' + Math.floor((elapsed / dur) * 100) + '% · ' + fmtClock(dur - elapsed);
    if (txt.textContent !== nextTxt) txt.textContent = nextTxt;
  }
}

setInterval(() => {
  if (STATE.activeSheet === 'wars') tickWars();
  if (!STATE.activeSheet) updateArenaFarmChip();
}, 1000);


// ==================== GLOBAL NATIVE SELECTION & CONTEXT MENU SUPPRESSION ====================
// Completely disables "Copy", "Look up", "Share", and long-press callouts across the whole Mini App
window.addEventListener('contextmenu', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { capture: true, passive: false });

document.addEventListener('contextmenu', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { capture: true, passive: false });

document.addEventListener('selectstart', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  e.preventDefault();
  return false;
}, { capture: true, passive: false });

document.addEventListener('dragstart', (e) => {
  e.preventDefault();
  return false;
}, { capture: true, passive: false });

// ============================================================================
// HOLD — Official Web3 Mini App (3D Trophies, Mid-Air Morse, Onboarding, Admin)
// ============================================================================

const MORSE_MAP = {
  A: '.-',    B: '-...',  C: '-.-.',  D: '-..',   E: '.',     F: '..-.',
  G: '--.',   H: '....',  I: '..',    J: '.---',  K: '-.-',   L: '.-..',
  M: '--',    N: '-.',    O: '---',   P: '.--.',  Q: '--.-',  R: '.-.',
  S: '...',   T: '-',     U: '..-',   V: '...-',  W: '.--',   X: '-..-',
  Y: '-.--',  Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.'
};

const REVERSE_MORSE = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
);

// Purge any legacy fake holder_XXX localStorage from earlier versions
(() => {
  const savedUser = localStorage.getItem('hold_username') || '';
  if (/^(holder_|guest_)/i.test(savedUser)) {
    localStorage.removeItem('hold_username');
    localStorage.removeItem('hold_auth_token');
  }
})();

const STATE = {
  user: null,
  authToken: localStorage.getItem('hold_auth_token') || localStorage.getItem('paxta_gift_auth_token') || '',
  username: localStorage.getItem('hold_username') || '',
  webAppInitData: '',
  webAppUser: null,
  totalPlayers: 0,
  top10Prizes: [],
  nftPoolSummary: null,
  squads: [],
  leaderboard: [],
  leaderboardDay: [],
  openedQuestLinks: {},
  viewedLeagueIdx: 0,
  leagueMainTab: 'miners',
  leagueTimePeriod: 'day',
  onboardingStep: 0,
  adminTab: 'overview',
  adminUsersData: null,
  adminUsersFetchedAt: 0,
  adminRenderSeq: 0,
  activeSheet: null,
  dirtySheets: { boosts: true, earn: true, frens: true, leagues: true, farm: true, wars: true },
  lastVaultFetchedAt: 0,
  vaultPromise: null,
  vaultLoading: false,
  lastSquadPillSig: '',
  // Pure Invisible Mid-Air Morse State
  morseSignal: '',
  morseDecodedLetters: [],
  morseMatchedWords: [],
  morseLetterTimer: null,
  morseClearAirTimer: null,
  dashFeedbackTimer: null,
  pointerDownTime: 0,
  pendingTaps: 0,
  tapSyncTimer: null,
  tapSyncInFlight: false,
  turboActiveUntil: 0,
  turboEndTimer: null,
  invoicePollTimer: null,
  questCountdownTimer: null,
  farmClaimBusy: false,
  farmRefClaimBusy: false,
  squadModalBusy: false,
  boostBusy: false,
  skinBusy: false
};

// ---- PaxtaGram Mini App PostMessage & InitData Parser (Zero External Tab Redirects) ----
function notifyPaxtaMiniApp(eventType, eventData = {}) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(JSON.stringify({ eventType, eventData }), '*');
    }
    if (window.TelegramWebviewProxy?.postEvent) {
      window.TelegramWebviewProxy.postEvent(eventType, JSON.stringify(eventData));
    }
  } catch {}
}

function parsePaxtaWebAppData() {
  try {
    // 1. Check standard Telegram.WebApp if populated
    const tg = window.Telegram?.WebApp;
    if (tg?.initData && tg?.initDataUnsafe?.user) {
      STATE.webAppInitData = tg.initData;
      STATE.webAppUser = tg.initDataUnsafe.user;
      return;
    }

    // 2. Check #tgWebAppData in window.location.hash or search (How PaxtaGram Mini Apps pass user data!)
    const rawHash = window.location.hash ? window.location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(rawHash);
    const searchParams = new URLSearchParams(window.location.search);
    const tgWebAppData = hashParams.get('tgWebAppData') || searchParams.get('tgWebAppData') || tg?.initData || '';

    if (tgWebAppData) {
      STATE.webAppInitData = tgWebAppData;
      const innerParams = new URLSearchParams(tgWebAppData);
      const userJson = innerParams.get('user');
      if (userJson) {
        STATE.webAppUser = JSON.parse(userJson);
        return;
      }
      try {
        const decoded = decodeURIComponent(tgWebAppData);
        const inner2 = new URLSearchParams(decoded);
        const userJson2 = inner2.get('user');
        if (userJson2) {
          STATE.webAppUser = JSON.parse(userJson2);
          return;
        }
      } catch {}
    }

    // 3. Fallback to shared paxta_gift_user in same-origin localStorage
    const sharedUserRaw = localStorage.getItem('paxta_gift_user');
    if (sharedUserRaw) {
      const parsed = JSON.parse(sharedUserRaw);
      if (parsed?.username && !/^(holder_|guest_)/i.test(parsed.username)) {
        STATE.webAppUser = {
          id: parsed.paxtaId || parsed.id || null,
          username: parsed.username,
          first_name: parsed.displayName || parsed.username
        };
      }
    }
  } catch {}
}

function openInternalPaxtaChannel(linkOrHandle) {
  const raw = String(linkOrHandle || '').trim();
  if (!raw) return;
  const cleanHandle = raw
    .replace(/^https?:\/\/(www\.)?(paxta\.online|t\.me)\//i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0]
    .trim();

  if (cleanHandle) {
    // Tell PaxtaGram parent frame to navigate internally without opening a new tab
    notifyPaxtaMiniApp('web_app_open_tg_link', { path_full: `/${cleanHandle}` });
    try {
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(`https://t.me/${cleanHandle}`);
      }
    } catch {}
  }
}

function haptic(style = 'light') {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(style);
  } catch {}
  notifyPaxtaMiniApp('web_app_trigger_haptic_feedback', { type: 'impact', impact_style: style });
}

const fmtInt = (n) => Math.floor(Number(n) || 0).toLocaleString('en-US');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function fmtOrdinal(n) {
  const num = parseInt(n, 10) || 1;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return fmtInt(num) + (s[(v - 20) % 10] || s[v] || s[0]);
}

function showToast(msg) {
  const el = document.getElementById('holdToast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.hidden = true; }, 2900);
}

function openModal(title, html, onMount) {
  const bd = document.getElementById('holdModalBackdrop');
  const tEl = document.getElementById('holdModalTitle');
  const bEl = document.getElementById('holdModalBody');
  if (!bd || !tEl || !bEl) return;
  tEl.textContent = title;
  bEl.innerHTML = html;
  bd.hidden = false;
  if (typeof onMount === 'function') onMount(bEl);
}

function clearInvoicePoll() {
  if (STATE.invoicePollTimer) {
    clearInterval(STATE.invoicePollTimer);
    STATE.invoicePollTimer = null;
  }
}

function closeModal() {
  clearInvoicePoll();
  if (STATE.questCountdownTimer) {
    clearInterval(STATE.questCountdownTimer);
    STATE.questCountdownTimer = null;
  }
  const bd = document.getElementById('holdModalBackdrop');
  if (bd) bd.hidden = true;
}

function renderSheetByName(sheetName) {
  if (!STATE.user) return;
  if (sheetName === 'wars') {
    renderWarsSheet();
  } else if (sheetName === 'farm') {
    renderFarmSheet();
  } else if (sheetName === 'boosts') {
    renderBoostsAndSkinsSheet();
  } else if (sheetName === 'earn') {
    renderEarnSheet();
  } else if (sheetName === 'frens') {
    renderFrensSheet();
  } else if (sheetName === 'leagues') {
    renderLeaguesSheet();
  } else if (sheetName === 'admin') {
    renderAdminSheet();
  }
  if (sheetName && sheetName in STATE.dirtySheets) {
    STATE.dirtySheets[sheetName] = false;
  }
}

function openSheet(sheetName) {
  const map = {
    frens: 'sheetFrens',
    earn: 'sheetEarn',
    boosts: 'sheetBoosts',
    leagues: 'sheetLeagues',
    admin: 'sheetAdmin',
    farm: 'sheetFarm',
    wars: 'sheetWars'
  };
  if (sheetName !== 'farm' && farmTickerInterval) {
    clearInterval(farmTickerInterval);
    farmTickerInterval = null;
  }
  if (sheetName !== 'earn') clearInvoicePoll();
  document.querySelectorAll('.apple-sheet').forEach(s => { s.hidden = true; });
  const targetId = map[sheetName];
  if (targetId) {
    STATE.activeSheet = sheetName;
    const el = document.getElementById(targetId);
    if (el) {
      el.hidden = false;
      document.body.classList.add('sheet-open');
    }
    if (sheetName === 'leagues') {
      const leagues = STATE.user?.allLeagues || [];
      const curIdx = leagues.findIndex(l => l.id === STATE.user?.league?.id);
      if (curIdx >= 0) STATE.viewedLeagueIdx = curIdx;
      renderSheetByName('leagues');
      loadLeaderboardData(false);
    } else if (sheetName === 'farm' || sheetName === 'admin' || STATE.dirtySheets[sheetName]) {
      renderSheetByName(sheetName);
    }
  }
}

function closeAllSheets() {
  if (farmTickerInterval) {
    clearInterval(farmTickerInterval);
    farmTickerInterval = null;
  }
  clearInvoicePoll();
  STATE.activeSheet = null;
  document.querySelectorAll('.apple-sheet').forEach(s => { s.hidden = true; });
  document.body.classList.remove('sheet-open');
  updateArenaFarmChip();
}

// ---- API Helper ----
function getWebAppInitData() {
  if (STATE.webAppInitData) return STATE.webAppInitData;
  try {
    if (window.Telegram?.WebApp?.initData) return window.Telegram.WebApp.initData;
  } catch {}
  return '';
}

async function api(url, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };
  if (STATE.authToken) headers['X-Auth-Token'] = STATE.authToken;
  const initData = getWebAppInitData();
  if (initData) headers['X-Init-Data'] = initData;

  try {
    const res = await fetch(url, { ...opts, headers });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, status: res.status, error: res.ok ? 'Notoʻgʻri server javobi' : `Server xatosi (${res.status})` };
    }
  } catch (err) {
    return { ok: false, networkError: true, error: 'Tarmoqda xatolik yuz berdi' };
  }
}

function mergeUserState(nextUser) {
  if (!nextUser || typeof nextUser !== 'object') return STATE.user;
  const prevFrac = STATE.user?._clientFrac || 0;
  STATE.user = STATE.user ? { ...STATE.user, ...nextUser } : { ...nextUser };
  if (nextUser._clientFrac === undefined) {
    STATE.user._clientFrac = prevFrac;
  }
  const serverTurbo = Number(STATE.user.turboActiveUntil || 0);
  if (serverTurbo > Date.now() && serverTurbo > STATE.turboActiveUntil) {
    STATE.turboActiveUntil = serverTurbo;
    scheduleTurboEnd(serverTurbo - Date.now());
  }
  return STATE.user;
}

function scheduleTurboEnd(ms) {
  if (STATE.turboEndTimer) clearTimeout(STATE.turboEndTimer);
  if (ms > 0) {
    STATE.turboEndTimer = setTimeout(() => {
      STATE.turboEndTimer = null;
      renderArena();
    }, ms + 50);
  }
}

// ---- Apply Skin Theme & Coin Images Globally ----
function applyActiveSkinTheme() {
  const u = STATE.user;
  if (!u) return;
  const skins = u.allSkins || [];
  const activeSkin = skins.find(s => s.id === u.skin) || skins[0] || {
    img: '/hold/skins/skin-4.png',
    theme: {
      accent: '#38b6ff',
      secondary: '#0066ff',
      glow1: 'rgba(0, 132, 255, 0.58)',
      glow2: 'rgba(0, 68, 204, 0.30)',
      bgBottom: '#041b4d'
    }
  };

  const t = activeSkin.theme;
  if (t) {
    const root = document.documentElement;
    root.style.setProperty('--theme-accent', t.accent);
    root.style.setProperty('--theme-secondary', t.secondary);
    root.style.setProperty('--theme-glow-1', t.glow1);
    root.style.setProperty('--theme-glow-2', t.glow2);
    root.style.setProperty('--theme-bg-bottom', t.bgBottom);
  }

  const coinIds = ['uiMainCoinImg', 'uiBalanceCoinIcon', 'uiDockCoinImg', 'uiBoostBalanceCoin', 'uiFarmHeroCoin', 'uiLeaguesPillCoin'];
  for (const id of coinIds) {
    const el = document.getElementById(id);
    if (el && el.getAttribute('src') !== activeSkin.img) {
      el.setAttribute('src', activeSkin.img);
    }
  }
}

// ---- Sync User State (Official PaxtaGram Profile Only — Never Fake holder_XXX) ----
async function syncHoldUser() {
  parsePaxtaWebAppData();

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash ? window.location.hash.slice(1) : '');
  const urlAuth = params.get('auth') || hashParams.get('auth');
  const urlRef = params.get('ref') || hashParams.get('ref') || params.get('start') || hashParams.get('tgWebAppStartParam') || '';

  if (urlAuth) {
    STATE.authToken = urlAuth;
    localStorage.setItem('hold_auth_token', urlAuth);
  }

  const tgUser = STATE.webAppUser;
  const candidateUsername = tgUser?.username || STATE.username || '';
  const cleanCandidate = /^(holder_|guest_)/i.test(candidateUsername) ? '' : candidateUsername;
  const displayName = tgUser
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
    : cleanCandidate;
  const paxtaId = tgUser?.id || null;

  const data = await api('/api/hold/sync', {
    method: 'POST',
    body: JSON.stringify({
      username: cleanCandidate,
      displayName,
      paxtaId,
      ref: urlRef ? String(urlRef).replace(/^ref_/i, '') : null
    })
  });

  const loginOverlay = document.getElementById('paxtaLoginOverlay');

  if (data.needPaxtaLogin || data.needsPaxtaLogin) {
    if (loginOverlay) loginOverlay.hidden = false;
    const errEl0 = document.getElementById('paxtaLoginError');
    if (errEl0 && data.error) {
      errEl0.textContent = data.error;
      errEl0.hidden = false;
    }
    return;
  }

  if (loginOverlay) loginOverlay.hidden = true;

  if (data.ok && data.user) {
    STATE.user = null;
    mergeUserState(data.user);
    STATE.username = STATE.user.username;
    localStorage.setItem('hold_username', STATE.username);
    if (data.authToken) {
      STATE.authToken = data.authToken;
      localStorage.setItem('hold_auth_token', data.authToken);
    }
    renderAll();

    if (STATE.user.passiveEarnedJustNow > 100 && STATE.user.ogBonusClaimed) {
      showToast(`🤖 Auto-Bot: +${fmtInt(STATE.user.passiveEarnedJustNow)} HOLD`);
    }

    if (!STATE.user.ogBonusClaimed) {
      openOnboardingStory(0);
    }
  } else if (data.error) {
    showToast(data.error);
  }
}

async function handlePaxtaLoginSubmit() {
  const inp = document.getElementById('inpPaxtaLoginUsername');
  const errEl = document.getElementById('paxtaLoginError');
  const btn = document.getElementById('btnPaxtaLoginSubmit');
  if (btn?.disabled) return;
  const raw = (inp?.value || '').trim().replace(/^@/, '');
  if (!raw) {
    if (errEl) {
      errEl.textContent = 'Iltimos, PaxtaGram @username kiriting';
      errEl.hidden = false;
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Tekshirilmoqda...';
  }
  if (errEl) errEl.hidden = true;

  const params = new URLSearchParams(window.location.search);
  const urlRef = params.get('ref') || params.get('start') || '';

  const res = await api('/api/hold/login-paxta', {
    method: 'POST',
    body: JSON.stringify({
      username: raw,
      ref: urlRef ? String(urlRef).replace(/^ref_/i, '') : null
    })
  });

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Davom etish';
  }

  if (res.ok && res.user) {
    STATE.user = null;
    mergeUserState(res.user);
    STATE.username = STATE.user.username;
    localStorage.setItem('hold_username', STATE.username);
    if (res.authToken) {
      STATE.authToken = res.authToken;
      localStorage.setItem('hold_auth_token', res.authToken);
    }
    const loginOverlay = document.getElementById('paxtaLoginOverlay');
    if (loginOverlay) loginOverlay.hidden = true;
    renderAll();
    loadLeaderboardData(true);
    if (!STATE.user.ogBonusClaimed) {
      openOnboardingStory(0);
    }
  } else {
    if (errEl) {
      errEl.textContent = res.error || 'PaxtaGram profil topilmadi';
      errEl.hidden = false;
    }
  }
}

// ============================================================================
// 3-SLIDE ONBOARDING STORY (INSPIRED BY SCREENSHOT 5)
// ============================================================================
function openOnboardingStory(step = 0) {
  const overlay = document.getElementById('onboardingStoryOverlay');
  if (!overlay) return;
  STATE.onboardingStep = step;
  overlay.hidden = false;
  renderOnboardingSlide();
}

function renderOnboardingSlide() {
  const u = STATE.user;
  if (!u) return;
  const step = STATE.onboardingStep;

  [0, 1, 2].forEach(idx => {
    const bar = document.getElementById(`osBar${idx}`);
    if (bar) bar.style.width = idx <= step ? '100%' : '0%';
  });

  const wrap = document.getElementById('osSlidesWrap');
  const foot = document.getElementById('osFootNote');
  const btn = document.getElementById('btnOsContinue');
  if (!wrap || !foot || !btn) return;

  const pid = u.paxtaId || 245;
  const topPct = u.topPct || 5;
  const years = u.yearsEquivalent || 2;
  const totalReward = pid <= 150 ? 14_500 : pid <= 600 ? 10_000 : pid <= 1400 ? 7_500 : 5_500;

  if (step === 0) {
    wrap.innerHTML = `
      <div class="os-top-headings">
        <h1>${pid <= 500 ? 'Legendary status!' : 'Pioneer status!'}</h1>
        <p>You've joined PaxtaGram</p>
      </div>
      <div class="os-center-hero">
        <img src="/hold/skins/skin-4.png" class="os-watermark-bg" alt="" />
        <div class="os-giant-num">${years}</div>
        <div class="os-giant-label">${years === 1 ? 'year' : 'years'} ago</div>
      </div>
      <div></div>
    `;
    foot.innerHTML = `Account <b>@${esc(u.username)}</b> (#${pid}).<br/>You're in the Top ${topPct}% PaxtaGram users 🔥`;
    btn.textContent = 'Continue';
  } else if (step === 1) {
    wrap.innerHTML = `
      <div class="os-top-headings">
        <h1>PaxtaGram Verified</h1>
        <p>Official profile connected</p>
      </div>
      <div class="os-center-hero">
        <img src="/hold/skins/skin-4.png" class="os-emblem-img" alt="Verified" />
        <div class="os-giant-label" style="margin-top:20px;">@${esc(u.username)}</div>
      </div>
      <div></div>
    `;
    foot.innerHTML = `Official PaxtaGram identity confirmed for <b>${esc(u.displayName || u.username)}</b> ✨`;
    btn.textContent = 'Continue';
  } else {
    wrap.innerHTML = `
      <div class="os-top-headings">
        <h1>You are amazing!</h1>
        <p>Here is your HOLD welcome reward</p>
      </div>
      <div class="os-center-hero">
        <img src="/hold/skins/skin-4.png" class="os-emblem-img" alt="HOLD" />
        <div class="os-giant-label" style="font-size:38px;margin-top:18px;">+${fmtInt(u.ogDetails?.totalBonus || totalReward)}</div>
      </div>
      <div></div>
    `;
    foot.innerHTML = `Welcome to the official $HOLD Arena 🤝`;
    btn.textContent = 'Start Mining $HOLD';
  }
}

async function advanceOnboardingStory() {
  const btn = document.getElementById('btnOsContinue');
  if (btn?.disabled) return;
  haptic('medium');
  if (STATE.onboardingStep < 2) {
    STATE.onboardingStep++;
    renderOnboardingSlide();
    return;
  }

  const overlay = document.getElementById('onboardingStoryOverlay');
  if (!STATE.user?.ogBonusClaimed) {
    if (btn) btn.disabled = true;
    const res = await api('/api/hold/claim-og', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username })
    });
    if (btn) btn.disabled = false;
    if (res.ok && res.user) {
      mergeUserState(res.user);
      renderAll();
      loadLeaderboardData(true);
      showToast(`🎉 +${fmtInt(res.ogDetails?.totalBonus || 5500)} HOLD!`);
      if (overlay) overlay.hidden = true;
    } else {
      showToast(res.error || 'Xatolik yuz berdi');
    }
  } else if (overlay) {
    overlay.hidden = true;
  }
}

// ============================================================================
// PURE FLOATING MID-AIR MORSE CODE (100% RELIABLE, ZERO INPUT BOX!)
// ============================================================================
function getCandidateMorseWords() {
  const daily = (STATE.user?.morse?.word || 'HOLD').toUpperCase();
  const secrets = STATE.user?.morse?.secretWords || ['WAKEUP', 'PAXTA', 'MEDAL', 'OBSIDIAN', 'MOON'];
  return Array.from(new Set([daily, ...secrets]));
}

function renderMidAirFloatingLetters(isSolved = false) {
  const airEl = document.getElementById('floatingMidAirMorse');
  if (!airEl) return;

  if (!STATE.morseDecodedLetters.length) {
    airEl.classList.remove('solved');
    airEl.innerHTML = '';
    return;
  }

  airEl.classList.toggle('solved', isSolved);
  airEl.innerHTML = STATE.morseDecodedLetters
    .map(ch => `<span class="midair-letter">${esc(ch)}</span>`)
    .join('');
}

function clearMidAirMorse() {
  clearTimeout(STATE.morseLetterTimer);
  clearTimeout(STATE.morseClearAirTimer);
  STATE.morseSignal = '';
  STATE.morseDecodedLetters = [];
  STATE.morseMatchedWords = [];
  renderMidAirFloatingLetters(false);
}

function recordCoinMorseSignal(symbol) {
  STATE.morseSignal += symbol;
  clearTimeout(STATE.morseLetterTimer);

  const allWords = getCandidateMorseWords();
  const activePool = STATE.morseDecodedLetters.length > 0 ? STATE.morseMatchedWords : allWords;
  const nextIdx = STATE.morseDecodedLetters.length;
  const expectedNextChars = Array.from(new Set(activePool.map(w => w[nextIdx]).filter(Boolean)));
  const expectedMorseCodes = expectedNextChars.map(ch => MORSE_MAP[ch]).filter(Boolean);

  const exactMatchNow = expectedMorseCodes.includes(STATE.morseSignal);
  const canGrowIntoAnotherExpected = expectedMorseCodes.some(
    code => code.length > STATE.morseSignal.length && code.startsWith(STATE.morseSignal)
  );

  let waitMs = 950;
  if (exactMatchNow && !canGrowIntoAnotherExpected) {
    waitMs = 520;
  } else if (canGrowIntoAnotherExpected) {
    waitMs = 1450;
  }

  STATE.morseLetterTimer = setTimeout(evaluateInvisibleMorseLetter, waitMs);
}

async function evaluateInvisibleMorseLetter() {
  const sig = STATE.morseSignal;
  STATE.morseSignal = '';
  if (!sig) return;

  const decodedChar = REVERSE_MORSE[sig];
  if (!decodedChar) return;

  const allWords = getCandidateMorseWords();

  if (STATE.morseDecodedLetters.length === 0) {
    const matching = allWords.filter(w => w.startsWith(decodedChar));
    if (matching.length === 0) return;
    STATE.morseDecodedLetters = [decodedChar];
    STATE.morseMatchedWords = matching;
    haptic('heavy');
    renderMidAirFloatingLetters(false);

    clearTimeout(STATE.morseClearAirTimer);
    STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 8000);
    return;
  }

  const nextPrefix = STATE.morseDecodedLetters.join('') + decodedChar;
  const stillMatching = STATE.morseMatchedWords.filter(w => w.startsWith(nextPrefix));

  if (stillMatching.length === 0) {
    if (sig === '.') {
      clearTimeout(STATE.morseClearAirTimer);
      STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 8000);
      return;
    }
    const freshMatch = allWords.filter(w => w.startsWith(decodedChar));
    if (freshMatch.length > 0) {
      STATE.morseDecodedLetters = [decodedChar];
      STATE.morseMatchedWords = freshMatch;
      haptic('heavy');
      renderMidAirFloatingLetters(false);
      clearTimeout(STATE.morseClearAirTimer);
      STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 8000);
    } else {
      clearMidAirMorse();
    }
    return;
  }

  STATE.morseDecodedLetters.push(decodedChar);
  STATE.morseMatchedWords = stillMatching;
  haptic('heavy');
  renderMidAirFloatingLetters(false);

  clearTimeout(STATE.morseClearAirTimer);
  STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 8000);

  const currentWord = STATE.morseDecodedLetters.join('');
  if (stillMatching.includes(currentWord)) {
    clearTimeout(STATE.morseClearAirTimer);
    renderMidAirFloatingLetters(true);
    haptic('heavy');

    const res = await api('/api/hold/solve-morse', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username, word: currentWord })
    });

    setTimeout(() => {
      clearMidAirMorse();
    }, 1800);

    if (res.ok && res.user) {
      mergeUserState(res.user);
      renderAll();
      showToast(res.message || `✨ ${currentWord} · +${fmtInt(res.reward)} HOLD!`);
    } else if (res.error) {
      showToast(res.error);
    }
  }
}

// ============================================================================
// RENDER ALL VIEWS (SMART DIRTY-SHEET RENDERING — ZERO HIDDEN DOM REBUILDS)
// ============================================================================
function renderArena() {
  const u = STATE.user;
  if (!u) return;

  applyActiveSkinTheme();

  const isTurbo = Date.now() < STATE.turboActiveUntil;
  document.body.classList.toggle('turbo-active', isTurbo);

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  // 1. Top Squad Pill (only rebuild innerHTML when squad/score/league/skin actually changes)
  const sqPill = document.getElementById('btnSquadPill');
  if (sqPill) {
    const activeSq = (u.squads || []).find(s => s.id === u.squadId);
    const sig = activeSq
      ? `${activeSq.id}|${activeSq.name}|${activeSq.totalHold}|${u.league?.id}|${coinImg}`
      : 'none';
    if (STATE.lastSquadPillSig !== sig) {
      STATE.lastSquadPillSig = sig;
      if (!activeSq) {
        sqPill.innerHTML = `<div class="nst-join-empty">Join Squad <span>›</span></div>`;
      } else {
        sqPill.innerHTML = `
          <div class="nst-joined-row">
            <div class="nst-left">
              <div class="cp-avatar">${esc((activeSq.name || 'S').charAt(0).toUpperCase())}</div>
              <div class="cp-meta">
                <div class="cp-name">${esc(activeSq.name)}</div>
                <div class="cp-sub">
                  <img src="${esc(coinImg)}" alt="" class="cp-mini-coin" />
                  <span>${fmtInt(activeSq.totalHold)}</span>
                </div>
              </div>
            </div>
            <div class="cp-badge">
              <img src="${esc(u.league?.trophyImg || '/hold/trophies/bronze.png')}" class="mini-league-cup" alt="" />
              <span>${esc(u.league?.name || 'Bronze')}</span>
            </div>
          </div>
        `;
      }
    }
  }

  // 2. Balance & Wreath Rank + League Row
  const balEl = document.getElementById('uiHoldBalance');
  const balTxt = fmtInt(u.holdBalance);
  if (balEl && balEl.textContent !== balTxt) balEl.textContent = balTxt;

  const tk = u.tokenomics || {};
  const factor = tk.redenomFactor || 1000;
  const tokEl = document.getElementById('uiArenaTokensText');
  if (tokEl) {
    const tVal = (Math.floor(u.holdBalance || 0) / factor);
    const tokTxt = `${tVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} $HOLD`;
    if (tokEl.textContent !== tokTxt) tokEl.textContent = tokTxt;
  }
  const hTagEl = document.getElementById('uiArenaHalvingTag');
  if (hTagEl) {
    const tagTxt = tk.snapshotLocked ? '🔒 Snapshot' : (tk.halving?.label || '1.0x');
    if (hTagEl.textContent !== tagTxt) hTagEl.textContent = tagTxt;
  }

  // The Final (Footprint disabled for now, saved for the finale)
  const fpBtn = document.getElementById('btnOpenFootprint');
  if (fpBtn) fpBtn.hidden = true;
  const fpBadge = document.getElementById('uiFootprintBadge');
  if (fpBadge && u.footprint) {
    fpBadge.hidden = !u.footprint.claimed;
  }

  // Live farm indicator dot on bottom dock
  const dockFarmDot = document.getElementById('uiDockFarmDot');
  if (dockFarmDot && u.farm) {
    const dur = u.farm.durationMs || 8 * 3600_000;
    const elapsed = Math.max(0, Date.now() - (u.farm.startedAt || Date.now()));
    dockFarmDot.hidden = elapsed < dur && !u.farm.canClaim;
  }

  const rankEl = document.getElementById('uiUserRankText');
  const rankTxt = fmtOrdinal(u.rank || 1);
  if (rankEl && rankEl.textContent !== rankTxt) rankEl.textContent = rankTxt;

  const miniCup = document.getElementById('uiMiniLeagueCup');
  if (miniCup && u.league?.trophyImg && miniCup.getAttribute('src') !== u.league.trophyImg) {
    miniCup.src = u.league.trophyImg;
  }

  const lgText = document.getElementById('uiLeagueNameText');
  const lgName = u.league?.name || 'Bronze';
  if (lgText && lgText.textContent !== lgName) lgText.textContent = lgName;

  // 2b. Arena Live Pills (Claimable Daily Streak & 2x Happy Hour)
  const streakPill = document.getElementById('btnArenaStreakPill');
  const streakText = document.getElementById('uiArenaStreakText');
  if (streakPill && streakText && u.streak) {
    const canClaim = !!u.streak.canClaimToday;
    streakPill.hidden = !canClaim;
    if (canClaim) {
      streakText.textContent = `Day ${u.streak.nextDay || 1} Bonus!`;
    }
  }

  const hhPill = document.getElementById('uiArenaHappyHourPill');
  if (hhPill) {
    hhPill.hidden = !u.happyHour?.active;
  }

  // 3. Energy & Progress Bar
  const eNow = document.getElementById('uiEnergyNow');
  const eMax = document.getElementById('uiEnergyMax');
  const eFill = document.getElementById('uiEnergyBarFill');
  const eNowTxt = fmtInt(u.energy);
  const eMaxTxt = `/ ${fmtInt(u.maxEnergy)}`;
  if (eNow && eNow.textContent !== eNowTxt) eNow.textContent = eNowTxt;
  if (eMax && eMax.textContent !== eMaxTxt) eMax.textContent = eMaxTxt;
  if (eFill) {
    const ePct = Math.min(100, Math.round((u.energy / Math.max(1, u.maxEnergy)) * 100));
    eFill.style.width = `${ePct}%`;
  }

  // 4. Admin button
  const adminBtn = document.getElementById('btnOpenAdminModal');
  if (adminBtn) adminBtn.hidden = !u.isAdmin;

  updateArenaFarmChip();
}

function renderAll() {
  if (!STATE.user) return;
  renderArena();

  for (const key of Object.keys(STATE.dirtySheets)) {
    STATE.dirtySheets[key] = true;
  }
  if (STATE.activeSheet && STATE.activeSheet !== 'admin') {
    renderSheetByName(STATE.activeSheet);
  }
}

// ---- Pooled Floating Tap Numbers (Zero GC / DOM Churn) ----
const TAP_FLOAT_POOL_SIZE = 20;
const tapFloatPool = [];
let tapFloatCursor = 0;

function spawnTapFloat(clientX, clientY, tapVal) {
  const layer = document.getElementById('tapFloatLayer');
  if (!layer) return;

  if (tapFloatPool.length < TAP_FLOAT_POOL_SIZE) {
    const el = document.createElement('div');
    el.className = 'tap-float-num';
    layer.appendChild(el);
    tapFloatPool.push(el);
  }

  const el = tapFloatPool[tapFloatCursor];
  tapFloatCursor = (tapFloatCursor + 1) % TAP_FLOAT_POOL_SIZE;

  const x = (clientX || window.innerWidth / 2) - 18;
  const y = (clientY || window.innerHeight / 2) - 28;
  el.textContent = `+${tapVal}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.classList.remove('active');
  void el.offsetWidth;
  el.classList.add('active');
}

function computeTapMetrics(u) {
  const tk = u.tokenomics || {};
  const isTurbo = Date.now() < STATE.turboActiveUntil;
  const hhMult = u.happyHour?.active ? (u.happyHour.multiplier || 2) : 1;
  const baseTap = Math.max(1, Number(u.baseTapPower) || ((Number(u.tapLevel) || 1) + (Number(u.league?.bonusTap) || 0)));
  // Backend u.tapPower already includes happyHour.multiplier; avoid double-multiplying!
  const effectiveTapPower = Number(u.tapPower) || (baseTap * hhMult);
  const rawTapVal = isTurbo ? effectiveTapPower * 7 : effectiveTapPower;
  const hm = tk.halving?.multiplier ?? 1;
  return { isTurbo, baseTap, rawTapVal, hm };
}

// ---- Tap Handling ----
function handleCoinTap(clientX, clientY) {
  const u = STATE.user;
  if (!u) return;

  const tk = u.tokenomics || {};
  if (tk.snapshotLocked) {
    showToast('🔒 TGE Snapshot muzlatilgan');
    return;
  }
  if (tk.halving && tk.halving.multiplier <= 0) {
    showToast('⛏️ Mining Pool (45M $HOLD) toʻlgan');
    return;
  }

  const { isTurbo, baseTap, rawTapVal, hm } = computeTapMetrics(u);

  if (!isTurbo && u.energy < baseTap) {
    showToast('⚡ Energiya toʻlmoqda...');
    return;
  }

  const scaled = rawTapVal * hm + (Number(u._clientFrac) || 0);
  const tapVal = Math.floor(scaled);
  u._clientFrac = Math.max(0, scaled - tapVal);

  if (!isTurbo) {
    u.energy = Math.max(0, u.energy - baseTap);
  }
  u.holdBalance += tapVal;
  u.lifetimeHold += tapVal;
  STATE.pendingTaps++;

  const balEl = document.getElementById('uiHoldBalance');
  if (balEl) balEl.textContent = fmtInt(u.holdBalance);
  const tokEl = document.getElementById('uiArenaTokensText');
  if (tokEl) {
    const f = tk.redenomFactor || 1000;
    tokEl.textContent = `${(Math.floor(u.holdBalance) / f).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} $HOLD`;
  }
  const eNow = document.getElementById('uiEnergyNow');
  if (eNow) eNow.textContent = fmtInt(u.energy);
  const eFill = document.getElementById('uiEnergyBarFill');
  if (eFill) eFill.style.width = `${Math.min(100, Math.round((u.energy / Math.max(1, u.maxEnergy)) * 100))}%`;

  spawnTapFloat(clientX, clientY, tapVal > 0 ? tapVal : `+${(rawTapVal * hm).toFixed(1)}`);

  if (!STATE.tapSyncTimer && !STATE.tapSyncInFlight) {
    STATE.tapSyncTimer = setTimeout(flushPendingTaps, 850);
  }
}

async function flushPendingTaps({ keepalive = false } = {}) {
  if (STATE.tapSyncTimer) {
    clearTimeout(STATE.tapSyncTimer);
    STATE.tapSyncTimer = null;
  }
  if (STATE.tapSyncInFlight) return;
  if (STATE.pendingTaps <= 0) return;

  const count = STATE.pendingTaps;
  STATE.pendingTaps = 0;
  STATE.tapSyncInFlight = true;

  const isTurbo = Date.now() < STATE.turboActiveUntil;
  try {
    const res = await api('/api/hold/tap', {
      method: 'POST',
      keepalive,
      body: JSON.stringify({
        username: STATE.username,
        taps: count,
        turbo: isTurbo
      })
    });

    if (res.ok && res.user) {
      const queuedDuringFlight = STATE.pendingTaps;
      mergeUserState(res.user);

      // Re-apply optimistic taps made while the request was in-flight so numbers never jump backward
      if (queuedDuringFlight > 0 && STATE.user) {
        const { isTurbo: turboNow, baseTap, rawTapVal, hm } = computeTapMetrics(STATE.user);
        const estGain = Math.floor(queuedDuringFlight * rawTapVal * hm);
        STATE.user.holdBalance = (STATE.user.holdBalance || 0) + estGain;
        STATE.user.lifetimeHold = (STATE.user.lifetimeHold || 0) + estGain;
        if (!turboNow) {
          STATE.user.energy = Math.max(0, (STATE.user.energy || 0) - queuedDuringFlight * baseTap);
        }
      }

      renderArena();
      for (const key of Object.keys(STATE.dirtySheets)) {
        STATE.dirtySheets[key] = true;
      }
      if (STATE.activeSheet && STATE.activeSheet !== 'admin' && STATE.activeSheet !== 'farm') {
        renderSheetByName(STATE.activeSheet);
      }
    } else if (res.networkError) {
      STATE.pendingTaps += count;
    }
  } finally {
    STATE.tapSyncInFlight = false;
    if (STATE.pendingTaps > 0 && !STATE.tapSyncTimer && !keepalive) {
      STATE.tapSyncTimer = setTimeout(flushPendingTaps, 450);
    }
  }
}

// ============================================================================
// SHEET 1: LEAGUES SHOWCASE & 5 3D TROPHY CUPS (PER-LEAGUE FILTERED!)
// ============================================================================
async function loadLeaderboardData(force = false) {
  const now = Date.now();
  if (!force && STATE.lastVaultFetchedAt && (now - STATE.lastVaultFetchedAt) < 15_000 && STATE.leaderboard.length) {
    return;
  }
  if (STATE.vaultPromise) return STATE.vaultPromise;

  STATE.vaultLoading = true;
  STATE.vaultPromise = (async () => {
    try {
      const res = await api('/api/hold/vault');
      if (res && res.ok) {
        STATE.totalPlayers = res.totalPlayers || (res.leaderboard || []).length;
        STATE.top10Prizes = res.top10Prizes || [];
        STATE.nftPoolSummary = res.nftPoolSummary || null;
        STATE.squads = res.squads || [];
        STATE.leaderboard = res.leaderboard || [];
        STATE.leaderboardDay = res.leaderboardDay || res.leaderboard || [];
        STATE.lastVaultFetchedAt = Date.now();
        if (STATE.activeSheet === 'leagues') {
          renderLeaguesSheet();
        } else {
          STATE.dirtySheets.leagues = true;
        }
      }
    } finally {
      STATE.vaultLoading = false;
      STATE.vaultPromise = null;
    }
  })();
  return STATE.vaultPromise;
}

function renderLeaguesSheet() {
  const u = STATE.user;
  if (!u) return;

  const totalEl = document.getElementById('uiTotalPlayersCount');
  if (totalEl) totalEl.textContent = fmtInt(Math.max(1, STATE.totalPlayers || STATE.leaderboard.length));

  const leagues = u.allLeagues || [];
  if (!leagues.length) return;

  const idx = Math.max(0, Math.min(leagues.length - 1, STATE.viewedLeagueIdx));
  const lg = leagues[idx];
  const nextLg = leagues[idx + 1] || null;

  const sheetEl = document.getElementById('sheetLeagues');
  const glowEl = document.getElementById('uiLeagueTrophyGlow');
  const trophyImgEl = document.getElementById('uiLeagueTrophyImg');

  if (sheetEl && lg.glow) sheetEl.style.setProperty('--league-glow', lg.glow);
  if (glowEl && lg.glow) glowEl.style.background = lg.glow;
  if (trophyImgEl && lg.trophyImg) trophyImgEl.src = lg.trophyImg;

  const prevBtn = document.getElementById('btnPrevLeague');
  const nextBtn = document.getElementById('btnNextLeague');
  if (prevBtn) prevBtn.disabled = idx <= 0;
  if (nextBtn) nextBtn.disabled = idx >= leagues.length - 1;

  const titleEl = document.getElementById('uiShowcaseLeagueTitle');
  const subEl = document.getElementById('uiShowcaseLeagueSub');
  const barEl = document.getElementById('uiShowcaseLeagueBar');

  if (titleEl) titleEl.textContent = `${lg.name} league`;
  if (subEl) {
    const nftQuota = lg.nftPoolCount ? ` · ${fmtInt(lg.nftPoolCount)} NFT` : '';
    if (lg.id === u.league?.id) {
      const targetStr = nextLg ? fmtInt(nextLg.minHold) : '∞';
      subEl.textContent = `${fmtInt(u.lifetimeHold)} / ${targetStr}${nftQuota}`;
    } else {
      subEl.textContent = `from ${fmtInt(lg.minHold)} HOLD${nftQuota}`;
    }
  }
  if (barEl) {
    if (lg.id === u.league?.id) {
      const target = nextLg ? nextLg.minHold : Math.max(10_000_000, u.lifetimeHold);
      const pct = Math.min(100, Math.max(4, Math.round((u.lifetimeHold / Math.max(1, target)) * 100)));
      barEl.style.width = `${pct}%`;
    } else if (u.lifetimeHold >= lg.minHold) {
      barEl.style.width = '100%';
    } else {
      const pct = Math.min(100, Math.max(2, Math.round((u.lifetimeHold / Math.max(1, lg.minHold)) * 100)));
      barEl.style.width = `${pct}%`;
    }
  }

  const listWrap = document.getElementById('leagueBoardList');
  if (!listWrap) return;
  listWrap.innerHTML = '';

  const timeTabsEl = document.getElementById('leagueTimeTabs');
  if (timeTabsEl) {
    timeTabsEl.hidden = STATE.leagueMainTab === 'prizes';
  }

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  if (STATE.leagueMainTab === 'squads') {
    const allSquads = (u.squads && u.squads.length) ? u.squads : (STATE.squads || []);
    const isDay = STATE.leagueTimePeriod === 'day';
    const jumpButtons = leagues
      .map((item, lIdx) => {
        const cnt = allSquads.filter(s => (s.league?.id || 'bronze') === item.id).length;
        if (!cnt) return '';
        const active = lIdx === STATE.viewedLeagueIdx;
        return `<button type="button" class="league-jump-pill" data-jump-lidx="${lIdx}" style="${active ? 'background:rgba(56,189,248,0.28);border-color:rgba(56,189,248,0.7);color:#fff;' : ''}">${esc(item.name)} (${cnt})</button>`;
      })
      .filter(Boolean)
      .join('');

    if (jumpButtons) {
      const bar = document.createElement('div');
      bar.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:10px;';
      bar.innerHTML = jumpButtons;
      bar.querySelectorAll('[data-jump-lidx]').forEach(btn => {
        btn.addEventListener('click', () => {
          STATE.viewedLeagueIdx = Number(btn.dataset.jumpLidx) || 0;
          haptic('light');
          renderLeaguesSheet();
        });
      });
      listWrap.appendChild(bar);
    }

    const filteredSquads = allSquads
      .filter(sq => (sq.league?.id || 'bronze') === lg.id)
      .sort((a, b) => isDay
        ? ((b.dailyHoldToday || 0) - (a.dailyHoldToday || 0)) || ((b.totalHold || 0) - (a.totalHold || 0))
        : ((b.totalHold || 0) - (a.totalHold || 0))
      );

    if (!filteredSquads.length) {
      const emptyEl = document.createElement('div');
      emptyEl.style.cssText = 'padding:22px 14px;text-align:center;color:var(--text-2);font-size:13px;line-height:1.5;';
      emptyEl.innerHTML = `
        Hozircha <b>${esc(lg.name)}</b> ligasida squadlar yoʻq.<br/>
        <span style="font-size:12px;opacity:0.75;">Squad jami kuchi ${fmtInt(lg.minHold)}+ HOLD boʻlganda shu ligaga kiradi.</span>
      `;
      listWrap.appendChild(emptyEl);
      return;
    }

    filteredSquads.forEach((sq, sIdx) => {
      const rank = sIdx + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
      const scoreVal = isDay ? (sq.dailyHoldToday || 0) : (sq.totalHold || 0);
      const sqAvatar = sq.avatarUrl
        ? `<img src="${esc(sq.avatarUrl)}" alt="" class="lb-avatar-circle" style="object-fit:cover;" />`
        : `<div class="lb-avatar-circle">${esc((sq.name || 'S').charAt(0).toUpperCase())}</div>`;
      const row = document.createElement('div');
      row.className = 'lb-row-item';
      row.style.cursor = 'pointer';
      row.innerHTML = `
        <div class="lb-left">
          <div class="lb-medal-col">${medal}</div>
          ${sqAvatar}
          <div class="lb-user-meta">
            <div class="lb-user-name">${esc(sq.name)} ${sq.verified ? '<span style="color:#38b6ff;">✓</span>' : ''}</div>
            <div class="lb-user-score">
              <span style="opacity:0.7;">@${esc(sq.handle || sq.id)} ·</span>
              <img src="${esc(coinImg)}" class="inline-c" alt="" />
              <span>${fmtInt(scoreVal)} ${isDay ? '(bugun) · ' : '· '}${fmtInt(sq.members || 0)} a'zo</span>
            </div>
          </div>
        </div>
        <span class="skin-pill-btn" style="font-size:11px;padding:4px 9px;">${esc(sq.league?.name || lg.name)}</span>
      `;
      row.addEventListener('click', () => openSquadModal(sq.id));
      listWrap.appendChild(row);
    });
    return;
  }

  if (STATE.leagueMainTab === 'prizes') {
    if (STATE.vaultLoading && !STATE.top10Prizes.length) {
      listWrap.innerHTML = `<div style="padding:26px 14px;text-align:center;color:var(--text-2);font-size:13.5px;">Yuklanmoqda...</div>`;
      return;
    }
    for (const p of STATE.top10Prizes) {
      const holder = STATE.leaderboard.find(x => x.rank === p.rank);
      const nft = p.nft;
      const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`;
      const row = document.createElement('div');
      row.className = 'lb-row-item';
      row.innerHTML = `
        <div class="lb-left">
          <div class="lb-medal-col">${medal}</div>
          ${nft ? `
            <div class="prize-nft-thumb" style="background:radial-gradient(circle, ${esc(nft.centerColor)}, ${esc(nft.edgeColor)});">
              <img src="${esc(nft.img)}" alt="${esc(nft.title)}" loading="lazy" />
            </div>
          ` : `<div class="lb-avatar-circle">#${p.rank}</div>`}
          <div class="lb-user-meta">
            <div class="lb-user-name">${nft ? esc(nft.title) : `Top #${p.rank} Prize`}</div>
            <div class="lb-user-score">
              <span style="color:var(--theme-accent);font-weight:700;">+${fmtInt(p.holdBonus)} HOLD</span>
              <span>· ${holder ? `@${esc(holder.username)}` : 'Boʻsh oʻrin'}</span>
            </div>
          </div>
        </div>
      `;
      listWrap.appendChild(row);
    }
    return;
  }

  // Miners Leaderboard — STRICTLY FILTERED BY VIEWED LEAGUE (`lg.id`)
  // When a user advances to Silver/Gold/Platinum/Diamond, they no longer appear in Bronze!
  const sourceList = STATE.leagueTimePeriod === 'day'
    ? (STATE.leaderboardDay?.length ? STATE.leaderboardDay : STATE.leaderboard)
    : (STATE.leaderboard || []);

  const leaguePlayers = sourceList.filter(p => (p.league?.id || 'bronze') === lg.id);

  if (!leaguePlayers.length) {
    listWrap.innerHTML = (STATE.vaultLoading && !sourceList.length)
      ? `<div style="padding:26px 14px;text-align:center;color:var(--text-2);font-size:13.5px;">Yuklanmoqda...</div>`
      : `
      <div style="padding:26px 14px;text-align:center;color:var(--text-2);font-size:13.5px;">
        Hozircha <b>${esc(lg.name)}</b> ligasida ishtirokchilar yoʻq.<br/>
        <span style="font-size:12px;opacity:0.75;">Kerakli chegara: ${fmtInt(lg.minHold)} HOLD</span>
      </div>
    `;
    return;
  }

  leaguePlayers.slice(0, 50).forEach((p, idxInLeague) => {
    const pos = idxInLeague + 1;
    const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}`;
    const scoreVal = STATE.leagueTimePeriod === 'day' ? (p.dailyHold ?? p.lifetimeHold) : p.lifetimeHold;
    const isMe = p.username === u.username;
    const row = document.createElement('div');
    row.className = 'lb-row-item';
    if (isMe) row.style.background = 'rgba(56, 182, 255, 0.10)';
    row.style.borderRadius = '12px';
    row.innerHTML = `
      <div class="lb-left">
        <div class="lb-medal-col">${medal}</div>
        <div class="lb-avatar-circle">${esc((p.displayName || p.username || 'U').charAt(0).toUpperCase())}</div>
        <div class="lb-user-meta">
          <div class="lb-user-name">${p.founderBadge ? '👑 ' : ''}${esc(p.displayName || p.username)} <span style="opacity:0.55;font-size:12px;">@${esc(p.username)}</span></div>
          <div class="lb-user-score">
            <img src="${esc(coinImg)}" class="inline-c" alt="" />
            <span>${fmtInt(scoreVal)}</span>
          </div>
        </div>
      </div>
      ${STATE.leagueTimePeriod === 'all' && p.rank <= 10 && p.prize?.nft ? `<span class="skin-pill-btn" style="font-size:11px;padding:4px 9px;">🎁 #${p.rank} ${esc(p.prize.nft.title)}</span>` : ''}
    `;
    listWrap.appendChild(row);
  });
}

// ============================================================================
// SHEET 2: BOOSTS & BUY SKINS
// ============================================================================
function renderBoostsAndSkinsSheet() {
  const u = STATE.user;
  if (!u) return;

  const balNum = document.getElementById('uiBoostBalanceNum');
  if (balNum) balNum.textContent = fmtInt(u.holdBalance);

  const rkSub = document.getElementById('uiRocketSub');
  const ftSub = document.getElementById('uiFullTankSub');
  if (rkSub) rkSub.textContent = (u.rocketCount ?? 3) > 0 ? `${u.rocketCount} / 3 available` : '12 hours left';
  if (ftSub) ftSub.textContent = (u.fullTankCount ?? 3) > 0 ? `${u.fullTankCount} / 3 available` : '12 hours left';

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  const upgList = document.getElementById('boostUpgradesList');
  if (upgList) {
    const rMaxed = (u.rechargingSpeedLevel || 1) >= (u.rechargingSpeedMax || 10);
    upgList.innerHTML = `
      <button type="button" class="not-row-item" data-boost-upg="energy_limit">
        <div class="nri-icon-box">🔋</div>
        <div class="nri-center">
          <div class="nri-title">Energy Limit</div>
          <div class="nri-sub">
            <img src="${esc(coinImg)}" class="inline-c" alt="" />
            <b>${fmtInt(u.nextEnergyUpgradeCost)}</b> · ${u.energyLevel} level
          </div>
        </div>
        <span class="nri-chevron">›</span>
      </button>

      <button type="button" class="not-row-item" data-boost-upg="recharging_speed" ${rMaxed ? 'disabled' : ''}>
        <div class="nri-icon-box">⚡</div>
        <div class="nri-center">
          <div class="nri-title">Recharging speed</div>
          <div class="nri-sub">
            ${rMaxed
              ? 'Max level reached'
              : `<img src="${esc(coinImg)}" class="inline-c" alt="" /> <b>${fmtInt(u.nextRechargingUpgradeCost)}</b> · ${u.rechargingSpeedLevel || 1} level`
            }
          </div>
        </div>
        <span class="nri-chevron">${rMaxed ? '✓' : '›'}</span>
      </button>

      <button type="button" class="not-row-item" data-boost-upg="multitap">
        <div class="nri-icon-box">☝️</div>
        <div class="nri-center">
          <div class="nri-title">Multitap</div>
          <div class="nri-sub">
            <img src="${esc(coinImg)}" class="inline-c" alt="" />
            <b>${fmtInt(u.nextTapUpgradeCost)}</b> · ${u.tapLevel} level
          </div>
        </div>
        <span class="nri-chevron">›</span>
      </button>

      <button type="button" class="not-row-item" data-boost-upg="autobot" ${u.autoBotEnabled ? 'disabled' : ''}>
        <div class="nri-icon-box">🤖</div>
        <div class="nri-center">
          <div class="nri-title">Auto tap bot</div>
          <div class="nri-sub ${!u.autoBotEnabled ? 'gold-lock' : ''}">
            ${u.autoBotEnabled ? 'Active (24/7 mining)' : `🪙 ${fmtInt(u.autoBotCost)} HOLD`}
          </div>
        </div>
        <span class="nri-chevron">${u.autoBotEnabled ? '✓' : '›'}</span>
      </button>
    `;

    upgList.querySelectorAll('[data-boost-upg]').forEach(btn => {
      btn.addEventListener('click', () => triggerBoost(btn.dataset.boostUpg));
    });
  }

  // Buy Skins List
  const skinsWrap = document.getElementById('skinsListContainer');
  if (skinsWrap) {
    const owned = u.ownedSkins || ['basic'];
    skinsWrap.innerHTML = (u.allSkins || []).map(sk => {
      const isOwned = owned.includes(sk.id);
      const isEnabled = u.skin === sk.id;
      return `
        <div class="not-row-item" data-skin-id="${esc(sk.id)}">
          <div class="nri-skin-box">
            <img src="${esc(sk.img)}" alt="${esc(sk.name)}" />
          </div>
          <div class="nri-center">
            <div class="nri-title">${esc(sk.name)}</div>
            <div class="nri-sub ${!isOwned ? 'gold-lock' : ''}">
              ${isOwned ? 'You own it' : `🔒 ${fmtInt(sk.priceHold)} HOLD`}
            </div>
          </div>
          <button type="button" class="skin-pill-btn ${isEnabled ? 'enabled' : ''}" data-skin-action="${esc(sk.id)}">
            ${isEnabled ? 'enabled' : isOwned ? 'turn on' : 'buy'}
          </button>
        </div>
      `;
    }).join('');

    skinsWrap.querySelectorAll('[data-skin-id]').forEach(row => {
      row.addEventListener('click', async () => {
        const skinId = row.dataset.skinId;
        if (STATE.user?.skin === skinId || STATE.skinBusy) return;
        STATE.skinBusy = true;
        const pillBtn = row.querySelector('[data-skin-action]');
        if (pillBtn) pillBtn.disabled = true;
        try {
          const res = await api('/api/hold/skin', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, skinId })
          });
          if (res.ok && res.user) {
            mergeUserState(res.user);
            haptic('heavy');
            renderAll();
            showToast(res.message);
          } else {
            showToast(res.error || 'Not enough HOLD');
          }
        } finally {
          STATE.skinBusy = false;
          if (pillBtn) pillBtn.disabled = false;
        }
      });
    });
  }
}

async function triggerBoost(type) {
  if (STATE.boostBusy) return;
  STATE.boostBusy = true;
  try {
    const res = await api('/api/hold/boost', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username, type })
    });
    if (res.ok && res.user) {
      mergeUserState(res.user);
      if (res.turboDurationMs) {
        STATE.turboActiveUntil = Date.now() + res.turboDurationMs;
        scheduleTurboEnd(res.turboDurationMs);
        closeAllSheets();
      }
      haptic('medium');
      renderAll();
      showToast(res.message);
    } else {
      showToast(res.error || 'Limit reached');
    }
  } finally {
    STATE.boostBusy = false;
  }
}

// ============================================================================
// SHEET 3: EARN MORE COINS (5 RETENTION FEATURES + 100% IN-APP VERIFICATION)
// ============================================================================
function renderEarnSheet() {
  const u = STATE.user;
  if (!u) return;

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';
  const done = u.tasksCompleted || [];
  const quests = u.quests || [];

  const lockedByLeague = (q) => {
    if (!q.minLeague) return false;
    const order = (u.allLeagues || []).map(l => l.id);
    const need = order.indexOf(q.minLeague);
    const mine = order.indexOf(u.league?.id || 'bronze');
    return need > -1 && mine < need;
  };

  const rowHtml = ({ icon, title, sub, subClass = '', right = '›', done: isDone = false }) => `
    <div class="nri-icon-box">${icon}</div>
    <div class="nri-center">
      <div class="nri-title">${title}</div>
      <div class="nri-sub ${subClass}">${sub}</div>
    </div>
    <span class="nri-chevron ${isDone ? 'done' : ''}">${right}</span>
  `;

  const coinTag = `<img src="${esc(coinImg)}" class="inline-c" alt="" />`;

  // Invite card coin follows active skin
  const invCoin = document.getElementById('uiEarnInviteCoin');
  if (invCoin) invCoin.src = coinImg;

  // 1. Daily section: Streak · Happy Hour · Weekly Lucky Draw (Morse stays 100% hidden)
  const dailyEl = document.getElementById('dailyTasksList');
  if (dailyEl) {
    dailyEl.innerHTML = '';
    const st = u.streak || {};
    const hh = u.happyHour || {};
    const lt = u.luckyDraw || {};

    const streakBtn = document.createElement('button');
    streakBtn.type = 'button';
    streakBtn.className = 'not-row-item';
    streakBtn.innerHTML = rowHtml({
      icon: '🔥',
      title: 'Daily reward',
      sub: st.canClaimToday
        ? `<b>+${fmtInt(st.nextRewardHold || 1000)}</b> ${coinTag} · Day ${st.nextDay || 1}/7`
        : `Day ${st.currentDay || 0}/7 · come back tomorrow`,
      right: st.canClaimToday ? '<span class="earn-claim-dot"></span>›' : '✓',
      done: !st.canClaimToday
    });
    streakBtn.addEventListener('click', openDailyStreakModal);
    dailyEl.appendChild(streakBtn);

    const hhRow = document.createElement('div');
    hhRow.className = 'not-row-item static';
    hhRow.innerHTML = rowHtml({
      icon: '⚡',
      title: 'Happy Hour',
      sub: hh.active ? '<b style="color:#4ade80;">Live now · 2x per tap</b>' : `2x per tap · ${esc(hh.scheduleText || '20:00 – 21:00')}`,
      right: hh.active ? '<span class="earn-live-badge">LIVE</span>' : ''
    });
    dailyEl.appendChild(hhRow);

    const ltBtn = document.createElement('button');
    ltBtn.type = 'button';
    ltBtn.className = 'not-row-item';
    ltBtn.innerHTML = rowHtml({
      icon: '🎟️',
      title: 'Weekly Lucky Draw',
      sub: `Sizda <b>${fmtInt(lt.myTickets || 0)}</b> chipta · Pul: ${fmtInt(lt.totalPoolTickets || 0)} (${lt.winChancePct || 0}%)`,
      right: `<span class="earn-count-badge">${fmtInt(lt.myTickets || 0)}</span> ›`
    });
    ltBtn.addEventListener('click', openLuckyDrawModal);
    dailyEl.appendChild(ltBtn);

    const tk = u.tokenomics || {};
    const tkBtn = document.createElement('button');
    tkBtn.type = 'button';
    tkBtn.className = 'not-row-item';
    tkBtn.innerHTML = rowHtml({
      icon: '🪙',
      title: 'Tokenomics & Burn',
      sub: `1M $HOLD · Fazasi: <b>${esc(tk.halving?.name || 'Genesis')} (${esc(tk.halving?.label || '1.0x')})</b> · 🔥 ${fmtInt(Math.floor(tk.burnedTokens || 0))} yoqilgan`,
      right: '›'
    });
    tkBtn.addEventListener('click', openTokenomicsModal);
    dailyEl.appendChild(tkBtn);
  }

  // 2. Quests — Notcoin-style rows, verified in-app (no external tabs)
  const renderQuestRows = (containerId, list) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    if (!list.length) {
      el.innerHTML = `<div class="earn-empty">New tasks coming soon</div>`;
      return;
    }
    // Pending first, completed last
    const sorted = [...list].sort((a, b) => Number(done.includes(a.id)) - Number(done.includes(b.id)));
    for (const q of sorted) {
      const isDone = done.includes(q.id);
      const isLocked = !isDone && lockedByLeague(q);
      const lockLeagueName = isLocked ? ((u.allLeagues || []).find(l => l.id === q.minLeague)?.name || 'Silver') : '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `not-row-item${isDone ? ' is-done' : ''}`;
      btn.innerHTML = rowHtml({
        icon: esc(q.icon || '⭐'),
        title: esc(q.title),
        sub: isDone
          ? 'Completed'
          : isLocked
            ? `🔒 ${esc(lockLeagueName)} league`
            : `<b>+${fmtInt(q.reward)}</b> ${coinTag}`,
        subClass: isLocked ? 'gold-lock' : '',
        right: isDone ? '✓' : '›',
        done: isDone
      });
      if (!isDone) {
        btn.addEventListener('click', () => {
          if (isLocked) {
            showToast(`${lockLeagueName} ligasiga chiqing`);
            return;
          }
          openQuestVerificationModal(q);
        });
      }
      el.appendChild(btn);
    }
  };

  const web3List = quests.filter(q => q.cat === 'web3');
  renderQuestRows('onboardingTasksList', quests.filter(q => q.cat === 'onboarding'));
  renderQuestRows('specialsTasksList', quests.filter(q => q.cat === 'specials' || !q.cat));
  renderQuestRows('web3TasksList', web3List);

  const web3Count = document.getElementById('uiWeb3Count');
  if (web3Count) web3Count.textContent = `${web3List.filter(q => done.includes(q.id)).length}/${web3List.length}`;

  async function startStarsInvoicePurchase({ row, amount, title, serviceId = null, successMsg }) {
    if (row.dataset.busy === '1') return;
    row.dataset.busy = '1';
    haptic('light');
    showToast('Toʻlov oynasi ochilmoqda...');
    let res;
    try {
      res = await api('/api/hold/create-invoice', {
        method: 'POST',
        body: JSON.stringify({
          username: STATE.username,
          amount,
          title,
          ...(serviceId ? { serviceId } : {})
        })
      });
    } finally {
      row.dataset.busy = '0';
    }

    if (res && res.ok && res.invoiceUrl) {
      const slug = res.slug || String(res.invoiceUrl).split('/').pop();
      notifyPaxtaMiniApp('web_app_open_invoice', { slug, url: res.invoiceUrl });
      try {
        if (window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(res.invoiceUrl, async (st) => {
            if (st === 'paid') {
              clearInvoicePoll();
              await syncHoldUser();
              showToast(successMsg);
            } else if (st === 'cancelled' || st === 'failed') {
              clearInvoicePoll();
            }
          });
        }
      } catch {}

      if (res.invoiceId) {
        clearInvoicePoll();
        let polls = 0;
        STATE.invoicePollTimer = setInterval(async () => {
          polls++;
          if (polls > 90) {
            clearInvoicePoll();
            return;
          }
          const stRes = await api(`/api/hold/invoice-status/${encodeURIComponent(res.invoiceId)}`);
          if (stRes.ok && stRes.status === 'paid') {
            clearInvoicePoll();
            await syncHoldUser();
            showToast(successMsg);
          } else if (stRes.status === 'not_found' || stRes.status === 'failed' || stRes.status === 'cancelled') {
            clearInvoicePoll();
          }
        }, 2000);
      }
    } else {
      showToast(res?.error || 'Invoice ochilmadi');
    }
  }

  // 4. Stars Services (Fixed Utility · No Gambling)
  const svcList = document.getElementById('starsServicesList');
  if (svcList) {
    const sv = u.services || {};
    const nowMs = Date.now();
    const isServiceOwned = (s) => {
      if (s.id === 'halving_shield') return !!sv.halvingShield;
      if (s.id === 'ref_booster_2x') return !!sv.refBooster2x;
      if (s.id === 'founder_badge') return !!sv.founderBadge;
      if (s.id === 'pro_bot_lv2') return (sv.autoBotLevel || 0) >= 2;
      if (s.id === 'pro_bot_lv3') return (sv.autoBotLevel || 0) >= 3;
      return false;
    };
    const isServiceActiveTemp = (s) => {
      if (s.category === 'turbo') return (sv.turboPassUntil || 0) > nowMs && (sv.turboPassMult || 1) >= (s.mult || 2);
      if (s.id === 'squad_buff_24h') return (sv.squadBuffUntil || 0) > nowMs;
      return false;
    };
    svcList.innerHTML = (u.starsServices || []).map(s => {
      const owned = isServiceOwned(s);
      const activeTemp = isServiceActiveTemp(s);
      const pill = owned
        ? '<span class="skin-pill-btn" style="background:rgba(52,199,89,0.18);color:#34c759;">✓ Faol</span>'
        : `<span class="skin-pill-btn">${activeTemp ? '⏳ ' : ''}${s.starsPrice} ⭐</span>`;
      return `
        <div class="not-row-item" data-service="${esc(s.id)}">
          <div class="nri-icon-box">${esc((s.badge || '⚡').split(' ')[0])}</div>
          <div class="nri-center">
            <div class="nri-title">${esc(s.name)}</div>
            <div class="nri-sub">${esc(s.desc)}</div>
          </div>
          ${pill}
        </div>
      `;
    }).join('');

    svcList.querySelectorAll('[data-service]').forEach(row => {
      row.addEventListener('click', () => {
        const serviceId = row.dataset.service;
        const svcObj = (u.starsServices || []).find(x => x.id === serviceId);
        if (!svcObj) return;
        startStarsInvoicePurchase({
          row,
          amount: svcObj.starsPrice,
          title: svcObj.name,
          serviceId: svcObj.id,
          successMsg: `🎉 ${svcObj.name} faollashtirildi!`
        });
      });
    });
  }

  // 5. Stars VIP Packs inside Earn
  const vipList = document.getElementById('vipPacksList');
  if (vipList) {
    vipList.innerHTML = (u.vipPacks || []).map(p => `
      <div class="not-row-item" data-pack="${esc(p.id)}">
        <div class="nri-icon-box">⭐</div>
        <div class="nri-center">
          <div class="nri-title">${esc(p.name)}</div>
          <div class="nri-sub">${esc(p.desc)}</div>
        </div>
        <span class="skin-pill-btn">${p.starsPrice} ⭐</span>
      </div>
    `).join('');

    vipList.querySelectorAll('[data-pack]').forEach(row => {
      row.addEventListener('click', () => {
        const packId = row.dataset.pack;
        const packObj = (u.vipPacks || []).find(x => x.id === packId);
        if (!packObj) return;
        startStarsInvoicePurchase({
          row,
          amount: packObj.starsPrice,
          title: packObj.name,
          successMsg: `🎉 ${packObj.name} muvaffaqiyatli faollashtirildi!`
        });
      });
    });
  }
}

function openTokenomicsModal() {
  const u = STATE.user;
  if (!u) return;
  const tk = u.tokenomics || {};
  const factor = tk.redenomFactor || 1000;
  const userTokens = (Math.floor(u.holdBalance || 0) / factor).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const totalSupply = fmtInt(tk.totalSupplyTokens || 1_000_000);
  const effSupply = fmtInt(Math.floor(tk.effectiveMaxSupplyTokens || 1_000_000));
  const mintedTok = (tk.mintedTokens || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const burnedTok = (tk.burnedTokens || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const circTok = (tk.circulatingTokens || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const pct = Math.min(100, Number(tk.miningProgressPct || 0));
  const h = tk.halving || { stage: 1, name: 'Genesis', label: '1.0x' };
  const stages = Array.isArray(tk.stages) ? tk.stages : [
    { stage: 1, name: 'Genesis', minPct: 0, maxPct: 25, label: '1.0x' },
    { stage: 2, name: 'Halving I', minPct: 25, maxPct: 50, label: '0.5x' },
    { stage: 3, name: 'Halving II', minPct: 50, maxPct: 75, label: '0.25x' },
    { stage: 4, name: 'Final Phase', minPct: 75, maxPct: 100, label: '0.1x' }
  ];
  const allocs = Array.isArray(tk.allocations) ? tk.allocations : [];

  openModal('🪙 $HOLD Tokenomics & Burn', `
    <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;line-height:1.5;">
      <div style="background:linear-gradient(135deg,rgba(56,189,248,0.16),rgba(59,130,246,0.08));border:1px solid rgba(56,189,248,0.28);border-radius:14px;padding:12px;">
        <div style="font-size:11.5px;color:#7dd3fc;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Sizning TGE ulushingiz (faqat holdBalance)</div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-top:4px;">
          <div style="font-size:22px;font-weight:800;color:#fff;">≈ ${userTokens} <span style="color:#38bdf8;">$HOLD</span></div>
          <div style="font-size:12px;color:var(--text-2);">${fmtInt(u.holdBalance || 0)} pts ÷ ${factor}</div>
        </div>
        <div style="margin-top:6px;font-size:11.5px;color:var(--text-2);">Notcoin uslubida <b>000</b> qisqaradi (${fmtInt(factor)} coin = 1 $HOLD). Faqat qoʻldagi <b>holdBalance</b> hisoblanadi — boost va skinlarga sarflangan coinlar <b>Burn</b> boʻlib yoqiladi.</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">
        <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:9px 6px;">
          <div style="font-size:10.5px;color:var(--text-2);">Hard Cap</div>
          <div style="font-size:14px;font-weight:800;color:#fff;">1M</div>
          <div style="font-size:10px;color:var(--text-2);">Eff: ${effSupply}</div>
        </div>
        <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:9px 6px;">
          <div style="font-size:10.5px;color:var(--text-2);">Muomalada</div>
          <div style="font-size:14px;font-weight:800;color:#4ade80;">${circTok}</div>
          <div style="font-size:10px;color:var(--text-2);">Minted: ${mintedTok}</div>
        </div>
        <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:9px 6px;">
          <div style="font-size:10.5px;color:var(--text-2);">🔥 Yoqilgan</div>
          <div style="font-size:14px;font-weight:800;color:#fb923c;">${burnedTok}</div>
          <div style="font-size:10px;color:var(--text-2);">${fmtInt(tk.burnedPoints || 0)} pts</div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:11px 12px;">
        <div style="display:flex;justify-content:space-between;font-weight:700;color:#fff;margin-bottom:6px;">
          <span>⛏️ Mining Pool (45M $HOLD)</span>
          <span>${pct.toFixed(2)}%</span>
        </div>
        <div style="height:8px;border-radius:99px;background:rgba(255,255,255,0.08);overflow:hidden;">
          <div style="height:100%;width:${Math.max(1.5, pct)}%;border-radius:99px;background:linear-gradient(90deg,#38bdf8,#4ade80);"></div>
        </div>
        <div style="margin-top:8px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">
          ${stages.map(s => {
            const active = s.stage === h.stage;
            return `<div style="padding:6px 4px;border-radius:8px;background:${active ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.04)'};border:1px solid ${active ? 'rgba(56,189,248,0.5)' : 'transparent'};">
              <div style="font-size:10px;color:${active ? '#7dd3fc' : 'var(--text-2)'};">${s.minPct}-${s.maxPct}%</div>
              <div style="font-size:12px;font-weight:800;color:#fff;">${esc(s.label)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:11px 12px;">
        <div style="font-weight:700;color:#fff;margin-bottom:6px;">📊 Taqsimot (${totalSupply} $HOLD)</div>
        ${allocs.map(a => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12px;">
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:99px;background:${esc(a.color)};display:inline-block;"></span>
              <span>${esc(a.label)}</span>
            </span>
            <b>${a.pct}% (${Math.round((a.tokens || 0) / 1_000_000)}M)</b>
          </div>
        `).join('')}
      </div>
    </div>
  `);
}

function openLuckyDrawModal() {
  const u = STATE.user;
  if (!u) return;
  const lt = u.luckyDraw || {};
  const myT = lt.myTickets || 0;
  const totalT = lt.totalPoolTickets || 0;
  const chance = lt.winChancePct || 0;
  const remMs = Math.max(0, (lt.endsAt || 0) - Date.now());
  const d = Math.floor(remMs / 86400000);
  const h = Math.floor((remMs % 86400000) / 3600000);
  const m = Math.floor((remMs % 3600000) / 60000);
  const timeLeftStr = lt.endsAt ? `${d}k ${h}s ${m}d` : 'Har dushanba 00:00';
  const last = lt.lastWinner;
  const lastHtml = last
    ? `<div style="background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);border-radius:12px;padding:10px 12px;font-size:12.5px;">
         🏆 <b style="color:#4ade80;">Oxirgi gʻolib:</b> @${esc(last.username)} · ${esc(last.prizeNft || 'Victory Medal NFT')} + ${fmtInt(last.rewardHold || 100000)} HOLD
       </div>`
    : `<div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:10px 12px;font-size:12.5px;color:var(--text-2);">
         🏆 Hali gʻolib aniqlanmagan — shu dushanba 00:00 (UTC+5) avtomatik oʻynaladi!
       </div>`;

  openModal('🎟️ Weekly Lucky Draw', `
    <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;line-height:1.5;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">
        <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:10px 6px;">
          <div style="font-size:11px;color:var(--text-2);">Mening chiptam</div>
          <div style="font-size:18px;font-weight:800;color:#fff;">${fmtInt(myT)} 🎟️</div>
        </div>
        <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:10px 6px;">
          <div style="font-size:11px;color:var(--text-2);">Umumiy pul</div>
          <div style="font-size:18px;font-weight:800;color:#fff;">${fmtInt(totalT)}</div>
        </div>
        <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:10px 6px;">
          <div style="font-size:11px;color:var(--text-2);">Shans</div>
          <div style="font-size:18px;font-weight:800;color:#38bdf8;">${chance}%</div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:11px 12px;color:var(--text-2);">
        <div><b style="color:#fff;">🎁 Sovrin:</b> ${esc(lt.prizeTitle || 'Victory Medal NFT + 100,000 HOLD')}</div>
        <div style="margin-top:4px;"><b style="color:#fff;">⏰ Oʻyin vaqti:</b> ${timeLeftStr} qoldi (har dushanba 00:00 UTC+5).</div>
        <div style="margin-top:4px;font-size:12px;">Chiptalar serverda saqlanadi; qancha koʻp chipta yigʻsangiz, gʻalaba ehtimoli shuncha yuqori. Oʻyindan soʻng keyingi hafta uchun 0 dan yigʻiladi.</div>
      </div>

      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:11px 12px;">
        <div style="font-weight:700;color:#fff;margin-bottom:6px;">Chipta qayerdan olinadi?</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span>🔐 Bugungi Vault kodi (@HOLDbot)</span>
          <b style="color:${u.vault?.solvedToday ? '#4ade80' : '#facc15'};">${u.vault?.solvedToday ? '✅ +1 olindi' : '+1 🎟️'}</b>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span>🕵️ Kunlik Morze kodi (@insider)</span>
          <b style="color:${u.morse?.solvedToday ? '#4ade80' : '#facc15'};">${u.morse?.solvedToday ? '✅ +1 olindi' : '+1 🎟️'}</b>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>🔥 7-kunlik Daily Streak</span>
          <b style="color:${(u.streak?.currentDay || 0) >= 7 ? '#4ade80' : '#facc15'};">+1 🎟️</b>
        </div>
      </div>

      ${lastHtml}
    </div>
  `);
}

function openDailyStreakModal() {
  const u = STATE.user;
  if (!u) return;
  const st = u.streak || {};
  const rewards = st.rewards?.length ? st.rewards : [1000, 2500, 5000, 10000, 15000, 25000, 50000].map((hold, i) => ({ day: i + 1, hold }));
  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  openModal('Daily reward', `
    <div class="streak-modal">
      <p class="streak-modal-sub">Har kuni kiring — zanjir uzilmasa mukofot oʻsib boradi. 7-kun: Cookie skin.</p>
      <div class="streak-days-grid">
        ${rewards.map(r => {
          const isClaimed = st.canClaimToday ? r.day < (st.nextDay || 1) : r.day <= (st.currentDay || 0);
          const isToday = st.canClaimToday && r.day === (st.nextDay || 1);
          const val = r.hold >= 1000 ? `${Math.round(r.hold / 1000)}K` : fmtInt(r.hold);
          return `
            <div class="streak-day-cell ${isClaimed ? 'claimed' : ''} ${isToday ? 'today' : ''}">
              <span class="streak-day-num">Day ${r.day}</span>
              <img src="${esc(coinImg)}" class="streak-day-coin" alt="" />
              <span class="streak-day-val">${isClaimed ? '✓' : val}</span>
            </div>
          `;
        }).join('')}
      </div>
      <button type="button" class="btn-sapphire-primary" id="btnClaimDailyStreak" ${st.canClaimToday ? '' : 'disabled'}>
        ${st.canClaimToday ? `Claim +${fmtInt(st.nextRewardHold || rewards[0].hold)}` : 'Come back tomorrow'}
      </button>
    </div>
  `, (body) => {
    body.querySelector('#btnClaimDailyStreak')?.addEventListener('click', async () => {
      await claimDailyStreakBonus();
      closeModal();
    });
  });
}

async function claimDailyStreakBonus() {
  if (STATE.streakBusy) return;
  STATE.streakBusy = true;
  try {
    const res = await api('/api/hold/claim-streak', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username })
    });
    if (res.ok && res.user) {
      mergeUserState(res.user);
      haptic('heavy');
      renderAll();
      showToast(res.message || '🔥 Kunlik bonus olindi!');
    } else {
      showToast(res.error || 'Bugungi bonus olingan');
    }
  } finally {
    STATE.streakBusy = false;
  }
}

// ---- 100% Verified In-App Task Modal (Zero External Tab Redirect!) ----
function openQuestVerificationModal(q) {
  const cleanHandle = String(q.link || '')
    .replace(/^https?:\/\/(www\.)?(paxta\.online|t\.me)\//i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0]
    .trim();

  openModal(q.title, `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div class="dark-group-box" style="padding:14px;text-align:center;gap:6px;">
        <div style="font-size:34px;">${esc(q.icon || '📢')}</div>
        <div style="font-size:16px;font-weight:700;color:#fff;">${esc(q.title)}</div>
        <div style="font-size:13.5px;color:var(--theme-accent);font-weight:700;">Mukofot: +${fmtInt(q.reward)} HOLD</div>
      </div>

      ${cleanHandle ? `
        <p style="font-size:13px;color:var(--text-2);line-height:1.45;text-align:center;">
          1. Quyidagi tugma orqali PaxtaGram ichida <b>@${esc(cleanHandle)}</b> kanaliga oʻting yoki nomini nusxalab obuna boʻling.<br/>
          2. Soʻng <b>"Tekshirish va Olish"</b> tugmasini bosing (bot aʼzolikni 100% tekshiradi).
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button type="button" class="skin-pill-btn" id="btnInternalOpenQuest" style="padding:12px;font-size:13px;">
            📢 @${esc(cleanHandle)} ochish
          </button>
          <button type="button" class="skin-pill-btn" id="btnCopyQuestHandle" style="padding:12px;font-size:13px;">
            📋 @${esc(cleanHandle)} nusxalash
          </button>
        </div>
      ` : `
        <p style="font-size:13px;color:var(--text-2);line-height:1.45;text-align:center;">
          Ushbu vazifa shartini bajargan boʻlsangiz, quyidagi tekshirish tugmasini bosing.
        </p>
      `}

      <button type="button" class="btn-sapphire-primary" id="btnVerifyQuestNow">
        ${cleanHandle ? '1. Avval kanalni oching' : 'Tekshirish va Olish'}
      </button>
    </div>
  `, (body) => {
    const verifyBtn = body.querySelector('#btnVerifyQuestNow');
    let started = !!STATE.openedQuestLinks[q.id] || !cleanHandle;
    if (started && cleanHandle && verifyBtn) {
      verifyBtn.textContent = '✅ Tekshirish va Olish';
    }

    const triggerStartQuest = async () => {
      const alreadyStarted = !!STATE.openedQuestLinks[q.id];
      STATE.openedQuestLinks[q.id] = STATE.openedQuestLinks[q.id] || Date.now();
      started = true;
      if (!alreadyStarted) {
        await api('/api/hold/start-quest', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, questId: q.id })
        });
      }
      if (verifyBtn && !STATE.questCountdownTimer) {
        const elapsed = Date.now() - STATE.openedQuestLinks[q.id];
        let sec = Math.max(0, Math.ceil((4000 - elapsed) / 1000));
        if (sec <= 0) {
          verifyBtn.disabled = false;
          verifyBtn.textContent = '✅ Tekshirish va Olish';
          return;
        }
        verifyBtn.disabled = true;
        verifyBtn.textContent = `Tekshirish (${sec}s)...`;
        STATE.questCountdownTimer = setInterval(() => {
          sec--;
          if (sec <= 0) {
            clearInterval(STATE.questCountdownTimer);
            STATE.questCountdownTimer = null;
            verifyBtn.disabled = false;
            verifyBtn.textContent = '✅ Tekshirish va Olish';
          } else {
            verifyBtn.textContent = `Tekshirish (${sec}s)...`;
          }
        }, 1000);
      }
    };

    body.querySelector('#btnInternalOpenQuest')?.addEventListener('click', async () => {
      await triggerStartQuest();
      openInternalPaxtaChannel(cleanHandle);
      showToast(`@${cleanHandle} PaxtaGram ichida ochildi!`);
    });

    body.querySelector('#btnCopyQuestHandle')?.addEventListener('click', async () => {
      await triggerStartQuest();
      try {
        await navigator.clipboard.writeText(`@${cleanHandle}`);
      } catch {}
      showToast(`@${cleanHandle} nusxalandi!`);
    });

    verifyBtn?.addEventListener('click', async () => {
      if (verifyBtn.disabled) return;
      if (!started && cleanHandle) {
        await triggerStartQuest();
        openInternalPaxtaChannel(cleanHandle);
        return;
      }
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Tekshirilmoqda...';
      const res = await api('/api/hold/claim-quest', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, questId: q.id })
      });
      verifyBtn.disabled = false;
      verifyBtn.textContent = '✅ Tekshirish va Olish';

      if (res.ok && res.user) {
        mergeUserState(res.user);
        haptic('heavy');
        closeModal();
        renderAll();
        showToast(`🎉 +${fmtInt(res.reward)} HOLD qoʻshildi!`);
      } else {
        showToast(res.error || 'Shart hali bajarilmagan');
      }
    });
  });
}

// ============================================================================
// SHEET 4: INVITE FRENS & OFFICIAL PAXTAGRAM SQUADS (100% IN-APP, NO NEW TAB)
// ============================================================================
function renderFrensSheet() {
  const u = STATE.user;
  if (!u) return;

  const refs = u.referrals || [];
  const heroCount = document.getElementById('uiFrensHeroCount');
  if (heroCount) heroCount.textContent = `${refs.length} ${refs.length === 1 ? 'Fren' : 'Frens'}`;

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  // In-app referral claim box (so users never need to open an external browser tab!)
  const refClaimBox = document.getElementById('inAppRefClaimBox');
  if (refClaimBox) {
    if (u.referredBy) {
      refClaimBox.innerHTML = `
        <div style="font-size:13px;color:var(--text-2);display:flex;align-items:center;justify-content:space-between;">
          <span>Sizni taklif qilgan doʻstingiz:</span>
          <b style="color:var(--theme-accent);">@${esc(u.referredBy)} ✓</b>
        </div>
      `;
    } else {
      refClaimBox.innerHTML = `
        <div style="font-size:13px;font-weight:600;color:#fff;">Doʻstingiz taklif qildimi? (+5,000 HOLD)</div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="inpInviterUsername" placeholder="Doʻstingiz @username yoki ID" class="apple-search-input" style="padding:9px 12px;" />
          <button type="button" class="skin-pill-btn" id="btnClaimRefCode" style="padding:0 16px;">Olish</button>
        </div>
      `;
      const btnClaimRef = refClaimBox.querySelector('#btnClaimRefCode');
      btnClaimRef?.addEventListener('click', async () => {
        if (btnClaimRef.disabled) return;
        const refVal = refClaimBox.querySelector('#inpInviterUsername')?.value.trim();
        if (!refVal) return;
        btnClaimRef.disabled = true;
        try {
          const res = await api('/api/hold/claim-ref', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, refUsername: refVal, friendUsername: refVal })
          });
          if (res.ok && res.user) {
            mergeUserState(res.user);
            haptic('heavy');
            renderAll();
            showToast(res.message);
          } else {
            showToast(res.error || 'Topilmadi');
          }
        } finally {
          if (btnClaimRef.isConnected) btnClaimRef.disabled = false;
        }
      });
    }
  }

  const frensList = document.getElementById('frensInvitedList');
  if (frensList) {
    if (!refs.length) {
      frensList.innerHTML = `
        <div style="padding:18px;text-align:center;color:var(--text-2);font-size:13.5px;">
          Hozircha doʻstlar yoʻq. Doʻstingizga @HOLDbot ga <b>/start ${esc(u.paxtaId || u.username)}</b> yozishini ayting va <b>+10,000 HOLD</b> oling!
        </div>
      `;
    } else {
      frensList.innerHTML = refs.map(r => `
        <div class="not-row-item">
          <div class="lb-avatar-circle">${esc((r.displayName || r.username || 'F').charAt(0).toUpperCase())}</div>
          <div class="nri-center">
            <div class="nri-title">${esc(r.displayName || r.username)} <span style="opacity:0.55;font-size:12px;">@${esc(r.username)}</span></div>
            <div class="nri-sub">${esc(r.league || 'Bronze')} · <img src="${esc(coinImg)}" class="inline-c" alt="" /> ${fmtInt(r.lifetimeHold)}</div>
          </div>
          <span style="color:#facc15;font-size:13px;font-weight:700;">+10K</span>
        </div>
      `).join('');
    }
  }

  const spotEl = document.getElementById('mySquadSpotlight');
  const mySq = u.squadId ? (u.squads || []).find(s => s.id === u.squadId) : null;
  if (spotEl) {
    if (mySq) {
      const av = mySq.avatarUrl
        ? `<img src="${esc(mySq.avatarUrl)}" alt="" class="squad-avatar-img" />`
        : `<div class="cp-avatar" style="width:44px;height:44px;border-radius:12px;">${esc((mySq.name || 'S').charAt(0).toUpperCase())}</div>`;
      spotEl.innerHTML = `
        <div class="squad-my-card">
          ${av}
          <div class="nri-center" style="min-width:0;">
            <div style="font-size:10.5px;font-weight:700;color:#7dd3fc;text-transform:uppercase;letter-spacing:0.4px;">🛡️ Mening Squadim</div>
            <div class="nri-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(mySq.name)} <span style="opacity:0.65;font-size:12px;">@${esc(mySq.handle || mySq.id)}</span></div>
            <div class="nri-sub">${esc(mySq.league?.name || 'Bronze')} · ${fmtInt(mySq.members)} aʼzo · <img src="${esc(coinImg)}" class="inline-c" alt="" /> ${fmtInt(mySq.totalHold)} mining</div>
          </div>
          <button type="button" class="skin-pill-btn" id="btnOpenMySquadSpot">Ochish</button>
        </div>
      `;
      spotEl.querySelector('#btnOpenMySquadSpot')?.addEventListener('click', () => openSquadModal(mySq.id));
    } else {
      spotEl.innerHTML = '';
    }
  }

  const sList = document.getElementById('squadsList');
  if (sList) {
    sList.innerHTML = '';
    const squads = [...(u.squads || [])].sort((a, b) => {
      if (a.id === u.squadId) return -1;
      if (b.id === u.squadId) return 1;
      return (b.totalHold || 0) - (a.totalHold || 0);
    });
    squads.forEach((sq, idx) => {
      const joined = u.squadId === sq.id;
      const av = sq.avatarUrl
        ? `<img src="${esc(sq.avatarUrl)}" alt="" class="squad-avatar-img" />`
        : `<div class="cp-avatar" style="width:44px;height:44px;border-radius:12px;">${esc((sq.name || 'S').charAt(0).toUpperCase())}</div>`;
      const row = document.createElement('div');
      row.className = 'not-row-item';
      row.innerHTML = `
        ${av}
        <div class="nri-center" style="min-width:0;">
          <div class="nri-title">${idx === 0 && !u.squadId ? '👑 ' : ''}${esc(sq.name)} ${sq.verified ? '<span style="color:#38b6ff;">✓</span>' : ''}</div>
          <div class="nri-sub">@${esc(sq.handle || sq.id)} · ${esc(sq.league?.name || 'Bronze')} · ${fmtInt(sq.members)} aʼzo · <img src="${esc(coinImg)}" class="inline-c" alt="" /> ${fmtInt(sq.totalHold)}</div>
        </div>
        <button type="button" class="skin-pill-btn ${joined ? 'enabled' : ''}">${joined ? 'Joined ✓' : 'Join'}</button>
      `;
      row.addEventListener('click', async () => {
        if (!joined) {
          if (STATE.joinSquadBusy) return;
          STATE.joinSquadBusy = true;
          try {
            const res = await api('/api/hold/join-squad', {
              method: 'POST',
              body: JSON.stringify({ username: STATE.username, squadId: sq.id })
            });
            if (res.ok && res.user) {
              mergeUserState(res.user);
              STATE.lastVaultFetchedAt = 0;
              haptic('medium');
              renderAll();
              showToast(res.message);
            } else {
              showToast(res.error || 'Qoʻshilib boʻlmadi');
            }
          } finally {
            STATE.joinSquadBusy = false;
          }
        } else {
          openSquadModal(sq.id);
        }
      });
      sList.appendChild(row);
    });
  }
}

function openSearchSquadsModal() {
  const coinImg = (STATE.user?.allSkins || []).find(s => s.id === STATE.user?.skin)?.img || '/hold/skins/skin-4.png';
  openModal('🔍 Squad qidirish', `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <p style="font-size:12.5px;color:var(--text-2);line-height:1.45;">
        Squad nomi yoki doʻstingiz bergan kanal <b>@username</b> manzilini yozing — darhol aʼzolar soni va mining koʻrinadi, <b>+</b> bosib toʻgʻridan-toʻgʻri qoʻshilasiz.
      </p>
      <div style="display:flex;gap:8px;">
        <input type="text" id="inpSearchSquad" placeholder="@kanal_user yoki nom..." class="apple-search-input" style="flex:1;min-width:0;" />
        <button type="button" class="skin-pill-btn" id="btnRunSearchSquad" style="padding:0 14px;">Topish</button>
      </div>
      <div id="searchSquadResults" style="max-height:46vh;overflow:auto;display:flex;flex-direction:column;gap:8px;"></div>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpSearchSquad');
    const resultsBox = body.querySelector('#searchSquadResults');
    const runBtn = body.querySelector('#btnRunSearchSquad');

    const joinDirect = async (payload) => {
      if (STATE.joinSquadBusy) return;
      STATE.joinSquadBusy = true;
      try {
        const res = await api('/api/hold/join-squad', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, ...payload })
        });
        if (res.ok && res.user) {
          mergeUserState(res.user);
          STATE.lastVaultFetchedAt = 0;
          haptic('heavy');
          closeModal();
          renderAll();
          showToast(res.message);
        } else {
          showToast(res.error || 'Qoʻshilib boʻlmadi');
        }
      } finally {
        STATE.joinSquadBusy = false;
      }
    };

    const runSearch = async (qStr) => {
      if (!resultsBox) return;
      resultsBox.innerHTML = `<div style="padding:14px;text-align:center;color:var(--text-2);font-size:13px;">Qidirilmoqda...</div>`;
      const res = await api(`/api/hold/search-squad?q=${encodeURIComponent(qStr || '')}`);
      if (!res || !res.ok) {
        resultsBox.innerHTML = `<div style="padding:14px;text-align:center;color:#f87171;font-size:13px;">Qidirishda xatolik</div>`;
        return;
      }
      const list = Array.isArray(res.squads) ? res.squads : [];
      const pm = res.paxtaMatch;
      resultsBox.innerHTML = '';

      if (pm) {
        const pmCard = document.createElement('div');
        pmCard.className = 'squad-my-card';
        pmCard.style.marginBottom = '2px';
        const av = pm.avatarUrl
          ? `<img src="${esc(pm.avatarUrl)}" alt="" class="squad-avatar-img" />`
          : `<div class="cp-avatar" style="width:42px;height:42px;border-radius:12px;">${esc((pm.name || 'S').charAt(0).toUpperCase())}</div>`;
        pmCard.innerHTML = `
          ${av}
          <div class="nri-center" style="min-width:0;">
            <div style="font-size:10.5px;font-weight:700;color:#4ade80;">✨ PaxtaGramda topildi</div>
            <div class="nri-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(pm.name)}</div>
            <div class="nri-sub">@${esc(pm.handle)} · Hali HOLDda yoʻq · ${fmtInt(pm.membersCount || 0)} obunachi</div>
          </div>
          <button type="button" class="skin-pill-btn" data-add-handle="${esc(pm.handle)}">+ Qoʻshish</button>
        `;
        pmCard.querySelector('[data-add-handle]')?.addEventListener('click', () => joinDirect({ channelHandle: pm.handle }));
        resultsBox.appendChild(pmCard);
      }

      if (!list.length && !pm) {
        resultsBox.innerHTML = `<div style="padding:18px;text-align:center;color:var(--text-2);font-size:13px;">Mos squad topilmadi. Kanal @username manzilini toʻliq yozib koʻring.</div>`;
        return;
      }

      for (const sq of list) {
        const joined = STATE.user?.squadId === sq.id;
        const av = sq.avatarUrl
          ? `<img src="${esc(sq.avatarUrl)}" alt="" class="squad-avatar-img" />`
          : `<div class="cp-avatar" style="width:42px;height:42px;border-radius:12px;">${esc((sq.name || 'S').charAt(0).toUpperCase())}</div>`;
        const item = document.createElement('div');
        item.className = 'not-row-item';
        item.style.background = 'rgba(255,255,255,0.04)';
        item.style.borderRadius = '14px';
        item.style.padding = '10px';
        item.innerHTML = `
          ${av}
          <div class="nri-center" style="min-width:0;">
            <div class="nri-title">${esc(sq.name)} ${sq.verified ? '<span style="color:#38b6ff;">✓</span>' : ''}</div>
            <div class="nri-sub">@${esc(sq.handle || sq.id)} · ${fmtInt(sq.members)} aʼzo · <img src="${esc(coinImg)}" class="inline-c" alt="" /> ${fmtInt(sq.totalHold)} (${esc(sq.league?.name || 'Bronze')})</div>
          </div>
          <button type="button" class="skin-pill-btn ${joined ? 'enabled' : ''}">${joined ? 'Joined ✓' : '+ Join'}</button>
        `;
        item.addEventListener('click', () => {
          if (joined) { closeModal(); openSquadModal(sq.id); }
          else joinDirect({ squadId: sq.id });
        });
        resultsBox.appendChild(item);
      }
    };

    let t = null;
    inp?.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => runSearch(inp.value.trim()), 320);
    });
    runBtn?.addEventListener('click', () => runSearch(inp?.value.trim() || ''));
    inp?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); runSearch(inp.value.trim()); }
    });
    runSearch('');
    setTimeout(() => inp?.focus(), 60);
  });
}

function openAddPaxtaChannelSquadModal() {
  openModal('+ Yangi Kanal Squad qoʻshish', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:13px;color:var(--text-2);line-height:1.45;">
        Rasmiy PaxtaGram kanalingiz yoki guruhingiz <b>@username</b> (yoki havola) manzilini kiriting. Bot kanalni tekshirib, real nomi bilan Squad yaratadi va sizni darhol qoʻshadi.
      </p>
      <input type="text" id="inpSquadHandle" placeholder="@kanal_nomi yoki https://paxta.online/..." class="apple-search-input" />
      <button type="button" class="btn-sapphire-primary" id="btnVerifyAndJoinSquad">Tekshirish va Qoʻshish</button>
    </div>
  `, (body) => {
    const btn = body.querySelector('#btnVerifyAndJoinSquad');
    const inp = body.querySelector('#inpSquadHandle');
    btn?.addEventListener('click', async () => {
      const channelHandle = inp?.value.trim();
      if (!channelHandle) return;
      btn.disabled = true;
      btn.textContent = 'Tekshirilmoqda...';
      const res = await api('/api/hold/join-squad', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, channelHandle })
      });
      btn.disabled = false;
      btn.textContent = 'Tekshirish va Qoʻshish';
      if (res.ok && res.user) {
        mergeUserState(res.user);
        STATE.lastVaultFetchedAt = 0;
        haptic('heavy');
        closeModal();
        renderAll();
        showToast(res.message);
      } else {
        showToast(res.error || 'Kanal topilmadi');
      }
    });
    setTimeout(() => inp?.focus(), 60);
  });
}

// ---- Top Up Stars via @HOLDbot Invoice (100% In-App — Never Opens New Tab!) ----
function openTopUpStarsModal(defaultAmount = 250, reason = 'HOLD Boost') {
  openModal('Top Up Stars', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[100, 250, 500, 1000, 2500, 5000].map(amt => `
          <button type="button" class="skin-pill-btn" data-preset="${amt}" style="padding:10px;">⭐ ${amt}</button>
        `).join('')}
      </div>
      <input type="number" id="inpStarsAmount" value="${defaultAmount}" min="10" max="100000" class="apple-search-input" />
      <div id="starsInvoiceStatusBox" hidden style="padding:10px;border-radius:12px;background:rgba(56,182,255,0.12);color:#e0f2fe;font-size:13px;text-align:center;"></div>
      <button type="button" class="btn-sapphire-primary" id="btnPayStarsInvoice">Pay with Stars</button>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpStarsAmount');
    const statusBox = body.querySelector('#starsInvoiceStatusBox');
    const payBtn = body.querySelector('#btnPayStarsInvoice');

    body.querySelectorAll('[data-preset]').forEach(b => {
      b.addEventListener('click', () => { if (inp) inp.value = b.dataset.preset; });
    });

    payBtn?.addEventListener('click', async () => {
      const amount = Math.max(1, parseInt(inp?.value, 10) || defaultAmount);
      payBtn.disabled = true;
      payBtn.textContent = 'Invoice yaratilmoqda...';

      const res = await api('/api/hold/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, amount, title: reason })
      });

      payBtn.disabled = false;
      payBtn.textContent = 'Pay with Stars';

      if (res.ok && res.invoiceUrl) {
        const slug = res.slug || String(res.invoiceUrl).split('/').pop();
        // Trigger PaxtaGram in-app invoice sheet via postMessage (Zero external tab!)
        notifyPaxtaMiniApp('web_app_open_invoice', { slug, url: res.invoiceUrl });
        try {
          if (window.Telegram?.WebApp?.openInvoice) {
            window.Telegram.WebApp.openInvoice(res.invoiceUrl, async (st) => {
              if (st === 'paid') {
                await syncHoldUser();
                closeModal();
                showToast(`🎉 +${amount} Stars qoʻshildi!`);
              }
            });
          }
        } catch {}

        if (statusBox) {
          statusBox.hidden = false;
          statusBox.innerHTML = `⏳ Toʻlov oynasi ochildi (<b>${amount} ⭐</b>). Tasdiqlashingiz bilan avtomatik tushadi...`;
        }

        if (res.invoiceId) {
          if (STATE.invoicePollTimer) clearInterval(STATE.invoicePollTimer);
          STATE.invoicePollTimer = setInterval(async () => {
            const stRes = await api(`/api/hold/invoice-status/${encodeURIComponent(res.invoiceId)}`);
            if (stRes.ok && stRes.status === 'paid') {
              clearInterval(STATE.invoicePollTimer);
              STATE.invoicePollTimer = null;
              await syncHoldUser();
              closeModal();
              showToast(`🎉 +${amount} Stars hisobingizga qoʻshildi!`);
            }
          }, 2000);
        }
      } else {
        showToast(res.error || 'Invoice xatosi');
      }
    });
  });
}

// ============================================================================
// SHEET 5: DEDICATED FULL-SCREEN ADMIN STUDIO (`#sheetAdmin` — NOT A POPUP!)
// ============================================================================
async function loadAdminUsersData(force = false) {
  if (!force && STATE.adminUsersData && (Date.now() - (STATE.adminUsersFetchedAt || 0)) < 15000) {
    return { ok: true, cached: true };
  }
  const res = await api(`/api/hold/admin-users?username=${encodeURIComponent(STATE.username)}`);
  if (res.ok) {
    STATE.adminUsersData = res;
    STATE.adminUsersFetchedAt = Date.now();
  }
  return res;
}

function confirmAdminAction({ title, message, confirmLabel = 'Tasdiqlash', danger = true, onConfirm }) {
  openModal(title, `
    <div class="dark-group-box" style="padding:14px;gap:12px;">
      <p style="font-size:13.5px;color:var(--text-1);line-height:1.45;">${esc(message)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button type="button" class="skin-pill-btn" id="btnAdmModalCancel" style="padding:11px;">Bekor qilish</button>
        <button type="button" class="${danger ? 'skin-pill-btn danger' : 'btn-sapphire-primary'}" id="btnAdmModalConfirm" style="padding:11px;">${esc(confirmLabel)}</button>
      </div>
    </div>
  `, (body) => {
    body.querySelector('#btnAdmModalCancel')?.addEventListener('click', closeModal);
    const btnOk = body.querySelector('#btnAdmModalConfirm');
    btnOk?.addEventListener('click', async () => {
      if (btnOk.disabled) return;
      btnOk.disabled = true;
      try {
        closeModal();
        await onConfirm();
      } finally {
        if (btnOk.isConnected) btnOk.disabled = false;
      }
    });
  });
}

async function renderAdminSheet() {
  const u = STATE.user;
  if (!u?.isAdmin) return;

  const container = document.getElementById('adminSheetBody');
  if (!container) return;

  const reqSeq = ++STATE.adminRenderSeq;
  if (STATE.adminTab === 'overview' || STATE.adminTab === 'users') {
    if (!STATE.adminUsersData) {
      container.innerHTML = `<div class="dark-group-box" style="padding:18px;text-align:center;color:var(--text-2);font-size:13px;">⏳ Yuklanmoqda...</div>`;
    }
    await loadAdminUsersData();
    if (reqSeq !== STATE.adminRenderSeq || STATE.activeSheet !== 'admin') return;
  }

  const adm = STATE.adminUsersData || {};
  const usersList = Array.isArray(adm.users) ? adm.users : [];
  const stats = adm.stats || {};
  const curUser = STATE.user;
  const totalPlayers = stats.totalPlayers ?? adm.totalUsers ?? usersList.length;
  const totalHoldInCirculation = stats.totalHoldInCirculation ?? adm.totalHoldCirculation ?? usersList.reduce((s, x) => s + (x.holdBalance || 0), 0);
  const hhActive = stats.happyHourActive ?? !!curUser.happyHour?.active;
  const hhForced = stats.happyHourForceEnabled ?? !!curUser.happyHour?.forced ?? (!!curUser.happyHour?.active && curUser.happyHour?.scheduleText === '2x Tap Happy Hour faol!');
  const lastWinner = stats.lastLuckyWinner || curUser.luckyDraw?.lastWinner || null;
  const secretMap = curUser.morse?.secretCodesMap || {};
  const quests = curUser.quests || [];
  const squads = curUser.squads || [];

  if (STATE.adminTab === 'overview') {
    container.innerHTML = `
      <div class="admin-stat-grid">
        <div class="admin-stat-card">
          <span>Rasmiy Ishtirokchilar</span>
          <strong>${fmtInt(totalPlayers)}</strong>
        </div>
        <div class="admin-stat-card">
          <span>Jami Muomaladagi HOLD</span>
          <strong>${fmtInt(totalHoldInCirculation)}</strong>
        </div>
        <div class="admin-stat-card">
          <span>2x Happy Hour Holati</span>
          <strong style="color:${hhActive ? '#4ade80' : '#facc15'};">${hhActive ? 'YOQILGAN (2X)' : 'Jadval (20:00)'}</strong>
        </div>
        <div class="admin-stat-card">
          <span>Lucky Ticket Gʻolibi</span>
          <strong style="font-size:15px;">${lastWinner ? `@${esc(lastWinner.username)}` : 'Oʻynalmagan'}</strong>
        </div>
      </div>

      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14.5px;">⚡ Tezkor Boshqaruv va Eventlar</strong>
        <button type="button" class="btn-sapphire-primary" id="btnAdmToggleHH">
          ${hhForced ? '🛑 2x Happy Hour Oʻchirish' : '⚡ 2x Happy Hour Yoqish (Barchaga)'}
        </button>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button type="button" class="skin-pill-btn" id="btnAdmRewardSquad" style="padding:12px;">⚔️ #1 Squadga +25K</button>
          <button type="button" class="skin-pill-btn" id="btnAdmDrawLucky" style="padding:12px;">🎟️ Lucky Ticket Gʻolibi</button>
        </div>
      </div>

      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14.5px;">🔄 Hisoblarni Reset Qilish (0 HOLD + Onboarding)</strong>
        <p style="font-size:12.5px;color:var(--text-2);line-height:1.45;">
          Oʻz hisobingizni yoki barcha ishtirokchilarni 0 HOLD va 3-qadamli Onboarding holatiga qaytarish:
        </p>
        <button type="button" class="skin-pill-btn" id="btnAdmResetSelf" style="padding:12px;width:100%;">
          🔄 Oʻz Hisobimni Reset Qilish (@${esc(curUser.username)})
        </button>
        <button type="button" class="skin-pill-btn danger" id="btnAdmResetAllUsers" style="padding:12px;width:100%;">
          ⚠️ BARCHA Foydalanuvchilarni Reset Qilish (Full Season Reset)
        </button>
      </div>
    `;

    const btnHH = container.querySelector('#btnAdmToggleHH');
    btnHH?.addEventListener('click', async () => {
      if (btnHH.disabled) return;
      btnHH.disabled = true;
      try {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'toggle_happy_hour' })
        });
        if (res.ok && res.user) {
          mergeUserState(res.user);
          STATE.adminUsersFetchedAt = 0;
          renderAll();
          renderAdminSheet();
          showToast(res.message);
        } else {
          showToast(res.error || 'Xato');
        }
      } finally {
        if (btnHH.isConnected) btnHH.disabled = false;
      }
    });

    const btnRewSq = container.querySelector('#btnAdmRewardSquad');
    btnRewSq?.addEventListener('click', async () => {
      if (btnRewSq.disabled) return;
      btnRewSq.disabled = true;
      try {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'reward_top_squad', rewardAmount: 25000 })
        });
        if (res.ok) {
          if (res.user) mergeUserState(res.user);
          STATE.adminUsersFetchedAt = 0;
          STATE.lastVaultFetchedAt = 0;
          renderAll();
          renderAdminSheet();
          showToast(res.message);
        } else {
          showToast(res.error || 'Xato');
        }
      } finally {
        if (btnRewSq.isConnected) btnRewSq.disabled = false;
      }
    });

    const btnDraw = container.querySelector('#btnAdmDrawLucky');
    btnDraw?.addEventListener('click', async () => {
      if (btnDraw.disabled) return;
      btnDraw.disabled = true;
      try {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'draw_lucky_winner' })
        });
        if (res.ok) {
          if (res.user) mergeUserState(res.user);
          STATE.adminUsersFetchedAt = 0;
          renderAll();
          renderAdminSheet();
          showToast(res.message);
        } else {
          showToast(res.error || 'Chiptali ishtirokchi yoʻq');
        }
      } finally {
        if (btnDraw.isConnected) btnDraw.disabled = false;
      }
    });

    const btnResetSelf = container.querySelector('#btnAdmResetSelf');
    btnResetSelf?.addEventListener('click', async () => {
      if (btnResetSelf.disabled) return;
      btnResetSelf.disabled = true;
      try {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'reset_user', targetUsername: STATE.username })
        });
        if (res.ok && res.user) {
          mergeUserState(res.user);
          STATE.adminUsersFetchedAt = 0;
          STATE.lastVaultFetchedAt = 0;
          closeAllSheets();
          renderAll();
          loadLeaderboardData(true);
          openOnboardingStory(0);
          showToast('Hisobingiz 0 HOLD va Onboarding holatiga qaytarildi!');
        } else {
          showToast(res.error || 'Xato');
        }
      } finally {
        if (btnResetSelf.isConnected) btnResetSelf.disabled = false;
      }
    });

    const btnResetAll = container.querySelector('#btnAdmResetAllUsers');
    btnResetAll?.addEventListener('click', () => {
      confirmAdminAction({
        title: '⚠️ Full Season Reset',
        message: 'Haqiqatan ham BARCHA foydalanuvchilar balansini 0 HOLD ga tushirib, mavsumni qayta boshlamoqchimisiz?',
        confirmLabel: 'Ha, Barchasini Reset',
        onConfirm: async () => {
          const res = await api('/api/hold/admin-config', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, action: 'reset_all_users' })
          });
          if (res.ok && res.user) {
            mergeUserState(res.user);
            STATE.adminUsersFetchedAt = 0;
            STATE.lastVaultFetchedAt = 0;
            closeAllSheets();
            renderAll();
            loadLeaderboardData(true);
            openOnboardingStory(0);
            showToast(res.message);
          } else {
            showToast(res.error || 'Xato');
          }
        }
      });
    });
    return;
  }

  if (STATE.adminTab === 'users') {
    container.innerHTML = `
      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">👤 Foydalanuvchini Boshqarish (Grant / Reset)</strong>
        <input type="text" id="admTargetUser" value="${esc(curUser.username)}" placeholder="@username" class="apple-search-input" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <input type="number" id="admHoldDelta" value="50000" placeholder="HOLD (+/-)" class="apple-search-input" />
          <input type="number" id="admStarsDelta" value="0" placeholder="Stars (+/-)" class="apple-search-input" />
        </div>
        <select id="admGrantSkin" class="apple-search-input">
          <option value="">Skin berish (ixtiyoriy)</option>
          ${(curUser.allSkins || []).map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
        </select>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button type="button" class="btn-sapphire-primary" id="btnAdmGrantUser">Saqlash / Qoʻshish</button>
          <button type="button" class="skin-pill-btn danger" id="btnAdmResetTargetUser" style="padding:12px;">🔄 Shu Userni Reset (0)</button>
        </div>
      </div>

      <div class="not-section-heading">Barcha Foydalanuvchilar (${usersList.length})</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${usersList.map((uRow, idx) => `
          <div class="admin-user-card">
            <div class="admin-user-head">
              <div>
                <strong style="font-size:14px;color:#fff;">#${uRow.rank || (idx + 1)} ${esc(uRow.displayName || uRow.username)}</strong>
                <span style="font-size:12px;color:var(--text-2);margin-left:6px;">@${esc(uRow.username)} · ${esc(uRow.league)}</span>
              </div>
              <b style="color:var(--theme-accent);font-size:13.5px;">${fmtInt(uRow.holdBalance)} HOLD</b>
            </div>
            <div style="font-size:11.5px;color:var(--text-2);">
              Lifetime: ${fmtInt(uRow.lifetimeHold)} · Streak: D${uRow.streakDays ?? uRow.streakCount ?? 0} · Tickets: ${uRow.luckyTickets} 🎟️ · Onboarding: ${uRow.ogBonusClaimed ? 'Ha' : 'Yoʻq'}
            </div>
            <div class="admin-user-actions">
              <button type="button" class="skin-pill-btn" data-quick-select="${esc(uRow.username)}" style="font-size:11.5px;padding:5px 10px;">Tanlash</button>
              <button type="button" class="skin-pill-btn" data-quick-reset="${esc(uRow.username)}" style="font-size:11.5px;padding:5px 10px;">🔄 Reset 0</button>
              <button type="button" class="skin-pill-btn" data-quick-morse="${esc(uRow.username)}" style="font-size:11.5px;padding:5px 10px;">Morze Reset</button>
              ${uRow.username !== curUser.username ? `<button type="button" class="skin-pill-btn danger" data-quick-del="${esc(uRow.username)}" style="font-size:11.5px;padding:5px 10px;">Oʻchirish</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const btnGrant = container.querySelector('#btnAdmGrantUser');
    btnGrant?.addEventListener('click', async () => {
      if (btnGrant.disabled) return;
      const targetUsername = container.querySelector('#admTargetUser')?.value.trim();
      const holdDelta = parseInt(container.querySelector('#admHoldDelta')?.value, 10) || 0;
      const starsDelta = parseInt(container.querySelector('#admStarsDelta')?.value, 10) || 0;
      const grantSkin = container.querySelector('#admGrantSkin')?.value || '';
      btnGrant.disabled = true;
      try {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'user_grant', targetUsername, holdDelta, starsDelta, grantSkin })
        });
        if (res.ok && res.user) {
          mergeUserState(res.user);
          STATE.adminUsersFetchedAt = 0;
          STATE.lastVaultFetchedAt = 0;
          renderAll();
          loadLeaderboardData(true);
          renderAdminSheet();
          showToast(res.message);
        } else {
          showToast(res.error || 'Xato');
        }
      } finally {
        if (btnGrant.isConnected) btnGrant.disabled = false;
      }
    });

    const btnResetTarget = container.querySelector('#btnAdmResetTargetUser');
    btnResetTarget?.addEventListener('click', async () => {
      if (btnResetTarget.disabled) return;
      const targetUsername = container.querySelector('#admTargetUser')?.value.trim();
      if (!targetUsername) return;
      btnResetTarget.disabled = true;
      try {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'reset_user', targetUsername })
        });
        if (res.ok && res.user) {
          mergeUserState(res.user);
          STATE.adminUsersFetchedAt = 0;
          STATE.lastVaultFetchedAt = 0;
          renderAll();
          loadLeaderboardData(true);
          renderAdminSheet();
          showToast(res.message);
        } else {
          showToast(res.error || 'Xato');
        }
      } finally {
        if (btnResetTarget.isConnected) btnResetTarget.disabled = false;
      }
    });

    container.querySelectorAll('[data-quick-select]').forEach(b => {
      b.addEventListener('click', () => {
        const inp = container.querySelector('#admTargetUser');
        if (inp) {
          inp.value = b.dataset.quickSelect;
          inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });

    container.querySelectorAll('[data-quick-reset]').forEach(b => {
      b.addEventListener('click', async () => {
        if (b.disabled) return;
        const target = b.dataset.quickReset;
        b.disabled = true;
        try {
          const res = await api('/api/hold/admin-config', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, action: 'reset_user', targetUsername: target })
          });
          if (res.ok && res.user) {
            mergeUserState(res.user);
            STATE.adminUsersFetchedAt = 0;
            STATE.lastVaultFetchedAt = 0;
            renderAll();
            loadLeaderboardData(true);
            renderAdminSheet();
            showToast(res.message);
          } else {
            showToast(res.error || 'Xato');
          }
        } finally {
          if (b.isConnected) b.disabled = false;
        }
      });
    });

    container.querySelectorAll('[data-quick-morse]').forEach(b => {
      b.addEventListener('click', async () => {
        if (b.disabled) return;
        const target = b.dataset.quickMorse;
        b.disabled = true;
        try {
          const res = await api('/api/hold/admin-config', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, action: 'user_grant', targetUsername: target, resetMorse: true })
          });
          if (res.ok && res.user) {
            mergeUserState(res.user);
            STATE.adminUsersFetchedAt = 0;
            renderAll();
            renderAdminSheet();
            showToast(`@${target} uchun Morze reset qilindi!`);
          } else {
            showToast(res.error || 'Xato');
          }
        } finally {
          if (b.isConnected) b.disabled = false;
        }
      });
    });

    container.querySelectorAll('[data-quick-del]').forEach(b => {
      b.addEventListener('click', () => {
        const target = b.dataset.quickDel;
        confirmAdminAction({
          title: '🗑️ Foydalanuvchini oʻchirish',
          message: `@${target} hisobini butunlay oʻchirmoqchimisiz?`,
          confirmLabel: 'Oʻchirish',
          onConfirm: async () => {
            const res = await api('/api/hold/admin-config', {
              method: 'POST',
              body: JSON.stringify({ username: STATE.username, action: 'delete_user', targetUsername: target })
            });
            if (res.ok && res.user) {
              mergeUserState(res.user);
              STATE.adminUsersFetchedAt = 0;
              STATE.lastVaultFetchedAt = 0;
              renderAll();
              loadLeaderboardData(true);
              renderAdminSheet();
              showToast(res.message);
            } else {
              showToast(res.error || 'Xato');
            }
          }
        });
      });
    });
    return;
  }

  if (STATE.adminTab === 'broadcast') {
    container.innerHTML = `
      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">📢 Barcha Foydalanuvchilarga E'lon (Broadcast)</strong>
        <p style="font-size:12.5px;color:var(--text-2);line-height:1.45;">
          Xabar @HOLDbot orqali botdan roʻyxatdan oʻtgan barcha faol PaxtaGram foydalanuvchilariga yetkaziladi. HTML formatlash (&lt;b&gt;qalin&lt;/b&gt;, &lt;i&gt;kursiv&lt;/i&gt;) va emojilar qoʻllab-quvvatlanadi.
        </p>
        <textarea id="admBroadcastText" rows="4" placeholder="E'lon matnini kiriting..." class="apple-search-input" style="resize:vertical;min-height:90px;font-family:inherit;"></textarea>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <input type="text" id="admBroadcastBtnText" value="🪙 $HOLD ga kirish" placeholder="Tugma matni (ixtiyoriy)" class="apple-search-input" />
          <input type="text" id="admBroadcastBtnUrl" value="https://paxta.online/u/HOLDbot" placeholder="Tugma havolasi" class="apple-search-input" />
        </div>
        <div id="admBroadcastProgress" hidden style="padding:10px;border-radius:12px;background:rgba(56,182,255,0.12);color:#e0f2fe;font-size:13px;text-align:center;"></div>
        <button type="button" class="btn-sapphire-primary" id="btnAdmSendBroadcast">🚀 Xabarni Barchaga Yuborish</button>
      </div>

      <div class="dark-group-box" style="padding:12px;gap:6px;">
        <strong style="font-size:13px;color:#fff;">💡 Foydali shablonlar:</strong>
        <button type="button" class="skin-pill-btn" id="tplHappyHour" style="text-align:left;padding:8px 12px;width:100%;font-size:12px;">
          ⚡ 2x Happy Hour e'loni
        </button>
        <button type="button" class="skin-pill-btn" id="tplStreakAlert" style="text-align:left;padding:8px 12px;width:100%;font-size:12px;">
          🔥 Kunlik zanjir eslatmasi
        </button>
        <button type="button" class="skin-pill-btn" id="tplNewTask" style="text-align:left;padding:8px 12px;width:100%;font-size:12px;">
          🎁 Yangi vazifa va bonus e'loni
        </button>
      </div>
    `;

    container.querySelector('#tplHappyHour')?.addEventListener('click', () => {
      const txt = container.querySelector('#admBroadcastText');
      if (txt) txt.value = '⚡ <b>Happy Hour boshlandi!</b>\n\nKeyingi 1 soat (20:00 – 21:00) davomida barcha bosishlar <b>2 barobar (2x)</b> koʻproq $HOLD beradi! 🚀';
    });
    container.querySelector('#tplStreakAlert')?.addEventListener('click', () => {
      const txt = container.querySelector('#admBroadcastText');
      if (txt) txt.value = '🔥 <b>Kunlik bonus kutmoqda!</b>\n\nBugungi kunlik zanjir mukofotingizni olishni unutmang. 7-kuni bepul Cookie skin beriladi! 🍪';
    });
    container.querySelector('#tplNewTask')?.addEventListener('click', () => {
      const txt = container.querySelector('#admBroadcastText');
      if (txt) txt.value = '🎁 <b>Yangi vazifalar qoʻshildi!</b>\n\nEarn boʻlimida yangi rasmiy kanallar paydo boʻldi. Bajarib qoʻshimcha $HOLD toʻplang!';
    });

    const btnBroadcast = container.querySelector('#btnAdmSendBroadcast');
    btnBroadcast?.addEventListener('click', () => {
      if (btnBroadcast.disabled) return;
      const text = container.querySelector('#admBroadcastText')?.value.trim();
      if (!text) {
        showToast('Iltimos, xabar matnini kiriting!');
        return;
      }
      const buttonText = container.querySelector('#admBroadcastBtnText')?.value.trim();
      const buttonUrl = container.querySelector('#admBroadcastBtnUrl')?.value.trim();
      const prg = container.querySelector('#admBroadcastProgress');

      confirmAdminAction({
        title: '📢 Broadcastni tasdiqlang',
        message: 'Haqiqatan ham barcha foydalanuvchilarga ushbu xabarni yubormoqchimisiz?',
        confirmLabel: 'Yuborish',
        danger: false,
        onConfirm: async () => {
          if (btnBroadcast) {
            btnBroadcast.disabled = true;
            btnBroadcast.textContent = 'Yuborilmoqda...';
          }
          if (prg) {
            prg.hidden = false;
            prg.textContent = '⏳ Xabar barcha ishtirokchilarga uzatilmoqda...';
          }
          try {
            const res = await api('/api/hold/admin-broadcast', {
              method: 'POST',
              body: JSON.stringify({
                username: STATE.username,
                text,
                buttonText,
                buttonUrl
              })
            });
            if (res.ok) {
              if (prg) prg.innerHTML = `✅ <b>Muvaffaqiyatli:</b> ${res.sent} ta yetkazildi (Jami: ${res.total}).`;
              showToast(res.message || 'Xabar yuborildi!');
            } else {
              if (prg) prg.innerHTML = `❌ Xatolik: ${esc(res.error || 'Yuborilmadi')}`;
              showToast(res.error || 'Xatolik');
            }
          } finally {
            if (btnBroadcast && btnBroadcast.isConnected) {
              btnBroadcast.disabled = false;
              btnBroadcast.textContent = '🚀 Xabarni Barchaga Yuborish';
            }
          }
        }
      });
    });
    return;
  }

  if (STATE.adminTab === 'morse') {
    container.innerHTML = `
      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">🕵️ Kunlik Morze Soʻzi va Maslahati (Hint)</strong>
        <input type="text" id="admMorseWord" value="${esc(curUser.morse?.word || 'HOLD')}" placeholder="Masalan: HOLD" class="apple-search-input" />
        <input type="text" id="admMorseHint" value="${esc(curUser.morse?.hint || '')}" placeholder="Earn boʻlimida koʻrinadigan maslahat (hint)" class="apple-search-input" />
        <input type="number" id="admMorseReward" value="${curUser.morse?.reward || 50000}" placeholder="Mukofot (HOLD)" class="apple-search-input" />
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button type="button" class="btn-sapphire-primary" id="btnAdmSaveDailyMorse" style="flex:1;">Saqlash</button>
          <button type="button" class="btn-sapphire-primary" id="btnAdmPostMorseChannel" style="flex:1.2;background:linear-gradient(135deg, #0284c7, #2563eb);">📢 @insider ga post</button>
        </div>
      </div>

      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">➕ Yangi Maxfiy Morze Kod Qoʻshish</strong>
        <input type="text" id="admSecCode" placeholder="Maxfiy soʻz (masalan: BONUS)" class="apple-search-input" />
        <input type="number" id="admSecReward" value="25000" placeholder="HOLD mukofoti" class="apple-search-input" />
        <button type="button" class="btn-sapphire-primary" id="btnAdmAddSecret">Maxfiy Kod Qoʻshish</button>
      </div>

      <div class="dark-group-box" style="padding:10px;">
        ${Object.entries(secretMap).map(([code, info]) => `
          <div class="not-row-item" style="padding:8px;">
            <div class="nri-center">
              <div class="nri-title">${esc(code)}</div>
              <div class="nri-sub">+${fmtInt(info.reward)} HOLD</div>
            </div>
            <button type="button" class="skin-pill-btn danger" data-del-secret="${esc(code)}">Oʻchirish</button>
          </div>
        `).join('')}
      </div>
    `;

    const btnSaveMorse = container.querySelector('#btnAdmSaveDailyMorse');
    btnSaveMorse?.addEventListener('click', async () => {
      if (btnSaveMorse.disabled) return;
      const morseWord = container.querySelector('#admMorseWord')?.value.trim();
      const morseHint = container.querySelector('#admMorseHint')?.value.trim();
      const morseReward = parseInt(container.querySelector('#admMorseReward')?.value, 10) || 50000;
      btnSaveMorse.disabled = true;
      try {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'save_morse', morseWord, morseHint, morseReward })
        });
        if (res.ok && res.user) {
          mergeUserState(res.user);
          renderAll();
          renderAdminSheet();
          showToast(res.message);
        } else {
          showToast(res.error || 'Xato');
        }
      } finally {
        if (btnSaveMorse.isConnected) btnSaveMorse.disabled = false;
      }
    });

    const btnPostMorse = container.querySelector('#btnAdmPostMorseChannel');
    btnPostMorse?.addEventListener('click', async () => {
      if (btnPostMorse.disabled) return;
      const morseWord = container.querySelector('#admMorseWord')?.value.trim();
      const morseReward = parseInt(container.querySelector('#admMorseReward')?.value, 10) || 50000;
      btnPostMorse.disabled = true;
      showToast('Kanalga post qilinmoqda...');
      try {
        const res = await api('/api/hold/admin-post-morse-channel', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, word: morseWord, reward: morseReward })
        });
        if (res.ok) {
          showToast(res.message);
        } else {
          showToast(res.error || 'Xatolik yuz berdi');
        }
      } finally {
        if (btnPostMorse.isConnected) btnPostMorse.disabled = false;
      }
    });

    const btnAddSec = container.querySelector('#btnAdmAddSecret');
    btnAddSec?.addEventListener('click', async () => {
      if (btnAddSec.disabled) return;
      const code = container.querySelector('#admSecCode')?.value.trim();
      const reward = parseInt(container.querySelector('#admSecReward')?.value, 10) || 25000;
      btnAddSec.disabled = true;
      try {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'add_secret_code', code, reward })
        });
        if (res.ok && res.user) {
          mergeUserState(res.user);
          renderAll();
          renderAdminSheet();
          showToast(res.message);
        } else {
          showToast(res.error || 'Xato');
        }
      } finally {
        if (btnAddSec.isConnected) btnAddSec.disabled = false;
      }
    });

    container.querySelectorAll('[data-del-secret]').forEach(b => {
      b.addEventListener('click', async () => {
        if (b.disabled) return;
        b.disabled = true;
        try {
          const res = await api('/api/hold/admin-config', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, action: 'delete_secret_code', code: b.dataset.delSecret })
          });
          if (res.ok && res.user) {
            mergeUserState(res.user);
            renderAll();
            renderAdminSheet();
          } else {
            showToast(res.error || 'Xato');
          }
        } finally {
          if (b.isConnected) b.disabled = false;
        }
      });
    });
    return;
  }

  if (STATE.adminTab === 'tasks') {
    container.innerHTML = `
      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">📋 Yangi Vazifa (Task) Qoʻshish</strong>
        <input type="text" id="admTaskTitle" placeholder="Vazifa nomi (masalan: Join @kanal)" class="apple-search-input" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <select id="admTaskCat" class="apple-search-input">
            <option value="specials">Specials</option>
            <option value="onboarding">Onboarding</option>
            <option value="web3">Web3 world</option>
          </select>
          <input type="text" id="admTaskIcon" value="📢" placeholder="Icon (📢, ⭐, 🏆)" class="apple-search-input" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <input type="number" id="admTaskReward" value="15000" placeholder="Mukofot (HOLD)" class="apple-search-input" />
          <select id="admTaskMinLeague" class="apple-search-input">
            <option value="">Liga cheklovi yoʻq</option>
            <option value="silver">Silver ligadan boshlab</option>
            <option value="gold">Gold ligadan boshlab</option>
            <option value="platinum">Platinum ligadan boshlab</option>
            <option value="diamond">Diamond ligadan boshlab</option>
          </select>
        </div>
        <input type="text" id="admTaskLink" placeholder="@kanal_username (bot obunani 100% tekshiradi)" class="apple-search-input" />
        <button type="button" class="btn-sapphire-primary" id="btnAdmAddTask">Vazifani Qoʻshish</button>
      </div>

      <div class="dark-group-box" style="padding:8px;">
        ${quests.map(q => `
          <div class="not-row-item" style="padding:8px;">
            <div class="nri-center">
              <div class="nri-title">${esc(q.icon || '⭐')} ${esc(q.title)}</div>
              <div class="nri-sub">${esc(q.cat)} · +${fmtInt(q.reward)} HOLD ${q.minLeague ? `· 🔒 ${esc(q.minLeague)}` : ''} ${q.link ? `· ${esc(q.link)}` : ''}</div>
            </div>
            <button type="button" class="skin-pill-btn danger" data-del-task="${esc(q.id)}">✕</button>
          </div>
        `).join('')}
      </div>
    `;

    const btnAddTask = container.querySelector('#btnAdmAddTask');
    btnAddTask?.addEventListener('click', async () => {
      if (btnAddTask.disabled) return;
      const title = container.querySelector('#admTaskTitle')?.value.trim();
      const cat = container.querySelector('#admTaskCat')?.value;
      const icon = container.querySelector('#admTaskIcon')?.value.trim();
      const reward = parseInt(container.querySelector('#admTaskReward')?.value, 10) || 15000;
      const minLeague = container.querySelector('#admTaskMinLeague')?.value || null;
      const link = container.querySelector('#admTaskLink')?.value.trim();
      btnAddTask.disabled = true;
      try {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'add_quest', title, cat, icon, reward, link, minLeague })
        });
        if (res.ok && res.user) {
          mergeUserState(res.user);
          renderAll();
          renderAdminSheet();
          showToast(res.message);
        } else {
          showToast(res.error || 'Xato');
        }
      } finally {
        if (btnAddTask.isConnected) btnAddTask.disabled = false;
      }
    });

    container.querySelectorAll('[data-del-task]').forEach(b => {
      b.addEventListener('click', async () => {
        if (b.disabled) return;
        b.disabled = true;
        try {
          const res = await api('/api/hold/admin-config', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, action: 'delete_quest', questId: b.dataset.delTask })
          });
          if (res.ok && res.user) {
            mergeUserState(res.user);
            renderAll();
            renderAdminSheet();
          } else {
            showToast(res.error || 'Xato');
          }
        } finally {
          if (b.isConnected) b.disabled = false;
        }
      });
    });
    return;
  }

  if (STATE.adminTab === 'squads') {
    container.innerHTML = `
      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">🏛 Rasmiy PaxtaGram Kanal Squad Qoʻshish</strong>
        <input type="text" id="admSquadHandle" placeholder="@kanal_username" class="apple-search-input" />
        <input type="text" id="admSquadName" placeholder="Kanal nomi (boʻsh qolsa avtomatik oladi)" class="apple-search-input" />
        <button type="button" class="btn-sapphire-primary" id="btnAdmAddSquad">Tekshirish va Qoʻshish</button>
      </div>

      <div class="dark-group-box" style="padding:8px;">
        ${squads.map(s => `
          <div class="not-row-item" style="padding:8px;">
            <div class="nri-center">
              <div class="nri-title">${esc(s.name)} ${s.verified ? '✓' : ''}</div>
              <div class="nri-sub">@${esc(s.handle || s.id)} · ${fmtInt(s.members || 0)} a'zo · ${fmtInt(s.totalHold)} HOLD</div>
            </div>
            <button type="button" class="skin-pill-btn danger" data-del-squad="${esc(s.id)}">✕</button>
          </div>
        `).join('')}
      </div>
    `;

    const btnAddSquad = container.querySelector('#btnAdmAddSquad');
    btnAddSquad?.addEventListener('click', async () => {
      if (btnAddSquad.disabled) return;
      const handle = container.querySelector('#admSquadHandle')?.value.trim();
      const name = container.querySelector('#admSquadName')?.value.trim();
      btnAddSquad.disabled = true;
      try {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'add_squad', handle, name })
        });
        if (res.ok && res.user) {
          mergeUserState(res.user);
          STATE.lastVaultFetchedAt = 0;
          renderAll();
          renderAdminSheet();
          showToast(res.message);
        } else {
          showToast(res.error || 'Kanal topilmadi');
        }
      } finally {
        if (btnAddSquad.isConnected) btnAddSquad.disabled = false;
      }
    });

    container.querySelectorAll('[data-del-squad]').forEach(b => {
      b.addEventListener('click', async () => {
        if (b.disabled) return;
        b.disabled = true;
        try {
          const res = await api('/api/hold/admin-config', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, action: 'delete_squad', squadId: b.dataset.delSquad })
          });
          if (res.ok && res.user) {
            mergeUserState(res.user);
            STATE.lastVaultFetchedAt = 0;
            renderAll();
            renderAdminSheet();
          } else {
            showToast(res.error || 'Xato');
          }
        } finally {
          if (b.isConnected) b.disabled = false;
        }
      });
    });
  }
}

// ============================================================================
// DOMCONTENTLOADED WIRING
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  try {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
  } catch {}
  notifyPaxtaMiniApp('web_app_ready');
  notifyPaxtaMiniApp('web_app_expand');

  // Official PaxtaGram Login Overlay Wiring
  document.getElementById('btnPaxtaLoginSubmit')?.addEventListener('click', handlePaxtaLoginSubmit);
  document.getElementById('inpPaxtaLoginUsername')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePaxtaLoginSubmit();
  });

  // Onboarding Continue Button
  document.getElementById('btnOsContinue')?.addEventListener('click', advanceOnboardingStory);
  document.getElementById('btnReplayOnboarding')?.addEventListener('click', () => {
    closeAllSheets();
    openOnboardingStory(0);
  });

  // PAWS Footprint Bar & Farm Triggers
  document.getElementById('btnOpenFootprint')?.addEventListener('click', (e) => {
    e.preventDefault();
    haptic('light');
    openFootprintStoryModal();
  });
  document.getElementById('btnDockFarm')?.addEventListener('click', (e) => {
    e.preventDefault();
    openSheet('farm');
  });
  document.getElementById('btnArenaFarmChip')?.addEventListener('click', () => openSheet('farm'));
  document.getElementById('btnOpenTokenomics')?.addEventListener('click', openTokenomicsModal);
  document.getElementById('btnOpenWarsCard')?.addEventListener('click', () => openSheet('wars'));
  document.getElementById('btnWarsInvite')?.addEventListener('click', () => openSheet('frens'));
  document.getElementById('btnClaimFarm')?.addEventListener('click', claimFarmYield);
  document.getElementById('btnClaimFarmRef')?.addEventListener('click', claimFarmRefYield);
  document.getElementById('btnCloseFootprintStory')?.addEventListener('click', () => {
    const m = document.getElementById('footprintStoryModal');
    if (m) m.hidden = true;
  });
  document.getElementById('fsmBackdrop')?.addEventListener('click', () => {
    const m = document.getElementById('footprintStoryModal');
    if (m) m.hidden = true;
  });

  // Bottom Dock Sheet Triggers
  document.querySelectorAll('[data-open-sheet]').forEach(btn => {
    btn.addEventListener('click', () => openSheet(btn.dataset.openSheet));
  });
  document.querySelectorAll('[data-close-sheet]').forEach(btn => {
    btn.addEventListener('click', closeAllSheets);
  });

  // Top Pill, Arena Streak Pill, League & Admin Sheet Triggers
  document.getElementById('btnSquadPill')?.addEventListener('click', () => openSheet(STATE.user?.squadId ? 'wars' : 'frens'));
  document.getElementById('btnOpenLeagues')?.addEventListener('click', () => openSheet('leagues'));
  document.getElementById('btnArenaStreakPill')?.addEventListener('click', () => {
    if (STATE.user?.streak?.canClaimToday) {
      claimDailyStreakBonus();
    } else {
      openSheet('earn');
    }
  });
  document.getElementById('btnOpenStarsTopup')?.addEventListener('click', () => openTopUpStarsModal(250));
  document.getElementById('btnOpenAdminModal')?.addEventListener('click', () => openSheet('admin'));
  document.getElementById('btnEarnInviteCard')?.addEventListener('click', () => openSheet('frens'));
  document.getElementById('btnSearchSquads')?.addEventListener('click', openSearchSquadsModal);
  document.getElementById('btnAddCustomSquad')?.addEventListener('click', openAddPaxtaChannelSquadModal);

  // Admin Full-Screen Sheet Tab Switcher
  document.querySelectorAll('#adminMainTabs .nseg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#adminMainTabs .nseg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.adminTab = btn.dataset.atab || 'overview';
      renderAdminSheet();
    });
  });

  // Switch to Top-10 NFT tab when clicking Stats pill in Leagues
  document.getElementById('btnSwitchTop10Tab')?.addEventListener('click', () => {
    document.querySelectorAll('#leagueMainTabs .nseg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.ltab === 'prizes');
    });
    STATE.leagueMainTab = 'prizes';
    renderLeaguesSheet();
  });

  // How Boost Works & Earn Guide Modals
  document.getElementById('btnHowBoostWorks')?.addEventListener('click', () => {
    openModal('How boost works', `
      <div style="display:flex;flex-direction:column;gap:10px;font-size:13.5px;color:var(--text-2);line-height:1.5;">
        <p><b style="color:#fff;">🚀 3 x Turbo:</b> 10 soniya davomida har bir bosishni 7 barobar koʻpaytiradi va energiya sarflamaydi.</p>
        <p><b style="color:#fff;">⚡ Full energy:</b> Energiya zaxirasini bir zumda 100% ga toʻldiradi.</p>
        <p><b style="color:#fff;">☝️ Multitap & 🔋 Energy Limit:</b> Har bir bosish kuchini va maksimal energiyani doimiy oshiradi.</p>
        <p><b style="color:#fff;">🎨 Buy Skins:</b> Markazdagi tanga koʻrinishi va butun ilova ranglar palitrasini oʻzgartiradi.</p>
      </div>
    `);
  });

  document.getElementById('btnOpenEarnGuide')?.addEventListener('click', () => {
    openModal('Full guide', `
      <div class="guide-list">
        <div class="guide-item"><span>🪙</span><div><b>Tap & Farm</b><p>Tangani bosing va ferma yigʻimini oling — har siklda HOLD balansga qoʻshiladi.</p></div></div>
        <div class="guide-item"><span>🔐</span><div><b>Bugungi Vault kodi</b><p>@HOLDbot ichida /vault yoki /start orqali koʻring va tanga chetlarini shu tartibda bosing (+30K HOLD + 1 🎟️).</p></div></div>
        <div class="guide-item"><span>🎟️</span><div><b>Weekly Lucky Draw</b><p>Vault, Morze va 7-kunlik Streak chipta beradi. Har dushanba NFT + 100K HOLD oʻynaladi.</p></div></div>
        <div class="guide-item"><span>🔥</span><div><b>Daily reward</b><p>Har kuni kiring. 7 kun ketma-ket — +50K HOLD, Cookie skin va +1 Lucky Ticket.</p></div></div>
        <div class="guide-item"><span>⚡</span><div><b>Happy Hour</b><p>Har kuni 20:00–21:00 da har bosish 2 barobar.</p></div></div>
        <div class="guide-item"><span>🏆</span><div><b>Top-10 & Ligalar</b><p>All-Time Top-10 mutlaq liderlar + 5 ta Liga fondidan NFT mukofotlari ajratiladi.</p></div></div>
      </div>
    `);
  });

  // Leagues Carousel Arrows & Tabs
  document.getElementById('btnPrevLeague')?.addEventListener('click', () => {
    if (STATE.viewedLeagueIdx > 0) {
      STATE.viewedLeagueIdx--;
      haptic('light');
      renderLeaguesSheet();
    }
  });
  document.getElementById('btnNextLeague')?.addEventListener('click', () => {
    const maxIdx = (STATE.user?.allLeagues?.length || 1) - 1;
    if (STATE.viewedLeagueIdx < maxIdx) {
      STATE.viewedLeagueIdx++;
      haptic('light');
      renderLeaguesSheet();
    }
  });

  document.querySelectorAll('#leagueMainTabs .nseg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#leagueMainTabs .nseg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.leagueMainTab = btn.dataset.ltab || 'miners';
      renderLeaguesSheet();
    });
  });

  document.querySelectorAll('#leagueTimeTabs .dsub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#leagueTimeTabs .dsub-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.leagueTimePeriod = btn.dataset.tperiod || 'day';
      renderLeaguesSheet();
    });
  });

  // Boosts Free Daily Triggers
  document.getElementById('btnBoostFullTank')?.addEventListener('click', () => triggerBoost('full_tank'));
  document.getElementById('btnBoostTurbo')?.addEventListener('click', () => triggerBoost('rocket'));

  // Main 3D Coin Pointer Events (Multi-touch Tap + Hold Dash Morse + Rim Eclipse + Compass!)
  const coinBtn = document.getElementById('holdCoinBtn');
  if (coinBtn) {
    coinBtn.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); return false; }, { capture: true });
    coinBtn.addEventListener('dragstart', (e) => { e.preventDefault(); return false; });
    coinBtn.addEventListener('selectstart', (e) => { e.preventDefault(); return false; });

    const activePointers = new Map();
    const circleTrace = {
      active: false,
      pointerId: null,
      lastAngle: null,
      accumulatedAngle: 0,
      lastHalfStep: 0,
      resetTimer: null
    };

    coinBtn.addEventListener('pointerdown', (e) => {
      if (e.cancelable) e.preventDefault();
      try {
        coinBtn.setPointerCapture(e.pointerId);
      } catch {}

      const rect = coinBtn.getBoundingClientRect();
      const ptrInfo = {
        downAt: Date.now(),
        rect,
        dashTimer: null,
        vaultSolved: false
      };
      activePointers.set(e.pointerId, ptrInfo);
      haptic('light');

      const dx = (e.clientX - (rect.left + rect.width / 2)) / Math.max(1, rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / Math.max(1, rect.height / 2);

      // Initialize Rim Circle Tracing only for single-finger touch
      if (activePointers.size === 1) {
        circleTrace.active = true;
        circleTrace.pointerId = e.pointerId;
        circleTrace.lastAngle = Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2));
      } else {
        circleTrace.active = false;
        circleTrace.pointerId = null;
        circleTrace.lastAngle = null;
      }

      coinBtn.style.transform = `rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg) scale(0.955)`;

      // Secret Compass Direction Detection (only if not yet solved today)
      if (!STATE.user?.vault?.solvedToday && Math.hypot(dx, dy) >= 0.35) {
        const dir = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'up' : 'down') : (dx > 0 ? 'right' : 'left');
        if (!STATE.compassSequence) STATE.compassSequence = [];
        clearTimeout(STATE.compassTimer);
        STATE.compassSequence.push(dir);
        STATE.compassTimer = setTimeout(() => { STATE.compassSequence = []; }, 2800);

        const expectedCompass = (Array.isArray(STATE.user?.vault?.sequence) && STATE.user.vault.sequence.length === 5)
          ? STATE.user.vault.sequence
          : ['up', 'right', 'down', 'left', 'up'];
        if (STATE.compassSequence.length > expectedCompass.length) {
          STATE.compassSequence = STATE.compassSequence.slice(-expectedCompass.length);
        }

        if (
          STATE.compassSequence.length === expectedCompass.length &&
          STATE.compassSequence.every((v, i) => v === expectedCompass[i])
        ) {
          STATE.compassSequence = [];
          clearTimeout(STATE.compassTimer);
          ptrInfo.vaultSolved = true;
          clearMidAirMorse();
          (async () => {
            haptic('heavy');
            const airEl = document.getElementById('floatingMidAirMorse');
            if (airEl) {
              airEl.classList.add('solved');
              airEl.innerHTML = `<span class="midair-letter" style="font-size:22px;letter-spacing:1px;">🧭 VAULT UNLOCKED</span>`;
              clearTimeout(STATE.morseClearAirTimer);
              STATE.morseClearAirTimer = setTimeout(() => { airEl.innerHTML = ''; airEl.classList.remove('solved'); }, 2200);
            }
            const res = await api('/api/hold/solve-compass', {
              method: 'POST',
              body: JSON.stringify({ username: STATE.username, sequence: expectedCompass })
            });
            if (res.ok && res.user) {
              mergeUserState(res.user);
              renderAll();
              showToast(res.message);
            } else if (res.error) {
              showToast(res.error);
            }
          })();
        }
      }

      ptrInfo.dashTimer = setTimeout(() => {
        if (activePointers.has(e.pointerId)) {
          haptic('medium');
          coinBtn.style.transform = `rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg) scale(0.91)`;
        }
      }, 195);
    });

    coinBtn.addEventListener('pointermove', (e) => {
      if (!circleTrace.active || circleTrace.pointerId !== e.pointerId || activePointers.size !== 1) return;
      const ptrInfo = activePointers.get(e.pointerId);
      const rect = ptrInfo?.rect || coinBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const px = e.clientX - cx;
      const py = e.clientY - cy;
      const dist = Math.hypot(px, py) / Math.max(1, rect.width / 2);

      // Check rim distance: outer rim area (dist >= 0.25)
      if (dist >= 0.25 && dist <= 2.2) {
        const curAngle = Math.atan2(py, px);
        if (circleTrace.lastAngle !== null) {
          let delta = curAngle - circleTrace.lastAngle;
          if (delta > Math.PI) delta -= 2 * Math.PI;
          if (delta < -Math.PI) delta += 2 * Math.PI;

          circleTrace.accumulatedAngle += delta;
          const turns = Math.abs(circleTrace.accumulatedAngle) / (2 * Math.PI);

          // Subtle dynamic 3D tilt tracking finger around rim
          coinBtn.style.transform = `rotateX(${(-py / Math.max(1, rect.height / 2)) * 14}deg) rotateY(${(px / Math.max(1, rect.width / 2)) * 14}deg) scale(0.96)`;

          // Haptic tick every half circle (180 deg)
          const currentHalf = Math.floor(turns * 2);
          if (currentHalf > circleTrace.lastHalfStep) {
            circleTrace.lastHalfStep = currentHalf;
            haptic('light');
          }

          // Trigger Solar Eclipse Easter Egg on 3 full circles! (turns >= 2.85)
          if (turns >= 2.85) {
            circleTrace.active = false;
            circleTrace.pointerId = null;
            circleTrace.accumulatedAngle = 0;
            circleTrace.lastHalfStep = 0;
            circleTrace.lastAngle = null;
            if (ptrInfo?.dashTimer) clearTimeout(ptrInfo.dashTimer);
            activePointers.delete(e.pointerId);
            coinBtn.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
            triggerSolarEclipseEasterEgg();
            return;
          }
        }
        circleTrace.lastAngle = curAngle;
      }
    });

    const finishCoinPress = (e) => {
      const ptrInfo = activePointers.get(e.pointerId);
      activePointers.delete(e.pointerId);
      if (ptrInfo?.dashTimer) clearTimeout(ptrInfo.dashTimer);

      if (circleTrace.pointerId === e.pointerId) {
        circleTrace.active = false;
        circleTrace.pointerId = null;
        circleTrace.lastAngle = null;
      }

      // Keep accumulatedAngle alive for 2.2s so multi-swipe circular tracing also works
      clearTimeout(circleTrace.resetTimer);
      circleTrace.resetTimer = setTimeout(() => {
        circleTrace.accumulatedAngle = 0;
        circleTrace.lastHalfStep = 0;
      }, 2200);

      if (activePointers.size === 0) {
        coinBtn.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      }

      if (!ptrInfo) return;
      const heldMs = Date.now() - ptrInfo.downAt;
      const isLargeTrace = Math.abs(circleTrace.accumulatedAngle) >= Math.PI;

      // If user was deliberately tracing circles or solved vault or cancelled, don't trigger regular tap
      if (!ptrInfo.vaultSolved && !isLargeTrace && e.type !== 'pointercancel') {
        handleCoinTap(e.clientX, e.clientY);
        recordCoinMorseSignal(heldMs >= 195 ? '-' : '.');
      }
    };

    coinBtn.addEventListener('pointerup', finishCoinPress);
    coinBtn.addEventListener('pointercancel', finishCoinPress);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushPendingTaps({ keepalive: true });
  });
  window.addEventListener('pagehide', () => {
    flushPendingTaps({ keepalive: true });
  });

  // Copy Referral Link / Username In-App (Never opens an external browser tab!)
  document.getElementById('btnCopyRefLink')?.addEventListener('click', async () => {
    const refCode = STATE.user?.paxtaId || STATE.username;
    const shareText = `🪙 $HOLD ga qoʻshiling!\n\n👉 Bot: https://paxta.online/u/HOLDbot\n💬 Botga kirib shu buyruqni yuboring: /start ${refCode}\n\nHar ikkalamizga bepul $HOLD beriladi! 🚀`;
    try {
      await navigator.clipboard.writeText(shareText);
      showToast(`Taklif xabari nusxalandi! @HOLDbot orqali ulashing`);
    } catch {
      showToast(`/start ${refCode}`);
    }
  });

  // Close Modal
  document.getElementById('btnCloseHoldModal')?.addEventListener('click', closeModal);
  document.getElementById('holdModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'holdModalBackdrop') closeModal();
  });

  await Promise.all([syncHoldUser(), loadLeaderboardData()]);

  // Energy regen ticker (matches server regenRate = 3 + floor(energyLevel / 2) + (rechargingSpeedLevel - 1) * 2 per sec)
  let lastEnergyTickAt = Date.now();
  setInterval(() => {
    const now = Date.now();
    const elapsedSec = Math.max(1, Math.floor((now - lastEnergyTickAt) / 1000));
    lastEnergyTickAt = now;
    const u = STATE.user;
    if (!u || u.energy >= u.maxEnergy) return;

    const ratePerSec = 3 + Math.floor((u.energyLevel || 1) / 2) + ((u.rechargingSpeedLevel || 1) - 1) * 2;
    const prevEnergy = u.energy;
    const nextEnergy = Math.min(u.maxEnergy, u.energy + ratePerSec * elapsedSec);
    if (nextEnergy === prevEnergy) return;
    u.energy = nextEnergy;

    if (!STATE.activeSheet) {
      const eNow = document.getElementById('uiEnergyNow');
      const eFill = document.getElementById('uiEnergyBarFill');
      if (eNow) eNow.textContent = fmtInt(nextEnergy);
      if (eFill) eFill.style.width = `${Math.min(100, Math.round((nextEnergy / Math.max(1, u.maxEnergy)) * 100))}%`;
    }
  }, 1000);
});

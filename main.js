// ─── COUNTDOWN handled by inline cfasync=false script in index.html ───

// ─── CAROUSEL ───
(function() {
  var current = 0;
  var total = 4;
  var track = null;
  var autoTimer = null;
  var isAnimating = false;
  var AUTO_DELAY = 6000;

  function init() {
    track = document.getElementById('carouselTrack');
    if (!track) return;

    // Build dot indicators
    var dotsContainer = document.getElementById('carouselDots');
    if (dotsContainer && dotsContainer.children.length === 0) {
      for (var i = 0; i < total; i++) {
        (function(idx) {
          var dot = document.createElement('div');
          dot.className = 'dot' + (idx === 0 ? ' active' : '');
          dot.onclick = function() { goTo(idx); startAuto(); };
          dotsContainer.appendChild(dot);
        })(i);
      }
    }

    // Mouse drag support
    var startX = 0;
    var isDragging = false;
    track.addEventListener('mousedown', function(e) {
      startX = e.clientX;
      isDragging = true;
      track.style.cursor = 'grabbing';
      stopAuto();
    });
    window.addEventListener('mouseup', function(e) {
      if (!isDragging) return;
      isDragging = false;
      track.style.cursor = '';
      var diff = startX - e.clientX;
      if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
      startAuto();
    });
    window.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      e.preventDefault();
    });

    // Touch swipe support
    var touchStartX = 0;
    track.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].clientX;
      stopAuto();
    }, { passive: true });
    track.addEventListener('touchend', function(e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
      startAuto();
    }, { passive: true });

    startAuto();
  }

  function goTo(n) {
    if (isAnimating) return;
    if (!track) track = document.getElementById('carouselTrack');
    if (!track) return;
    isAnimating = true;
    current = ((n % total) + total) % total;
    track.style.transition = 'transform 0.5s ease';
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    document.querySelectorAll('.dot').forEach(function(d, i) {
      d.classList.toggle('active', i === current);
    });
    setTimeout(function() { isAnimating = false; }, 520);
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(function() { goTo(current + 1); }, AUTO_DELAY);
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  // Keep these for any remaining references
  window.nextSlide = function() { goTo(current + 1); startAuto(); };
  window.prevSlide = function() { goTo(current - 1); startAuto(); };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ─── SOCIAL SHARE ───
window.shareTo = function(platform) {
  const url  = encodeURIComponent('https://sarvamsai.in');
  const text = encodeURIComponent(`🙏 Sarvam Sai — A Centenary Offering honouring Bhagawan Sri Sathya Sai Baba's 100th birth anniversary. 100 blessed figurines released daily for 100 days. A devotional offering in His centenary year.`);
  const urls = {
    whatsapp:  `https://wa.me/?text=${text}%20${url}`,
    twitter:   `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    facebook:  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    instagram: `https://www.instagram.com/`,
    linkedin:  `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    telegram:  `https://t.me/share/url?url=${url}&text=${text}`,
  };
  if (platform === 'instagram') {
    navigator.clipboard.writeText('https://sarvamsai.in').then(() => {
      alert('Link copied! You can now paste it on Instagram.');
    });
    return;
  }
  window.open(urls[platform], '_blank', 'noopener');
  return false;
}

// ─── HAMBURGER MENU ───
window.toggleMenu = function() {
  document.getElementById('nav-links').classList.toggle('open');
  document.getElementById('nav-hamburger').classList.toggle('open');
}
window.closeMenu = function() {
  document.getElementById('nav-links').classList.remove('open');
  document.getElementById('nav-hamburger').classList.remove('open');
}

// ─── CONFIG ───
const API      = 'https://script.google.com/macros/s/AKfycbydYU5rFJyss7YfcRqg2gC5JU5VcktvKlgrCkvAz_a-1mxJJvcqrV_G8AQr_W6SjtjaLg/exec';
const SITE_URL = 'https://sarvamsai.in';
// Email confirmation sent automatically by Apps Script

// ─── REFERRAL: read ?ref= from URL ───
const urlParams = new URLSearchParams(window.location.search);
const refCode   = urlParams.get('ref') || '';

// ─── SESSION ───
let currentUser = null;
const savedEmail = localStorage.getItem('ss_email');
if (savedEmail) loadUser(savedEmail);

async function apiCall(params) {
  const qs  = new URLSearchParams(params).toString();
  const res = await fetch(API + '?' + qs);
  return res.json();
}

// ─── REGISTER FORM ───
window.showRegisterForm = function() {
  document.getElementById('register-form-wrap').style.display = 'block';
  document.getElementById('cta-register-btns').style.display  = 'none';
  document.getElementById('reg-name').focus();
}

window.hideRegisterForm = function() {
  document.getElementById('register-form-wrap').style.display = 'none';
  document.getElementById('cta-register-btns').style.display  = 'flex';
}

window.submitRegistration = async function() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const btn   = document.getElementById('reg-submit-btn');

  document.getElementById('reg-error').style.display = 'none';

  if (!name)  { showRegError('Please enter your name'); return; }
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) { showRegError('Please enter a valid email address'); return; }

  btn.textContent = 'Joining...';
  btn.style.opacity = '0.7';
  btn.disabled = true;

  try {
    const data = await apiCall({ action:'register', name, email, referred_by:refCode });

    if (data.success || data.error === 'already_registered') {
      localStorage.setItem('ss_email', email);
      currentUser = data.user;
      showRegisteredState(data.user);
    } else {
      showRegError('Something went wrong. Please try again.');
      btn.textContent = 'Join the Queue';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  } catch(e) {
    showRegError('Network error. Please try again.');
    btn.textContent = 'Join the Queue';
    btn.style.opacity = '1';
    btn.disabled = false;
  }
};

function showRegError(msg) {
  const el = document.getElementById('reg-error');
  el.textContent = msg;
  el.style.display = 'block';
}

async function loadUser(email) {
  try {
    const data = await apiCall({ action:'getUser', email:email });
    if (data.success) { currentUser = data.user; showRegisteredState(data.user); }
  } catch(e) {}
}

window.showRegisteredState = function(user) {
  const prevRank = currentUser ? currentUser.rank : null;
  currentUser = user;
  document.getElementById('cta-register-btns').style.display  = 'none';
  document.getElementById('register-form-wrap').style.display  = 'none';
  document.getElementById('cta-registered').style.display      = 'block';
  document.getElementById('user-rank').textContent    = '#' + (user.rank || '—');
  var invCount = user.invite_count || 0;
  var invEl = document.getElementById('user-invites');
  var invSubEl = document.getElementById('invite-count-sub');
  if (invEl) invEl.textContent = invCount > 0 ? invCount : '';
  if (invSubEl) invSubEl.textContent = invCount > 0 ? (invCount === 1 ? 'devotee invited' : 'devotees invited') : 'Be the first to invite';
  document.getElementById('user-invite-link').textContent = `${SITE_URL}/?ref=${encodeURIComponent(user.email)}`;
  const movEl = document.getElementById('rank-movement');
  if (movEl) {
    if (prevRank && user.rank < prevRank) {
      const d = prevRank - user.rank;
      movEl.innerHTML = `<span class="dash-rank-movement-up">▲ up ${d} place${d>1?'s':''}</span>`;
    } else {
      movEl.textContent = 'in the queue';
    }
  }
  loadLeaderboard();
}

async function loadLeaderboard() {
  try {
    const data = await apiCall({ action:'leaderboard' });
    const el   = document.getElementById('leaderboard-list');
    if (!data.success || !data.leaderboard.length) {
      el.innerHTML = '<div style="padding:1rem 2rem;font-family:\'Cormorant Garamond\',serif;font-style:italic;color:var(--muted);font-size:0.95rem;">Be the first to invite friends!</div>';
      return;
    }
    const medals = ['🥇','🥈','🥉'];
    el.innerHTML = data.leaderboard.map((u, i) => `
      <div style="display:flex;align-items:center;padding:0.85rem 1.5rem;border-bottom:1px solid var(--border);gap:1rem;">
        <span style="font-size:1.1rem;flex-shrink:0;width:28px;">${medals[i] || '<span style=\'font-family:Cinzel,serif;font-size:0.65rem;color:var(--muted)\'>' + (i+1) + '</span>'}</span>
        <span style="font-family:'Cinzel',serif;font-size:0.68rem;letter-spacing:0.08em;text-transform:uppercase;flex:1;color:var(--ink)">${u.name || 'Devotee'}</span>
        <span style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.78rem;color:var(--muted);">${u.email}</span>
      </div>`).join('');
  } catch(e) {}
}

window.openInviteShare = function() {
  if (currentUser) {
    if (!currentUser.samithi_id) openSamithiModal();
    else shareInvite('whatsapp');
  } else showRegisterForm();
}

window.shareOnWhatsApp = function() {
  const emailRef = currentUser ? currentUser.email : (savedEmail || '');
  const link  = currentUser ? `${SITE_URL}/?ref=${encodeURIComponent(currentUser.email)}` : SITE_URL;
  const msg   = encodeURIComponent(`🙏 *Sarvam Sai — A Centenary Offering*\n\nA centenary offering to Bhagawan Sri Sathya Sai Baba. 100 Discovery Boxes each day for 100 days. Help a devotee receive this blessing.\n\nJoin here: ${link}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}


window.shareInvite = function(platform) {
  const emailRef = currentUser ? currentUser.email : (savedEmail || '');
  const link = `${SITE_URL}/?ref=${encodeURIComponent(emailRef)}`;
  const text = encodeURIComponent(`🙏 I'm sharing this with you — a devotional offering to Bhagawan Sri Sathya Sai Baba in His centenary year. Receive your Discovery Box: ${link}`);
  const urls = {
    whatsapp: `https://wa.me/?text=${text}`,
    twitter:  `https://twitter.com/intent/tweet?text=${text}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('🙏 Join the SarvamSai offering — a collectible Discovery Box honouring Bhagawan Sri Sathya Sai Baba\'s centenary.')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
  };
  if (urls[platform]) window.open(urls[platform], '_blank', 'noopener');
};

window.copyInviteLink = function() {
  const link = document.getElementById('user-invite-link').textContent;
  navigator.clipboard.writeText(link).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  });
}

// ─── SCROLL REVEAL ───
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.step, .stat-card, .section-title, .process-header, .carousel-wrap').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.9s ease, transform 0.9s ease';
  observer.observe(el);
});

// ─── BUTTON WIRING (fallback for onclick) ───
document.querySelectorAll('[onclick]').forEach(el => {
  const fn = el.getAttribute('onclick').replace(/[()';]/g, '').trim().split('(')[0];
  if (window[fn]) {
    el.addEventListener('click', function(e) {
      const match = el.getAttribute('onclick').match(/^(\w+)\(([^)]*)\)/);
      if (match) {
        const args = match[2] ? [match[2].replace(/['"]/g, '')] : [];
        window[match[1]](...args);
      }
    });
  }
});

// ─── FLOATING CTA ───
(function() {
  function initFloatingCTA() {
    var bar = document.getElementById('floating-cta');
    if (!bar) return;

    var lastScrollY = 0;
    var ticking = false;

    function update() {
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      lastScrollY = scrollY;
      ticking = false;

      // Don't show until scrolled 500px
      if (scrollY < 500) {
        bar.classList.remove('visible');
        return;
      }

      // Hide if CTA section is visible
      var ctaSec = document.getElementById('cta');
      if (ctaSec) {
        var rect = ctaSec.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          bar.classList.remove('visible');
          return;
        }
      }

      // Hide if footer is visible
      var footer = document.getElementById('footer');
      if (footer) {
        var rect = footer.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          bar.classList.remove('visible');
          return;
        }
      }

      bar.classList.add('visible');
    }

    window.addEventListener('scroll', function() {
      lastScrollY = window.pageYOffset;
      if (!ticking) {
        window.requestAnimationFrame(function() { update(); });
        ticking = true;
      }
    }, { passive: true });

    // Initial check after page settles
    setTimeout(update, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingCTA);
  } else {
    initFloatingCTA();
  }
})();

// ─── SAMITHI ───
let samithiList = [];
let selectedSamithi = null;

window.openSamithiModal = function() {
  const modal = document.getElementById('samithi-modal');
  if (modal) {
    modal.style.display = 'flex';
    loadSamithis();
    setTimeout(() => document.getElementById('samithi-search')?.focus(), 300);
  }
};

window.closeSamithiModal = function() {
  const modal = document.getElementById('samithi-modal');
  if (modal) modal.style.display = 'none';
};

window.showAddSamithi = function() {
  document.getElementById('samithi-step-search').style.display = 'none';
  document.getElementById('samithi-step-add').style.display    = 'block';
};

window.showSearchSamithi = function() {
  document.getElementById('samithi-step-add').style.display    = 'none';
  document.getElementById('samithi-step-search').style.display = 'block';
};

async function loadSamithis() {
  try {
    const data = await apiCall({ action: 'getSamithis' });
    if (data.success) samithiList = data.samithis || [];
  } catch(e) {}
}

window.searchSamithi = function(query) {
  const results = document.getElementById('samithi-results');
  if (!query || query.length < 2) { results.style.display = 'none'; return; }
  const filtered = samithiList.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.city.toLowerCase().includes(query.toLowerCase())
  );
  if (!filtered.length) { results.style.display = 'none'; return; }
  results.style.display = 'block';
  results.innerHTML = filtered.map(s => `
    <div class="samithi-result-item" onclick="selectSamithi('${s.id}','${s.name.replace(/'/g,"\\'")}','${s.city.replace(/'/g,"\\'")}')">
      ${s.name}
      <span>${s.city} · ${s.member_count || 0} member${s.member_count !== 1 ? 's' : ''}</span>
    </div>
  `).join('');
};

window.selectSamithi = async function(id, name, city) {
  try {
    const email = currentUser ? currentUser.email : (savedEmail || '');
    const data = await apiCall({ action: 'joinSamithi', samithi_id: id, email });
    if (data.success) {
      showSamithiSuccess(name);
      updateSamithiLabel(name, city);
      loadSamithiLeaderboard();
    }
  } catch(e) {}
};

window.submitNewSamithi = async function() {
  const name  = document.getElementById('new-samithi-name').value.trim();
  const city  = document.getElementById('new-samithi-city').value.trim();
  const phone = document.getElementById('new-samithi-phone').value.trim();
  const errEl = document.getElementById('samithi-error');
  if (!name || !city) { errEl.textContent = 'Please enter the Samithi name and city.'; errEl.style.display = 'block'; return; }
  errEl.style.display = 'none';
  try {
    const email = currentUser ? currentUser.email : (savedEmail || '');
    const data = await apiCall({ action: 'addSamithi', name, city, phone, email });
    if (data.success) {
      showSamithiSuccess(name);
      updateSamithiLabel(name, city);
      loadSamithiLeaderboard();
    } else {
      errEl.textContent = data.error || 'Something went wrong.';
      errEl.style.display = 'block';
    }
  } catch(e) {
    errEl.textContent = 'Connection error. Please try again.';
    errEl.style.display = 'block';
  }
};

function showSamithiSuccess(name) {
  document.getElementById('samithi-step-search').style.display  = 'none';
  document.getElementById('samithi-step-add').style.display     = 'none';
  document.getElementById('samithi-step-success').style.display = 'block';
  document.getElementById('samithi-success-name').textContent   = name;
}

function updateSamithiLabel(name, city) {
  const el = document.getElementById('samithi-my-name');
  if (el) { el.textContent = name + ' · ' + city; el.style.cursor = 'default'; el.onclick = null; }
}

async function loadSamithiLeaderboard() {
  const el = document.getElementById('samithi-leaderboard-list');
  if (!el) return;
  try {
    const data = await apiCall({ action: 'samithiLeaderboard' });
    if (!data.success || !data.samithis || !data.samithis.length) {
      el.innerHTML = '<div style="padding:1rem 1.5rem;font-family:\'Cormorant Garamond\',serif;font-style:italic;color:var(--muted);font-size:0.95rem;">Be the first to nominate a Samithi or Satsang!</div>';
      return;
    }
    const medals = ['🥇','🥈','🥉'];
    el.innerHTML = data.samithis.map((s, i) => `
      <div style="display:flex;align-items:center;padding:0.85rem 1.5rem;border-bottom:1px solid var(--border);gap:1rem;">
        <span style="font-size:1.1rem;flex-shrink:0;width:28px;">${medals[i] || (i+1)}</span>
        <span style="flex:1;">
          <div style="font-family:'Cinzel',serif;font-size:0.68rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink);">${s.name}</div>
          <div style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:0.78rem;color:var(--muted);">${s.city}</div>
        </span>
        <span style="font-family:'Cinzel',serif;font-size:0.65rem;font-weight:700;color:var(--burgundy);white-space:nowrap;">${s.member_count} member${s.member_count !== 1 ? 's' : ''}</span>
      </div>`).join('');
  } catch(e) {}
}

// Show samithi modal 2s after registration, load leaderboard
const _origShowRegistered = window.showRegisteredState;
window.showRegisteredState = function(user) {
  _origShowRegistered(user);
  loadSamithiLeaderboard();
  // Only show modal if not already in a samithi
  if (!user.samithi_id) {
    setTimeout(() => {
      loadSamithis();
      openSamithiModal();
    }, 2000);
  } else {
    // Show their samithi name
    const el = document.getElementById('samithi-my-name');
    if (el && user.samithi_name) updateSamithiLabel(user.samithi_name, user.samithi_city || '');
  }
};

// ─── FAQ ACCORDION ───
window.toggleFaq = function(btn) {
  const item = btn.parentElement;
  const body = item.querySelector('.faq-body');
  const icon = btn.querySelector('.faq-icon');
  const isOpen = body.style.display === 'block';

  if (isOpen) {
    body.style.display = 'none';
    icon.textContent = '+';
    icon.style.transform = 'rotate(0deg)';
    btn.style.background = '#faf6ef';
  } else {
    body.style.display = 'block';
    icon.textContent = '−';
    icon.style.transform = 'rotate(0deg)';
    btn.style.background = '#f3ece0';
  }
};

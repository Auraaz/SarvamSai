// ─── COUNTDOWN ───
function updateCountdown() {
  const now = new Date();
  const dropStart = new Date('2026-04-24T00:00:00');
  const dropEnd   = new Date('2026-08-02T00:00:00');

  if (now >= dropEnd) {
    document.getElementById('countdown').textContent = 'CLOSED';
    document.getElementById('countdown-label').textContent = 'Season Complete';
    document.getElementById('stat-days').textContent = '0';
    return;
  }
  if (now >= dropStart) {
    const daysPassed = Math.floor((now - dropStart) / 86400000);
    document.getElementById('stat-days').textContent = 100 - daysPassed;
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const diff = tomorrow - now;
    const h = String(Math.floor(diff / 3600000)).padStart(2,'0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
    document.getElementById('countdown').textContent = `${h}:${m}:${s}`;
    document.getElementById('countdown-label').textContent = 'Until Next Blessing';
  } else {
    const diff = dropStart - now;
    const days = Math.floor(diff / 86400000);
    const h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2,'0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2,'0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2,'0');
    var daysEl = document.getElementById('countdown-days');
    if(daysEl) daysEl.textContent = days + ' days';
    document.getElementById('countdown').textContent = `${h}:${m}:${s}`;
    document.getElementById('countdown-label').textContent = 'Until the Offering Opens';
  }
}
if (document.getElementById('countdown')) {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ─── CAROUSEL ───
let current = 0;
const total = 4;
const track = document.getElementById('carouselTrack');
const dotsContainer = document.getElementById('carouselDots');

for (let i = 0; i < total; i++) {
  const dot = document.createElement('div');
  dot.className = 'dot' + (i === 0 ? ' active' : '');
  dot.onclick = () => { goTo(i); resetTimer(); };
  dotsContainer.appendChild(dot);
}

function goTo(n) {
  current = (n + total) % total;
  track.style.transform = `translateX(-${current * 100}%)`;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
}

// Expose to global scope so onclick attributes work
window.nextSlide = function() { goTo(current + 1); resetTimer(); };
window.prevSlide = function() { goTo(current - 1); resetTimer(); };

let autoTimer = setInterval(() => goTo(current + 1), 8000);
function resetTimer() {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => goTo(current + 1), 8000);
}

// ─── SWIPE SUPPORT ───
let touchStartX = 0;
let touchEndX = 0;
const carouselWrap = document.querySelector('.carousel-wrap');
if (carouselWrap) {
  carouselWrap.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  carouselWrap.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) { goTo(current + 1); } else { goTo(current - 1); }
      resetTimer();
    }
  }, { passive: true });
}

// ─── SOCIAL SHARE ───
window.shareTo = function(platform) {
  const url  = encodeURIComponent('https://sarvamsai.in');
  const text = encodeURIComponent(`🙏 Sarvam Sai — A Centenary Offering honouring Bhagawan Sri Sathya Sai Baba's 100th birth anniversary. 100 consecrated figurines released daily for 100 days. Net zero profit — every rupee unlocks the Sarvam Sai Universe.`);
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
const API      = 'https://script.google.com/macros/s/AKfycbxi6pJbUn2oGNVW47E_9AGyupXE4H9O5I5P3oLBmChh-JQJX7hmkTb7NFK7B4Yef7LY1A/exec';
const SITE_URL = 'https://sarvamsai.in';
// Email confirmation sent automatically by Apps Script

// ─── REFERRAL: read ?ref= from URL ───
const urlParams = new URLSearchParams(window.location.search);
const refCode   = urlParams.get('ref') || '';

// ─── SESSION ───
let currentUser = null;
const savedEmail = localStorage.getItem('ss_email');
if (savedPhone) loadUser(savedPhone);

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
  const phone = document.getElementById('reg-phone').value.trim().replace(/\D/g,'');
  const btn   = document.getElementById('reg-submit-btn');

  document.getElementById('reg-error').style.display = 'none';

  if (!name)           { showRegError('Please enter your name'); return; }
  if (phone.length < 7){ showRegError('Please enter a valid WhatsApp number'); return; }

  btn.textContent = 'Registering...';
  btn.style.opacity = '0.7';
  btn.disabled = true;

  try {
    const data = await apiCall({ action:'register', name, whatsapp:phone, referred_by:refCode });

    if (data.success || data.error === 'already_registered') {
      localStorage.setItem('ss_phone', phone);
      currentUser = data.user;
      showRegisteredState(data.user);
      if (data.success) {
        const msg = encodeURIComponent(`🙏 New SarvamSai Registration!\n\nName: ${name}\nWhatsApp: +${phone}${refCode ? '\nReferred by: +' + refCode : ''}`);
        // Email confirmation sent automatically by Apps Script
      }
    } else {
      showRegError('Something went wrong. Please try again.');
      btn.textContent = 'Secure My Spot';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  } catch(e) {
    showRegError('Network error. Please try again.');
    btn.textContent = 'Secure My Spot';
    btn.style.opacity = '1';
    btn.disabled = false;
  }
}

function showRegError(msg) {
  const el = document.getElementById('reg-error');
  el.textContent = msg;
  el.style.display = 'block';
}

async function loadUser(phone) {
  try {
    const data = await apiCall({ action:'getUser', email:savedEmail });
    if (data.success) { currentUser = data.user; showRegisteredState(data.user); }
  } catch(e) {}
}

window.showRegisteredState = function(user) {
  document.getElementById('cta-register-btns').style.display  = 'none';
  document.getElementById('register-form-wrap').style.display  = 'none';
  document.getElementById('cta-registered').style.display      = 'block';
  document.getElementById('user-rank').textContent    = '#' + (user.rank || '—');
  document.getElementById('user-invites').textContent = user.invite_count || 0;
  document.getElementById('user-invite-link').textContent = `${SITE_URL}/?ref=${encodeURIComponent(user.email)}`;
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
      <div style="display:flex;align-items:center;padding:0.75rem 2rem;border-bottom:1px solid var(--border);gap:1rem;">
        <span style="font-size:1rem;width:24px;">${medals[i] || (i+1)}</span>
        <span style="font-family:'EB Garamond',serif;font-size:1rem;flex:1;color:var(--ink-soft);">${u.name || 'Anonymous'}</span>
        <span style="font-family:'Cinzel',serif;font-size:0.65rem;color:var(--muted);">${u.email}</span>
        <span style="font-family:'Cinzel',serif;font-size:0.75rem;font-weight:700;color:var(--burgundy);">${u.invite_count} ✦</span>
      </div>`).join('');
  } catch(e) {}
}

window.openInviteShare = function() {
  if (currentUser) shareOnWhatsApp();
  else showRegisterForm();
}

window.shareOnWhatsApp = function() {
  const emailRef = currentUser ? currentUser.email : (savedEmail || '');
  const link  = phone ? `${SITE_URL}/?ref=${phone}` : SITE_URL;
  const msg   = encodeURIComponent(`🙏 *Sarvam Sai — A Centenary Offering*\n\nLimited edition figurines honouring the centenary birth anniversary. 100 drops daily for 100 days, each minted with that day's date.\n\nJoin here: ${link}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

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
  const bar    = document.getElementById('floating-cta');
  const ctaSec = document.getElementById('cta');
  const heroSec = document.getElementById('hero');
  if (!bar) return;

  function updateBar() {
    const scrollY = window.scrollY;
    const heroBottom = heroSec ? heroSec.getBoundingClientRect().bottom + scrollY : 300;

    // Hide if we haven't scrolled past hero yet
    if (scrollY < heroBottom - 100) {
      bar.classList.remove('visible');
      return;
    }

    // Hide if CTA section is in view
    if (ctaSec) {
      const rect = ctaSec.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        bar.classList.remove('visible');
        return;
      }
    }

    bar.classList.add('visible');
  }

  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();
})();

// 로그인 · 회원가입
// Demo only: accounts live in this browser's localStorage. To go live, replace the
// `store` functions below with calls to a real auth service (Firebase, Supabase, …).

const store = {
  users() {
    try { return JSON.parse(localStorage.getItem('meomul.users')) || {}; } catch { return {}; }
  },
  saveUsers(users) {
    try { localStorage.setItem('meomul.users', JSON.stringify(users)); } catch { /* storage blocked */ }
  },
  session() {
    try { return localStorage.getItem('meomul.session'); } catch { return null; }
  },
  setSession(email) {
    try {
      if (email) localStorage.setItem('meomul.session', email);
      else localStorage.removeItem('meomul.session');
    } catch { /* storage blocked */ }
  },
};

async function hash(text) {
  const data = new TextEncoder().encode(`meomul:${text}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const currentUser = () => {
  const email = store.session();
  return email ? store.users()[email] || null : null;
};

// ----- modal -----
const authModal = document.createElement('dialog');
authModal.className = 'booking-modal auth-modal';
authModal.setAttribute('aria-labelledby', 'auth-title');
authModal.innerHTML = `
  <button type="button" class="modal-close" aria-label="닫기">×</button>
  <h2 class="booking-title" id="auth-title">머물나무 회원</h2>
  <div class="auth-tabs" role="tablist">
    <button type="button" role="tab" data-tab="login">로그인</button>
    <button type="button" role="tab" data-tab="signup">회원가입</button>
  </div>

  <form class="donate-form auth-form" data-form="login" novalidate>
    <div class="social-login">
      <button type="button" class="btn-social btn-google" data-social="google"><span class="social-logo" aria-hidden="true">G</span>Google로 계속하기</button>
      <button type="button" class="btn-social btn-kakao" data-social="kakao"><span class="social-logo" aria-hidden="true">💬</span>카카오로 계속하기</button>
      <p class="social-or"><span>또는 이메일로</span></p>
    </div>
    <label><span class="lbl">이메일</span><input type="email" name="email" required autocomplete="email"></label>
    <label><span class="lbl">비밀번호</span><input type="password" name="password" required autocomplete="current-password"></label>
    <p class="form-error" role="alert" hidden></p>
    <button type="submit" class="btn btn-red">로그인</button>
    <p class="auth-switch">아직 회원이 아니신가요? <button type="button" data-tab="signup">회원가입</button></p>
  </form>

  <form class="donate-form auth-form" data-form="signup" novalidate hidden>
    <div class="social-login">
      <button type="button" class="btn-social btn-google" data-social="google"><span class="social-logo" aria-hidden="true">G</span>Google로 계속하기</button>
      <button type="button" class="btn-social btn-kakao" data-social="kakao"><span class="social-logo" aria-hidden="true">💬</span>카카오로 계속하기</button>
      <p class="social-or"><span>또는 이메일로</span></p>
    </div>
    <div class="field-row">
      <label><span class="lbl">이름 <span class="req">*</span></span><input type="text" name="name" required autocomplete="name"></label>
      <label><span class="lbl">연락처</span><input type="tel" name="phone" placeholder="010-0000-0000" autocomplete="tel"></label>
    </div>
    <label><span class="lbl">이메일 (아이디) <span class="req">*</span></span><input type="email" name="email" required autocomplete="email"></label>
    <div class="field-row">
      <label><span class="lbl">비밀번호 <span class="req">*</span></span><input type="password" name="password" required minlength="8" autocomplete="new-password"></label>
      <label><span class="lbl">비밀번호 확인 <span class="req">*</span></span><input type="password" name="password2" required autocomplete="new-password"></label>
    </div>
    <p class="auth-hint">비밀번호는 영문과 숫자를 섞어 8자 이상으로 만들어 주세요.</p>
    <label class="choice agree"><input type="checkbox" name="terms" required> 이용약관과 개인정보 수집·이용에 동의해요. <span class="req">*</span></label>
    <label class="choice agree"><input type="checkbox" name="news"> 새 책 · 프로그램 소식을 문자와 이메일로 받을게요. (선택)</label>
    <p class="form-error" role="alert" hidden></p>
    <button type="submit" class="btn btn-red">가입하기</button>
    <p class="auth-switch">이미 회원이신가요? <button type="button" data-tab="login">로그인</button></p>
  </form>

  <div class="auth-done" hidden></div>`;
document.body.appendChild(authModal);

const forms = {
  login: authModal.querySelector('[data-form="login"]'),
  signup: authModal.querySelector('[data-form="signup"]'),
};
const doneBox = authModal.querySelector('.auth-done');

function showTab(tab) {
  Object.entries(forms).forEach(([key, form]) => {
    form.hidden = key !== tab;
    form.reset();
    form.querySelector('.form-error').hidden = true;
  });
  doneBox.hidden = true;
  authModal.querySelectorAll('.auth-tabs [data-tab]').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  });
}

function openAuth(tab = 'login') {
  showTab(tab);
  if (!authModal.open) authModal.showModal();
  forms[tab].querySelector('input').focus();
}

authModal.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) showTab(tabBtn.dataset.tab);
  if (e.target === authModal || e.target.closest('.modal-close')) authModal.close();
});

function fail(form, message) {
  const box = form.querySelector('.form-error');
  box.textContent = message;
  box.hidden = false;
}

function finish(message) {
  forms.login.hidden = true;
  forms.signup.hidden = true;
  doneBox.hidden = false;
  doneBox.innerHTML = `<div class="donate-done">${message}
    <button type="button" class="btn btn-green" onclick="this.closest('dialog').close()">확인</button></div>`;
  renderHeader();
  fillForms();
}

forms.signup.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = forms.signup;
  const email = f.email.value.trim().toLowerCase();
  const problems = [];
  if (!f.name.value.trim()) problems.push('이름');
  if (!f.email.checkValidity() || !email) problems.push('이메일');
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(f.password.value)) problems.push('비밀번호 (영문+숫자 8자 이상)');
  if (f.password.value !== f.password2.value) problems.push('비밀번호 확인이 달라요');
  if (f.phone.value && !/^[0-9-]{9,13}$/.test(f.phone.value.trim())) problems.push('연락처');
  if (!f.terms.checked) problems.push('약관 동의');
  if (problems.length) return fail(f, `다음 항목을 확인해 주세요: ${problems.join(', ')}`);

  const users = store.users();
  if (users[email]) return fail(f, '이미 가입된 이메일이에요. 로그인해 주세요.');
  users[email] = {
    name: f.name.value.trim(),
    email,
    phone: f.phone.value.trim(),
    news: f.news.checked,
    password: await hash(f.password.value),
    points: 0,
    joined: new Date().toISOString().slice(0, 10),
  };
  store.saveUsers(users);
  store.setSession(email);
  finish(`<h3>환영해요, ${users[email].name} 님!</h3>
    <p>머물나무 회원이 되셨어요. 책을 기부하면 나눔 포인트가 쌓이고,<br>프로그램 예약도 더 쉽게 할 수 있어요.</p>`);
});

forms.login.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = forms.login;
  const email = f.email.value.trim().toLowerCase();
  if (!email || !f.password.value) return fail(f, '이메일과 비밀번호를 입력해 주세요.');
  const user = store.users()[email];
  if (!user || user.password !== (await hash(f.password.value))) {
    return fail(f, '이메일 또는 비밀번호가 맞지 않아요.');
  }
  store.setSession(email);
  finish(`<h3>${user.name} 님, 다시 오셨네요</h3><p>나눔 포인트 <b>${(user.points || 0).toLocaleString('ko-KR')}P</b></p>`);
});

// ----- 소셜 로그인 (Google · 카카오) -----
const keys = window.MEOMUL_AUTH || {};

// one member record per email; social sign-ins don't need a password
function socialSignIn(provider, { name, email }) {
  if (!email) {
    alert('이메일 제공에 동의해야 가입할 수 있어요.');
    return;
  }
  email = email.toLowerCase();
  const users = store.users();
  const isNew = !users[email];
  users[email] = {
    points: 0,
    joined: new Date().toISOString().slice(0, 10),
    phone: '',
    ...users[email],
    name: users[email]?.name || name || email.split('@')[0],
    email,
    provider,
  };
  store.saveUsers(users);
  store.setSession(email);
  if (!authModal.open) authModal.showModal();
  const via = provider === 'google' ? 'Google' : '카카오';
  finish(isNew
    ? `<h3>환영해요, ${users[email].name} 님!</h3><p>${via} 계정으로 머물나무 회원이 되셨어요.</p>`
    : `<h3>${users[email].name} 님, 다시 오셨네요</h3><p>${via} 계정으로 로그인했어요.</p>`);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(src));
    document.head.appendChild(s);
  });
}

// 시연 모드: with no keys set, the social buttons show a sample sign-in step inside the modal
const DEMO_ACCOUNTS = {
  google: [
    { name: '홍길동', email: 'hong.gildong@gmail.com' },
    { name: '김머물', email: 'meomul.kim@gmail.com' },
  ],
  kakao: [{ name: '진주', email: 'jinju@kakao.com' }],
};

function notReady(form, who) {
  const provider = who === 'Google' ? 'google' : 'kakao';
  forms.login.hidden = true;
  forms.signup.hidden = true;
  doneBox.hidden = false;
  const accounts = DEMO_ACCOUNTS[provider];
  doneBox.innerHTML = provider === 'google'
    ? `<div class="demo-sso demo-google">
        <p class="demo-tag">시연용 화면</p>
        <h3><span class="social-logo" aria-hidden="true">G</span> 계정 선택</h3>
        <p class="demo-sub">머물나무(으)로 이동할 계정을 선택하세요</p>
        <ul class="demo-accounts">
          ${accounts.map((a, i) => `<li><button type="button" data-demo="${i}">
            <span class="demo-avatar">${a.name.slice(0, 1)}</span>
            <span><b>${a.name}</b><small>${a.email}</small></span></button></li>`).join('')}
        </ul>
        <button type="button" class="demo-back" data-tab="login">취소</button>
      </div>`
    : `<div class="demo-sso demo-kakao">
        <p class="demo-tag">시연용 화면</p>
        <h3><span class="social-logo" aria-hidden="true">💬</span> 카카오 로그인</h3>
        <p class="demo-sub"><b>머물나무</b>에서 다음 정보를 받으려고 해요</p>
        <ul class="demo-consent">
          <li>✓ 닉네임 · ${accounts[0].name}</li>
          <li>✓ 카카오계정(이메일) · ${accounts[0].email}</li>
        </ul>
        <button type="button" class="btn-social btn-kakao" data-demo="0">동의하고 계속하기</button>
        <button type="button" class="demo-back" data-tab="login">취소</button>
      </div>`;
  doneBox.querySelectorAll('[data-demo]').forEach((btn) => {
    btn.addEventListener('click', () => socialSignIn(provider, accounts[Number(btn.dataset.demo)]));
  });
}

// Google: popup → access token → profile
async function googleLogin(form) {
  if (!keys.googleClientId) return notReady(form, 'Google');
  try {
    await loadScript('https://accounts.google.com/gsi/client');
    const client = google.accounts.oauth2.initTokenClient({
      client_id: keys.googleClientId,
      scope: 'openid email profile',
      callback: async (res) => {
        if (res.error) return fail(form, 'Google 로그인이 취소되었어요.');
        const me = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${res.access_token}` },
        }).then((r) => r.json());
        socialSignIn('google', { name: me.name, email: me.email });
      },
    });
    client.requestAccessToken();
  } catch {
    fail(form, 'Google 로그인을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.');
  }
}

// Kakao: redirect to Kakao → back here with ?code=… → token → profile
const KAKAO_SDK = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
const redirectUri = location.origin + location.pathname;

async function kakaoReady() {
  await loadScript(KAKAO_SDK);
  if (!Kakao.isInitialized()) Kakao.init(keys.kakaoJsKey);
}

async function kakaoLogin(form) {
  if (!keys.kakaoJsKey || !keys.kakaoRestKey) return notReady(form, '카카오');
  try {
    await kakaoReady();
    Kakao.Auth.authorize({ redirectUri, state: 'kakao', scope: 'profile_nickname,account_email' });
  } catch {
    fail(form, '카카오 로그인을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.');
  }
}

async function finishKakaoRedirect() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (!code || params.get('state') !== 'kakao' || !keys.kakaoRestKey) return;
  history.replaceState(null, '', redirectUri + location.hash); // tidy the address bar
  try {
    const token = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: new URLSearchParams({ grant_type: 'authorization_code', client_id: keys.kakaoRestKey, redirect_uri: redirectUri, code }),
    }).then((r) => r.json());
    if (!token.access_token) throw new Error('no token');
    await kakaoReady();
    Kakao.Auth.setAccessToken(token.access_token);
    const me = await Kakao.API.request({ url: '/v2/user/me' });
    const account = me.kakao_account || {};
    socialSignIn('kakao', { name: account.profile?.nickname, email: account.email });
  } catch {
    openAuth('login');
    fail(forms.login, '카카오 로그인에 실패했어요. 다시 시도해 주세요.');
  }
}

authModal.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-social]');
  if (!btn) return;
  const form = btn.closest('form');
  if (btn.dataset.social === 'google') googleLogin(form);
  else kakaoLogin(form);
});

// ----- header: 로그인/회원가입 ↔ 이름/로그아웃 -----
const actions = document.querySelector('.header-actions');
const guestHTML = actions.innerHTML;

function renderHeader() {
  const user = currentUser();
  if (!user) {
    actions.innerHTML = guestHTML;
    actions.querySelector('.link-login').addEventListener('click', (e) => { e.preventDefault(); openAuth('login'); });
    actions.querySelector('.btn').addEventListener('click', (e) => { e.preventDefault(); openAuth('signup'); });
    return;
  }
  actions.innerHTML = `
    <span class="user-chip" title="나눔 포인트 ${(user.points || 0).toLocaleString('ko-KR')}P">
      <span class="user-avatar" aria-hidden="true">${user.name.slice(0, 1)}</span>${user.name} 님
    </span>
    <button type="button" class="link-login logout">로그아웃</button>`;
  actions.querySelector('.logout').addEventListener('click', () => {
    store.setSession(null);
    if (window.Kakao?.Auth?.getAccessToken()) Kakao.Auth.logout().catch(() => {});
    renderHeader();
    fillForms(); // clears what we had filled in for this member
  });
}

// other "로그인 / 회원가입" links on the page (e.g. 나눔서가 포인트 안내)
document.querySelectorAll('[data-auth]').forEach((link) => {
  link.addEventListener('click', (e) => { e.preventDefault(); openAuth(link.dataset.auth); });
});

// logged-in members don't retype their name and phone in the booking forms
// a field we filled (and the visitor hasn't changed since) follows whoever is logged in;
// anything the visitor typed themselves is left alone
function fillForms() {
  const user = currentUser();
  const values = { name: user?.name || '', phone: user?.phone || '', email: user?.email || '' };
  document.querySelectorAll('form:not(.auth-form)').forEach((form) => {
    Object.entries(values).forEach(([key, value]) => {
      const input = form.elements[key];
      if (!(input instanceof HTMLInputElement)) return;
      const ours = input.dataset.autofill !== undefined && input.value === input.dataset.autofill;
      if (input.value && !ours) return;
      input.value = value;
      if (value) input.dataset.autofill = value;
      else delete input.dataset.autofill;
    });
  });
}
document.addEventListener('click', () => setTimeout(fillForms), true); // forms are rebuilt when modals open

renderHeader();
fillForms();
finishKakaoRedirect();

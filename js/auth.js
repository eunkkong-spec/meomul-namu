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
    <label><span class="lbl">이메일</span><input type="email" name="email" required autocomplete="email"></label>
    <label><span class="lbl">비밀번호</span><input type="password" name="password" required autocomplete="current-password"></label>
    <p class="form-error" role="alert" hidden></p>
    <button type="submit" class="btn btn-red">로그인</button>
    <p class="auth-switch">아직 회원이 아니신가요? <button type="button" data-tab="signup">회원가입</button></p>
  </form>

  <form class="donate-form auth-form" data-form="signup" novalidate hidden>
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
    renderHeader();
  });
}

// other "로그인 / 회원가입" links on the page (e.g. 나눔서가 포인트 안내)
document.querySelectorAll('[data-auth]').forEach((link) => {
  link.addEventListener('click', (e) => { e.preventDefault(); openAuth(link.dataset.auth); });
});

// logged-in members don't retype their name and phone in the booking forms
function fillForms() {
  const user = currentUser();
  if (!user) return;
  document.querySelectorAll('form:not(.auth-form)').forEach((form) => {
    if (form.name instanceof HTMLInputElement && !form.name.value) form.name.value = user.name;
    if (form.phone instanceof HTMLInputElement && !form.phone.value) form.phone.value = user.phone || '';
    if (form.email instanceof HTMLInputElement && !form.email.value) form.email.value = user.email;
  });
}
document.addEventListener('click', () => setTimeout(fillForms), true); // forms are rebuilt when modals open

renderHeader();
fillForms();

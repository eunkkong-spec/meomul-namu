// 나눔서가: donation form
const form = document.querySelector('.donate-form');
const errorBox = form.querySelector('.form-error');
const pickupField = form.querySelector('.pickup-only');

// the pickup address only matters for 방문 수거
form.querySelectorAll('input[name="method"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    pickupField.hidden = form.method.value !== 'pickup';
  });
});

// 나눔 포인트: 1,000P per book, shown as the count changes
const POINTS_PER_BOOK = 1000;
const pointsFor = (n) => (Math.max(0, Math.floor(Number(n) || 0)) * POINTS_PER_BOOK).toLocaleString('ko-KR');
const pointsPreview = form.querySelector('.points-preview');
form.count.addEventListener('input', () => { pointsPreview.textContent = pointsFor(form.count.value); });

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const problems = [];
  if (!form.name.value.trim()) problems.push('이름');
  if (!/^[0-9-]{9,13}$/.test(form.phone.value.trim())) problems.push('연락처');
  if (form.email.value && !form.email.checkValidity()) problems.push('이메일');
  if (!(Number(form.count.value) >= 1)) problems.push('권수');
  if (form.method.value === 'pickup' && Number(form.count.value) < 20) problems.push('방문 수거는 20권 이상');
  if (form.method.value === 'pickup' && !form.address.value.trim()) problems.push('수거 주소');
  if (!form.agree.checked) problems.push('개인정보 수집 동의');

  if (problems.length) {
    errorBox.textContent = `다음 항목을 확인해 주세요: ${problems.join(', ')}`;
    errorBox.hidden = false;
    return;
  }

  // no server yet — show the confirmation in place of the form
  const who = form.nickname.value.trim() || '익명의 이웃';
  const points = pointsFor(form.count.value);
  form.innerHTML = `
    <div class="donate-done">
      <h3>신청이 접수되었어요</h3>
      <p>${form.name.value.trim()} 님, 소중한 책 ${form.count.value}권을 나눠 주셔서 고맙습니다.<br>
        2일 안에 <b>${form.phone.value.trim()}</b>로 연락드릴게요.</p>
      <p class="donate-points">적립 예정 나눔 포인트 <b>${points}P</b></p>
      <p class="donate-card-preview">물려읽기 카드 · "${who} 님이 건넨 책"</p>
      <a href="index.html" class="btn btn-green">머물나무로 돌아가기</a>
    </div>`;
});

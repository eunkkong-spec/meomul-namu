// 프로그램 예약: booking form
const form = document.querySelector('.program-form');
const errorBox = form.querySelector('.form-error');
const kidsField = form.querySelector('.kids-only');
const NAMES = {
  writing: '어르신 글쓰기 수업',
  bookclub: '이주의 책 나누기',
  drawing: '어린이 그림 수업',
  author: '작가와의 만남',
};

// the child's name/age only matters for the drawing class
function syncProgram() {
  kidsField.hidden = form.program.value !== 'drawing';
}
form.program.addEventListener('change', syncProgram);

// "이 프로그램 예약" buttons and ?p=… links pick the program for you
function choose(id) {
  if (!NAMES[id]) return;
  form.program.value = id;
  syncProgram();
}
// booking form lives in a modal; every "예약" link opens it
const modal = document.querySelector('.booking-modal');
function openBooking(id) {
  choose(id);
  if (!modal.open) modal.showModal();
}
document.querySelectorAll('a[href="#apply"]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openBooking(btn.dataset.program);
  });
});
modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
// a click on the dimmed backdrop (outside the box) closes it too
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

// links from other pages: program.html?p=author#apply
const params = new URLSearchParams(location.search);
if (params.get('p') || location.hash === '#apply') openBooking(params.get('p'));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const problems = [];
  if (!form.program.value) problems.push('프로그램');
  if (!(Number(form.people.value) >= 1)) problems.push('인원');
  if (form.program.value === 'drawing' && !form.child.value.trim()) problems.push('아이 이름과 나이');
  if (!form.name.value.trim()) problems.push('이름');
  if (!/^[0-9-]{9,13}$/.test(form.phone.value.trim())) problems.push('연락처');
  if (!form.agree.checked) problems.push('개인정보 수집 동의');

  if (problems.length) {
    errorBox.textContent = `다음 항목을 확인해 주세요: ${problems.join(', ')}`;
    errorBox.hidden = false;
    return;
  }

  // no server yet — show the confirmation in place of the form
  const program = NAMES[form.program.value];
  const usePoints = form.points.checked;
  form.innerHTML = `
    <div class="donate-done">
      <h3>예약 신청이 접수되었어요</h3>
      <p><b>${program}</b> · ${form.people.value}명<br>
        ${form.name.value.trim()} 님, 하루 안에 <b>${form.phone.value.trim()}</b>로 예약 확정 문자를 보내 드릴게요.</p>
      ${usePoints ? '<p>참가비는 나눔 포인트로 결제돼요.</p>' : ''}
      <button type="button" class="btn btn-green" onclick="this.closest('dialog').close()">닫기</button>
    </div>`;
});

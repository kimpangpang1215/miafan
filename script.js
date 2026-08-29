const openForm = document.getElementById('openForm');
const writePanel = document.getElementById('writePanel');
const form = document.getElementById('reviewForm');
const bubbleArea = document.getElementById('bubbleArea');
const reviewText = document.getElementById('reviewText');
const charCount = document.getElementById('charCount');
const toast = document.getElementById('toast');

function showToast(msg){
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>toast.classList.add('hidden'), 2400);
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[m]);
}

openForm.addEventListener('click', ()=>{
  writePanel.classList.toggle('hidden');
  if(!writePanel.classList.contains('hidden')) reviewText.focus();
});

reviewText.addEventListener('input', ()=>{
  charCount.textContent = `${reviewText.value.length}/140`;
});

document.addEventListener('click', (e)=>{
  const like = e.target.closest('.like-btn');
  if(like){
    const countEl = like.querySelector('span');
    const liked = like.dataset.liked === '1';
    countEl.textContent = Math.max(0, Number(countEl.textContent) + (liked ? -1 : 1));
    like.dataset.liked = liked ? '0' : '1';
    like.childNodes[0].textContent = liked ? '♡ 공감 ' : '♥ 공감 ';
  }

  const replyToggle = e.target.closest('.reply-toggle');
  if(replyToggle){
    const box = replyToggle.closest('.bubble').querySelector('.reply-box');
    if(box) box.classList.toggle('hidden');
  }
});

document.querySelectorAll('.reply-form').forEach(replyForm=>{
  replyForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const input = replyForm.querySelector('input');
    const value = input.value.trim();
    if(!value) return showToast('댓글을 입력해 주세요.');
    const p = document.createElement('p');
    p.className = 'reply';
    p.innerHTML = `<strong>익명</strong> ${escapeHtml(value)}`;
    replyForm.before(p);
    input.value = '';
    showToast('댓글이 달렸어요.');
  });
});

form.addEventListener('submit', (e)=>{
  e.preventDefault();

  const vote = new FormData(form).get('vote');
  const value = reviewText.value.trim();
  const nickname = (document.getElementById('nickname').value.trim() || '익명').slice(0,12);

  if(!value) return showToast('한마디를 입력해 주세요.');

  const article = document.createElement('article');
  article.className = `bubble ${vote === 'yes' ? 'recommend' : 'dislike'}`;
  article.innerHTML = `
    <div class="bubble-top">
      <span class="tag">${vote === 'yes' ? '👍 추천해요' : '👀 아쉬워요'}</span>
      <span class="time">${escapeHtml(nickname)} · 방금</span>
    </div>
    <p>${escapeHtml(value)}</p>
    <div class="actions">
      <button class="like-btn" type="button">♡ 공감 <span>0</span></button>
    </div>
  `;
  bubbleArea.prepend(article);

  const count = document.getElementById(vote === 'yes' ? 'yesCount' : 'noCount');
  count.textContent = Number(count.textContent) + 1;

  form.reset();
  reviewText.value = '';
  charCount.textContent = '0/140';
  writePanel.classList.add('hidden');
  showToast('내 한마디가 통통 떠올랐어요 💬');
});

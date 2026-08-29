const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchStatus = document.getElementById('searchStatus');
const results = document.getElementById('results');
const selectedSection = document.getElementById('selectedSection');
const changeBook = document.getElementById('changeBook');
const reason = document.getElementById('reason');
const reasonCount = document.getElementById('reasonCount');
const submitOpinion = document.getElementById('submitOpinion');
const opinionWall = document.getElementById('opinionWall');
const opinionBubble = document.getElementById('opinionBubble');

let selectedBook = null;

function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[ch]);
}

function yearFrom(datetime='') {
  if (!datetime) return '정보 없음';
  const y = String(datetime).slice(0,4);
  return /^\d{4}$/.test(y) ? y : '정보 없음';
}

function normalizeIsbn(isbn='') {
  const parts = String(isbn).trim().split(/\s+/).filter(Boolean);
  return parts.find(v => v.length === 13) || parts[0] || '정보 없음';
}

function setStatus(message) {
  searchStatus.textContent = message;
}

function renderResults(books) {
  results.innerHTML = '';
  if (!books.length) {
    setStatus('검색 결과가 없어요. 제목이나 저자를 조금 다르게 검색해 보세요.');
    return;
  }

  setStatus(`${books.length}권을 찾았어요. 정확한 책을 선택해 주세요.`);
  books.forEach((book, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'result-card';
    button.dataset.index = index;

    const cover = book.cover
      ? `<img class="result-cover" src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)} 표지" />`
      : `<div class="result-cover" aria-label="표지 없음"></div>`;

    button.innerHTML = `
      ${cover}
      <div>
        <div class="result-title">${escapeHtml(book.title)}</div>
        <div class="result-meta">${escapeHtml(book.author || '저자 정보 없음')} · ${escapeHtml(book.publisher || '출판사 정보 없음')} · ${(book.pubDate || '정보 없음').slice(0,4)}</div>
      </div>
      <span class="choose">선택 →</span>
    `;
    button.addEventListener('click', () => selectBook(book));
    results.appendChild(button);
  });
}

async function searchBooks(query) {
  setStatus('책 정보를 찾고 있어요…');
  results.innerHTML = '';

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '검색 중 오류가 발생했어요.');
    }

    renderResults(data.items || []);
  } catch (err) {
    setStatus(err.message || '검색 중 오류가 발생했어요.');
  }
}

function selectBook(book) {
  selectedBook = book;

  const cover = document.getElementById('bookCover');
  const fallback = document.getElementById('coverFallback');

  if (book.cover) {
    cover.src = book.cover;
    cover.alt = `${book.title} 책 표지`;
    cover.classList.remove('hidden');
    fallback.classList.add('hidden');
  } else {
    cover.removeAttribute('src');
    cover.alt = '';
    cover.classList.add('hidden');
    fallback.classList.remove('hidden');
  }

  document.getElementById('bookTitle').textContent = book.title || '제목 정보 없음';
  document.getElementById('bookAuthors').textContent = book.author || '저자 정보 없음';
  document.getElementById('bookPublisher').textContent = book.publisher || '정보 없음';
  document.getElementById('bookYear').textContent = (book.pubDate || '정보 없음').slice(0,4);
  document.getElementById('bookIsbn').textContent = book.isbn13 || book.isbn || '정보 없음';
  document.getElementById('bookContents').textContent = book.description || '책 소개 정보가 제공되지 않았어요.';

  const link = document.getElementById('bookLink');
  if (book.link) {
    link.href = book.link;
    link.classList.remove('hidden');
  } else {
    link.classList.add('hidden');
  }

  selectedSection.classList.remove('hidden');
  opinionWall.classList.add('hidden');
  reason.value = '';
  reasonCount.textContent = '0/220';
  selectedSection.scrollIntoView({behavior:'smooth', block:'start'});
}

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query.length < 1) {
    setStatus('검색할 책 제목이나 저자를 입력해 주세요.');
    return;
  }
  searchBooks(query);
});

changeBook.addEventListener('click', () => {
  selectedBook = null;
  selectedSection.classList.add('hidden');
  opinionWall.classList.add('hidden');
  searchInput.focus();
  window.scrollTo({top:0, behavior:'smooth'});
});

reason.addEventListener('input', () => {
  reasonCount.textContent = `${reason.value.length}/220`;
});

submitOpinion.addEventListener('click', () => {
  if (!selectedBook) return;
  const text = reason.value.trim();
  if (!text) {
    reason.focus();
    return;
  }

  const vote = document.querySelector('input[name="vote"]:checked').value;
  const voteText = vote === 'recommend' ? '👍 추천해요' : '🤔 나는 비추천';

  opinionBubble.innerHTML = `
    <div class="vote">${voteText}</div>
    <div class="book-mini">${escapeHtml(selectedBook.title)} · ${escapeHtml(selectedBook.author || '')}</div>
    <p class="text">${escapeHtml(text)}</p>
  `;

  opinionWall.classList.remove('hidden');
  opinionWall.scrollIntoView({behavior:'smooth', block:'start'});
});

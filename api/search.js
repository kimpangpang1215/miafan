module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 요청만 사용할 수 있어요.' });
  }

  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ error: '검색어를 입력해 주세요.' });
  }

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    console.error('KAKAO_REST_API_KEY is missing');
    return res.status(500).json({ error: '카카오 API 키가 설정되지 않았어요.' });
  }

  const url = new URL('https://dapi.kakao.com/v3/search/book');
  url.searchParams.set('query', q);
  url.searchParams.set('size', '10');
  url.searchParams.set('sort', 'accuracy');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `KakaoAK ${key}`,
        Accept: 'application/json',
      },
    });

    const text = await response.text();

    if (!response.ok) {
      console.error('Kakao Book API HTTP error:', response.status, text);
      return res.status(response.status).json({
        error: `카카오에서 책 정보를 불러오지 못했어요. (${response.status})`,
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error('Kakao Book API JSON parse error:', error, text);
      return res.status(502).json({ error: '카카오의 책 검색 응답을 읽지 못했어요.' });
    }

    const items = (data.documents || []).map((book) => {
      const isbnParts = String(book.isbn || '')
        .split(/\s+/)
        .filter(Boolean);

      const isbn13 =
        isbnParts.find((value) => /^\d{13}$/.test(value)) || '';
      const isbn10 =
        isbnParts.find((value) => /^[0-9Xx]{10}$/.test(value)) || '';

      return {
        title: book.title || '',
        author: Array.isArray(book.authors) ? book.authors.join(', ') : '',
        publisher: book.publisher || '',
        pubDate: book.datetime ? String(book.datetime).slice(0, 10) : '',
        isbn: isbn10 || isbnParts[0] || '',
        isbn13,
        description: book.contents || '',
        cover: book.thumbnail || '',
        link: book.url || '',
      };
    });

    return res.status(200).json({ items });
  } catch (error) {
    console.error('Kakao book search error:', error);
    return res.status(500).json({ error: '책 검색 중 오류가 발생했어요.' });
  }
};

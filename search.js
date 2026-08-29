module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'GET 요청만 사용할 수 있어요.' });
  }

  const q = String(req.query.q || '').trim();
  if (!q) {
    return res.status(400).json({ error: '검색어를 입력해 주세요.' });
  }

  const key = process.env.ALADIN_TTB_KEY;
  if (!key) {
    return res.status(500).json({
      error: '알라딘 TTB Key가 아직 연결되지 않았어요. Vercel Environment Variables에 ALADIN_TTB_KEY를 등록해 주세요.'
    });
  }

  const url = new URL('https://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
  url.searchParams.set('ttbkey', key);
  url.searchParams.set('Query', q);
  url.searchParams.set('QueryType', 'Keyword');
  url.searchParams.set('MaxResults', '10');
  url.searchParams.set('start', '1');
  url.searchParams.set('SearchTarget', 'Book');
  url.searchParams.set('output', 'js');
  url.searchParams.set('Version', '20131101');
  url.searchParams.set('Cover', 'Big');

  try {
    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
      console.error('Aladin API HTTP error:', response.status, text);
      return res.status(response.status).json({
        error: '알라딘에서 책 정보를 불러오지 못했어요.'
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Aladin API parse error:', text.slice(0, 500));
      return res.status(502).json({
        error: '알라딘 응답을 읽지 못했어요. TTB Key와 API 설정을 확인해 주세요.'
      });
    }

    if (data.errorCode) {
      console.error('Aladin API error:', data);
      return res.status(400).json({
        error: data.errorMessage || '알라딘 API 설정을 확인해 주세요.'
      });
    }

    const items = (data.item || []).map(item => ({
      title: item.title || '',
      author: item.author || '',
      publisher: item.publisher || '',
      pubDate: item.pubDate || '',
      isbn: item.isbn || '',
      isbn13: item.isbn13 || '',
      description: item.description || '',
      cover: item.cover || '',
      link: item.link || ''
    }));

    return res.status(200).json({
      items,
      totalResults: data.totalResults || 0
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: '알라딘 책 검색 서버에 연결하지 못했어요.'
    });
  }
};

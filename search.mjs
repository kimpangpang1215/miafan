export async function GET(request) {
  const urlObj = new URL(request.url);
  const q = String(urlObj.searchParams.get('q') || '').trim();

  if (!q) {
    return Response.json({ error: '검색어를 입력해 주세요.' }, { status: 400 });
  }

  const key = process.env.ALADIN_TTB_KEY;
  if (!key) {
    return Response.json(
      { error: '알라딘 TTB Key가 연결되지 않았어요. Vercel 환경변수를 확인해 주세요.' },
      { status: 500 }
    );
  }

  const aladinUrl = new URL('https://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
  aladinUrl.searchParams.set('ttbkey', key);
  aladinUrl.searchParams.set('Query', q);
  aladinUrl.searchParams.set('QueryType', 'Keyword');
  aladinUrl.searchParams.set('MaxResults', '10');
  aladinUrl.searchParams.set('start', '1');
  aladinUrl.searchParams.set('SearchTarget', 'Book');
  aladinUrl.searchParams.set('output', 'js');
  aladinUrl.searchParams.set('Version', '20131101');
  aladinUrl.searchParams.set('Cover', 'Big');

  try {
    const response = await fetch(aladinUrl.toString(), {
      headers: {
        'User-Agent': 'JayangHangangLibrary-BookComment/1.0',
        'Accept': 'application/json,text/plain,*/*'
      }
    });

    const text = await response.text();

    if (!response.ok) {
      console.error('Aladin HTTP error', response.status, text.slice(0, 500));
      return Response.json(
        { error: `알라딘 도서 검색에 실패했어요. (${response.status})` },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Aladin parse error', text.slice(0, 500));
      return Response.json(
        { error: '알라딘 응답 형식을 읽지 못했어요. 잠시 후 다시 시도해 주세요.' },
        { status: 502 }
      );
    }

    if (data.errorCode) {
      return Response.json(
        { error: data.errorMessage || '알라딘 API 설정을 확인해 주세요.' },
        { status: 400 }
      );
    }

    const items = (data.item || []).map((item) => ({
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

    return Response.json({
      items,
      totalResults: data.totalResults || 0
    });
  } catch (error) {
    console.error('Book search function error', error);
    return Response.json(
      { error: '책 검색 서버에 연결하지 못했어요.' },
      { status: 500 }
    );
  }
}

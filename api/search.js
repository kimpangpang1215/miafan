export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = String(req.query.q || "").trim();
  if (!query) {
    return res.status(400).json({ error: "검색어를 입력해 주세요." });
  }

  const ttbKey = process.env.ALADIN_TTB_KEY;
  if (!ttbKey) {
    return res.status(500).json({ error: "ALADIN_TTB_KEY가 설정되지 않았습니다." });
  }

  const params = new URLSearchParams({
    ttbkey: ttbKey,
    Query: query,
    QueryType: "Keyword",
    MaxResults: "10",
    start: "1",
    SearchTarget: "Book",
    output: "js",
    Version: "20131101",
    Cover: "Big",
  });

  // www. 없이 aladin.co.kr로 호출
  const apiUrl = `https://aladin.co.kr/ttb/api/ItemSearch.aspx?${params.toString()}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json,text/plain,*/*",
      },
    });

    const text = await response.text();

    if (!response.ok) {
      console.error(`Aladin API HTTP error: ${response.status}`, text.slice(0, 2000));
      return res.status(response.status).json({
        error: `알라딘 API 요청 실패 (${response.status})`,
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Aladin response parse error:", text.slice(0, 2000));
      return res.status(502).json({ error: "알라딘 응답을 읽지 못했습니다." });
    }

    const items = (data.item || []).map((book) => ({
      title: book.title || "",
      author: book.author || "",
      publisher: book.publisher || "",
      pubDate: book.pubDate || "",
      isbn: book.isbn || "",
      isbn13: book.isbn13 || "",
      description: book.description || "",
      cover: book.cover || "",
      link: book.link || "",
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Aladin search error:", error);
    return res.status(500).json({ error: "책 검색 중 오류가 발생했습니다." });
  }
}

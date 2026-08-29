module.exports = async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return res.status(500).json({
      error: "Supabase 환경변수가 설정되지 않았습니다."
    });
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };

  try {
    if (req.method === "GET") {
      const isbn13 = String(req.query.isbn13 || "").trim();

      if (!isbn13) {
        return res.status(400).json({ error: "isbn13이 필요합니다." });
      }

      const endpoint = new URL("/rest/v1/opinions", url);
      endpoint.searchParams.set(
        "select",
        "id,created_at,isbn13,book_title,vote,reason"
      );
      endpoint.searchParams.set("isbn13", `eq.${isbn13}`);
      endpoint.searchParams.set("order", "created_at.desc");

      const response = await fetch(endpoint.toString(), { headers });
      const text = await response.text();

      if (!response.ok) {
        console.error("Supabase GET error:", response.status, text);
        return res.status(response.status).json({
          error: "저장된 의견을 불러오지 못했어요."
        });
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Supabase GET parse error:", text);
        return res.status(502).json({
          error: "의견 데이터를 읽지 못했어요."
        });
      }

      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

      const isbn13 = String(body.isbn13 || "").trim();
      const book_title = String(body.book_title || "").trim();
      const vote = String(body.vote || "").trim();
      const reason = String(body.reason || "").trim();

      if (
        !isbn13 ||
        !book_title ||
        !["추천", "비추천"].includes(vote) ||
        !reason
      ) {
        return res.status(400).json({
          error: "책, 추천 여부, 이유를 모두 입력해 주세요."
        });
      }

      const endpoint = new URL("/rest/v1/opinions", url);

      const response = await fetch(endpoint.toString(), {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          isbn13,
          book_title,
          vote,
          reason
        })
      });

      const text = await response.text();

      if (!response.ok) {
        console.error("Supabase POST error:", response.status, text);
        return res.status(response.status).json({
          error: "의견 저장에 실패했어요."
        });
      }

      let data;
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }

      return res.status(201).json(data);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({
      error: "허용되지 않는 요청입니다."
    });
  } catch (error) {
    console.error("Opinions API error:", error);
    return res.status(500).json({
      error: "의견 저장 서버에서 오류가 발생했어요."
    });
  }
};

export default async function handler(request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return Response.json(
      { error: "Supabase 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const headers = {
    "apikey": key,
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json"
  };

  if (request.method === "GET") {
    const reqUrl = new URL(request.url);
    const isbn13 = (reqUrl.searchParams.get("isbn13") || "").trim();
    if (!isbn13) return Response.json({ error: "isbn13이 필요합니다." }, { status: 400 });

    const endpoint = new URL("/rest/v1/opinions", url);
    endpoint.searchParams.set("select", "id,created_at,isbn13,book_title,vote,reason");
    endpoint.searchParams.set("isbn13", `eq.${isbn13}`);
    endpoint.searchParams.set("order", "created_at.desc");

    const r = await fetch(endpoint, { headers });
    const text = await r.text();
    if (!r.ok) return Response.json({ error: text || "의견을 불러오지 못했습니다." }, { status: r.status });
    return new Response(text, { status: 200, headers: { "Content-Type": "application/json" } });
  }

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); }
    catch { return Response.json({ error: "잘못된 요청입니다." }, { status: 400 }); }

    const isbn13 = String(body.isbn13 || "").trim();
    const book_title = String(body.book_title || "").trim();
    const vote = String(body.vote || "").trim();
    const reason = String(body.reason || "").trim();

    if (!isbn13 || !book_title || !["추천", "비추천"].includes(vote) || !reason) {
      return Response.json({ error: "책, 추천 여부, 이유를 모두 입력해 주세요." }, { status: 400 });
    }

    const endpoint = new URL("/rest/v1/opinions", url);
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({ isbn13, book_title, vote, reason })
    });
    const text = await r.text();
    if (!r.ok) return Response.json({ error: text || "의견 저장에 실패했습니다." }, { status: r.status });
    return new Response(text, { status: 201, headers: { "Content-Type": "application/json" } });
  }

  return Response.json({ error: "허용되지 않는 요청입니다." }, { status: 405 });
}

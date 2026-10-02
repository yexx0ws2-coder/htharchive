export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 작품 목록 읽기
    if (url.pathname === "/api/works" && request.method === "GET") {
      const { results } = await env.DB
        .prepare("SELECT * FROM works ORDER BY created_at DESC")
        .all();

      return Response.json(results);
    }

    // 작품 새로 저장하기
    if (url.pathname === "/api/works" && request.method === "POST") {
      const body = await request.json();

      const title = String(body.title ?? "").trim();

      if (!title) {
        return Response.json(
          { error: "작품명을 입력해 주세요." },
          { status: 400 }
        );
      }

      const work = await env.DB
        .prepare(`
          INSERT INTO works (
            user_id,
            title,
            season_start,
            season_end,
            icon
          )
          VALUES (?, ?, ?, ?, ?)
          RETURNING *
        `)
        .bind(
          "local-dev",
          title,
          body.season_start || null,
          body.season_end || null,
          body.icon || null
        )
        .first();

      return Response.json(work, { status: 201 });
    }

    return env.ASSETS.fetch(request);
  },
};

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
// 작품 삭제하기
if (url.pathname.startsWith("/api/works/") && request.method === "DELETE") {
  const id = url.pathname.split("/").pop();

  if (!id) {
    return Response.json(
      { error: "삭제할 작품을 찾을 수 없어요." },
      { status: 400 }
    );
  }

  const result = await env.DB
    .prepare(`
      DELETE FROM works
      WHERE id = ? AND user_id = ?
    `)
    .bind(id, "local-dev")
    .run();

  if (!result.meta.changes) {
    return Response.json(
      { error: "작품을 찾을 수 없어요." },
      { status: 404 }
    );
  }

  return Response.json({ ok: true });
}
    return env.ASSETS.fetch(request);
  },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // D1 작품 목록 테스트 API
    if (url.pathname === "/api/works" && request.method === "GET") {
      const { results } = await env.DB
        .prepare("SELECT * FROM works ORDER BY created_at DESC")
        .all();

      return Response.json(results);
    }

    // 그 외 주소는 기존 HTH 화면 그대로 표시
    return env.ASSETS.fetch(request);
  },
};

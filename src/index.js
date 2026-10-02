const FIREBASE_API_KEY = "AIzaSyCi5EBQCox0Ipo_CSoHS9zhkBeami7sAL4";

class AuthScriptInjector {
  element(element) {
    element.prepend(
      '<script src="/auth.js"></script>',
      { html: true }
    );
  }
}

class AppPatchInjector {
  element(element) {
    element.append(
      '<script src="/app-patch.js"></script>',
      { html: true }
    );
  }
}

function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

async function getFirebaseUser(request) {
  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new Response(
      JSON.stringify({ error: "로그인이 필요해요." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }

  const idToken = match[1].trim();

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ idToken })
    }
  );

  if (!response.ok) {
    throw new Response(
      JSON.stringify({ error: "로그인이 만료되었거나 유효하지 않아요." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }

  const data = await response.json();
  const user = data?.users?.[0];

  if (!user?.localId || user.disabled) {
    throw new Response(
      JSON.stringify({ error: "사용자 정보를 확인할 수 없어요." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8" }
      }
    );
  }

  return {
    uid: user.localId,
    email: user.email || "",
    displayName: user.displayName || ""
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      // 모든 API는 Firebase 로그인 확인 후에만 접근합니다.
      if (url.pathname.startsWith("/api/")) {
        const user = await getFirebaseUser(request);
        const userId = user.uid;

        // 작품 목록 읽기: 로그인한 사용자의 데이터만
        if (url.pathname === "/api/works" && request.method === "GET") {
          const { results } = await env.DB
            .prepare(`
              SELECT *
              FROM works
              WHERE user_id = ?
              ORDER BY created_at DESC
            `)
            .bind(userId)
            .all();

          return Response.json(results);
        }

        // 작품 새로 저장하기
        if (url.pathname === "/api/works" && request.method === "POST") {
          const body = await request.json();
          const title = String(body.title ?? "").trim();

          if (!title) {
            return jsonError("작품명을 입력해 주세요.");
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
              userId,
              title,
              body.season_start || null,
              body.season_end || null,
              body.icon || null
            )
            .first();

          return Response.json(work, { status: 201 });
        }

        // 작품 정보 수정하기: 본인 데이터만
        if (
          url.pathname.startsWith("/api/works/") &&
          request.method === "PATCH"
        ) {
          const id = url.pathname.split("/").pop();
          const body = await request.json();
          const title = String(body.title ?? "").trim();

          if (!title) {
            return jsonError("작품명을 입력해 주세요.");
          }

          const work = await env.DB
            .prepare(`
              UPDATE works
              SET
                title = ?,
                season_start = ?,
                season_end = ?,
                icon = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ? AND user_id = ?
              RETURNING *
            `)
            .bind(
              title,
              body.season_start || null,
              body.season_end || null,
              body.icon || null,
              id,
              userId
            )
            .first();

          if (!work) {
            return jsonError("작품을 찾을 수 없어요.", 404);
          }

          return Response.json(work);
        }

        // 작품 삭제하기: 본인 데이터만
        if (
          url.pathname.startsWith("/api/works/") &&
          request.method === "DELETE"
        ) {
          const id = url.pathname.split("/").pop();

          if (!id) {
            return jsonError("삭제할 작품을 찾을 수 없어요.");
          }

          const result = await env.DB
            .prepare(`
              DELETE FROM works
              WHERE id = ? AND user_id = ?
            `)
            .bind(id, userId)
            .run();

          if (!result.meta.changes) {
            return jsonError("작품을 찾을 수 없어요.", 404);
          }

          return Response.json({ ok: true });
        }

        return jsonError("API 경로를 찾을 수 없어요.", 404);
      }

      const assetResponse = await env.ASSETS.fetch(request);
      const contentType = assetResponse.headers.get("content-type") || "";

      if (contentType.includes("text/html")) {
        return new HTMLRewriter()
          .on("head", new AuthScriptInjector())
          .on("body", new AppPatchInjector())
          .transform(assetResponse);
      }

      return assetResponse;
    } catch (error) {
      if (error instanceof Response) {
        return error;
      }

      console.error(error);
      return jsonError("서버 처리 중 오류가 발생했어요.", 500);
    }
  },
};

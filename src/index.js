const FIREBASE_API_KEY = "AIzaSyCi5EBQCox0Ipo_CSoHS9zhkBeami7sAL4";

class AuthScriptInjector {
  element(element) {
    element.prepend('<script src="/auth.js"></script>', { html: true });
  }
}

class AppPatchInjector {
  element(element) {
    element.append('<script src="/app-patch.js"></script>', { html: true });
  }
}

function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

function asString(value, fallback = "") {
  return value == null ? fallback : String(value);
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
      headers: { "Content-Type": "application/json" },
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

function addBulkInsert(statements, db, table, columns, rows, chunkSize = 40) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const oneRow = `(${columns.map(() => "?").join(",")})`;
    const sql = `
      INSERT INTO ${table} (${columns.join(",")})
      VALUES ${chunk.map(() => oneRow).join(",")}
    `;
    statements.push(
      db.prepare(sql).bind(...chunk.flat())
    );
  }
}

async function getArchive(env, userId) {
  const [
    accountsResult,
    workCastResult,
    viewingsResult,
    viewingCastResult,
    threadsResult,
    threadViewingsResult,
    postsResult,
    mediaResult
  ] = await Promise.all([
    env.DB.prepare(`
      SELECT id, handle, label, is_default, sort_order
      FROM x_accounts
      WHERE user_id = ?
      ORDER BY sort_order ASC, rowid ASC
    `).bind(userId).all(),

    env.DB.prepare(`
      SELECT work_id, actor, role, sort_order
      FROM work_cast
      WHERE user_id = ?
      ORDER BY work_id ASC, sort_order ASC, id ASC
    `).bind(userId).all(),

    env.DB.prepare(`
      SELECT id, work_id, viewing_date, session, theater, created_at
      FROM viewings
      WHERE user_id = ?
      ORDER BY viewing_date DESC, created_at DESC
    `).bind(userId).all(),

    env.DB.prepare(`
      SELECT viewing_id, actor, role, sort_order
      FROM viewing_cast
      WHERE user_id = ?
      ORDER BY viewing_id ASC, sort_order ASC, id ASC
    `).bind(userId).all(),

    env.DB.prepare(`
      SELECT id, work_id, title, author, created_at, source, source_urls_json
      FROM threads
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all(),

    env.DB.prepare(`
      SELECT thread_id, viewing_id, sort_order
      FROM thread_viewings
      WHERE user_id = ?
      ORDER BY thread_id ASC, sort_order ASC
    `).bind(userId).all(),

    env.DB.prepare(`
      SELECT id, thread_id, owner, author, body, quote_author, quote_text, is_context, sort_order
      FROM posts
      WHERE user_id = ?
      ORDER BY thread_id ASC, sort_order ASC
    `).bind(userId).all(),

    env.DB.prepare(`
      SELECT id, post_id, type, url, alt, sort_order
      FROM media
      WHERE user_id = ?
      ORDER BY post_id ASC, sort_order ASC
    `).bind(userId).all()
  ]);

  const viewingCastMap = new Map();
  for (const row of viewingCastResult.results || []) {
    if (!viewingCastMap.has(row.viewing_id)) viewingCastMap.set(row.viewing_id, []);
    viewingCastMap.get(row.viewing_id).push({
      actor: row.actor || "",
      role: row.role || ""
    });
  }

  const mediaMap = new Map();
  for (const row of mediaResult.results || []) {
    if (!mediaMap.has(row.post_id)) mediaMap.set(row.post_id, []);
    mediaMap.get(row.post_id).push({
      id: row.id,
      type: row.type || "link",
      src: row.url,
      alt: row.alt || "",
      source: "url",
      order: Number(row.sort_order || 0)
    });
  }

  const postsMap = new Map();
  for (const row of postsResult.results || []) {
    if (!postsMap.has(row.thread_id)) postsMap.set(row.thread_id, []);

    const post = {
      owner: Boolean(row.owner),
      text: row.body || "",
      media: mediaMap.get(row.id) || []
    };

    if (row.author) post.author = row.author;
    if (row.is_context) post.context = true;
    if (row.quote_text) {
      post.quote = {
        author: row.quote_author || "",
        text: row.quote_text
      };
    }

    postsMap.get(row.thread_id).push(post);
  }

  const threadViewingsMap = new Map();
  for (const row of threadViewingsResult.results || []) {
    if (!threadViewingsMap.has(row.thread_id)) threadViewingsMap.set(row.thread_id, []);
    threadViewingsMap.get(row.thread_id).push(row.viewing_id);
  }

  return {
    accounts: (accountsResult.results || []).map(row => ({
      id: row.id,
      handle: row.handle,
      label: row.label || "",
      isDefault: Boolean(row.is_default)
    })),

    workCast: (workCastResult.results || []).map(row => ({
      workId: row.work_id,
      actor: row.actor || "",
      role: row.role || ""
    })),

    viewings: (viewingsResult.results || []).map(row => ({
      id: row.id,
      workId: row.work_id || "etc",
      date: row.viewing_date,
      session: row.session || "",
      theater: row.theater || "",
      cast: viewingCastMap.get(row.id) || []
    })),

    threads: (threadsResult.results || []).map(row => ({
      id: row.id,
      workId: row.work_id || "etc",
      viewingIds: threadViewingsMap.get(row.id) || [],
      title: row.title,
      author: row.author || "",
      createdAt: row.created_at,
      source: row.source || "manual",
      urls: parseJsonArray(row.source_urls_json),
      posts: postsMap.get(row.id) || []
    }))
  };
}

async function putArchive(env, userId, body) {
  const accounts = Array.isArray(body?.accounts) ? body.accounts : [];
  const workCast = Array.isArray(body?.workCast) ? body.workCast : [];
  const viewings = Array.isArray(body?.viewings) ? body.viewings : [];
  const threads = Array.isArray(body?.threads) ? body.threads : [];

  const statements = [
    env.DB.prepare("DELETE FROM media WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM posts WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM thread_viewings WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM threads WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM viewing_cast WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM viewings WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM work_cast WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM x_accounts WHERE user_id = ?").bind(userId)
  ];

  const accountRows = accounts
    .filter(a => asString(a?.handle).trim())
    .map((a, index) => [
      userId,
      asString(a.id || `account-${index}`),
      asString(a.handle).trim(),
      asString(a.label),
      a.isDefault ? 1 : 0,
      index
    ]);

  addBulkInsert(
    statements,
    env.DB,
    "x_accounts",
    ["user_id", "id", "handle", "label", "is_default", "sort_order"],
    accountRows
  );

  const workCastRows = workCast
    .filter(c => asString(c?.workId).trim() && asString(c?.actor).trim())
    .map((c, index) => [
      userId,
      asString(c.workId),
      asString(c.actor).trim(),
      asString(c.role).trim(),
      Number.isFinite(c.sortOrder) ? c.sortOrder : index
    ]);

  addBulkInsert(
    statements,
    env.DB,
    "work_cast",
    ["user_id", "work_id", "actor", "role", "sort_order"],
    workCastRows
  );

  const viewingRows = [];
  const viewingCastRows = [];

  for (const viewing of viewings) {
    const id = asString(viewing?.id).trim();
    const date = asString(viewing?.date).trim();
    if (!id || !date) continue;

    viewingRows.push([
      userId,
      id,
      viewing?.workId === "etc" ? null : asString(viewing?.workId || "").trim() || null,
      date,
      asString(viewing?.session),
      asString(viewing?.theater)
    ]);

    const cast = Array.isArray(viewing?.cast) ? viewing.cast : [];
    cast.forEach((member, index) => {
      const actor = asString(member?.actor).trim();
      if (!actor) return;
      viewingCastRows.push([
        userId,
        id,
        actor,
        asString(member?.role).trim(),
        index
      ]);
    });
  }

  addBulkInsert(
    statements,
    env.DB,
    "viewings",
    ["user_id", "id", "work_id", "viewing_date", "session", "theater"],
    viewingRows
  );

  addBulkInsert(
    statements,
    env.DB,
    "viewing_cast",
    ["user_id", "viewing_id", "actor", "role", "sort_order"],
    viewingCastRows
  );

  const threadRows = [];
  const threadViewingRows = [];
  const postRows = [];
  const mediaRows = [];

  for (const thread of threads) {
    const threadId = asString(thread?.id).trim();
    const title = asString(thread?.title).trim();
    if (!threadId || !title) continue;

    threadRows.push([
      userId,
      threadId,
      thread?.workId === "etc" ? null : asString(thread?.workId || "").trim() || null,
      title,
      asString(thread?.author),
      asString(thread?.createdAt || new Date().toISOString()),
      asString(thread?.source || "manual"),
      JSON.stringify(Array.isArray(thread?.urls) ? thread.urls : [])
    ]);

    const viewingIds = Array.isArray(thread?.viewingIds) ? thread.viewingIds : [];
    viewingIds.forEach((viewingId, index) => {
      const id = asString(viewingId).trim();
      if (!id) return;
      threadViewingRows.push([userId, threadId, id, index]);
    });

    const posts = Array.isArray(thread?.posts) ? thread.posts : [];
    posts.forEach((post, postIndex) => {
      const postId = `${threadId}:p:${postIndex}`;

      postRows.push([
        userId,
        postId,
        threadId,
        post?.owner ? 1 : 0,
        asString(post?.author),
        asString(post?.text),
        asString(post?.quote?.author),
        asString(post?.quote?.text),
        post?.context ? 1 : 0,
        postIndex
      ]);

      const media = Array.isArray(post?.media) ? post.media : [];
      let mediaOrder = 0;

      for (const item of media) {
        const url = asString(item?.src).trim();
        if (!/^https?:\/\//i.test(url)) continue;

        mediaRows.push([
          userId,
          `${postId}:m:${mediaOrder}`,
          postId,
          "link",
          url,
          asString(item?.alt),
          mediaOrder
        ]);
        mediaOrder++;
      }
    });
  }

  addBulkInsert(
    statements,
    env.DB,
    "threads",
    ["user_id", "id", "work_id", "title", "author", "created_at", "source", "source_urls_json"],
    threadRows
  );

  addBulkInsert(
    statements,
    env.DB,
    "thread_viewings",
    ["user_id", "thread_id", "viewing_id", "sort_order"],
    threadViewingRows
  );

  addBulkInsert(
    statements,
    env.DB,
    "posts",
    ["user_id", "id", "thread_id", "owner", "author", "body", "quote_author", "quote_text", "is_context", "sort_order"],
    postRows
  );

  addBulkInsert(
    statements,
    env.DB,
    "media",
    ["user_id", "id", "post_id", "type", "url", "alt", "sort_order"],
    mediaRows
  );

  await env.DB.batch(statements);
  return { ok: true };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/")) {
        const user = await getFirebaseUser(request);
        const userId = user.uid;

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

        if (url.pathname === "/api/works" && request.method === "POST") {
          const body = await request.json();
          const title = asString(body?.title).trim();

          if (!title) return jsonError("작품명을 입력해 주세요.");

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
              body?.season_start || null,
              body?.season_end || null,
              body?.icon || null
            )
            .first();

          return Response.json(work, { status: 201 });
        }

        if (
          url.pathname.startsWith("/api/works/") &&
          request.method === "PATCH"
        ) {
          const id = url.pathname.split("/").pop();
          const body = await request.json();
          const title = asString(body?.title).trim();

          if (!title) return jsonError("작품명을 입력해 주세요.");

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
              body?.season_start || null,
              body?.season_end || null,
              body?.icon || null,
              id,
              userId
            )
            .first();

          if (!work) return jsonError("작품을 찾을 수 없어요.", 404);
          return Response.json(work);
        }

        if (
          url.pathname.startsWith("/api/works/") &&
          request.method === "DELETE"
        ) {
          const id = url.pathname.split("/").pop();

          if (!id) return jsonError("삭제할 작품을 찾을 수 없어요.");

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

        if (url.pathname === "/api/archive" && request.method === "GET") {
          return Response.json(await getArchive(env, userId));
        }

        if (url.pathname === "/api/archive" && request.method === "PUT") {
          const body = await request.json();
          return Response.json(await putArchive(env, userId, body));
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
      if (error instanceof Response) return error;

      console.error(error);
      return jsonError("서버 처리 중 오류가 발생했어요.", 500);
    }
  }
};

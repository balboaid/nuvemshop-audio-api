/* src/index.js */

const ALLOWED_ORIGIN = "*"; // domínio da NuvemShop

async function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key"
    }
  });
}

export default {
  async fetch(request, env) {
    try {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-api-key"
          }
        });
      }

      const url = new URL(request.url);
      const pathname = url.pathname;

      // ============================
      // GET /admin  → retorna painel HTML
      // ============================
      if (pathname === "/admin" && request.method === "GET") {
        const html = await env.ASSETS.get("admin.html");
        return new Response(html, {
          headers: { "Content-Type": "text/html;charset=UTF-8" }
        });
      }

      // ============================
      // GET /api/previews?product_id=123
      // ============================
      if (pathname === "/api/previews" && request.method === "GET") {
        const product_id = url.searchParams.get("product_id");

        if (!product_id) {
          return jsonResponse({ error: "missing product_id" }, 400);
        }

        const query = await env.previews_db
          .prepare(
            "SELECT id, product_id, audio_url, title, track_number, created_at FROM product_previews WHERE product_id = ? ORDER BY track_number ASC, id ASC"
          )
          .bind(product_id)
          .all();

        return jsonResponse({ previews: query.results || [] });
      }

      // ============================
      // POST /api/previews
      // ============================
      if (pathname === "/api/previews" && request.method === "POST") {
        const apiKey = request.headers.get("x-api-key");
        if (!apiKey || apiKey !== env.PREVIEW_API_KEY) {
          return jsonResponse({ error: "unauthorized" }, 401);
        }

        let payload;
        try {
          payload = await request.json();
        } catch {
          return jsonResponse({ error: "invalid json" }, 400);
        }

        const { product_id, audio_url, title = null, track_number = null } = payload;

        if (!product_id || !audio_url) {
          return jsonResponse({ error: "product_id and audio_url required" }, 400);
        }

        const result = await env.previews_db
          .prepare(
            "INSERT INTO product_previews (product_id, audio_url, title, track_number) VALUES (?, ?, ?, ?)"
          )
          .bind(product_id, audio_url, title, track_number)
          .run();

        return jsonResponse({
          success: true,
          insertedId: result.lastRowId || null
        });
      }

      // ============================
      // PUT /api/previews/:id
      // ============================
      if (pathname.startsWith("/api/previews/") && request.method === "PUT") {
        const apiKey = request.headers.get("x-api-key");
        if (!apiKey || apiKey !== env.PREVIEW_API_KEY) {
          return jsonResponse({ error: "unauthorized" }, 401);
        }

        const id = pathname.split("/").pop();

        let payload;
        try {
          payload = await request.json();
        } catch {
          return jsonResponse({ error: "invalid json" }, 400);
        }

        const { audio_url, title, track_number } = payload;

        const fields = [];
        const values = [];

        if (audio_url !== undefined) {
          fields.push("audio_url = ?");
          values.push(audio_url);
        }
        if (title !== undefined) {
          fields.push("title = ?");
          values.push(title);
        }
        if (track_number !== undefined) {
          fields.push("track_number = ?");
          values.push(track_number);
        }

        if (fields.length === 0) {
          return jsonResponse({ error: "no fields to update" }, 400);
        }

        values.push(id);

        const sql = `UPDATE product_previews SET ${fields.join(", ")} WHERE id = ?`;

        const result = await env.previews_db.prepare(sql).bind(...values).run();

        return jsonResponse({
          success: true,
          updated: result.changes
        });
      }

      // ============================
      // DELETE /api/previews/:id
      // ============================
      if (pathname.startsWith("/api/previews/") && request.method === "DELETE") {
        const apiKey = request.headers.get("x-api-key");
        if (!apiKey || apiKey !== env.PREVIEW_API_KEY) {
          return jsonResponse({ error: "unauthorized" }, 401);
        }

        const id = pathname.split("/").pop();

        const result = await env.previews_db
          .prepare("DELETE FROM product_previews WHERE id = ?")
          .bind(id)
          .run();

        return jsonResponse({
          success: true,
          deleted: result.changes
        });
      }

      // rota não encontrada
      return new Response("Not Found", { status: 404 });
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
};

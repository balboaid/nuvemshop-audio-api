const ALLOWED_ORIGIN = "*"; // domínio da NuvemShop

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    }
  });
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-api-key",
          }
        });
      }

      // -----------------------------------------------------
      // GET /api/previews?product_id=123
      // -----------------------------------------------------
      if (pathname === "/api/previews" && request.method === "GET") {
        const productId = url.searchParams.get("product_id");

        if (!productId) {
          return jsonResponse({ error: "product_id is required" }, 400);
        }

        const query = `
          SELECT id, product_id, audio_url, title, track_number, created_at
          FROM product_previews
          WHERE product_id = ?
          ORDER BY track_number ASC, id ASC
        `;

        const stmt = env.previews_db.prepare(query);
        const result = await stmt.bind(productId).all();

        return jsonResponse({ previews: result.results || [] });
      }

      // -----------------------------------------------------
      // POST /api/previews (com x-api-key)
      // -----------------------------------------------------
      if (pathname === "/api/previews" && request.method === "POST") {

        const apiKeyHeader = request.headers.get("x-api-key");
        if (!apiKeyHeader || apiKeyHeader !== env.PREVIEW_API_KEY) {
          return jsonResponse({ error: "unauthorized" }, 401);
        }

        let payload;
        try {
          payload = await request.json();
        } catch (e) {
          return jsonResponse({ error: "invalid json" }, 400);
        }

        const { product_id, audio_url, title = null, track_number = null } = payload;

        if (!product_id || !audio_url) {
          return jsonResponse({
            error: "product_id and audio_url are required"
          }, 400);
        }

        const insertQuery = `
          INSERT INTO product_previews (product_id, audio_url, title, track_number)
          VALUES (?, ?, ?, ?)
        `;

        const insert = await env.previews_db.prepare(insertQuery)
          .bind(product_id, audio_url, title, track_number)
          .run();

        return jsonResponse({
          success: true,
          insertedId: insert.lastRowId || null
        });
      }

      // -----------------------------------------------------
      // Default 404
      // -----------------------------------------------------
      return new Response("Not Found", { status: 404 });

    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
    }
  }
};

// ========================================================================================
//  CORS + JSON Response Helper
// ========================================================================================

const ALLOWED_ORIGIN = "*"; // Later change to the Nuvemshop domain

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

// ========================================================================================
//  WORKER ENTRYPOINT
// ========================================================================================

export default {
  async fetch(request, env) {
    try {
      // ------------------------------------------------------
      //  CORS PREFLIGHT (OPTIONS)
      // ------------------------------------------------------
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

      // ====================================================================================
      //  GET PREVIEWS - REST STYLE (/api/previews/:product_id)
      // ====================================================================================
      if (pathname.startsWith("/api/previews/") && request.method === "GET") {
        const productId = pathname.split("/").pop();

        if (!productId) {
          return jsonResponse({ error: "Product ID is required" }, 400);
        }

        const stmt = env.previews_db.prepare(
          "SELECT * FROM product_previews WHERE product_id = ? ORDER BY track_number ASC"
        );
        const result = await stmt.bind(productId).all();

        return jsonResponse(result.results);
      }

      // ====================================================================================
      //  GET PREVIEWS (legacy) /api/previews?product_id=xxxx
      // ====================================================================================
      if (pathname === "/api/previews" && request.method === "GET") {
        const productId = url.searchParams.get("product_id");

        if (!productId) {
          return jsonResponse({ error: "product_id is required" }, 400);
        }

        const stmt = env.previews_db.prepare(
          "SELECT * FROM product_previews WHERE product_id = ? ORDER BY track_number ASC"
        );
        const result = await stmt.bind(productId).all();

        return jsonResponse(result.results);
      }

      // ====================================================================================
      //  CREATE PREVIEW - POST /api/previews
      // ====================================================================================
      if (pathname === "/api/previews" && request.method === "POST") {
        const apiKey = request.headers.get("x-api-key");

        if (apiKey !== env.PREVIEW_API_KEY) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const body = await request.json();
        const { product_id, title, audio_url, track_number } = body;

        if (!product_id || !title || !audio_url) {
          return jsonResponse({
            error: "product_id, title and audio_url are required"
          }, 400);
        }

        await env.previews_db.prepare(
          "INSERT INTO product_previews (product_id, title, audio_url, track_number) VALUES (?, ?, ?, ?)"
        )
        .bind(product_id, title, audio_url, track_number || 1)
        .run();

        return jsonResponse({ success: true, message: "Preview created" });
      }

      // ====================================================================================
      //  UPDATE PREVIEW - PUT /api/previews/:id
      // ====================================================================================
      if (pathname.startsWith("/api/previews/") && request.method === "PUT") {
        const apiKey = request.headers.get("x-api-key");

        if (apiKey !== env.PREVIEW_API_KEY) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const id = pathname.split("/").pop();
        const { title, audio_url, track_number } = await request.json();

        await env.previews_db.prepare(
          "UPDATE product_previews SET title = ?, audio_url = ?, track_number = ? WHERE id = ?"
        )
        .bind(title, audio_url, track_number || 1, id)
        .run();

        return jsonResponse({ success: true, message: "Preview updated" });
      }

      // ====================================================================================
      //  DELETE PREVIEW - DELETE /api/previews/:id
      // ====================================================================================
      if (pathname.startsWith("/api/previews/") && request.method === "DELETE") {
        const apiKey = request.headers.get("x-api-key");

        if (apiKey !== env.PREVIEW_API_KEY) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }

        const id = pathname.split("/").pop();

        await env.previews_db.prepare(
          "DELETE FROM product_previews WHERE id = ?"
        )
        .bind(id)
        .run();

        return jsonResponse({ success: true, message: "Preview deleted" });
      }

      // ====================================================================================
      //  NOT FOUND
      // ====================================================================================
      return jsonResponse({ error: "Not Found" }, 404);

    } catch (error) {
      return jsonResponse(
        { error: error.message, stack: error.stack },
        500
      );
    }
  }
};

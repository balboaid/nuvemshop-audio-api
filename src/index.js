export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (url.pathname === "/api/previews") {
        const productId = url.searchParams.get("product_id");

        if (!productId) {
          return new Response(
            JSON.stringify({ error: "product_id is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // USE O NOME EXATO DO BINDING DEFINIDO NO wrangler.jsonc
        const stmt = env.previews_db.prepare(
          "SELECT * FROM product_previews WHERE product_id = ?"
        );

        const result = await stmt.bind(productId).all();

        return new Response(
          JSON.stringify(result.results),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("Not Found", { status: 404 });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};

export async function getPreviews(request, env) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id");

  if (!productId) {
    return new Response(
      JSON.stringify({ error: "product_id is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { results } = await env.DB.prepare(
    "SELECT * FROM product_previews WHERE product_id = ? ORDER BY track_number ASC"
  )
    .bind(productId)
    .all();

  return new Response(JSON.stringify(results), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

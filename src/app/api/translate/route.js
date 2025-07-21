export async function POST(req) {
  try {
    const { q, target } = await req.json();

    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q,
        source: "en",
        target,
        format: "text",
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ translatedText: data.translatedText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("API Error:", err);
    return new Response(JSON.stringify({ error: "Failed to translate" }), {
      status: 500,
    });
  }
}

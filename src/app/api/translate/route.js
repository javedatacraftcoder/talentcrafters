export async function POST(req) {
  try {
    const { q, target } = await req.json();

    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q,
        source: "en",
        target,
        format: "text"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: "Translation failed", details: errorText }), {
        status: 500
      });
    }

    const result = await response.json();
    return new Response(JSON.stringify({ translatedText: result.translatedText }), {
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", details: err.message }), {
      status: 500
    });
  }
}

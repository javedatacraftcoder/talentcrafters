export async function POST(req) {
  try {
    const body = await req.json();

    const libreRes = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: body.q,
        source: body.source,
        target: body.target,
        format: "text",
      }),
    });

    const data = await libreRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
    });
  }
}

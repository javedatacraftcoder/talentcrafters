import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.q || !body.source || !body.target) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const libreRes = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: body.q,
        source: body.source,
        target: body.target,
        format: "text"
      }),
    });

    if (!libreRes.ok) {
      const errText = await libreRes.text();
      return NextResponse.json({ error: `LibreTranslate error: ${errText}` }, { status: libreRes.status });
    }

    const data = await libreRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

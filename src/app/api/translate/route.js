// src/app/api/translate/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

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

    if (!libreRes.ok) {
      return NextResponse.json({ error: "Failed to translate" }, { status: libreRes.status });
    }

    const data = await libreRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import translate from "google-translate-open-api";

export async function POST(req) {
  const { text, targetLang } = await req.json();

  try {
    const result = await translate(text, {
      tld: "com",
      to: targetLang,
    });

    const translatedText = result.data[0];
    return NextResponse.json({ translated: translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}

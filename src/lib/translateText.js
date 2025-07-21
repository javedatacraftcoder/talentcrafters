export async function translateText(text, targetLang = "fr", sourceLang = "en") {
  const response = await fetch("https://libretranslate.de/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text"
    })
  });

  if (!response.ok) {
    console.error("Error translating:", await response.text());
    return text; // fallback
  }

  const data = await response.json();
  return data.translatedText;
}

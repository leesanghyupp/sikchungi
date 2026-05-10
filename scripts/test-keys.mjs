import { GoogleGenAI } from "@google/genai";

async function testGemini() {
  console.log("\n🧪 [1/2] Gemini API 키 테스트 중...");
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "너는 '식충이'라는 잼민이 톤 음식 추천 캐릭터야. 딱 한 줄로 자기소개해줘.",
  });
  console.log("✅ Gemini 응답:", response.text?.trim());
}

async function testUnsplash() {
  console.log("\n🧪 [2/2] Unsplash API 키 테스트 중...");
  const res = await fetch(
    "https://api.unsplash.com/search/photos?query=kimchi+stew&per_page=1",
    {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Unsplash 응답 실패 (${res.status} ${res.statusText})`);
  }
  const data = await res.json();
  const first = data.results?.[0];
  if (!first) throw new Error("검색 결과가 비어있음");
  console.log("✅ Unsplash 응답:");
  console.log("   이미지 URL:", first.urls.regular);
  console.log("   설명:", first.alt_description ?? "(설명 없음)");
}

(async () => {
  try {
    if (!process.env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY 미설정");
    if (!process.env.UNSPLASH_ACCESS_KEY) throw new Error("UNSPLASH_ACCESS_KEY 미설정");

    await testGemini();
    await testUnsplash();

    console.log("\n🎉 두 키 모두 정상 동작!");
  } catch (e) {
    console.error("\n❌ 실패:", e.message);
    process.exit(1);
  }
})();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url: videoUrl } = req.query;
  if (!videoUrl) return res.status(400).json({ success: false, message: "URL missing" });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25 sec timeout

    const apiRes = await fetch(
      "https://batgpt.vercel.app/api/alldl?url=" + encodeURIComponent(videoUrl),
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const data = await apiRes.json();
    console.log("RAW:", JSON.stringify(data).substring(0, 300));

    if (!data.success || !data.mediaInfo) {
      throw new Error(data.message || "API ne kuch nahi diya");
    }

    return res.status(200).json({ success: true, mediaInfo: data.mediaInfo });

  } catch (e) {
    if (e.name === "AbortError") {
      return res.status(503).json({ success: false, message: "API timeout ho gayi — dobara try karo!" });
    }
    return res.status(503).json({ success: false, message: "Error: " + e.message });
  }
}

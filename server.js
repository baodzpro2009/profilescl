const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

let CLIENT_ID = null;
let lastUpdate = 0;

// ===== AUTO GET CLIENT ID =====
async function getClientId() {
  // cache 1 tiếng
  if (CLIENT_ID && Date.now() - lastUpdate < 60 * 60 * 1000) {
    return CLIENT_ID;
  }

  try {
    console.log("🔄 Đang lấy client_id mới...");

    const html = await axios.get("https://soundcloud.com").then(r => r.data);

    // tìm file js chứa client_id
    const scriptUrls = [...html.matchAll(/https:\/\/a-v2\.sndcdn\.com\/assets\/.+?\.js/g)]
      .map(m => m[0]);

    for (let url of scriptUrls) {
      try {
        const js = await axios.get(url).then(r => r.data);

        const match = js.match(/client_id:"([a-zA-Z0-9]+)"/);
        if (match) {
          CLIENT_ID = match[1];
          lastUpdate = Date.now();
          console.log("✅ Lấy client_id:", CLIENT_ID);
          return CLIENT_ID;
        }
      } catch {}
    }

  } catch (e) {
    console.log("❌ Lỗi lấy client_id:", e.message);
  }

  throw new Error("Không lấy được client_id");
}

// ===== SEARCH =====
app.get("/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);

  try {
    const client_id = await getClientId();

    const { data } = await axios.get(
      "https://api-v2.soundcloud.com/search/tracks",
      {
        params: {
          q,
          client_id,
          limit: 5
        }
      }
    );

    const tracks = data.collection.map(t => ({
      title: t.title,
      user: t.user.username,
      stream: t.media?.transcodings?.[0]?.url
    }));

    res.json(tracks);
  } catch (e) {
    console.log("❌ SEARCH ERROR:", e.message);
    res.json([]);
  }
});

// ===== STREAM =====
app.get("/stream", async (req, res) => {
  try {
    const client_id = await getClientId();

    const { data } = await axios.get(req.query.url, {
      params: { client_id }
    });

    res.redirect(data.url);
  } catch (e) {
    console.log("❌ STREAM ERROR:", e.message);
    res.send("Không phát được");
  }
});

app.listen(3000, () => console.log("🚀 Auto SCL server chạy"));

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();

// Use ES Modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 3000;
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
const MODEL_NAME = "gemini-2.5-flash-image-preview";
const API_ENDPOINT = `${API_BASE_URL}${MODEL_NAME}:generateContent`;

// POST endpoint to generate image
app.post("/generate", async (req, res) => {
  try {
    const { promptText, base64Image, mimeType } = req.body;
    const apiKey = process.env.NANO_BANANA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API key is missing from the server configuration." });
    }

    const payloadParts = [];
    if (promptText) payloadParts.push({ text: promptText });
    if (base64Image && mimeType) {
      payloadParts.push({
        inlineData: {
          mimeType,
          data: base64Image,
        },
      });
    }

    const payload = {
      contents: [{ parts: payloadParts }],
    };

    const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({ error: errData.error?.message || "API error" });
    }

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Serve the index.html file on the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

let qvac, modelId, modelStatus = "loading", modelError = "";

// -------------------- LOAD QVAC MODEL --------------------

async function initModel() {
  try {
    qvac = await import("@qvac/sdk");

    const modelSrc =
      qvac.LLAMA_3_2_1B_INST_Q4_0 ??
      qvac.LLAMA_3_2_1B_INSTRUCT_Q4_0 ??
      qvac.LLAMA_3_2_1B_Q4_0;

    if (!modelSrc || typeof qvac.loadModel !== "function") {
      throw new Error("QVAC model export or loadModel not found.");
    }

    const loaded = await qvac.loadModel({ modelSrc });

    modelId = loaded?.modelId ?? loaded?.id ?? loaded;

    if (!modelId) {
      throw new Error("QVAC did not return a model ID.");
    }

    modelStatus = "ready";
    console.log("VocabGrow AI: QVAC local model loaded.");

  } catch (e) {
    modelStatus = "error";
    modelError = e?.message || String(e);

    console.error("QVAC model initialization failed:", modelError);
  }
}

// -------------------- QVAC TEXT GENERATION --------------------

async function generateText(prompt) {
  const result = await qvac.completion({
    modelId,
    history: [
      {
        role: "user",
        content: prompt
      }
    ],
    stream: true
  });

  if (!result?.tokenStream) {
    throw new Error(
      "QVAC did not return a token stream. Check the installed SDK response format."
    );
  }

  let answer = "";

  for await (const token of result.tokenStream) {
    answer += typeof token === "string"
      ? token
      : token?.text ?? "";
  }

  if (!answer.trim()) {
    throw new Error("QVAC returned an empty answer.");
  }

  return answer.trim();
}

// -------------------- MODEL STATUS --------------------

app.get("/api/status", (_req, res) => {
  res.json({
    status: modelStatus,
    message:
      modelStatus === "ready"
        ? "Local AI is ready."
        : modelStatus === "error"
          ? modelError
          : "Loading local AI…"
  });
});

// -------------------- VOCABULARY COACH --------------------

app.post("/api/coach", async (req, res) => {
  const word = String(req.body?.word ?? "")
    .trim()
    .slice(0, 100);

  const level = String(req.body?.level ?? "Intermediate")
    .slice(0, 30);

  if (!word) {
    return res.status(400).json({
      error: "Enter a word to learn."
    });
  }

  if (modelStatus !== "ready") {
    return res.status(503).json({
      error: "Local QVAC model is not ready.",
      detail: modelError || "Wait for model loading."
    });
  }

  const prompt = `
You are VocabGrow AI, a friendly English vocabulary tutor.

Explain the word "${word}" for a ${level} English learner.

Use these headings:

Meaning:
Part of speech:
Simple example:
Synonyms:
Antonyms:
Memory tip:

Keep the explanation clear, useful, and easy to understand.
If context changes the meaning, mention that.
`;

  try {
    const answer = await generateText(prompt);

    res.json({
      answer,
      source: "on-device QVAC model"
    });

  } catch (e) {
    console.error("Coach error:", e);

    res.status(500).json({
      error: "Local AI vocabulary generation failed.",
      detail: e?.message || String(e)
    });
  }
});

// -------------------- VOCABULARY QUIZ --------------------

app.post("/api/quiz", async (req, res) => {
  const words = Array.isArray(req.body?.words)
    ? req.body.words
        .slice(0, 20)
        .map(w => String(w).slice(0, 100))
    : [];

  if (!words.length) {
    return res.status(400).json({
      error: "Save at least one word first."
    });
  }

  if (modelStatus !== "ready") {
    return res.status(503).json({
      error: "Local QVAC model is not ready.",
      detail: modelError || "Wait for model loading."
    });
  }

  const prompt = `
You are VocabGrow AI, an English vocabulary tutor.

Create a 5-question vocabulary quiz using these words only:

${words.join(", ")}

Include a mix of:
1. Multiple-choice meaning questions
2. Fill-in-the-blank questions

Give four options for multiple-choice questions.
Include the answer key at the end.
Keep the quiz clear and easy to follow.
`;

  try {
    const answer = await generateText(prompt);

    res.json({
      answer,
      source: "on-device QVAC model"
    });

  } catch (e) {
    console.error("Quiz error:", e);

    res.status(500).json({
      error: "Local AI quiz generation failed.",
      detail: e?.message || String(e)
    });
  }
});

// -------------------- FRONTEND --------------------

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------- START SERVER --------------------

app.listen(PORT, () => {
  console.log(`VocabGrow AI: http://localhost:${PORT}`);
  initModel();
});
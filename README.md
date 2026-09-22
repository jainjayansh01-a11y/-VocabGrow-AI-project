# VocabGrow AI 🌱

A private, local-first vocabulary coach powered by QVAC. Learn words, explore meanings and examples, save a personal wordbook, and practise with AI-generated quizzes.

## Features
- Learner-friendly word explanations with part of speech, examples, synonyms, antonyms, and a memory tip
- Browser-based wordbook (local storage)
- AI-generated quiz based on saved words
- Responsive, clean dashboard
- QVAC local inference; no external AI API key

## Run locally
1. Extract this ZIP and open the `VocabGrow-AI` folder in VS Code.
2. In Terminal, run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Use Node.js 20+. The first model load may take time and can require model assets. Keep the terminal running.

## QVAC note
The server calls `loadModel()` and `completion()` from `@qvac/sdk`. Model export names and runtime support can vary by SDK version/platform. This starter has not been verified on every device. If model loading fails, check the first error in the terminal and confirm the SDK's supported model export for your environment.

## Structure
`server.js` — QVAC + Express API  
`public/index.html` — app interface  
`public/styles.css` — styling  
`public/app.js` — wordbook and UI logic

## Privacy
Saved words remain in this browser's local storage. AI requests go to your local Node server and are processed by the configured QVAC model. No cloud AI endpoint or external vocabulary service is used.

## Before submitting/publishing
Test local inference on your machine, verify SDK compatibility, add at least 3 meaningful commits authored by you, and capture screenshots or a demo recording. `node_modules/` is excluded from Git.

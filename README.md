# ReplyCraft AI

A privacy-first AI writing assistant that drafts email, customer-support, and everyday message replies using an on-device QVAC model.

## Features
- Draft replies from pasted messages
- Select purpose, tone, and length
- Add custom instructions
- Copy and regenerate drafts
- Responsive browser UI with a Node/Express backend
- No external AI API key configured; inference is intended to run locally with QVAC

## Requirements
Node.js 18+, npm, and a system supported by the installed `@qvac/sdk` runtime.

## Run locally
```bash
npm install
npm start
```
Open http://localhost:3000. The first startup may take time while the model initializes. Check the status pill and server terminal.

## QVAC integration
`server.js` imports `@qvac/sdk`, calls `loadModel(...)`, and sends prompts through `completion(...)`. SDK model exports/runtime support may vary by release and operating system. Test on your machine and adjust the model export/API calls to match current QVAC SDK documentation before presenting the project as verified.

## Demo flow
1. Start the app and wait for “Local AI ready”.
2. Paste a sample message, select purpose/tone/length, and generate.
3. Edit or copy the draft.
4. Explain the local inference design and show model status.

AI-generated text can be inaccurate. Review before sending.

## License
Apache-2.0. See `LICENSE`.

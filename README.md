# SceneCraft Backend

AI-Powered Interactive Story Analysis Platform Backend.

## Prerequisites

Before running the application, make sure you configure the environment variables correctly.

## Environment Configuration

Create a `.env` file at the root of the project (you can copy `.env.example` as a template) and configure the following variables:

### AI Provider Settings (Gemini)

- **`AI_PROVIDER`**: Set to `gemini` (default).
- **`GEMINI_API_KEY`**: Your Google Gemini API Key.
- **`EMBEDDING_MODEL`**: Set to `text-embedding-004` (default).

### Other AI Providers (Optional)

- **`OPENAI_API_KEY`**: Required if `AI_PROVIDER` is set to `openai`.

## Verification / Testing

You can verify that your Gemini credentials and the AI service layer are configured correctly by running the ping script:

```bash
npm run ai:ping
```

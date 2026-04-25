# Backend Agent Requirements

## Tech Stack
- **Runtime**: Node.js (TypeScript)
- **Framework**: Express (for API)
- **AI**: Google Vertex AI SDK (Gemini 1.5 Flash)
- **Infrastructure**: Cloud Run / Cloud Functions
- **Database/Storage**: Firebase Admin SDK (Firestore, GCS)
- **Messaging**: Google Cloud Pub/Sub

## Core Responsibilities
1. **Pub/Sub Triggered Worker**:
   - Listen for new meal document events.
   - Extract the `imageUrl` and `timestamp` (for time-of-day context).
2. **Multimodal Analysis (Gemini)**:
   - Construct an expert nutritional & psychiatric prompt.
   - Analyze the image for:
     - Caloric and macro estimation.
     - Mental health impacts: Focus impact, Sugar crash risk, Inflammation, Sleep hygiene, Gut-brain axis health.
   - Pass the `timestamp` to the model so it can adjust advice based on the time of day (e.g., "High sugar at night disrupts sleep" vs "Good morning fuel").
3. **Firestore Synchronization**:
   - Update the meal document with `status: 'completed'`.
   - Store the structured analysis JSON.
4. **Security**: Ensure all operations use Service Account credentials and respect user data privacy.

## Coding Standards
- Implement robust error handling for AI API failures.
- Use environment variables for all sensitive configuration.
- Log processing steps clearly for debugging.
- Ensure the JSON schema returned by Gemini matches the frontend `Meal` interface.

## Prompt Engineering Requirements
The worker must instruct Gemini to:
- Be concise but medically/scientifically grounded.
- Avoid generic advice; use the specific meal contents.
- Format output as a strictly valid JSON.

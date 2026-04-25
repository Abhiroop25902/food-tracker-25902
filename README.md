# Mental Health & Nutrition App (Google Hackathon)

This project is a **vibe coded** application built with 🚀 **JetBrains Air** and **Gemini**.

## Architecture
- **Frontend**: React (Vite, TS, Tailwind)
- **Backend API**: Node.js (Express, Firebase Admin)
- **Worker**: Cloud Run/Function (Vertex AI Gemini 1.5 Flash)
- **Database**: Firestore
- **Storage**: GCS (Firebase Storage)
- **Messaging**: Pub/Sub

## Flow
1. User logs in via Google Auth.
2. User uploads food photo.
3. Photo stored in Firebase Storage.
4. Backend creates a Firestore doc with `imageUrl`, `userId`, and `timestamp`.
5. Backend publishes a message to Pub/Sub.
6. Worker pulls/receives message, uses Gemini to analyze image.
7. Worker updates Firestore doc with:
   - Macros (Fat, Carbs, Calories, Protein)
   - Mental Health Insights (Sugar crash risk, Drowsiness, Mood impact)
8. Frontend listens to Firestore doc and displays results.

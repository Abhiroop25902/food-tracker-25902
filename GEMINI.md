# Mental Health & Nutrition App - Hackathon Progress Checkpoint

## Project Overview
An app for a Google Hackathon where users photograph food to track both macros and mental health impacts (sugar crashes, focus, mood, sleep, and gut health).

## Tech Stack
- **Frontend**: React 19 (Vite, TS), Tailwind v4, Lucide React, Firebase SDK.
- **Backend**: Node.js Express (TS), Firebase Admin SDK, GCP Pub/Sub SDK, Axios.
- **AI**: Gemini 1.5 Flash (via Vertex AI SDK).
- **GCP Resources**: Cloud Pub/Sub (Topic: `meal-analysis`, Subscription: `meal-analysis-sub`), Vertex AI.
- **Firebase**: Auth (Google), Firestore (Collection: `meals`), Storage (Bucket: `food-pics`).

## Configuration
- **Project ID**: `food-tracker-25902`
- **Frontend Port**: 5173
- **Backend Port**: 8080 (Cloud Run compatible)
- **Local Dev**: Backend includes a local Pub/Sub subscriber in `src/index.ts` to process tasks immediately.
- **Service Account**: Local backend uses `backend/service-account.json` (ignored by git).
- **Storage Bucket**: `food-tracker-25902.firebasestorage.app`

## Current Progress
- [x] **Frontend UI**: Dashboard with real-time Firestore listeners, Upload component with Firebase Storage integration.
- [x] **Backend API**: `POST /api/meals` saves metadata to Firestore and triggers Pub/Sub.
- [x] **AI Worker**: Gemini 1.5 Flash prompt designed to analyze images for 5+ mental health dimensions + macros.
- [x] **Cloud Run Worker**: Created a dedicated Pub/Sub push subscriber in `worker/` for scalable analysis.
- [x] **Cloud Deployment**: 
    - [x] Backend API deployed to `https://meal-api-527102117645.us-central1.run.app`.
    - [x] Worker deployed to `https://meal-worker-527102117645.us-central1.run.app`.
    - [x] Pub/Sub configured for push delivery to the worker.
- [x] **E2E Flow**: Local and cloud development flows are fully wired.
- [x] **Security Fixes**: 
    - [x] Updated `firestore.rules` to restrict data access to the owner.
    - [x] Created `storage.rules` for per-user folder isolation (`food-pics/{userId}/`).
    - [x] Configured Firestore composite index for `userId` + `timestamp` ordering.
- [x] **Infrastructure**:
    - [x] Set up `cors.json` for GCS local development.
    - [x] Configured `backend/.env` with absolute path to service account.
    - [x] Updated `.gitignore` to protect sensitive `.json` and `.env` files.
    - [x] Set up Cloud Run and Artifact Registry in `us-central1`.
- [x] **Bug Fixes**: 
    - [x] Fixed Vertex AI SDK typo (`inline_data` -> `inlineData`).
    - [x] Added `.dockerignore` and fixed Dockerfile build issues.
    - [x] Updated frontend `BACKEND_URL` to point to production.
    - [x] Fixed TypeScript linting errors in `Dashboard.tsx` (unused icon imports).
- [x] **CI/CD & GitHub**:
    - [x] Set up GitHub Actions for automated deployment:
        - `deploy-backend.yml`: Deploys Backend API to Cloud Run on changes to `backend/**`.
        - `deploy-worker.yml`: Deploys Worker to Cloud Run on changes to `worker/**`.
        - `firebase-hosting-merge.yml`: Deploys Frontend to Firebase Hosting on changes to `frontend/**`.
    - [x] Configured all workflows to use Node.js 24 runners (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`).
    - [x] Pushed codebase to GitHub repository: `https://github.com/Abhiroop25902/food-tracker-25902.git`.
- [x] **Security**:
    - [x] Patched Dependabot alerts by updating `uuid` to `>=14.0.0` and `@tootallnate/once` to `>=3.0.1`.

## Next Steps
1. **Apply CORS**: Run `gsutil cors set cors.json gs://food-tracker-25902.firebasestorage.app`.
2. **Deploy Rules**: Run `firebase deploy --only firestore,storage`.
3. **Real Image Testing**: Test the full upload-to-insight loop with the cloud infrastructure.

## Key Files
- `firestore.rules` & `storage.rules`: Security configuration.
- `firestore.indexes.json`: Performance and query capability.
- `backend/src/index.ts`: API and local task subscriber logic.
- `worker/src/index.ts`: Cloud Run Pub/Sub push subscriber.
- `frontend/src/components/Upload.tsx`: Frontend upload logic (points to Cloud Run).
- `backend/Dockerfile` & `worker/Dockerfile`: Containerization configs.

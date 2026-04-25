# Mental Health & Nutrition App - Hackathon Progress Checkpoint

## Project Overview
An app for a Google Hackathon where users photograph food to track both macros and mental health impacts (sugar crashes, focus, mood, sleep, and gut health).

## Tech Stack
- **Frontend**: React 19 (Vite, TS), Tailwind v4, Lucide React, Firebase SDK.
- **Backend**: Node.js Express (TS), Firebase Admin SDK, GCP Pub/Sub SDK, Axios.
- **AI**: Gemini 2.5 Flash (via Vertex AI SDK).
- **GCP Resources**: Cloud Pub/Sub (Topic: `meal-analysis`, Subscription: `meal-analysis-sub`), Vertex AI.
- **Firebase**: Auth (Google), Firestore (Collection: `meals`), Storage (Bucket: `food-pics`).

## Configuration
- **Project ID**: `food-tracker-25902`
- **Frontend Port**: 5173
- **Backend Port**: 8080 (Cloud Run compatible)
- **Local Dev**: Backend publishes to Pub/Sub; Cloud Worker handles consumption.
- **Service Account**: Local backend uses `backend/service-account.json` (ignored by git).
- **Storage Bucket**: `food-tracker-25902.firebasestorage.app`

## Current Progress
- [x] **Architecture**: Removed redundant local worker logic from backend; enforced strict Pub/Sub flow (API -> Pub/Sub -> Worker).
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
- [x] **User Management**:
    - [x] Implemented **Onboarding Screen** for new users to collect weight, height, age, gender, and **Daily Calorie Goal**.
    - [x] Added **BMR Calculation** (Mifflin-St Jeor Equation) and goal-based target calculation (+/- 500 kcal).
    - [x] Created a **Profile Page** for users to view and update their personal metrics and calorie targets.
    - [x] Integrated **Daily Calorie Summary** on the Dashboard comparing intake vs. the personalized **Daily Target**.
    - [x] Updated Firestore rules to secure user profile data.
- [x] **AI Worker**:
    - [x] Updated Gemini prompt to incorporate the user's **Daily Calorie Target** for more personalized nutritional advice (e.g., tailored for bulking vs. weight loss).
- [x] **UX & Polish**:
    - [x] Added **Meal Description Context** (optional) to the Upload screen.
    - [x] Fixed frontend CI/CD failures by removing unused imports in `Navbar.tsx`.
    - [x] Standardized application to **Light Mode**.
    - [x] Hidden browser-default number input arrows.
    - [x] Improved dropdown UI with custom SVG arrows.
    - [x] Migrated all forms to **React 19 Action Patterns**.
    - [x] Configured **COOP Headers** for Google Login.
    - [x] Resolved logout race conditions by improving Firestore listener cleanup.
    - [x] **New**: Replaced "Start Analysis" with "Upload & Analyze" for clarity.
    - [x] **New**: Added a professional loader/spinner during authentication.
    - [x] **New**: Stabilized Dashboard layout with fixed image aspect ratios and "Analyzing..." states.
    - [x] **New**: Removed redundant "Profile" text link from Navbar, favoring the user avatar.
    - [x] **New**: Replaced all "Loading..." text with centered circular loaders across App, Dashboard, and Profile.
    - [x] **New**: Refined upload feedback to show "Uploading..." during the network phase.
    - [x] **New**: Simplified meal analysis UI by removing the brain icon for a cleaner spinner look.
    - [x] **New**: Added click-to-expand functionality for mental health insights (Focus, Mood, Gut, Sleep) to prevent text truncation.
- [x] **Reliability & Idempotency**:
    - [x] Implemented idempotency in Worker to prevent re-processing already analyzed meals.
    - [x] Added safety checks for deleted Firestore documents to prevent infinite Pub/Sub retry loops.
- [x] **AI Upgrade**: Migrated to `gemini-2.5-flash` for long-term stability and performance.

    - [x] Set up GitHub Actions for automated deployment:
        - `deploy-backend.yml`: Deploys Backend API to Cloud Run on changes to `backend/**`.
        - `deploy-worker.yml`: Deploys Worker to Cloud Run on changes to `worker/**`.
        - `firebase-hosting-merge.yml`: Deploys Frontend to Firebase Hosting on changes to `frontend/**`.
    - [x] Configured all workflows to use Node.js 24 runners (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`).
    - [x] Resolved GCP IAM permission issues (Artifact Registry Writer & Service Account User) for the GitHub Action service account.
    - [x] Added `workflow_dispatch` for manual triggers and path triggers for workflow self-updates.
    - [x] Pushed codebase to GitHub repository: `https://github.com/Abhiroop25902/food-tracker-25902.git`.
- [x] **Security**:
    - [x] Patched Dependabot alerts by updating `uuid` to `>=14.0.0` and `@tootallnate/once` to `>=3.0.1`.
    - [x] Verified service account scopes for Cloud Run deployments.

- [x] **Branding**: Renamed application to "Mindful Bites" across all platforms.
- [x] **AI Upgrade**: Migrated to `gemini-2.5-flash` for long-term stability and performance.
- [x] **Bug Fixes**: 
    - [x] Fixed `userId` reference error in Worker that caused Cloud Run deployment failures.
- [x] **Documentation**: Updated README with "Mindful Bites" branding and long-term mental health benefits.
- [x] **Infrastructure**: 
    - [x] Frontend link added: `https://food-tracker-25902.web.app`.
    - [x] Verified model performance with new version.

## Next Steps
1. **Real Image Testing**: Test the full upload-to-insight loop with the cloud infrastructure.
2. **Analytics**: Implement a "Trends" view to visualize mental health impacts over time.
3. **UX Polish**: Add loading skeletons and transition animations for a smoother feel.

## Key Files
- `firestore.rules` & `storage.rules`: Security configuration.
- `firestore.indexes.json`: Performance and query capability.
- `backend/src/index.ts`: API logic that saves to Firestore and publishes to Pub/Sub.
- `worker/src/index.ts`: Cloud Run Pub/Sub push subscriber and AI analysis engine.
- `frontend/src/components/Upload.tsx`: Frontend upload logic (points to Cloud Run).
- `backend/Dockerfile` & `worker/Dockerfile`: Containerization configs.

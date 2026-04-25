# Frontend Agent Requirements

## Tech Stack
- **Framework**: React 18+ with TypeScript (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: Firebase Auth (Google Provider)
- **Database**: Firestore (Real-time listeners)
- **Storage**: Firebase Storage (GCS)
- **Routing**: React Router DOM v6

## Core Responsibilities
1. **User Authentication**: Maintain a secure login flow using Google Auth. Protect private routes (`/`, `/upload`).
2. **Photo Upload**:
   - Handle image selection and compression (if needed).
   - Upload to `food-pics/{userId}/{timestamp}`.
   - Create a Firestore document in `meals` collection with `status: 'processing'`.
3. **Data Visualization**:
   - Display meal history in a responsive grid.
   - Visualize macro nutrients (Protein, Carbs, Fat, Calories).
   - Visualize complex mental health metrics (Crash risk, Focus, Gut health, etc.) using intuitive icons and color coding.
4. **Real-time UX**: Use Firestore `onSnapshot` to automatically update the UI when the backend worker completes the analysis.
5. **Responsive Design**: Ensure the layout works seamlessly on mobile devices (crucial for food photography).

## Coding Standards
- Use functional components and hooks.
- Maintain strict TypeScript interfaces (refer to `src/types.ts`).
- Follow a modular component structure in `src/components/`.
- Use `clsx` and `tailwind-merge` for dynamic class manipulation.

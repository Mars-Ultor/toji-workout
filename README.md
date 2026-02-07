Toji's Training Regimen (Bodyweight)

A single-page web app for structured bodyweight training. Built as a lightweight SPA using TailwindCSS and the Firebase web SDK (Auth + Firestore). Use this repository with Firebase Hosting to publish.

Quickstart

1. Install Firebase CLI (if you don't have it):
   npm install -g firebase-tools

2. Configure Firebase project and enable Auth + Firestore:

   - Create a Firebase project in the console.
   - Enable Email/Password sign-in under Authentication.
   - Create a Firestore database in production or test mode.
   - Copy your Firebase config and replace the placeholder in `public/index.html` (the firebaseConfig object near the top of the script).

3. Serve locally:
   In PowerShell:

```powershell
firebase serve --only hosting
```

Or using the modern CLI:

```powershell
firebase emulators:start --only hosting
```

4. Deploy to Hosting:

```powershell
firebase deploy --only hosting
```

Files of interest

- `public/index.html`: Main single-file app (UI, logic, Firebase integration).
- `public/`: Static assets for hosting.

Notes & Next steps

- The app uses Firestore to persist user progress and workout history. The firebase config object currently contains an example placeholder — replace it with your project's config from the Firebase console.
- The code is intentionally contained in a single HTML file for quick iteration. For production, consider splitting JavaScript into modules and bundling assets.
- If you'd like, I can split the app into smaller files, add build tooling, or wire analytics/storage options.

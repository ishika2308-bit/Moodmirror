# Building MoodMirror APK

## Prerequisites
1. Ensure you have **Android Studio** installed.
2. Install the **Android SDK**, specifically API 34 (UpsideDownCake).
3. Ensure **Node.js** and **npm** are installed.

## Build Steps

1. Build the production web assets:
```bash
npm run build
```

2. Sync the web assets into the Capacitor Android project:
```bash
npx cap sync android
```

3. Open Android Studio to build the APK:
```bash
npx cap open android
```

4. Inside Android Studio:
   - Wait for Gradle sync to complete.
   - Go to **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
   - Once complete, click **locate** in the notification popup to find your `app-debug.apk` (or `app-release.apk` if building a signed release variant).

## Connecting Spotify on Mobile
The app utilizes a custom URL scheme `moodmirror://` for mobile OAuth redirects.
- In the Spotify Developer Dashboard, ensure the callback URL is registered as: `moodmirror://spotify-callback`

## Capacitor Configuration
- `capacitor.config.ts` has been configured with `com.moodmirror.app`
- App name defaults to "moodmirror"

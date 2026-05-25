# BuildPulse Mobile

Native Flutter client for BuildPulse. It mirrors the React web app flows using
the existing API and Socket.IO backend.

## Running

Update the environment files in the app root:

- `.env.dev.ios` for iOS simulator (defaults to `http://localhost:4000/api`)
- `.env.dev.android` for Android emulator (defaults to `http://10.0.2.2:4000/api`)

The app loads `.env.dev.{platform}` in debug/profile and `.env.prod.{platform}` in release.

Message push notifications use Firebase Cloud Messaging. Production builds need
the platform Firebase config files in place:

- `android/app/google-services.json` for Android package `com.nandormezei.buildpulse`
- `ios/Runner/GoogleService-Info.plist` for iOS bundle `com.nandormezei.buildpulse`

```sh
flutter run
```

## Checks

```sh
flutter analyze
flutter test
```

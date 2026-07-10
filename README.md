<p align="center">
  <img src="./assets/images/icon.png" width="80" height="80" alt="IVault logo">
</p>

<h1 align="center">IVault</h1>

<p align="center">
  <strong>Documents Vault</strong><br>
  A private, offline-first mobile app to scan, store, and view your important documents.
  Built with <a href="https://expo.dev">Expo</a> + React Native.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#privacy">Privacy</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Features

- **Document scanning** — Uses the native document scanner to capture the front and back of ID cards sequentially.
- **Offline-first** — All data and images are stored locally on-device. No network requests, no accounts, no telemetry.
- **3D flip viewer** — Swipe or tap to flip between the front and back of a card, powered by Reanimated shared values and gestures.
- **Save to device gallery** — Save card images to the native photo library during creation or from the card detail view, using `expo-media-library`.
- **Light / Dark / System theme** — Persisted theme preference with a clean monochrome palette.
- **Review & save** — Preview both sides, add a name and optional note, then save to the local database.
- **Card grid** — 2-column grid of cards with staggered entrance animations.
- **Settings** — App info, privacy statement, and appearance controls.

## Tech Stack

| Layer      | Technology                                                            |
| ---------- | --------------------------------------------------------------------- |
| Framework  | [Expo](https://expo.dev) SDK 54                                       |
| UI         | React Native 0.81, Reanimated 4, Gesture Handler 2                    |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction) (file-based) |
| Database   | SQLite via `expo-sqlite` + [Drizzle ORM](https://orm.drizzle.team)    |
| Fonts      | Geist & Geist Mono (`@expo-google-fonts/geist`)                       |
| Scanner    | `@dariyd/react-native-document-scanner`                               |
| Images     | `expo-image`, stored as JPG files in `FileSystem.documentDirectory`   |
| TypeScript | Strict mode, path aliases `@/*` → `./src/*`                           |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS: Xcode (macOS only) or [Expo Go](https://expo.dev/go)
- Android: Android Studio or [Expo Go](https://expo.dev/go)

### Install

```bash
npm install
```

### Run

```bash
npm start
```

Then press `i` for iOS simulator or `a` for Android emulator. You can also scan the QR code with Expo Go on a physical device.

### Platform-specific commands

```bash
npm run ios      # Open directly in iOS simulator
npm run android  # Open directly in Android emulator
```

### Lint

```bash
npm run lint
```

## Building with EAS

Build and distribute the app using [EAS Build](https://docs.expo.dev/build/introduction/).

### Prerequisites

- [EAS CLI](https://docs.expo.dev/build/setup/#install-the-latest-eas-cli): `npm install -g eas-cli`
- Log in to your Expo account: `eas login`

### Build profiles

| Profile       | Type                  | Use case                          |
| ------------- | --------------------- | --------------------------------- |
| `development` | Dev client            | Debug builds with the dev menu    |
| `preview`     | Internal distribution | Share with testers via QR or link |
| `production`  | App store release     | Production binary for submission  |

### Build an APK (Android)

```bash
eas build --platform android --profile preview
```

For a development build:

```bash
eas build --platform android --profile development
```

For a production build:

```bash
eas build --platform android --profile production
```

### Build for iOS

```bash
eas build --platform ios --profile preview
```

> **Note:** iOS builds require an active Apple Developer account and are only available on macOS.

For all available options, see the [EAS Build documentation](https://docs.expo.dev/build/introduction/).

## Project Structure

```
ivault/
├── assets/                    # App icons & images
├── drizzle/                   # Drizzle Kit migration output
├── src/
│   ├── app/                   # Expo Router file-based routes
│   │   ├── _layout.tsx        # Root layout (fonts, theme, stack nav)
│   │   ├── index.tsx          # Home screen (card grid / empty state)
│   │   ├── capture.tsx        # Document scanner (front → back)
│   │   ├── transform.tsx      # Review & save captured images
│   │   ├── settings.tsx       # Theme toggle, about, privacy info
│   │   └── card/[id].tsx      # Card detail with 3D flip viewer
│   ├── components/            # Reusable UI components
│   │   ├── flip-card.tsx      # 3D flip card (pan + tap gestures)
│   │   ├── card-face.tsx      # Single card face with animated style
│   │   ├── card-grid.tsx      # 2-column FlatList of card thumbnails
│   │   ├── card-thumbnail.tsx # Pressable card preview
│   │   ├── empty-state.tsx    # Empty state with CTA
│   │   ├── themed-text.tsx    # Theme-aware Text component
│   │   └── themed-view.tsx    # Theme-aware View component
│   ├── constants/
│   │   └── theme.ts           # Colors, fonts, spacing, radii, motion
│   ├── contexts/
│   │   └── theme-context.tsx  # Theme mode provider & persistence
│   ├── db/
│   │   ├── index.ts           # SQLite + Drizzle initialization
│   │   └── schema.ts          # Cards table schema
│   ├── hooks/
│   │   ├── use-cards.ts       # CRUD hook with auto-refresh on focus
│   │   ├── use-color-scheme.ts # Resolved light/dark from theme context
│   │   └── use-theme.ts       # Returns current Colors palette
│   └── utils/
│       └── image-loader.ts    # Delete card image files
├── drizzle.config.ts          # Drizzle Kit configuration
├── tsconfig.json              # TypeScript config with path aliases
└── package.json
```

## Privacy

IVault is built as an **offline-first** application.

- All documents and data are stored exclusively on your device.
- Nothing is ever sent to any server, API, or third party.
- No accounts, no telemetry, no tracking.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feat/amazing-feature`).
5. Open a Pull Request.

## License

[MIT](LICENSE)

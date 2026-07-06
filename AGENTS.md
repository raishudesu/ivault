# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# IVault — Digital ID Card Vault

## Project

- **Package manager**: npm (not yarn/pnpm). Use `npm install`.
- **Entry point**: `"main": "expo-router/entry"` in `package.json`.
- **Source root**: `src/`. Screens in `src/app/` (file-based routing).
- **Path aliases** (`tsconfig.json`): `@/*` → `./src/*`, `@/assets/*` → `./assets/*`.
- **TypeScript**: strict mode, v6.0.3.
- **Expo experiments**: `typedRoutes`, `reactCompiler`.
- **Scheme**: `ivault` (deep linking).
- **Native only** (iOS + Android). No web.
- **No CI/CD**, no test runner, no env files.

## Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Dev server → iOS sim |
| `npm run android` | Dev server → Android emu |

## Architecture

### Screens (`src/app/`)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `index.tsx` | Home: 2-column card grid + empty state + FAB |
| `/capture` | `capture.tsx` | Camera: capture front → capture back |
| `/transform` | `transform.tsx` | Edge detection + crop + name/note + save |
| `/card/[id]` | `card/[id].tsx` | Full-screen 3D flip card viewer + delete |

Layout in `_layout.tsx`: Stack navigator wrapped in `GestureHandlerRootView`.

### Data layer

- **DB**: `expo-sqlite` + **Drizzle ORM** (`drizzle-orm`)
- **Schema**: `src/db/schema.ts` — single `cards` table (id, name, note, frontImagePath, backImagePath, createdAt, updatedAt)
- **Init**: `src/db/index.ts` — called at module scope from `_layout.tsx`
- **Hook**: `useCards()` in `src/hooks/use-cards.ts` — wraps all CRUD with auto-refresh
- **Image storage**: `FileSystem.documentDirectory + 'cards/{id}/front.jpg'` and `back.jpg`

### Image pipeline

1. **Capture** (`expo-camera` `CameraView`) → temp cache
2. **Edge detection** (`src/utils/edge-detector.ts`) — pure TS: grayscale → blur → Sobel → threshold → convex hull → quadrilateral
3. **Crop editor** (`src/components/crop-editor.tsx`) — shows image + 4 draggable corner handles; auto-detects edges on load, falls back to default corners
4. **Perspective warp** (`src/components/perspective-warp.tsx`) — `@shopify/react-native-skia` projective transform
5. **Save** — copies processed images to documents dir, inserts row in SQLite

### Key components

- `FlipCard` — 3D flippable card using Reanimated `useSharedValue` + `useAnimatedStyle` with `perspective`/`rotateY`; supports swipe-to-flip (Pan) and tap-to-flip (Tap exclusive gesture)
- `CardFace` — single face with `backfaceVisibility: 'hidden'`
- `CropEditor` — auto edge detection + 4 draggable corner handles via PanResponder
- `CardGrid` — 2-column FlatList of CardThumbnails
- `ThemedText` / `ThemedView` — core UI primitives with theme support

### Theme system

`src/constants/theme.ts`: `Colors` (light/dark), `Fonts`, `Spacing` constants. Hooks: `useTheme()`, `useColorScheme()` (with web hydration). VS Code on-save actions for fixAll/organizeImports/sortMembers.

### Key libraries

| Library | Purpose |
|---------|---------|
| `expo-router` | File-based routing |
| `expo-camera` | Photo capture |
| `expo-sqlite` | Local database |
| `drizzle-orm` | Type-safe SQL |
| `@shopify/react-native-skia` | Perspective warp rendering |
| `react-native-reanimated` | 3D flip animation |
| `react-native-gesture-handler` | Swipe/tap gestures |
| `expo-image` | Image display |
| `expo-file-system` | Image file I/O |
| `expo-image-manipulator` | Image resize/preview |

## When making changes

1. All data flows through `useCards()` hook — do not access `getDb()` directly in screens.
2. Platform-specific code uses `.web.tsx` suffix (existing convention). The app is native-only but `.web.tsx` files for hooks may still exist.
3. Use `@/` path aliases for imports.
4. No test runner — do not add test files.
5. Images are stored as files, not in DB. DB stores file paths.
6. The FlipCard animation uses Reanimated worklets + shared values — ensure animation code follows Reanimated v4 patterns.

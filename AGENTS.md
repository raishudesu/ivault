# IVault — Digital ID Card Vault

## Project

- **SDK**: Expo 54, React Native 0.81, React 19.1, TypeScript 5.9.
- **Docs**: Read versioned Expo docs at `https://docs.expo.dev/versions/v54.0.0/`. The top heading in this file tells you the correct SDK version.
- **PM**: npm only (no yarn/pnpm). Use `npm install`.
- **Entry**: `"main": "expo-router/entry"` in `package.json`.
- **Source**: `src/`. Screens in `src/app/` (file-based routing).
- **Aliases** (`tsconfig.json`): `@/*` → `./src/*`, `@/assets/*` → `./assets/*`.
- **TypeScript**: strict mode.
- **Expo experiments**: `typedRoutes`, `reactCompiler`.
- **Scheme**: `ivault` (deep link).
- **Native only** (iOS + Android). No web. `.web.tsx` files exist only for `use-color-scheme` hydration.

## Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Dev server → iOS sim |
| `npm run android` | Dev server → Android emu |
| `npm run lint` | Runs `expo lint` (no ESLint configured — will warn) |

No test runner, no CI/CD, no env files.

## Architecture

### Route screens (`src/app/`)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `index.tsx` | Home: 2-column card grid + empty state + FAB |
| `/capture` | `capture.tsx` | Opens native document scanner for front → back sequentially |
| `/transform` | `transform.tsx` | Review captured images + name/note form → save |
| `/card/[id]` | `card/[id].tsx` | 3D flip card viewer + delete |

Layout (`_layout.tsx`): Stack navigator in `GestureHandlerRootView`. Fonts (Geist + GeistMono from `@expo-google-fonts`) loaded before render. DB initialized at module scope (`initDb()`).

### Data layer

- **DB**: `expo-sqlite` + **Drizzle ORM**.
- **Schema** (`src/db/schema.ts`): single `cards` table — `id`, `name`, `note`, `frontImagePath`, `backImagePath`, `createdAt`, `updatedAt`.
- **Init** (`src/db/index.ts`): called at module scope from `_layout.tsx`. Creates table via raw SQL, returns `drizzle(sqlite, { schema })`.
- **CRUD hook** (`src/hooks/use-cards.ts`): `useCards()` wraps all queries with auto-refresh on screen focus. Do not access `getDb()` directly in screens.
- **Image storage**: `FileSystem.documentDirectory + 'cards/{id}/front.jpg'` and `back.jpg`. DB stores paths, not images.
- **Drizzle Kit** config: `drizzle.config.ts` — schema `src/db/schema.ts`, output `./drizzle`, dialect `sqlite`, driver `expo`.

### Image pipeline

1. **Capture** — `@dariyd/react-native-document-scanner` (native document scanner, not `expo-camera`). Captures front, saves to cache, then captures back.
2. **Review & save** (`src/app/transform.tsx`) — shows both images, text inputs for name/note, copies to `documentsDirectory/cards/{id}/`.
3. **Delete** — `src/utils/image-loader.ts`: `deleteCardImages()` removes both image files via `FileSystem.deleteAsync`.

### Key components

| Component | File | Purpose |
|-----------|------|---------|
| `FlipCard` | `src/components/flip-card.tsx` | 3D flip card — Reanimated `useSharedValue` + `useAnimatedStyle`, `perspective`/`rotateY`. Gesture: Pan (swipe-to-flip) + Tap (tap-to-flip), composed via `Gesture.Exclusive`. |
| `CardFace` | `src/components/card-face.tsx` | Single face with `backfaceVisibility: 'hidden'`. Uses `expo-image`. |
| `CardGrid` | `src/components/card-grid.tsx` | 2-column `FlatList` of `CardThumbnail`. |
| `CardThumbnail` | `src/components/card-thumbnail.tsx` | Card preview card in grid. |
| `EmptyState` | `src/components/empty-state.tsx` | Shown when no cards exist. |
| `ThemedText` | `src/components/themed-text.tsx` | Text with `type` variants (`body`, `title`, `micro`, `mono`, `code`) and `themeColor`. |
| `ThemedView` | `src/components/themed-view.tsx` | View with theme-aware `backgroundColor`. |

### Theme system

`src/constants/theme.ts`: `Colors` (light/dark with `ink`, `gray50`–`gray500`), `Fonts` (Geist, GeistMono), `Spacing`, `Radii`, `Motion` (Reanimated easing + durations). Hooks: `useTheme()` returns `Colors[scheme]`, `useColorScheme()` wraps RN's (defaults to `'light'`).

### Removed from package.json

These were previously in `dependencies` but **unused and removed**: `@shopify/react-native-skia`, `expo-camera`, `expo-image-manipulator`, `react-native-worklets`, `@expo/ui`, `expo-device`, `expo-glass-effect`, `expo-symbols`, `expo-web-browser`, `react-dom`, `react-native-web`. Do not re-add them without confirmation.

## OpenCode config

- `opencode.json` loads plugin from `./.opencode/plugins/ponytail.mjs`.
- `CLAUDE.md` delegates to this file.
- `.claude/settings.json` enables `expo@claude-plugins-official`.

## VS Code

- Plugin: `expo.vscode-expo-tools`.
- On-save actions (`settings.json`): `source.fixAll`, `source.organizeImports`, `source.sortMembers`.

## When making changes

1. All data flows through `useCards()` hook — never access `getDb()` in screens.
2. Use `@/` path aliases for imports.
3. No test runner — do not add test files.
4. Images stored as files; DB stores file paths.
5. Reanimated v4 patterns (worklets + shared values) for animation code.

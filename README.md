# Rasial Helper for Alt1

Safe companion app for Alt1 focused on bilingual setup validation, calibration, coach callouts and lightweight recognition support. This project is intentionally passive: it does not automate gameplay, send inputs or try to play RuneScape for the user.

## What this app does

- Validates your pre-fight setup against study presets
- Highlights required, recommended and optional preparation items
- Lets you confirm setup items manually or by assisted sample matching
- Adds visual calibration profiles with region-based OCR and brightness probes for Alt1
- Adds a Rasial-focused necro gauge and buff tracker with sample/OCR parsing
- Supports `pt-BR` and `en-US` independently for app language and game language
- Provides calibration for lightweight text matching
- Shows a study coach timeline and overlay preview
- Keeps a diagnostics trail so you can see what was manual, detected or uncertain

## Safety boundary

This repository is designed as a passive educational helper. It should not be extended into gameplay automation, memory reading, input sending, bypasses or anti-detection tooling.

## Run locally

Install dependencies:

```bash
npm install
```

Development mode:

```bash
npm run dev
```

Build and tests:

```bash
npm run build
npm test
```

Serve the built app for Alt1:

```bash
npm run build
npm run serve:alt1
```

## Using it in Alt1

The project is structured as an Alt1-style web app. The simplest flow is:

1. Run `npm run dev` for development or `npm run serve:alt1` after building.
2. Open the URL inside an Alt1 app window.
3. Enable `run as app`.
4. Grant `Overlay` permission.
5. Keep `Screen pixels` disabled until you actually need assisted calibration.

The app also exposes [public/appconfig.json](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/public/appconfig.json) so you can keep packaging aligned with an app-style setup.

## Hosting 24/7

### GitHub Pages

The repository now includes [deploy-pages.yml](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/.github/workflows/deploy-pages.yml), which deploys automatically on every push to `main`.

Recommended steps:

1. Push the repository to GitHub.
2. In GitHub, open `Settings > Pages`.
3. Set the source to `GitHub Actions`.
4. Push to `main` and wait for the workflow to finish.
5. Your app will be published at a URL like:

```text
https://YOUR-USER.github.io/YOUR-REPO/
```

Your public Alt1 app config will be available at:

```text
https://YOUR-USER.github.io/YOUR-REPO/appconfig.json
```

Because the Vite base is configured with relative assets, the same build works both locally and on GitHub Pages.

### Cloudflare Pages

This project is also compatible with static hosting on Cloudflare Pages.

Suggested settings:

- Build command: `npm run build`
- Build output directory: `dist`

That gives you a permanently hosted static URL without changing the app code.

## Core screens

### Official / Alt1 mode

The app shows whether it is running inside Alt1 or in a normal browser preview.

### Setup Validator

This is the main study feature.

- Choose a preset such as safe learning, balanced farm or minimal check
- Paste notes like `overload, aura active, familiar summoned`
- Let the helper try to detect matching setup items
- Click an item to cycle its state between `missing`, `manual`, `detected` and `uncertain`
- Review the readiness score and missing required items

The validator is intentionally didactic:

- it tells you why each resource matters
- it gives a next action for fixing the issue
- it separates required and recommended items
- it makes confidence visible instead of pretending uncertain detections are correct

### Visual Calibration

The helper now includes visual profiles with normalized regions that can be scanned in Alt1 when `pixel` permission is available.

Each region can:

- read lightweight OCR text from a calibrated anchor point
- sample brightness from a few points as weak visual evidence
- apply `detected` or `uncertain` updates to linked setup items
- fall back to browser sample text when Alt1 pixel access is not available

This keeps the workflow usable during development and while tuning coordinates.

### Necro Gauge and Buff Tracker

The helper also includes a Rasial-focused tracker inspired by rotation and buff helper overlays.

It can track:

- necrosis stacks
- residual souls
- living death uptime
- bloat uptime
- ghost, skeleton and zombie timers
- split soul style upkeep
- overload style upkeep

The current implementation works through:

- region calibration
- Alt1 OCR/pixel reads when available
- sample fallback parsing when you are tuning the layout or testing outside Alt1
- a first specialized buff-bar slot reader for fixed supported settings
- a wiki-backed icon catalog for priority Necro and Rasial-related statuses
- user-captured icon templates for specialized slot matching inside Alt1

Supported automatic mode for the specialized buff reader:

- buff bar size `small`
- game scale `100%`
- UI scale `100%`

Priority catalog prepared for specialized matching:

- residual souls
- necrosis
- living death
- split soul
- overload
- bloat
- ghost
- skeleton
- zombie

For each of those entries, the tracker catalog now stores:

- RuneScape Wiki article reference
- icon file hint
- buff bar category
- automatic detection strategy
- default slot hint for the compact Necro layout when applicable

Icon matcher v1 flow:

1. Open the app inside Alt1 with `pixel` permission ready.
2. Calibrate the `buff-bar` region so it tightly frames the supported icons.
3. While the priority buffs are visible, use `Capture icon templates`.
4. Run `Scan all tracker regions`.
5. Use `Last read` and `Icon matches` in the tracker panel to verify what the app saw.

### Calibration

Paste sample OCR-like text such as `Phase 2`, `Fase 2`, `Soul volley` or `Rajada de almas`.

The matcher:

- normalizes case
- strips accent dependence
- tolerates simple OCR noise
- compares language-specific aliases
- warns when the selected language conflicts with the strongest profile

### Fight Coach

The coach runs a study timeline with localized recommendations and a simple overlay preview.

## Language model

The app language and the game language are independent.

Examples:

- App in `pt-BR`, game in `en-US`: menus and explanations stay in Portuguese while matching prefers English aliases.
- App in `en-US`, game in `pt-BR`: UI stays in English while setup and OCR samples prefer Portuguese aliases.

Settings available in the UI:

- App language: `auto`, `pt-BR`, `en-US`
- Game language: `auto`, `pt-BR`, `en-US`
- Force selected game language for recognition

## Project structure

- [src/app.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/app.ts)
- [src/i18n/index.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/i18n/index.ts)
- [src/locales/en-US.json](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/locales/en-US.json)
- [src/locales/pt-BR.json](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/locales/pt-BR.json)
- [src/setup/catalog.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/setup/catalog.ts)
- [src/setup/validator.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/setup/validator.ts)
- [src/recognition/matcher.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/recognition/matcher.ts)
- [src/state/store.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/state/store.ts)
- [src/integrations/alt1.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/integrations/alt1.ts)
- [src/tracking/catalog.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/tracking/catalog.ts)
- [src/tracking/icon-catalog.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/tracking/icon-catalog.ts)

## Recognition strategy

Preferred order:

1. Position and region
2. Visual patterns and icons
3. Color or layout heuristics
4. Text matching only when needed

The current implementation demonstrates the safe part of that design with:

- locale-specific alias dictionaries
- accent-insensitive normalization
- light OCR error correction
- tolerant similarity scoring

## Adding new presets or setup items

Add or edit the source definitions in [src/setup/catalog.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/setup/catalog.ts).

Each item contains:

- category
- requirement level
- translation keys
- supported validation modes
- aliases per language

## Adding a new language

1. Create a locale file under `src/locales`.
2. Register it in [src/i18n/catalog.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/i18n/catalog.ts).
3. Extend the language union in [src/types/languages.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/src/types/languages.ts).
4. Add recognition aliases and setup aliases for the new language.
5. Add tests for translation parity and validator behavior.

## Tests

Current automated coverage includes:

- locale parity and fallback behavior
- language-aware matcher behavior
- setup sample detection
- readiness report generation
- visual profile scanning and rect normalization
- tracker parsing for stacks, timers and toggles
- tracker catalog consistency

Relevant files:

- [tests/i18n.test.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/tests/i18n.test.ts)
- [tests/matcher.test.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/tests/matcher.test.ts)
- [tests/setup-validator.test.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/tests/setup-validator.test.ts)
- [tests/visual-detector.test.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/tests/visual-detector.test.ts)
- [tests/tracker-detector.test.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/tests/tracker-detector.test.ts)
- [tests/tracker-catalog.test.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/tests/tracker-catalog.test.ts)

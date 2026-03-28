# Rasial Helper for Alt1

Safe companion app for Alt1 focused on bilingual setup validation, calibration, coach callouts and lightweight recognition support. This project is intentionally passive: it does not automate gameplay, send inputs or try to play RuneScape for the user.

## What this app does

- Validates your pre-fight setup against study presets
- Highlights required, recommended and optional preparation items
- Lets you confirm setup items manually or by assisted sample matching
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

Relevant files:

- [tests/i18n.test.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/tests/i18n.test.ts)
- [tests/matcher.test.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/tests/matcher.test.ts)
- [tests/setup-validator.test.ts](/e:/Arquivos-Jogos/backup/Programming/teste-runescape/tests/setup-validator.test.ts)

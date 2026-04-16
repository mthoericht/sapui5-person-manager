# SAPUI5 Person Manager (TypeScript)

A SAPUI5 freestyle app built with TypeScript for managing people.

It demonstrates a simple people management flow:

- list people in a table
- open a detail page
- create, edit, and delete a person
- use a mocked backend API via `json-server`

## Tech Stack

- SAPUI5 (OpenUI5)
- TypeScript
- UI5 Tooling (`@ui5/cli`)
- `ui5-tooling-transpile`
- `json-server` for mock API
- ESLint for linting and auto-fixes

## Project Structure

- `webapp/` – SAPUI5 app source
  - `view/` – XML views
  - `controller/` – TypeScript controllers
  - `model/` – domain services/models
  - `api/` – reusable HTTP API client
  - `css/` – custom styles
- `mock/`
  - `db.json` – mock data
  - `schema.json` – JSON schema for mock data

## Prerequisites

- Node.js 18+ (recommended)
- npm

## Installation

```bash
npm install
```

## Run the App

Start UI and mock backend together:

```bash
npm run start:all
```

Then open:

- UI: [http://localhost:8080](http://localhost:8080)
- Mock API: [http://localhost:3001/persons](http://localhost:3001/persons)

## Available Scripts

- `npm run start` – starts UI5 dev server on port `8080`
- `npm run mock` – starts `json-server` on port `3001`
- `npm run start:all` – starts both servers in parallel
- `npm run ts-typecheck` – runs TypeScript type check (`tsc --noEmit`)
- `npm run lint` – runs ESLint checks for `webapp/**/*.ts` and `webapp/**/*.js`
- `npm run lint:fix` – runs ESLint with auto-fix
- `npm run build` – builds app into `dist/`

## Code Style and Quality

- Linting is handled by ESLint (`eslint.config.js`).
- Auto-fixing is available via `npm run lint:fix`.
- The configured brace style is **Allman** (`brace-style: allman`).
- Formatting is intentionally ESLint-only (no Prettier), to avoid style conflicts.

## Recommended Workflow

For local development and before opening a PR, run:

```bash
npm run lint:fix
npm run ts-typecheck
npm run build
```

This sequence first applies safe automatic lint fixes, then validates TypeScript types, and
finally verifies that the project builds successfully.

## Mock Data Schema

`mock/db.json` references `mock/schema.json` using:

```json
"$schema": "./schema.json"
```

This enables schema-aware validation and editor support.

## Notes

- The app uses a small `ApiClient` class (`webapp/api/ApiClient.ts`) to centralize HTTP calls.
- `PersonService` contains person-specific API operations (`get`, `create`, `update`, `delete`).
- The list view width is intentionally constrained for better readability on large screens.

## Internationalization (i18n) and language switching

The UI supports **German** and **English**.

### Where the texts are stored

- `webapp/i18n/i18n_de.properties` – German translations (`*_de.properties`)
- `webapp/i18n/i18n.properties` – default translations (English base bundle)

### `supportedLocales` / `fallbackLocale` (important)

UI5 loads i18n files using a **fallback chain**. Without the right configuration, a `de…` locale
can skip `i18n_de.properties` and not resolve the expected texts.

To keep the setup simple and avoid redundancy, the app is configured with:

- `supportedLocales: ["de", ""]` (`""` = base bundle `i18n.properties`)
- `fallbackLocale: ""` (default fallback is the base bundle)

Configured in:

- `webapp/manifest.json` (`sap.app.i18n` and `sap.ui5.models.i18n.settings`)
- runtime `ResourceModel` creation in `webapp/Component.ts` and `webapp/controller/PersonList.controller.ts`

### How language switching works in the UI

- Language dropdown in `webapp/view/PersonList.view.xml` (`Select` bound to `/currentLanguage`)
- On change in `PersonList.controller.ts`:
  - `Localization.setLanguage(...)`
  - the component `i18n` `ResourceModel` is recreated for the selected language
  - the selection is persisted as `localStorage["appLanguage"]`

### Troubleshooting

- If the app always starts in English, check `localStorage["appLanguage"]` (for example `en`).
  Remove the key or pick **German** in the dropdown, then reload.

# SAPUI5 Person Manager (TypeScript)

A small SAPUI5 freestyle app for managing people with TypeScript and a local data API.

## Features

- Person list with detail view
- Create, edit, and delete
- Multi-select in list via checkboxes, including batch delete
- Required gender field in the detail form (`M`, `W`, `D`)
- Sorting directly from table headers (asc/desc per column)
- German/English language switch

## Tech Stack

- SAPUI5 (OpenUI5), TypeScript
- UI5 Tooling (`@ui5/cli`, `ui5-tooling-transpile`)
- `json-server` as local data backend
- ESLint

## Project Structure

- `webapp/controller/`
  - `PersonList.controller.ts`: list interactions, table state, delete flow, route-based list loading
  - `PersonDetail.controller.ts`: detail form orchestration and UI mapping for validation feedback
- `webapp/service/`
  - `LanguageService.ts`: language normalization, i18n model application, persistence
  - `PersonService.ts`: shared person workflows (`load`, `save+refresh`, `delete+refresh`)
- `webapp/validation/`
  - `personValidation.ts`: domain validation for `PersonDraft`
- `webapp/util/`
  - `i18nUtil.ts`: translator helper
  - `modelStateUtil.ts`: busy-state helper (`runWithBusy`)
  - `personListQueryUtil.ts`: search filter and sorter builders
- `webapp/api/`: technical API adapters (`ApiClient.ts`, `PersonApiService.ts`)
- `webapp/model/`: domain types (`Person.ts`)
- `webapp/view/`: XML views (`PersonList.view.xml`, `PersonDetail.view.xml`)
- `data/db.json`: local API data
- `data/schema.json`: JSON schema for editor validation

## Prerequisites

- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Start

```bash
npm run start:all
```

- UI: [http://localhost:8080](http://localhost:8080)
- API: [http://localhost:3001/persons](http://localhost:3001/persons)

## Important Scripts

- `npm run start:webapp`  
  Starts the UI5 development server on port `8080`.
- `npm run start:backend`  
  Starts the `json-server` API on port `3001` using `data/db.json`.
- `npm run start:all`  
  Runs webapp and backend API together in parallel for local development.
- `npm run clean`  
  Removes local build and dependency artifacts (`dist`, `node_modules`).
- `npm run install:clean`  
  Performs a clean reinstall (`npm run clean && npm install`).
- `npm run lint`  
  Runs ESLint checks for the frontend source files.
- `npm run lint:fix`  
  Runs ESLint with automatic fixes where possible.
- `npm run ts-typecheck`  
  Executes TypeScript type checking (`tsc --noEmit`) without generating build output.
- `npm run test:unit`  
  Runs QUnit unit tests in a headless browser (expects the UI5 server on `http://localhost:8080` to be reachable).
- `npm run test:unit:ci`  
  Waits until the QUnit test page is reachable on `http://localhost:8080` and then runs the same headless QUnit tests (recommended for CI pipelines when the UI5 server is started separately).
- `npm run test:unit:watch`  
  Watches `webapp/` files and re-runs unit tests on each change (requires a reachable UI5 server on `http://localhost:8080`).
- `npm run test:integration`  
  Runs OPA5 integration tests in a headless browser (expects the UI5 server on `http://localhost:8080` to be reachable).
- `npm run test:integration:ci`  
  Waits until the OPA test page is reachable on `http://localhost:8080` and then runs the same headless integration tests (recommended for CI pipelines when the UI5 server is started separately).
- `npm run build`  
  Creates a production build in `dist/`.

## Unit Tests (QUnit)

- Test entry page: `webapp/test/unit/unitTests.qunit.html`
- Test bootstrap module: `webapp/test/unit/unitTests.qunit.ts`
- Test files are authored in TypeScript (`*.qunit.ts`).
- Node-based test runner script: `scripts/run-qunit.mjs` (uses `puppeteer`).

Typical usage:

```bash
# local development (if UI5 server already runs on port 8080)
npm run test:unit

# CI execution (expects UI5 server to become available on port 8080)
npm run test:unit:ci

# re-run unit tests on file changes
npm run test:unit:watch
```

## Integration Tests (OPA5)

- Test entry page: `webapp/test/integration/opaTests.qunit.html`
- Test bootstrap module: `webapp/test/integration/opaTests.qunit.ts`
- Journeys live under `webapp/test/integration/journeys/`
- Backend calls are mocked via `window.fetch` in the journey setup (no `json-server` writes).
  - Typical mocked endpoints: `GET/POST/PUT http://localhost:3001/persons...`

Typical usage:

```bash
# local development (if UI5 server already runs on port 8080)
npm run test:integration

# CI execution (expects UI5 server to become available on port 8080)
npm run test:integration:ci
```

Troubleshooting:

- `ERR_CONNECTION_REFUSED` for `http://localhost:8080/test/unit/unitTests.qunit.html`  
  The UI5 server is not reachable on port `8080`. Start it with `npm run start:webapp` (or `npm run start:all`) before running `npm run test:unit`.
- `wait-on` times out in `npm run test:unit:ci`  
  The QUnit test page did not become reachable within the configured timeout. Ensure the UI5 server is started as part of your CI job (for example `npm run start:webapp:test` in a separate step/process).
- `EADDRINUSE: Port 8080 is already in use`  
  Another process already listens on `8080`. This is usually fine when running `npm run test:unit` against an already running server. If needed, stop the other process or use a dedicated test port.

## i18n (Short)

- Files:
  - `webapp/i18n/i18n_de.properties`
  - `webapp/i18n/i18n.properties`
- Shared i18n helper: `webapp/util/i18nUtil.ts` (`createTranslator`)
- Central language flow: `webapp/service/LanguageService.ts` (`getInitialLanguage`, `applyLanguage`)
- Configuration uses `supportedLocales: ["de", ""]` and `fallbackLocale: ""`.
- Selected language is stored in `localStorage["appLanguage"]`.

## Accessibility (WCAG)

- The app is developed with WCAG principles in mind (semantic structure, keyboard accessibility, and form feedback).
- Current implementation includes page heading semantics (`h1`) and field-level validation feedback (`ValueState`/`ValueStateText`) for required fields.
- Manual accessibility testing (keyboard and screen reader) is still required.

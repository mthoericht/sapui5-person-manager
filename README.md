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

- `webapp/` app code (views, controller, model, API, CSS)
- `data/db.json` local data
- `data/schema.json` JSON schema for editor validation

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
- `npm run build`  
  Creates a production build in `dist/`.

## i18n (Short)

- Files:
  - `webapp/i18n/i18n_de.properties`
  - `webapp/i18n/i18n.properties`
- Shared i18n helper: `webapp/util/i18nUtil.ts` (`createTranslator`)
- Configuration uses `supportedLocales: ["de", ""]` and `fallbackLocale: ""`.
- Selected language is stored in `localStorage["appLanguage"]`.

## Accessibility (WCAG)

- The app is developed with WCAG principles in mind (semantic structure, keyboard accessibility, and form feedback).
- Current implementation includes page heading semantics (`h1`) and field-level validation feedback (`ValueState`/`ValueStateText`) for required fields.
- Manual accessibility testing (keyboard and screen reader) is still required.

## Implementation Notes

- Sort state is stored in the app model: `/sortField`, `/sortDescending`.
- Sorting is applied in `webapp/controller/PersonList.controller.ts` via `sap/ui/model/Sorter`.
- Gender is represented in `webapp/model/Person.ts` as `gender: string`.

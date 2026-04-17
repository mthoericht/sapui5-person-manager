import Localization from "sap/base/i18n/Localization";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import type Component from "sap/ui/core/Component";

export type AppLanguage = "de" | "en";

const STORAGE_KEY = "appLanguage";
const BUNDLE_NAME = "person.app.i18n.i18n";
const SUPPORTED_LOCALES = ["de", ""];
const FALLBACK_LOCALE = "";

/**
 * Reads and normalizes the initial application language.
 *
 * @returns The supported language key.
 */
export function getInitialLanguage(): AppLanguage
{
  const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
  return normalizeLanguage(savedLanguage ?? Localization.getLanguage());
}

/**
 * Applies language to UI5 localization and component i18n model.
 *
 * @param component App component that owns the i18n model.
 * @param language Requested application language.
 */
export function applyLanguage(component: Component, language: AppLanguage): void
{
  Localization.setLanguage(language);
  component.setModel(createI18nModel(language), "i18n");
  window.localStorage.setItem(STORAGE_KEY, language);
}

/**
 * Converts arbitrary locale input to the supported language set.
 *
 * @param language Raw locale or language value.
 * @returns Supported language key.
 */
export function normalizeLanguage(language: string): AppLanguage
{
  const normalized = language.toLowerCase().split("-")[0];
  return normalized === "en" ? "en" : "de";
}

function createI18nModel(language: AppLanguage): ResourceModel
{
  return new ResourceModel({
    bundleName: BUNDLE_NAME,
    bundleLocale: language,
    supportedLocales: SUPPORTED_LOCALES,
    fallbackLocale: FALLBACK_LOCALE,
  });
}

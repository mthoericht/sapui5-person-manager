import type Component from "sap/ui/core/Component";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * Creates a translator function bound to a component instance.
 *
 * @param component Owner component instance.
 * @returns Function for localized text lookup with fallback.
 */
export function createTranslator(component: Component | undefined): (key: string, fallback: string) => string
{
  return (key: string, fallback: string) => getI18nText(component, key, fallback);
}

/**
 * Returns the i18n resource bundle from the component when available.
 *
 * @param component Owner component instance.
 * @returns Loaded resource bundle or undefined.
 */
function getI18nBundle(component: Component | undefined): ResourceBundle | undefined
{
  const i18nModel = component?.getModel("i18n") as ResourceModel | undefined;
  const bundleOrPromise = i18nModel?.getResourceBundle();
  if (!bundleOrPromise || bundleOrPromise instanceof Promise)
  {
    return undefined;
  }
  return bundleOrPromise;
}

/**
 * Returns a localized text by key with fallback text.
 *
 * @param component Owner component instance.
 * @param key i18n key.
 * @param fallback Fallback text when key/bundle is unavailable.
 * @returns Localized text or fallback text.
 */
function getI18nText(component: Component | undefined, key: string, fallback: string): string
{
  return getI18nBundle(component)?.getText(key) ?? fallback;
}
export {};

declare const QUnit: {
  module: (name: string) => void;
  test: (name: string, callback: (assert: any) => void) => void;
};

sap.ui.define([
  "person/app/service/LanguageService",
  "sap/base/i18n/Localization",
], function (
  languageService: {
    getInitialLanguage: () => "de" | "en";
    applyLanguage: (component: { setModel: (model: unknown, name: string) => void }, language: "de" | "en") => void;
    normalizeLanguage: (language: string) => "de" | "en";
  },
  Localization: {
    getLanguage: () => string;
    setLanguage: (language: string) => void;
  }
)
{
  "use strict";

  const { getInitialLanguage, applyLanguage, normalizeLanguage } = languageService;
  const storageKey = "appLanguage";

  QUnit.module("service/LanguageService");

  QUnit.test("normalizeLanguage maps locales to supported app keys", function (assert: any)
  {
    assert.strictEqual(normalizeLanguage("en-US"), "en", "english locale should map to en");
    assert.strictEqual(normalizeLanguage("EN"), "en", "english language should map to en");
    assert.strictEqual(normalizeLanguage("de-DE"), "de", "german locale should map to de");
    assert.strictEqual(normalizeLanguage("fr-FR"), "de", "unsupported language should fallback to de");
  });

  QUnit.test("getInitialLanguage prefers saved language from localStorage", function (assert: any)
  {
    const originalGetLanguage = Localization.getLanguage;
    window.localStorage.setItem(storageKey, "en");
    Localization.getLanguage = function ()
    {
      return "de-DE";
    };

    const result = getInitialLanguage();
    assert.strictEqual(result, "en", "saved language should be used");

    Localization.getLanguage = originalGetLanguage;
    window.localStorage.removeItem(storageKey);
  });

  QUnit.test("getInitialLanguage uses UI5 language when nothing is saved", function (assert: any)
  {
    const originalGetLanguage = Localization.getLanguage;
    window.localStorage.removeItem(storageKey);
    Localization.getLanguage = function ()
    {
      return "en-GB";
    };

    const result = getInitialLanguage();
    assert.strictEqual(result, "en", "UI5 language should be normalized and used");

    Localization.getLanguage = originalGetLanguage;
  });

  QUnit.test("applyLanguage updates localization, i18n model and localStorage", function (assert: any)
  {
    const originalSetLanguage = Localization.setLanguage;
    let calledLanguage = "";
    Localization.setLanguage = function (language: string)
    {
      calledLanguage = language;
    };

    let modelName = "";
    let modelValue: unknown;
    const componentStub = {
      setModel: function (model: unknown, name: string)
      {
        modelValue = model;
        modelName = name;
      },
    };

    applyLanguage(componentStub, "de");

    assert.strictEqual(calledLanguage, "de", "UI5 localization should be updated");
    assert.strictEqual(modelName, "i18n", "i18n model should be replaced on component");
    assert.ok(modelValue, "created i18n model should be provided");
    assert.strictEqual(window.localStorage.getItem(storageKey), "de", "language should be persisted");

    Localization.setLanguage = originalSetLanguage;
    window.localStorage.removeItem(storageKey);
  });
});

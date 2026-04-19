export {};

declare const QUnit: {
  module: (name: string) => void;
  test: (name: string, callback: (assert: any) => void) => void;
};

sap.ui.define([
  "person/app/util/i18nUtil",
], function (
  i18nUtil: { createTranslator: (component: unknown) => (key: string, fallback: string) => string }
)
{
  "use strict";

  const { createTranslator } = i18nUtil;

  QUnit.module("util/i18nUtil");

  QUnit.test("returns fallback when component is undefined", function (assert: any)
  {
    const t = createTranslator(undefined);
    assert.strictEqual(t("personTitle", "Fallback"), "Fallback", "fallback should be returned");
  });

  QUnit.test("returns translated text when sync bundle is available", function (assert: any)
  {
    const componentStub = {
      getModel: function (name: string)
      {
        if (name !== "i18n")
        {
          return undefined;
        }
        return {
          getResourceBundle: function ()
          {
            return {
              getText: function (key: string)
              {
                if (key === "personTitle")
                {
                  return "Personen";
                }
                return "Unknown";
              },
            };
          },
        };
      },
    };

    const t = createTranslator(componentStub);
    assert.strictEqual(t("personTitle", "Fallback"), "Personen", "bundle value should be returned");
  });

  QUnit.test("returns fallback when bundle loading is async", function (assert: any)
  {
    const componentStub = {
      getModel: function ()
      {
        return {
          getResourceBundle: function ()
          {
            return Promise.resolve({
              getText: function ()
              {
                return "Should not be used";
              },
            });
          },
        };
      },
    };

    const t = createTranslator(componentStub);
    assert.strictEqual(t("personTitle", "Fallback"), "Fallback", "fallback should be used for promise bundle");
  });
});

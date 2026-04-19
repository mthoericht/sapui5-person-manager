export {};

declare const QUnit: {
  module: (name: string) => void;
  test: (name: string, callback: (assert: any) => void) => void;
};

sap.ui.define(["person/app/validation/personValidation",], function (
  personValidation: { validatePersonDraft: (draft: { firstName: string; lastName: string; email: string; gender: string }) => { isValid: boolean; missingFields: string[]; hasInvalidEmail: boolean } }
)
{
  "use strict";

  const { validatePersonDraft } = personValidation;

  QUnit.module("validation/personValidation");

  QUnit.test("returns valid result for complete draft", function (assert: any)
  {
    const result = validatePersonDraft({
      firstName: "Max",
      lastName: "Mustermann",
      email: "max@example.com",
      gender: "male",
    });

    assert.ok(result.isValid, "draft should be valid");
    assert.deepEqual(result.missingFields, [], "no fields should be missing");
    assert.notOk(result.hasInvalidEmail, "email should be considered valid");
  });

  QUnit.test("collects missing fields after trimming", function (assert: any)
  {
    const result = validatePersonDraft({
      firstName: " ",
      lastName: "",
      email: " ",
      gender: "",
    });

    assert.notOk(result.isValid, "draft should be invalid");
    assert.deepEqual(
      result.missingFields,
      ["firstName", "lastName", "email", "gender"],
      "all empty fields should be reported"
    );
    assert.notOk(result.hasInvalidEmail, "invalid email format should not be checked when email is missing");
  });

  QUnit.test("flags invalid email format", function (assert: any)
  {
    const result = validatePersonDraft({
      firstName: "Anna",
      lastName: "Meyer",
      email: "anna.example.com",
      gender: "female",
    });

    assert.notOk(result.isValid, "draft should be invalid");
    assert.deepEqual(result.missingFields, [], "no required fields should be missing");
    assert.ok(result.hasInvalidEmail, "invalid email format should be reported");
  });
});

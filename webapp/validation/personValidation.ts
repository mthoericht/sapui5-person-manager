import type { PersonDraft } from "../model/Person";

export type PersonField = keyof PersonDraft;

export type PersonValidationResult = {
  isValid: boolean;
  missingFields: PersonField[];
  hasInvalidEmail: boolean;
};

/**
 * Validates a person draft independent from UI controls.
 *
 * @param draft Person data to validate.
 * @returns Structured validation result for field-level feedback.
 */
export function validatePersonDraft(draft: PersonDraft): PersonValidationResult
{
  const missingFields: PersonField[] = [];

  if (!draft.firstName.trim())
  {
    missingFields.push("firstName");
  }
  if (!draft.lastName.trim())
  {
    missingFields.push("lastName");
  }
  if (!draft.email.trim())
  {
    missingFields.push("email");
  }
  if (!draft.gender.trim())
  {
    missingFields.push("gender");
  }

  const hasInvalidEmail = !missingFields.includes("email") && !isValidEmail(draft.email);

  return {
    isValid: missingFields.length === 0 && !hasInvalidEmail,
    missingFields,
    hasInvalidEmail,
  };
}

function isValidEmail(email: string): boolean
{
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

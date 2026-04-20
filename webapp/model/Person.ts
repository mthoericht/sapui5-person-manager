export type Gender = "M" | "W" | "D";

export type PersonSortField = "firstName" | "lastName" | "email";

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: Gender;
}

export type PersonDraft = Omit<Person, "id">;

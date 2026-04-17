export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
}

export type PersonDraft = Omit<Person, "id">;

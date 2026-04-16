export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export type PersonDraft = Omit<Person, "id">;

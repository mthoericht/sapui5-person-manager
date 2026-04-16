import type { Person, PersonDraft } from "./Person";
import ApiClient from "../api/ApiClient";

const API_BASE = "http://localhost:3001";
const apiClient = new ApiClient(API_BASE);

export default class PersonService 
{
  /**
   * Fetches all persons.
   *
   * @returns List of persons.
   */
  public static async getPersons(): Promise<Person[]> 
  {
    return apiClient.get<Person[]>("/persons");
  }

  /**
   * Fetches one person by ID.
   *
   * @param id Person ID.
   * @returns The matching person.
   */
  public static async getPerson(id: string): Promise<Person> 
  {
    return apiClient.get<Person>(`/persons/${id}`);
  }

  /**
   * Updates an existing person.
   *
   * @param updated Complete person object to persist.
   * @returns The updated person from the backend.
   */
  public static async updatePerson(updated: Person): Promise<Person> 
  {
    return apiClient.put<Person>(`/persons/${updated.id}`, updated);
  }

  /**
   * Creates a new person.
   *
   * @param draft Person data without ID.
   * @returns The created person including its ID.
   */
  public static async createPerson(draft: PersonDraft): Promise<Person> 
  {
    return apiClient.post<Person>("/persons", draft);
  }

  /**
   * Deletes a person by ID.
   *
   * @param id Person ID.
   * @returns A promise that resolves when deletion succeeds.
   */
  public static async deletePerson(id: string): Promise<void> 
  {
    await apiClient.delete(`/persons/${id}`);
  }
}

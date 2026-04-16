import type { Person, PersonDraft } from "./Person";
import ApiClient from "../api/ApiClient";

const API_BASE = "http://localhost:3001";
const apiClient = new ApiClient(API_BASE);

export default class PersonService 
{
  public static async getPersons(): Promise<Person[]> 
  {
    return apiClient.get<Person[]>("/persons");
  }

  public static async getPerson(id: string): Promise<Person> 
  {
    return apiClient.get<Person>(`/persons/${id}`);
  }

  public static async updatePerson(updated: Person): Promise<Person> 
  {
    return apiClient.put<Person>(`/persons/${updated.id}`, updated);
  }

  public static async createPerson(draft: PersonDraft): Promise<Person> 
  {
    return apiClient.post<Person>("/persons", draft);
  }

  public static async deletePerson(id: string): Promise<void> 
  {
    await apiClient.delete(`/persons/${id}`);
  }
}

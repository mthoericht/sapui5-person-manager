import PersonApiService from "../api/PersonApiService";
import type { Person, PersonDraft } from "../model/Person";

/**
 * Loads all persons from backend.
 *
 * @returns Current list of persons.
 */
export async function loadPersons(): Promise<Person[]>
{
  return PersonApiService.getPersons();
}

/**
 * Saves a person (create or update) and returns refreshed list data.
 *
 * @param selectedPerson Current selected person from app state.
 * @param payload Validated person payload to persist.
 * @param isCreating Flag indicating create or update flow.
 * @returns Saved person and refreshed person list.
 */
export async function savePersonAndRefreshList(
  selectedPerson: Person | PersonDraft,
  payload: PersonDraft,
  isCreating: boolean
): Promise<{ savedPerson: Person; persons: Person[] }>
{
  if (!isCreating && !(selectedPerson as Person).id)
  {
    throw new Error("Fehlende Person-ID für Update");
  }

  const savedPerson = isCreating
    ? await PersonApiService.createPerson(payload)
    : await PersonApiService.updatePerson({
      id: (selectedPerson as Person).id,
      ...payload,
    });

  const persons = await loadPersons();
  return { savedPerson, persons };
}

/**
 * Deletes selected persons and returns refreshed list data.
 *
 * @param ids Person IDs to delete.
 * @returns Refreshed person list.
 */
export async function deletePersonsAndRefreshList(ids: string[]): Promise<Person[]>
{
  await Promise.all(ids.map((id) => PersonApiService.deletePerson(id)));
  return loadPersons();
}

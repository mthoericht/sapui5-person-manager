import Sorter from "sap/ui/model/Sorter";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";

/**
 * Builds a list filter for first name, last name, and email search terms.
 *
 * @param query Search query from list state.
 * @returns Filter array compatible with list binding filter API.
 */
export function buildPersonSearchFilter(query: string): Filter[]
{
  const trimmedQuery = query.trim();
  if (!trimmedQuery)
  {
    return [];
  }

  const searchTerms = trimmedQuery.split(/\s+/).filter(Boolean);
  const termFilters = searchTerms.map((term) =>
    new Filter({
      filters: [
        new Filter("firstName", FilterOperator.Contains, term),
        new Filter("lastName", FilterOperator.Contains, term),
        new Filter("email", FilterOperator.Contains, term),
      ],
      // false because we want to match each term in any supported field.
      and: false,
    })
  );

  return [
    new Filter({
      filters: termFilters,
      and: true,
    }),
  ];
}

/**
 * Creates a sorter for person list sorting.
 *
 * @param sortField Field name used for sorting.
 * @param sortDescending Sorting direction flag.
 * @returns UI5 sorter instance.
 */
export function buildPersonSorter(sortField: string, sortDescending: boolean): Sorter
{
  return new Sorter(sortField, sortDescending);
}

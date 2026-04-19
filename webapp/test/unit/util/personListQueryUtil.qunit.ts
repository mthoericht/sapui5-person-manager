export {};

declare const QUnit: {
  module: (name: string) => void;
  test: (name: string, callback: (assert: any) => void) => void;
};

sap.ui.define([
  "person/app/util/personListQueryUtil",
], function (personListQueryUtil: {
  buildPersonSearchFilter: (query: string) => any[];
  buildPersonSorter: (field: string, descending: boolean) => any;
})
{
  "use strict";

  const { buildPersonSearchFilter, buildPersonSorter } = personListQueryUtil;

  QUnit.module("util/personListQueryUtil");

  QUnit.test("returns empty filter array for blank query", function (assert: any)
  {
    const filters = buildPersonSearchFilter("   ");
    assert.deepEqual(filters, [], "blank query should not create filters");
  });

  QUnit.test("builds grouped OR/AND filters for multiple search terms", function (assert: any)
  {
    const filters = buildPersonSearchFilter("anna meier");

    assert.strictEqual(filters.length, 1, "root filter should be returned");

    const root = filters[0];
    assert.ok(Array.isArray(root.aFilters), "root should contain nested filters");
    assert.strictEqual(root.aFilters.length, 2, "one nested filter per search term");

    const firstTerm = root.aFilters[0];
    assert.ok(Array.isArray(firstTerm.aFilters), "term filter should contain field filters");
    assert.strictEqual(firstTerm.aFilters.length, 3, "term filter should target firstName, lastName, email");
    const fieldPaths = firstTerm.aFilters.map((subFilter: any) => subFilter.sPath).sort();
    assert.deepEqual(fieldPaths, ["email", "firstName", "lastName"], "term filter should cover all supported fields");
  });

  QUnit.test("creates sorter with provided field and direction", function (assert: any)
  {
    const sorter = buildPersonSorter("lastName", true);
    assert.strictEqual(sorter.sPath, "lastName", "sort field should be set");
    assert.strictEqual(sorter.bDescending, true, "sort direction should be descending");
  });
});

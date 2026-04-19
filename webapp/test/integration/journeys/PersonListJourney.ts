export {};

declare const QUnit: {
  module: (name: string, hooks: { beforeEach?: () => void; afterEach?: () => void }) => void;
};

sap.ui.define([
  "sap/ui/test/opaQunit",
  "sap/ui/test/Opa5",
  "sap/ui/test/actions/Press",
  "sap/ui/test/actions/EnterText",
], function (opaTest: any, Opa5: any, Press: any, EnterText: any)
{
  "use strict";

  const initialMockPersons = [
    {
      id: "1",
      firstName: "Anna",
      lastName: "Meyer",
      email: "anna@example.com",
      gender: "W",
    },
    {
      id: "2",
      firstName: "Max",
      lastName: "Mustermann",
      email: "max@example.com",
      gender: "M",
    },
    {
      id: "3",
      firstName: "Lea",
      lastName: "Schmidt",
      email: "lea@example.com",
      gender: "D",
    },
  ];

  let serverPersons: typeof initialMockPersons = [];
  let nextPersonNumericId = 1000;

  let originalFetch: typeof window.fetch | undefined;

  function jsonResponse(body: unknown, status = 200): Response
  {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  function installFetchMock(): void
  {
    serverPersons = initialMockPersons.map((person) => ({ ...person }));
    nextPersonNumericId = 1000;

    originalFetch = window.fetch.bind(window);
    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response>
    {
      const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method ?? "GET").toUpperCase();

      if (!requestUrl.startsWith("http://localhost:3001/persons"))
      {
        throw new Error(`Unexpected backend request in integration test: ${method} ${requestUrl}`);
      }

      if (method === "GET" && requestUrl === "http://localhost:3001/persons")
      {
        return jsonResponse(serverPersons);
      }

      if (method === "GET" && requestUrl.startsWith("http://localhost:3001/persons/"))
      {
        const personId = requestUrl.split("/").pop() ?? "";
        const person = serverPersons.find((entry) => entry.id === personId);
        if (!person)
        {
          return jsonResponse({ message: "not found" }, 404);
        }
        return jsonResponse(person);
      }

      if (method === "PUT" && requestUrl.startsWith("http://localhost:3001/persons/"))
      {
        const personId = requestUrl.split("/").pop() ?? "";
        const bodyText = typeof init?.body === "string" ? init.body : "";
        const updated = JSON.parse(bodyText || "{}") as typeof initialMockPersons[number];
        const index = serverPersons.findIndex((entry) => entry.id === personId);
        if (index === -1)
        {
          return jsonResponse({ message: "not found" }, 404);
        }
        serverPersons[index] = { ...updated, id: personId };
        return jsonResponse(serverPersons[index]);
      }

      if (method === "POST" && requestUrl === "http://localhost:3001/persons")
      {
        const bodyText = typeof init?.body === "string" ? init.body : "";
        const draft = JSON.parse(bodyText || "{}") as Omit<typeof initialMockPersons[number], "id">;
        nextPersonNumericId += 1;
        const created = {
          id: String(nextPersonNumericId),
          ...draft,
        };
        serverPersons.push(created);
        return jsonResponse(created, 201);
      }

      throw new Error(`Unsupported mocked request in integration test: ${method} ${requestUrl}`);
    };
  }

  function restoreFetchMock(): void
  {
    if (originalFetch)
    {
      window.fetch = originalFetch;
      originalFetch = undefined;
    }
  }

  Opa5.extendConfig({
    autoWait: true,
    viewNamespace: "person.app.view.",
  });

  QUnit.module("integration/PersonList with mocked backend", {
    beforeEach: function ()
    {
      window.localStorage.removeItem("appLanguage");
      installFetchMock();
    },
    afterEach: function ()
    {
      restoreFetchMock();
    },
  });

  opaTest("loads mocked persons in list table", function (Given: any, When: any, Then: any)
  {
    Given.iStartMyUIComponent({
      componentConfig: {
        name: "person.app",
      },
      hash: "",
    });

    Then.waitFor({
      id: "personTable",
      viewName: "PersonList",
      success: function (table: any)
      {
        const items = table.getItems();
        Opa5.assert.strictEqual(items.length, 3, "exactly three mocked persons are rendered");
      },
    });

    Then.iTeardownMyUIComponent();
  });

  opaTest("filters list using search field without touching real backend", function (Given: any, When: any, Then: any)
  {
    Given.iStartMyUIComponent({
      componentConfig: {
        name: "person.app",
      },
      hash: "",
    });

    When.waitFor({
      id: "personSearchField",
      viewName: "PersonList",
      actions: new EnterText({
        text: "anna",
      }),
    });

    Then.waitFor({
      id: "personTable",
      viewName: "PersonList",
      success: function (table: any)
      {
        const items = table.getItems();
        Opa5.assert.strictEqual(items.length, 1, "search narrows table down to one mocked person");
      },
    });

    Then.iTeardownMyUIComponent();
  });

  opaTest("navigates to create detail route", function (Given: any, When: any, Then: any)
  {
    Given.iStartMyUIComponent({
      componentConfig: {
        name: "person.app",
      },
      hash: "",
    });

    When.waitFor({
      id: "createPersonButton",
      viewName: "PersonList",
      actions: new Press(),
    });

    Then.waitFor({
      id: "firstNameInput",
      viewName: "PersonDetail",
      success: function ()
      {
        Opa5.assert.ok(true, "create flow opens the detail form");
      },
    });

    Then.iTeardownMyUIComponent();
  });

  opaTest("updates an existing person end-to-end (mocked backend)", function (Given: any, When: any, Then: any)
  {
    Given.iStartMyUIComponent({
      componentConfig: {
        name: "person.app",
      },
      hash: "",
    });

    When.waitFor({
      id: "personTable",
      viewName: "PersonList",
      success: function (table: any)
      {
        Opa5.assert.ok(table.getItems()[0], "first list row should exist");
      },
      actions: function (table: any)
      {
        const firstRow = table.getItems()[0];
        new Press().executeOn(firstRow);
      },
    });

    Then.waitFor({
      id: "firstNameInput",
      viewName: "PersonDetail",
      success: function (input: any)
      {
        Opa5.assert.strictEqual(input.getValue(), "Anna", "detail should load mocked person data");
      },
    });

    When.waitFor({
      id: "firstNameInput",
      viewName: "PersonDetail",
      actions: new EnterText({
        text: "Annabelle",
        clearTextFirst: true,
      }),
    });

    When.waitFor({
      id: "savePersonButton",
      viewName: "PersonDetail",
      actions: new Press(),
    });

    Then.waitFor({
      id: "personTable",
      viewName: "PersonList",
      success: function (table: any)
      {
        const firstItem = table.getItems()[0];
        const context = firstItem.getBindingContext();
        const data = context?.getObject?.() as { firstName?: string } | undefined;
        Opa5.assert.strictEqual(data?.firstName, "Annabelle", "list should reflect updated mocked person");
      },
    });

    Then.iTeardownMyUIComponent();
  });
});

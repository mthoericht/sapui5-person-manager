export {};

declare const QUnit: {
  module: (name: string) => void;
  test: (name: string, callback: (assert: any) => void | Promise<void>) => void;
};

sap.ui.define([
  "person/app/controller/PersonList.controller",
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
], function (PersonList: any, UIComponent: any, JSONModel: any)
{
  "use strict";

  QUnit.module("controller/PersonList");

  function createListControllerWithStubs(stubs: {
    router?: { navTo: (...args: any[]) => void; getRoute?: (name: string) => any };
    appModel?: any;
    byId?: (id: string) => any;
    ownerComponent?: any;
  })
  {
    const originalGetRouterFor = UIComponent.getRouterFor;

    const router = stubs.router ?? {
      navTo: function ()
      {
        // noop default
      },
      getRoute: function ()
      {
        return {
          attachPatternMatched: function ()
          {
            // noop
          },
        };
      },
    };

    UIComponent.getRouterFor = function ()
    {
      return router;
    };

    const controller = new PersonList();
    controller.getAppModel = function ()
    {
      return stubs.appModel;
    };
    controller.byId = function (id: string)
    {
      return stubs.byId?.(id);
    };
    controller.getOwnerComponent = function ()
    {
      return stubs.ownerComponent;
    };

    return {
      controller,
      router,
      restore: function ()
      {
        UIComponent.getRouterFor = originalGetRouterFor;
      },
    };
  }

  QUnit.test("onCreate navigates to new person detail", function (assert: any)
  {
    const navCalls: any[] = [];
    const { controller, router, restore } = createListControllerWithStubs({
      router: {
        navTo: function (...args: any[])
        {
          navCalls.push(args);
        },
        getRoute: function ()
        {
          return {
            attachPatternMatched: function ()
            {
              // noop
            },
          };
        },
      },
    });

    controller.onInit();
    controller.onCreate();

    assert.deepEqual(navCalls, [["detail", { id: "new" }]], "should navigate to create route");

    restore();
  });

  QUnit.test("onItemPress navigates using binding context id", function (assert: any)
  {
    const navCalls: any[] = [];
    const { controller, restore } = createListControllerWithStubs({
      router: {
        navTo: function (...args: any[])
        {
          navCalls.push(args);
        },
        getRoute: function ()
        {
          return {
            attachPatternMatched: function ()
            {
              // noop
            },
          };
        },
      },
    });

    controller.onInit();
    controller.onItemPress({
      getSource: function ()
      {
        return {
          getBindingContext: function ()
          {
            return {
              getObject: function ()
              {
                return { id: "p-123" };
              },
            };
          },
        };
      },
    });

    assert.deepEqual(navCalls, [["detail", { id: "p-123" }]], "should navigate using person id");

    restore();
  });

  QUnit.test("onSelectionChange writes selected ids into app model", function (assert: any)
  {
    const appModel = new JSONModel({
      selectedPersonIds: [],
    });

    const { controller, restore } = createListControllerWithStubs({
      appModel,
    });

    controller.onSelectionChange({
      getSource: function ()
      {
        return {
          getSelectedContexts: function ()
          {
            return [
              { getObject: function () { return { id: "a" }; } },
              { getObject: function () { return { id: "" }; } },
              { getObject: function () { return { id: "b" }; } },
            ];
          },
        };
      },
    });

    assert.deepEqual(appModel.getProperty("/selectedPersonIds"), ["a", "b"], "should persist filtered ids");

    restore();
  });

  QUnit.test("onSearch updates model and applies binding filter/sort", function (assert: any)
  {
    const filterCalls: any[] = [];
    const sortCalls: any[] = [];

    const bindingStub = {
      filter: function (filters: any)
      {
        filterCalls.push(filters);
      },
      sort: function (sorter: any)
      {
        sortCalls.push(sorter);
      },
    };

    const appModel = new JSONModel({
      searchQuery: "",
      sortField: "lastName",
      sortDescending: false,
    });

    const { controller, restore } = createListControllerWithStubs({
      appModel,
      byId: function (id: string)
      {
        assert.strictEqual(id, "personTable", "should resolve person table id");
        return {
          getBinding: function (name: string)
          {
            assert.strictEqual(name, "items", "should bind items aggregation");
            return bindingStub;
          },
        };
      },
    });

    controller.onSearch({
      getParameter: function (name: string)
      {
        if (name === "query")
        {
          return "  anna meier  ";
        }
        return undefined;
      },
    });

    assert.strictEqual(appModel.getProperty("/searchQuery"), "anna meier", "should trim and persist query");
    assert.strictEqual(filterCalls.length, 1, "filter should be applied once");
    assert.strictEqual(sortCalls.length, 1, "sort should be applied once");

    restore();
  });
});

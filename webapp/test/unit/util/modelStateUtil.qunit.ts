export {};

declare const QUnit: {
  module: (name: string) => void;
  test: (name: string, callback: (assert: any) => void | Promise<void>) => void;
};

sap.ui.define([
  "person/app/util/modelStateUtil",
], function (modelStateUtil: { runWithBusy: <T>(model: { setProperty: (path: string, value: boolean) => void }, scope: "list" | "detail", action: () => Promise<T>) => Promise<T> })
{
  "use strict";

  const { runWithBusy } = modelStateUtil;

  QUnit.module("util/modelStateUtil");

  QUnit.test("sets busy true before action and false after success", async function (assert: any)
  {
    const calls: Array<{ path: string; value: boolean }> = [];
    const modelStub = {
      setProperty: function (path: string, value: boolean)
      {
        calls.push({ path, value });
      },
    };

    const result = await runWithBusy(modelStub, "list", async function ()
    {
      return "ok";
    });

    assert.strictEqual(result, "ok", "action result should be returned");
    assert.deepEqual(
      calls,
      [
        { path: "/list/busy", value: true },
        { path: "/list/busy", value: false },
      ],
      "busy flag should be toggled around action"
    );
  });

  QUnit.test("resets busy to false when action throws", async function (assert: any)
  {
    const calls: Array<{ path: string; value: boolean }> = [];
    const modelStub = {
      setProperty: function (path: string, value: boolean)
      {
        calls.push({ path, value });
      },
    };

    let errorMessage = "";
    try
    {
      await runWithBusy(modelStub, "detail", async function ()
      {
        throw new Error("boom");
      });
    }
    catch (err)
    {
      errorMessage = (err as Error).message;
    }

    assert.strictEqual(errorMessage, "boom", "original error should be propagated");
    assert.deepEqual(
      calls,
      [
        { path: "/detail/busy", value: true },
        { path: "/detail/busy", value: false },
      ],
      "busy flag should be reset even on error"
    );
  });
});

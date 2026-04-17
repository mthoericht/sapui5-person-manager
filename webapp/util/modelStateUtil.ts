import JSONModel from "sap/ui/model/json/JSONModel";

export type BusyScope = "list" | "detail";

/**
 * Executes an async action while a model busy flag is active.
 *
 * @param model JSON model containing the busy state.
 * @param scope Busy state scope ("list" or "detail").
 * @param action Async action to execute.
 * @returns Action result.
 */
export async function runWithBusy<T>(
  model: JSONModel,
  scope: BusyScope,
  action: () => Promise<T>
): Promise<T>
{
  const busyPath = `/${scope}/busy`;
  model.setProperty(busyPath, true);
  try
  {
    return await action();
  }
  finally
  {
    model.setProperty(busyPath, false);
  }
}

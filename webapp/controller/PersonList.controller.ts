import type Event from "sap/ui/base/Event";
import type { Person } from "../model/Person";
import UIComponent from "sap/ui/core/UIComponent";
import type Router from "sap/ui/core/routing/Router";
import type ListBinding from "sap/ui/model/ListBinding";
import JSONModel from "sap/ui/model/json/JSONModel";
import Controller from "sap/ui/core/mvc/Controller";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Table from "sap/m/Table";
import { createTranslator } from "../util/i18nUtil";
import { runWithBusy } from "../util/modelStateUtil";
import { applyLanguage, normalizeLanguage } from "../service/LanguageService";
import { buildPersonSearchFilter, buildPersonSorter } from "../util/personListQueryUtil";
import { deletePersonsAndRefreshList, loadPersons } from "../service/PersonService";

export default class PersonList extends Controller
{
  private _router!: Router;

  /**
   * Initializes the list controller and router reference.
   */
  public onInit(): void 
  {
    this._router = UIComponent.getRouterFor(this);
    const listRoute = this._router.getRoute("list");
    if (listRoute)
    {
      listRoute.attachPatternMatched(this._onListRouteMatched, this);
    }
    const oModel = this.getAppModel();
    oModel?.setProperty("/sortField", oModel.getProperty("/sortField") || "lastName");
    oModel?.setProperty("/sortDescending", !!oModel.getProperty("/sortDescending"));
    oModel?.setProperty("/searchQuery", (oModel.getProperty("/searchQuery") as string) || "");
    this._applyTableState();
  }

  /**
   * Navigates to the detail route for the pressed list item.
   *
   * @param oEvent Item press event.
   */
  public onItemPress(oEvent: Event): void 
  {
    const oContext = (oEvent.getSource() as any).getBindingContext?.();
    if (!oContext) 
    {
      return;
    }

    const oPerson = oContext.getObject() as Person;
    this._router.navTo("detail", { id: oPerson.id });
  }

  /**
   * Updates selected person IDs in the shared model.
   *
   * @param oEvent Selection change event.
   */
  public onSelectionChange(oEvent: Event): void 
  {
    const oModel = this.getAppModel();

    if (!oModel) 
    {
      return;
    }

    const oTable = (oEvent.getSource() as Table | undefined);
    const selectedIds = (oTable?.getSelectedContexts?.() ?? [])
      .map((context) => context.getObject() as Person)
      .map((person) => person.id)
      .filter(Boolean);

    oModel.setProperty("/selectedPersonIds", selectedIds);
  }

  /**
   * Navigates to the create form.
   */
  public onCreate(): void 
  {
    this._router.navTo("detail", { id: "new" });
  }

  /**
   * Applies a new application language and persists the preference.
   *
   * @param oEvent Language selection change event.
   */
  public onLanguageChange(oEvent: Event): void
  {
    const selectedLanguage = normalizeLanguage(
      ((oEvent as any).getParameter("selectedItem")?.getKey?.() ?? "de") as string
    );
    const component = this.getOwnerComponent();
    if (component)
    {
      applyLanguage(component, selectedLanguage);
    }

    const oModel = this.getAppModel();
    oModel?.setProperty("/currentLanguage", selectedLanguage);
  }

  /**
   * Applies sorting when the sort field is changed in toolbar controls.
   *
   * @param oEvent Sort field select change event.
   */
  public onSortFieldChange(oEvent: Event): void
  {
    const oModel = this.getAppModel();
    if (!oModel)
    {
      return;
    }

    const selectedSortField =
      ((oEvent as any).getParameter("selectedItem")?.getKey?.() as string | undefined) ?? "lastName";
    oModel.setProperty("/sortField", selectedSortField);
    this._applyTableState();
  }

  /**
   * Toggles sorting direction (ascending/descending).
   */
  public onSortDirectionToggle(): void
  {
    const oModel = this.getAppModel();
    if (!oModel)
    {
      return;
    }

    const currentDescending = !!oModel.getProperty("/sortDescending");
    oModel.setProperty("/sortDescending", !currentDescending);
    this._applyTableState();
  }

  /**
   * Applies a table filter for first name, last name, and email.
   *
   * @param oEvent Search event from the list toolbar.
   */
  public onSearch(oEvent: Event): void
  {
    const oModel = this.getAppModel();
    if (!oModel)
    {
      return;
    }

    const query =
      ((oEvent as any).getParameter("query") as string | undefined)
      ?? ((oEvent as any).getParameter("newValue") as string | undefined)
      ?? "";

    oModel.setProperty("/searchQuery", query.trim());
    this._applyTableState();
  }

  /**
   * Deletes all selected persons after confirmation and refreshes the list.
   *
   * @returns A promise that resolves when the delete flow is finished.
   */
  public async onDelete(): Promise<void> 
  {
    const oModel = this.getAppModel();
    if (!oModel) 
    {
      return;
    }

    const translate = createTranslator(this.getOwnerComponent());
    const selectedPersonIds = (oModel.getProperty("/selectedPersonIds") as string[] | undefined) ?? [];
    if (selectedPersonIds.length === 0) 
    {
      MessageToast.show(translate("selectAtLeastOnePerson", "Bitte zuerst mindestens eine Person auswählen"));
      return;
    }

    const confirmText = selectedPersonIds.length === 1
      ? translate("confirmDeleteSingle", "Person wirklich löschen?")
      : translate("confirmDeleteMultiple", "Ausgewählte Personen wirklich löschen?");

    const confirmed = await new Promise<boolean>((resolve) => 
    {
      MessageBox.confirm(confirmText, {
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.CANCEL,
        onClose: (action) => resolve(action === MessageBox.Action.OK),
      });
    });

    if (!confirmed) 
    {
      return;
    }

    try
    {
      await runWithBusy(oModel, "list", async () =>
      {
        const persons = await deletePersonsAndRefreshList(selectedPersonIds);
        oModel.setProperty("/persons", persons);
        this._applyTableState();
        oModel.setProperty("/selectedPersonIds", []);
        const successText = selectedPersonIds.length === 1
          ? translate("deleteSuccessSingle", "Person gelöscht")
          : translate("deleteSuccessMultiple", "Personen gelöscht");
        MessageToast.show(successText);
      });
    }
    catch (e)
    {
      MessageToast.show((e as Error).message ?? "Fehler beim Löschen");
    }
  }

  /**
   * Applies active search filter and sorting to table items.
   */
  private _applyTableState(): void
  {
    const oModel = this.getAppModel();
    const oTable = this.byId("personTable") as Table | undefined;
    const oBinding = oTable?.getBinding("items") as ListBinding | undefined;

    if (!oModel || !oBinding)
    {
      return;
    }

    const query = (oModel.getProperty("/searchQuery") as string) || "";
    oBinding.filter(buildPersonSearchFilter(query));

    const sortField = (oModel.getProperty("/sortField") as string) || "lastName";
    const sortDescending = !!oModel.getProperty("/sortDescending");
    
    oBinding.sort(buildPersonSorter(sortField, sortDescending));
  }

  /**
   * Loads persons when list route is entered and no data is present yet.
   */
  private async _onListRouteMatched(_event: Event): Promise<void>
  {
    const oModel = this.getAppModel();
    if (!oModel)
    {
      return;
    }
    oModel.setProperty("/selectedPersonIds", []);
    (this.byId("personTable") as Table | undefined)?.removeSelections(true);

    const persons = (oModel.getProperty("/persons") as Person[] | undefined) ?? [];
    if (persons.length > 0)
    {
      return;
    }

    try
    {
      await runWithBusy(oModel, "list", async () =>
      {
        const loadedPersons = await loadPersons();
        oModel.setProperty("/persons", loadedPersons);
      });
      this._applyTableState();
    }
    catch (e)
    {
      MessageToast.show((e as Error).message ?? "Fehler beim Laden der Personen");
    }
  }

  private getAppModel(): JSONModel | undefined
  {
    return this.getOwnerComponent()?.getModel() as JSONModel | undefined;
  }
}

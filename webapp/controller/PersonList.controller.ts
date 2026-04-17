import Controller from "sap/ui/core/mvc/Controller";
import type Event from "sap/ui/base/Event";
import type { Person } from "../model/Person";
import UIComponent from "sap/ui/core/UIComponent";
import type Router from "sap/ui/core/routing/Router";
import JSONModel from "sap/ui/model/json/JSONModel";
import Sorter from "sap/ui/model/Sorter";
import type ListBinding from "sap/ui/model/ListBinding";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import PersonService from "../model/PersonService";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import Localization from "sap/base/i18n/Localization";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import Table from "sap/m/Table";
import { createTranslator } from "../util/i18nUtil";

export default class PersonList extends Controller 
{
  private _router!: Router;

  /**
   * Initializes the list controller and router reference.
   */
  public onInit(): void 
  {
    this._router = UIComponent.getRouterFor(this);
    const oModel = this._getAppModel();
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
    const oModel = this._getAppModel();

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
    const selectedLanguage = ((oEvent as any).getParameter("selectedItem")?.getKey?.() ?? "de") as string;
    Localization.setLanguage(selectedLanguage);
    const i18nModel = new ResourceModel({
      bundleName: "person.app.i18n.i18n",
      bundleLocale: selectedLanguage,
      supportedLocales: ["de", ""],
      fallbackLocale: "",
    });
    this.getOwnerComponent()?.setModel(i18nModel, "i18n");
    window.localStorage.setItem("appLanguage", selectedLanguage);

    const oModel = this._getAppModel();
    oModel?.setProperty("/currentLanguage", selectedLanguage);
  }

  /**
   * Applies sorting when the sort field is changed in toolbar controls.
   *
   * @param oEvent Sort field select change event.
   */
  public onSortFieldChange(oEvent: Event): void
  {
    const oModel = this._getAppModel();
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
    const oModel = this._getAppModel();
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
    const oModel = this._getAppModel();
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
    const oModel = this._getAppModel();
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

    oModel.setProperty("/busy", true);

    try 
    {
      await Promise.all(selectedPersonIds.map((id) => PersonService.deletePerson(id)));
      const persons = await PersonService.getPersons();
      oModel.setProperty("/persons", persons);
      this._applyTableState();
      oModel.setProperty("/selectedPersonIds", []);
      const successText = selectedPersonIds.length === 1
        ? translate("deleteSuccessSingle", "Person gelöscht")
        : translate("deleteSuccessMultiple", "Personen gelöscht");
      MessageToast.show(successText);
    }
    catch (e) 
    {
      MessageToast.show((e as Error).message ?? "Fehler beim Löschen");
    }
    finally 
    {
      oModel.setProperty("/busy", false);
    }
  }

  /**
   * Returns the shared application JSON model from the owner component.
   *
   * @returns The app model, if available.
   */
  private _getAppModel(): JSONModel | undefined
  {
    return this.getOwnerComponent()?.getModel() as JSONModel | undefined;
  }

  /**
   * Applies active search filter and sorting to table items.
   */
  private _applyTableState(): void
  {
    const oModel = this._getAppModel();
    const oTable = this.byId("personTable") as Table | undefined;
    const oBinding = oTable?.getBinding("items") as ListBinding | undefined;

    if (!oModel || !oBinding)
    {
      return;
    }

    const query = (oModel.getProperty("/searchQuery") as string) || "";
    oBinding.filter(this._buildSearchFilter(query));

    const sortField = (oModel.getProperty("/sortField") as string) || "lastName";
    const sortDescending = !!oModel.getProperty("/sortDescending");
    
    oBinding.sort(new Sorter(sortField, sortDescending));
  }

  /**
   * Builds a filter for first name, last name, and email search.
   *
   * @param query Search input from the shared application model.
   * @returns Filter instance or empty filter array.
   */
  private _buildSearchFilter(query: string): Filter[]
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
        //false because we want to match all terms, not just one
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
}

import Controller from "sap/ui/core/mvc/Controller";
import type Event from "sap/ui/base/Event";
import type Element from "sap/ui/core/Element";
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
   * Updates the selected person ID in the shared model.
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

    const selectedItem = (oEvent as any).getParameter("listItem");
    if (!selectedItem) 
    {
      oModel.setProperty("/selectedPersonId", "");
      return;
    }

    const selectedPerson = (selectedItem.getBindingContext?.()?.getObject?.() ?? null) as Person | null;
    oModel.setProperty("/selectedPersonId", selectedPerson?.id ?? "");
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
   * Toggles sorting on the clicked table header field.
   *
   * @param oEvent Header sort button press event.
   */
  public onHeaderSortPress(oEvent: Event): void
  {
    const oModel = this._getAppModel();
    if (!oModel)
    {
      return;
    }

    const headerSortButton = oEvent.getSource() as Element;
    // Field requested by the clicked header button; fallback keeps sorting deterministic.
    const requestedSortField = (headerSortButton.data("sortField") as string | undefined) ?? "lastName";
    const activeSortField = (oModel.getProperty("/sortField") as string) || "lastName";
    const currentDescending = !!oModel.getProperty("/sortDescending");

    if (requestedSortField === activeSortField)
    {
      oModel.setProperty("/sortDescending", !currentDescending);
    }
    else
    {
      oModel.setProperty("/sortField", requestedSortField);
      oModel.setProperty("/sortDescending", false);
    }

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
   * Deletes the currently selected person after confirmation and refreshes the list.
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

    const selectedPersonId = oModel.getProperty("/selectedPersonId") as string;
    if (!selectedPersonId) 
    {
      MessageToast.show("Bitte zuerst eine Person auswählen");
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => 
    {
      MessageBox.confirm("Person wirklich löschen?", {
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
      await PersonService.deletePerson(selectedPersonId);
      const persons = await PersonService.getPersons();
      oModel.setProperty("/persons", persons);
      this._applyTableState();
      oModel.setProperty("/selectedPersonId", "");
      MessageToast.show("Person gelöscht");
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

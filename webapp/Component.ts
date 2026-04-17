import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";
import PersonService from "./model/PersonService";
import type { Person } from "./model/Person";
import Localization from "sap/base/i18n/Localization";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * @namespace person.app
 */
export default class Component extends UIComponent 
{
  /**
   * Initializes the component, sets up the app model, and triggers initial data loading.
   */
  public init(): void 
  {
    super.init();

    const savedLanguage = window.localStorage.getItem("appLanguage");
    const initialLanguage = this._normalizeLanguage(savedLanguage ?? Localization.getLanguage());
    Localization.setLanguage(initialLanguage);
    this.setModel(
      new ResourceModel({
        bundleName: "person.app.i18n.i18n",
        bundleLocale: initialLanguage,
        supportedLocales: ["de", ""],
        fallbackLocale: "",
      }),
      "i18n"
    );

    const oModel = new JSONModel({
      persons: [] as Person[],
      selectedPerson: null as Person | null,
      selectedPersonIds: [] as string[],
      isCreating: false,
      busy: false,
      currentLanguage: initialLanguage,
    });
    this.setModel(oModel);

    this.getRouter().initialize();

    void this._loadPersons();
  }

  /**
   * Loads all persons from the backend and updates the global model state.
   *
   * @returns A promise that resolves when loading is finished.
   */
  private async _loadPersons(): Promise<void> 
  {
    const oModel = this.getModel() as JSONModel;
    oModel.setProperty("/busy", true);
    try 
    {
      const persons = await PersonService.getPersons();
      oModel.setProperty("/persons", persons);
    }
    finally 
    {
      oModel.setProperty("/busy", false);
    }
  }

  /**
   * Normalizes locale values to supported language keys.
   *
   * @param language Raw locale value.
   * @returns Supported language key.
   */
  private _normalizeLanguage(language: string): "de" | "en"
  {
    const normalized = language.toLowerCase().split("-")[0];
    return normalized === "en" ? "en" : "de";
  }
}

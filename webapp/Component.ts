import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { Person } from "./model/Person";
import { applyLanguage, getInitialLanguage } from "./service/LanguageService";

/**
 * @namespace person.app
 */
export default class Component extends UIComponent 
{
  /**
   * Initializes the component, sets up the app model, and starts routing.
   */
  public init(): void 
  {
    super.init();

    //initialize the language
    const initialLanguage = getInitialLanguage();
    applyLanguage(this, initialLanguage);

    //initialize the model
    const oModel = new JSONModel({
      persons: [] as Person[],
      selectedPerson: null as Person | null,
      selectedPersonIds: [] as string[],
      isCreating: false,
      list: {
        busy: false,
      },
      detail: {
        busy: false,
      },
      currentLanguage: initialLanguage,
    });

    this.setModel(oModel);

    //initialize the router
    this.getRouter().initialize();
  }
}

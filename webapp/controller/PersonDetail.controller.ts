import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageToast from "sap/m/MessageToast";
import Input from "sap/m/Input";
import Select from "sap/m/Select";
import PersonService from "../model/PersonService";
import type { Person, PersonDraft } from "../model/Person";
import UIComponent from "sap/ui/core/UIComponent";
import type Router from "sap/ui/core/routing/Router";
import { createTranslator } from "../util/i18nUtil";

export default class PersonDetail extends Controller 
{
  private _router!: Router;

  /**
   * Initializes the detail controller and attaches route matching handling.
   */
  public onInit(): void 
  {
    this._router = UIComponent.getRouterFor(this);
    const oRoute = this._router.getRoute("detail");
    if (oRoute) 
    {
      oRoute.attachPatternMatched(this._onRouteMatched as any, this);
    }
  }

  /**
   * Loads or initializes the selected person depending on route parameters.
   *
   * @param oEvent Route match event.
   * @returns A promise that resolves when route handling is completed.
   */
  private async _onRouteMatched(oEvent: any): Promise<void> 
  {
    const sId = oEvent.getParameter("arguments")?.id as string | undefined;
    if (!sId) 
    {
      return;
    }

    const oModel = this._getAppModel();

    if (!oModel) 
    {
      return;
    }
    if (sId === "new") 
    {
      oModel.setProperty("/isCreating", true);
      oModel.setProperty("/selectedPerson", {
        firstName: "",
        lastName: "",
        email: "",
        gender: "M",
      } as PersonDraft);
      return;
    }

    oModel.setProperty("/busy", true);
    try 
    {
      const oPerson = await PersonService.getPerson(sId);
      oModel.setProperty("/isCreating", false);
      oModel.setProperty("/selectedPerson", {
        ...oPerson,
        gender: oPerson.gender || "M",
      });
    }
    catch (e) 
    {
      MessageToast.show((e as Error).message ?? "Fehler beim Laden der Person");
      oModel.setProperty("/selectedPerson", null);
    }
    finally 
    {
      oModel.setProperty("/busy", false);
    }
  }

  /**
   * Navigates back to the list route.
   */
  public onNavBack(): void 
  {
    this._router.navTo("list");
  }

  /**
   * Validates and persists the current person, then refreshes list state.
   *
   * @returns A promise that resolves when save handling is completed.
   */
  public async onSave(): Promise<void> 
  {
    const oModel = this._getAppModel();
    if (!oModel) 
    {
      MessageToast.show("Model nicht verfügbar");
      return;
    }
    const oSelected = oModel.getProperty("/selectedPerson") as Person | PersonDraft | null;
    if (!oSelected) 
    {
      MessageToast.show("Keine Person ausgewählt");
      return;
    }
    const isCreating = !!oModel.getProperty("/isCreating");

    const oFirstNameInput: Input = this.byId("firstNameInput") as Input;
    const oLastNameInput: Input = this.byId("lastNameInput") as Input;
    const oEmailInput: Input = this.byId("emailInput") as Input;
    const oGenderSelect: Select = this.byId("genderSelect") as Select;
    const translate = createTranslator(this.getOwnerComponent());

    const sFirstName = oFirstNameInput.getValue().trim();
    const sLastName = oLastNameInput.getValue().trim();
    const sEmail = oEmailInput.getValue().trim();
    const sGender = oGenderSelect.getSelectedKey().trim();

    this._clearValidationStates(oFirstNameInput, oLastNameInput, oEmailInput, oGenderSelect);

    if (!sFirstName || !sLastName || !sEmail || !sGender) 
    {
      const requiredMessage = translate("fieldRequired", "Bitte dieses Feld ausfüllen");
      if (!sFirstName)
      {
        oFirstNameInput.setValueState("Error");
        oFirstNameInput.setValueStateText(requiredMessage);
      }
      if (!sLastName)
      {
        oLastNameInput.setValueState("Error");
        oLastNameInput.setValueStateText(requiredMessage);
      }
      if (!sEmail)
      {
        oEmailInput.setValueState("Error");
        oEmailInput.setValueStateText(requiredMessage);
      }
      if (!sGender)
      {
        oGenderSelect.setValueState("Error");
        oGenderSelect.setValueStateText(requiredMessage);
      }
      MessageToast.show(
        translate("validationPleaseFillAllFields", "Bitte alle Pflichtfelder ausfüllen")
      );
      return;
    }
    if (!this._isValidEmail(sEmail)) 
    {
      oEmailInput.setValueState("Error");
      oEmailInput.setValueStateText(
        translate("validationInvalidEmail", "Bitte eine gültige E-Mail-Adresse eingeben")
      );
      MessageToast.show(
        translate("validationInvalidEmail", "Bitte eine gültige E-Mail-Adresse eingeben")
      );
      return;
    }
    oEmailInput.setValueState("None");

    const payload: PersonDraft = {
      firstName: sFirstName,
      lastName: sLastName,
      email: sEmail,
      gender: sGender,
    };

    oModel.setProperty("/busy", true);
    try 
    {
      if (!isCreating && !(oSelected as Person).id) 
      {
        throw new Error("Fehlende Person-ID für Update");
      }
      const oSaved = isCreating
        ? await PersonService.createPerson(payload)
        : await PersonService.updatePerson({
          id: (oSelected as Person).id,
          ...payload,
        });
      oModel.setProperty("/selectedPerson", oSaved);
      oModel.setProperty("/isCreating", false);
      
      //refresh the list
      const persons = await PersonService.getPersons();
      oModel.setProperty("/persons", persons);
      oModel.setProperty("/selectedPersonIds", [oSaved.id]);

      MessageToast.show("Gespeichert");
      this._router.navTo("list");
    }
    catch (e) 
    {
      MessageToast.show((e as Error).message ?? "Fehler beim Speichern");
    }
    finally 
    {
      oModel.setProperty("/busy", false);
    }
  }

  /**
   * Checks whether an email address has a basic valid format.
   *
   * @param email Email string to validate.
   * @returns True when the email format is valid.
   */
  private _isValidEmail(email: string): boolean 
  {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
   * Resets validation states for all editable form fields.
   */
  private _clearValidationStates(
    oFirstNameInput: Input,
    oLastNameInput: Input,
    oEmailInput: Input,
    oGenderSelect: Select
  ): void
  {
    oFirstNameInput.setValueState("None");
    oLastNameInput.setValueState("None");
    oEmailInput.setValueState("None");
    oGenderSelect.setValueState("None");
  }

}

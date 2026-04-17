import MessageToast from "sap/m/MessageToast";
import Input from "sap/m/Input";
import Select from "sap/m/Select";
import UIComponent from "sap/ui/core/UIComponent";
import Controller from "sap/ui/core/mvc/Controller";
import PersonApiService from "../api/PersonApiService";
import type { Person, PersonDraft } from "../model/Person";
import type Router from "sap/ui/core/routing/Router";
import JSONModel from "sap/ui/model/json/JSONModel";
import { createTranslator } from "../util/i18nUtil";
import { runWithBusy } from "../util/modelStateUtil";
import { validatePersonDraft } from "../validation/personValidation";
import { savePersonAndRefreshList } from "../service/PersonService";

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

    const oModel = this.getAppModel();

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

    try
    {
      await runWithBusy(oModel, "detail", async () =>
      {
        const oPerson = await PersonApiService.getPerson(sId);
        oModel.setProperty("/isCreating", false);
        oModel.setProperty("/selectedPerson", {
          ...oPerson,
          gender: oPerson.gender || "M",
        });
      });
    }
    catch (e)
    {
      MessageToast.show((e as Error).message ?? "Fehler beim Laden der Person");
      oModel.setProperty("/selectedPerson", null);
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
    const oModel = this.getAppModel();
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
    const payload: PersonDraft = {
      firstName: sFirstName,
      lastName: sLastName,
      email: sEmail,
      gender: sGender,
    };

    this._clearValidationStates(oFirstNameInput, oLastNameInput, oEmailInput, oGenderSelect);
    const validationResult = validatePersonDraft(payload);

    if (validationResult.missingFields.length > 0)
    {
      const requiredMessage = translate("fieldRequired", "Bitte dieses Feld ausfüllen");
      if (validationResult.missingFields.includes("firstName"))
      {
        this.setControlError(oFirstNameInput, requiredMessage);
      }
      if (validationResult.missingFields.includes("lastName"))
      {
        this.setControlError(oLastNameInput, requiredMessage);
      }
      if (validationResult.missingFields.includes("email"))
      {
        this.setControlError(oEmailInput, requiredMessage);
      }
      if (validationResult.missingFields.includes("gender"))
      {
        this.setControlError(oGenderSelect, requiredMessage);
      }
      MessageToast.show(
        translate("validationPleaseFillAllFields", "Bitte alle Pflichtfelder ausfüllen")
      );
      return;
    }
    if (validationResult.hasInvalidEmail)
    {
      this.setControlError(
        oEmailInput,
        translate("validationInvalidEmail", "Bitte eine gültige E-Mail-Adresse eingeben")
      );
      MessageToast.show(
        translate("validationInvalidEmail", "Bitte eine gültige E-Mail-Adresse eingeben")
      );
      return;
    }

    try
    {
      await runWithBusy(oModel, "detail", async () =>
      {
        const { savedPerson: oSaved, persons } = await savePersonAndRefreshList(oSelected, payload, isCreating);
        oModel.setProperty("/selectedPerson", oSaved);
        oModel.setProperty("/isCreating", false);
        oModel.setProperty("/persons", persons);
        oModel.setProperty("/selectedPersonIds", []);

        MessageToast.show("Gespeichert");
        this._router.navTo("list");
      });
    }
    catch (e)
    {
      MessageToast.show((e as Error).message ?? "Fehler beim Speichern");
    }
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
    this.clearControlState(oFirstNameInput);
    this.clearControlState(oLastNameInput);
    this.clearControlState(oEmailInput);
    this.clearControlState(oGenderSelect);
  }

  private getAppModel(): JSONModel | undefined
  {
    return this.getOwnerComponent()?.getModel() as JSONModel | undefined;
  }

  private setControlError(control: Input | Select, message: string): void
  {
    control.setValueState("Error");
    control.setValueStateText(message);
  }

  private clearControlState(control: Input | Select): void
  {
    control.setValueState("None");
    control.setValueStateText("");
  }

}

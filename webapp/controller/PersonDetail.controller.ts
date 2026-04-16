import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageToast from "sap/m/MessageToast";
import Input from "sap/m/Input";
import PersonService from "../model/PersonService";
import type { Person, PersonDraft } from "../model/Person";
import UIComponent from "sap/ui/core/UIComponent";
import type Router from "sap/ui/core/routing/Router";

export default class PersonDetail extends Controller 
{
  private _router!: Router;

  public onInit(): void 
  {
    this._router = UIComponent.getRouterFor(this);
    const oRoute = this._router.getRoute("detail");
    if (oRoute) 
    {
      oRoute.attachPatternMatched(this._onRouteMatched as any, this);
    }
  }

  private async _onRouteMatched(oEvent: any): Promise<void> 
  {
    const sId = oEvent.getParameter("arguments")?.id as string | undefined;
    if (!sId) 
    {
      return;
    }

    const oModel = this.getOwnerComponent()?.getModel() as JSONModel | undefined;
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
      } as PersonDraft);
      return;
    }

    oModel.setProperty("/busy", true);
    try 
    {
      const oPerson = await PersonService.getPerson(sId);
      oModel.setProperty("/isCreating", false);
      oModel.setProperty("/selectedPerson", oPerson);
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

  public onNavBack(): void 
  {
    this._router.navTo("list");
  }

  public async onSave(): Promise<void> 
  {
    const oModel = this.getOwnerComponent()?.getModel() as JSONModel | undefined;
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

    const oFirstNameInput = this.byId("firstNameInput") as Input;
    const oLastNameInput = this.byId("lastNameInput") as Input;
    const oEmailInput = this.byId("emailInput") as Input;

    const sFirstName = oFirstNameInput.getValue().trim();
    const sLastName = oLastNameInput.getValue().trim();
    const sEmail = oEmailInput.getValue().trim();

    if (!sFirstName || !sLastName || !sEmail) 
    {
      MessageToast.show("Bitte alle Felder ausfüllen");
      return;
    }
    if (!this._isValidEmail(sEmail)) 
    {
      MessageToast.show("Bitte eine gültige E-Mail-Adresse eingeben");
      oEmailInput.setValueState("Error");
      return;
    }
    oEmailInput.setValueState("None");

    const payload: PersonDraft = {
      firstName: sFirstName,
      lastName: sLastName,
      email: sEmail,
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
      const persons = await PersonService.getPersons();
      oModel.setProperty("/persons", persons);
      oModel.setProperty("/selectedPersonId", oSaved.id);

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

  private _isValidEmail(email: string): boolean 
  {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

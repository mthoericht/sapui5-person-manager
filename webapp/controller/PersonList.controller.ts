import Controller from "sap/ui/core/mvc/Controller";
import type Event from "sap/ui/base/Event";
import type { Person } from "../model/Person";
import UIComponent from "sap/ui/core/UIComponent";
import type Router from "sap/ui/core/routing/Router";
import JSONModel from "sap/ui/model/json/JSONModel";
import PersonService from "../model/PersonService";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";

export default class PersonList extends Controller 
{
  private _router!: Router;

  public onInit(): void 
  {
    this._router = UIComponent.getRouterFor(this);
  }

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

  public onSelectionChange(oEvent: Event): void 
  {
    const oModel = this.getOwnerComponent()?.getModel() as JSONModel | undefined;
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

    const selectedPerson = (selectedItem.getBindingContext?.()?.getObject?.() ??
      null) as Person | null;
    oModel.setProperty("/selectedPersonId", selectedPerson?.id ?? "");
  }

  public onCreate(): void 
  {
    this._router.navTo("detail", { id: "new" });
  }

  public async onDelete(): Promise<void> 
  {
    const oModel = this.getOwnerComponent()?.getModel() as JSONModel | undefined;
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
}

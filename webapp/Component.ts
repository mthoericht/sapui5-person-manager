import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";
import PersonService from "./model/PersonService";
import type { Person } from "./model/Person";

/**
 * @namespace person.app
 */
export default class Component extends UIComponent {
	public init(): void {
		super.init();

		const oModel = new JSONModel({
			persons: [] as Person[],
			selectedPerson: null as Person | null,
			selectedPersonId: "",
			isCreating: false,
			busy: false
		});
		this.setModel(oModel);

		this.getRouter().initialize();

		void this._loadPersons();
	}

	private async _loadPersons(): Promise<void> {
		const oModel = this.getModel() as JSONModel;
		oModel.setProperty("/busy", true);
		try {
			const persons = await PersonService.getPersons();
			oModel.setProperty("/persons", persons);
		} finally {
			oModel.setProperty("/busy", false);
		}
	}
}


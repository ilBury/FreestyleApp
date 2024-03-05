sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel"
], function (UIComponent,
	JSONModel) {
	"use strict";

	return UIComponent.extend("products.app.Component", {
		metadata: {
			manifest: "json",
			handleValidation: true
		},

		init : function () {
			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);
			const oModel = new JSONModel();
			oModel.loadData("./model/products.json", "", false, "", true);
			oModel.loadData("./model/categories.json", "", false, "", true);
			oModel.loadData("./model/suppliers.json", "", false, "", true);

            this.setModel(oModel);
			this.getRouter().initialize();
		}
	});
});
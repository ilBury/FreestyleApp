sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(
	Controller
) {
	"use strict";

	return Controller.extend("app.products.controller.BaseController", {

		getTextFromI18n: function(sKey) {
			const i18nModel = this.getOwnerComponent().getModel("i18n");
			const oBundle = i18nModel.getResourceBundle();
      		return oBundle.getText(sKey)
		},

		getModel: function(sName) {
			return this.getView().getModel(sName);
		}
        
	});
});
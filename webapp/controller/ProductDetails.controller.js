sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
	"use strict";

	return Controller.extend("products.app.controller.ProductDetails", {
		
        onInit: function() {
            const oModel = new JSONModel();
            const oComponent = this.getOwnerComponent();
            const oRouter = oComponent.getRouter();
            
            oModel.loadData("./model/products.json", "", false, "", true);
			oModel.loadData("./model/categories.json", "", false, "", true);
			oModel.loadData("./model/suppliers.json", "", false, "", true);

            this.getView().setModel(oModel);

            oRouter.getRoute("ProductDetails").attachPatternMatched(this.onPatternMatched, this);
        },

        onPatternMatched: function(oEvent) {
            const mRouteArguments = oEvent.getParameter("arguments");
            const sProductId = mRouteArguments.productId;
            const sKey = "/Products/" + (sProductId - 1);

            this.getView().bindObject({
                path: sKey
            })
        },

        getCurrentSupplier: function(data) {
			const oModel = this.getView().getModel();
			const aSuppliers = oModel.getProperty("/Suppliers");	

			return aSuppliers.find((el) => data?.includes(el.SupplierId))
		},
		getCategoriesName: function(data) {
			const oModel = this.getView().getModel();
			const aCategories = oModel.getProperty("/Categories");	

			return aCategories
					.filter((el) => data?.includes(el.Id))
					.map(el => el.Name)
					.join("")
		},

	});
});
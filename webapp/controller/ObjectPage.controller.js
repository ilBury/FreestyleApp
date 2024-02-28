sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
	"use strict";

	return Controller.extend("products.app.controller.ObjectPage", {
		
        onInit: function() {
            const oModelProducts = new JSONModel();
            const oModelCategories = new JSONModel();
            const oModelSuppliers = new JSONModel();

            const sProductsJson = "../model/products.json";
            const sCategoriesJson = "../model/categories.json";
            const sSuppliersJson = "../model/suppliers.json";

            oModelProducts.loadData(sProductsJson, "", false);
            oModelCategories.loadData(sCategoriesJson, "", false);
            oModelSuppliers.loadData(sSuppliersJson, "", false);

            oModelCategories.setData(oModelSuppliers.getData(), true);
            oModelProducts.setData(oModelCategories.getData(), true);
            
            this.getView().setModel(oModelProducts);

            const oComponent = this.getOwnerComponent();
            const oRouter = oComponent.getRouter();


            oRouter.getRoute("ObjectPage").attachPatternMatched(this.onPatternMatched, this);
        },

        onPatternMatched: function(oEvent) {
            const mRouteArguments = oEvent.getParameter("arguments");
            const sProductId = mRouteArguments.productId;
            const sKey = "/Products/" + (sProductId - 1);

            this.getView().bindObject({
                path: sKey
            })
        },

        getSuppliersName: function(data) {
			const oModel = this.getView().getModel();
			const aSuppliers = oModel.getProperty("/Suppliers");	
			console.log(aSuppliers, data)
			return aSuppliers
					.filter((el) => data?.includes(el.SupplierId))
					.map(el => el.SuppliersName)
		},

        getSuppliersAddress: function(data) {
			const oModel = this.getView().getModel();
			const aSuppliers = oModel.getProperty("/Suppliers");	
			console.log(aSuppliers, data)
			return aSuppliers
					.filter((el) => data?.includes(el.SupplierId))
					.map(el => el.Address)
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
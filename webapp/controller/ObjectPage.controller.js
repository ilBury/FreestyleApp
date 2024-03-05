sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/base/strings/formatMessage",
	"sap/ui/core/Core"
], function (Controller, JSONModel,	formatMessage, Core) {
	"use strict";

	return Controller.extend("products.app.controller.ObjectPage", {
		
        formatMessage: formatMessage,
        onInit: function() {
			const oMessageManager = Core.getMessageManager();
			const oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
            const oComponent = this.getOwnerComponent();
            const oRouter = oComponent.getRouter();
			const oAvailabilityModel = new JSONModel({
				Availability: [
					{
						key: "false",
						value: this.getTextFromI18n("InStockText")
					},
					{
						key: "true",
						value: this.getTextFromI18n("OutOfStockText")
					}
				],
				SelectedKey: "false"
			})
			const oFormModel = new JSONModel({
				Id: "",
				Name: "",
				Description: "",
				Price: null,
				Quantity: "",
				Category: "",
				Suppliers: [],
				Availability: "",
				Currency: "",
				CreatedAt: new Date(),
				UpdatedAt: new Date()
			})
			
			oMessageManager.registerObject(this.getView(), true)
			this.getView().setModel(oFormModel, "FormModel");
			this.getView().setModel(oAvailabilityModel, "AvailabilityModel");

            oRouter.getRoute("ObjectPage").attachPatternMatched(this.onPatternMatched, this);
        },

		onNameInputLiveChange: function() {
			console.log("hello")
			
		},

		getTextFromI18n: function(sKey) {
			const i18nModel = this.getOwnerComponent().getModel("i18n");
			const oBundle = i18nModel.getResourceBundle();
      		return oBundle.getText(sKey)
		},

        onPatternMatched: function(oEvent) {
            const mRouteArguments = oEvent.getParameter("arguments");
            const sProductId = mRouteArguments.productId;
			const oModel = this.getView().getModel();
			const sProductQuantity = oModel.getProperty("/Products").length;
            const sKey = "/Products/" + (sProductId - 1);
			const oEditModel = new JSONModel({
				EditMode: sProductId > sProductQuantity ? true : false
			});

			
			this.getView().setModel(oEditModel, "EditModel");
            this.getView().bindObject({
                path: sKey
            })
        },

        getSuppliersName: function(data) {
			const oModel = this.getView().getModel();
			const aSuppliers = oModel.getProperty("/Suppliers");	
			
			return aSuppliers
					.filter((el) => data?.includes(el.SupplierId))
					.map(el => el.SuppliersName)
		},

        getSuppliersAddress: function(data) {
			const oModel = this.getView().getModel();
			const aSuppliers = oModel.getProperty("/Suppliers");	
			
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

		onValidateFieldGroup: function(oEvent) {
			
			
			console.log("hello")
		},

		onCreateProductPress: function(oEvent) {
			const oView = this.getView();
			const oModel = oView.getModel()
			const oFormModel = oView.getModel("FormModel");
			const aProducts = oModel.getProperty("/Products");
			const sProductId = aProducts.length + 1;

			/* oFormModel.setProperty("/Id", String(sProductId));
			
			
			aProducts.push(oFormModel.getProperty("/"))
			oModel.setProperty("/Products", aProducts);
			oFormModel.setProperty("/", {
				Id: "",
				Name: "",
				Description: "",
				Price: null,
				Quantity: "",
				Category: "",
				Suppliers: "",
				Availability: "",
				Currency: "",
				CreatedAt: new Date(),
				UpdatedAt: new Date()
			}) */
		},

		onCancelButtonPress: function() {
			const oComponent = this.getOwnerComponent();

			oComponent.getRouter().navTo("ListReport")
		}

	});
});
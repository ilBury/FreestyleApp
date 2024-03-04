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
				Name: null,
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

			/**
		 * Validates the value of an input control.
		 *
		 * @param {sap.m.Input} oInput - The input control to validate.
		 * @returns {boolean} - Indicates whether a validation error occurred.
		 * @public
		 */
			validateInput: function (oInput) {
				let sValueState = "None";
				let bValidationError = false;
				const oBinding = oInput.getBinding("value");
				
				try {
					oBinding.getType().validateValue(oInput.getValue());
					if(!oInput.getValue()) {
						throw new Error("Required");
					}
				} catch (oException) {
					sValueState = "Error";
					bValidationError = true;
				}
	
				oInput.setValueState(sValueState);
	
				return bValidationError;
			},

		/**
		 * Event handler for the change event of a valid input.
		 *
		 * @param {sap.ui.base.Event} oEvent - The event object passed when the function is called.
		 * @returns {void}
		 * @public
		 */
		onChangeInputValid: function(oEvent) {
			const oInput = oEvent.getSource();
			this.validateInput(oInput);
		},

		checkFieldsForValidity: function(oField) {
			console.log(oField)
			/* return oField !== "" ? "None" : "Error";	 */
		},

		onCreateProductPress: function(oEvent) {
			const oView = this.getView();
			const oModel = oView.getModel()
			const oFormModel = oView.getModel("FormModel");
			const aProducts = oModel.getProperty("/Products");
			const sProductId = aProducts.length + 1;

			oFormModel.setProperty("/Id", String(sProductId));
			console.log(oFormModel.getProperty("/"))
			/* this.checkFieldsForValidity(oFormModel.getProperty("/Name")) */
			

			/* 
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
			})*/
		},

		onCancelButtonPress: function() {
			const oComponent = this.getOwnerComponent();

			oComponent.getRouter().navTo("ListReport")
		}

	});
});
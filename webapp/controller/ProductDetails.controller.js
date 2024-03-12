sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/Core",
	"sap/ui/model/ValidateException",
	"sap/base/util/deepEqual"
], function (Controller, JSONModel, MessageToast, MessageBox, DateFormat, Core, ValidateException, deepEqual) {
	"use strict";

	return Controller.extend("products.app.controller.ProductDetails", {
		
        onInit: function() {
			
            const oComponent = this.getOwnerComponent();
            const oRouter = oComponent.getRouter();
            const oAvailabilityModel = new JSONModel({
				Availability: [
					{
						key: "true",
						value: this.getTextFromI18n("InStockText")
					},
					{
						key: "false",
						value: this.getTextFromI18n("OutOfStockText")
					}
				]
			})
			Core.getMessageManager().registerObject(this.getView(), true);
			
			this.getView().setModel(oAvailabilityModel, "AvailabilityModel");

            oRouter.getRoute("ProductDetails").attachPatternMatched(this.onPatternMatched, this);
			oRouter.attachRouteMatched(this.onRouteMatched, this)
        },

		onRouteMatched: function() {
			const oDateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd'T'HH:mm:ss"
			});
	
			const oFormModel = new JSONModel({
				Id: "",
				Name: "",
				Description: "",
				Price: null,
				Quantity: null,
				Category: "",
				Suppliers: [],
				Availability: "",
				Currency: "",
				CreatedAt: oDateFormat.format(new Date()),
				UpdatedAt: oDateFormat.format(new Date())
			})

			this.getView().setModel(oFormModel, "FormModel");
		},

        onPatternMatched: function(oEvent) {
            const mRouteArguments = oEvent.getParameter("arguments");
            const sProductId = mRouteArguments.productId;
			const sNewProduct = "newProduct";
			const oModel = this.getView().getModel();
			const bCorrectId = oModel.getProperty("/Products").map((el) => el.Id).includes(sProductId);
			const oEditModel = new JSONModel({
				EditMode: sProductId === sNewProduct ? true : false
			});
			
			this.getView().setModel(oEditModel, "EditModel");
			const bEditMode = this.getView().getModel("EditModel").getProperty("/EditMode");
			const sKey = bEditMode ? "/Products/newProduct" : "/Products/" + (sProductId - 1);

			if(!bCorrectId && !bEditMode) {
				const oComponent = this.getOwnerComponent();
				oComponent.getRouter().getTargets().display("notFound");
			}
			
			
            this.getView().bindObject({
                path: sKey
            })
        },

		getTextFromI18n: function(sKey) {
			const i18nModel = this.getOwnerComponent().getModel("i18n");
			const oBundle = i18nModel.getResourceBundle();
      		return oBundle.getText(sKey)
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

		onCreateProductPress: function() {
			const oView = this.getView();
			const oModel = oView.getModel();
			const oFormModel = oView.getModel("FormModel");
			const aProducts = oModel.getProperty("/Products");
			const nProductId = aProducts.length + 1;
			const aSelectedSuppliersId = this.byId("idSuppliersMultiComboBox").getSelectedKeys();
			const aSuppliers = aSelectedSuppliersId.map(el => ({SupplierId: el}));
			const sAvailability = oFormModel.getProperty("/Availability");
			const oDateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd'T'HH:mm:ss"
			});
			
			const oInputBinding = this.byId("idNameInput").getBinding("value");
			const sValue = oFormModel.getProperty("/Name");
			try {
				oInputBinding.getType().validateValue(sValue);
				if(this.byId("idNameInput").getValueState() === "Error") {
					return new Error()
				}
			} catch (oException) {
				this.byId("idNameInput").setValueState("Error")
				return
			}
		
			this.byId("idNameInput").setValueState("None");
			
			
			oFormModel.setProperty("/Availability", JSON.parse(sAvailability.toLowerCase()))
			oFormModel.setProperty("/Id", String(nProductId));
			oFormModel.setProperty("/Suppliers", aSuppliers);
		
			aProducts.push(oFormModel.getProperty("/"))
			oModel.setProperty("/Products", aProducts);
	
			oFormModel.setProperty("/", {
				Id: "",
				Name: "",
				Description: "",
				Price: null,
				Quantity: null,
				Category: "",
				Suppliers: [],
				Availability: "",
				Currency: "",
				CreatedAt: oDateFormat.format(new Date()),
				UpdatedAt: oDateFormat.format(new Date())
			})
		
			MessageToast.show(this.getTextFromI18n("CreatedProductText"), {
				closeOnBrowserNavigation: false
			});
			this.getOwnerComponent().getRouter().navTo("ListReport");
		},

		onFormValidateFieldGroup: function(oEvent) {
			const sValue = this.byId("idNameInput").getValue();
			const oInputBinding = this.byId("idNameInput").getBinding("value")
			try {
				oInputBinding.getType().validateValue(sValue);
	
			} catch (oException) {
				this.byId("idNameInput").setValueState("Error")
				
				return;
				//logic with setValueState or create custom message
			}
			this.byId("idNameInput").setValueState("None")
		},

		onConfirmationMessageBoxPress: function(oComponent) {
			const oCopyModel = this.getView().getModel("CopyModel");
			const oFormModel = this.getView().getModel("FormModel");
			const sCurrentId = this.getView().getBindingContext().getObject("Id")
			const oModel = this.getView().getModel();
			MessageBox
			.warning(this.getTextFromI18n(oCopyModel ? "LostChangesWarningMessage" : "LostDataWarningMessage"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: (sAction) => {
					if(sAction === MessageBox.Action.OK) {
						if(oCopyModel) {
							oFormModel.setProperty("/", Object.assign({}, oCopyModel.getData()))
							oModel.setProperty("/Products/" + (sCurrentId - 1), Object.assign({}, oCopyModel.getData()))
						}
						oComponent.getRouter().navTo("ListReport");	
					}
				}
			});
		},

		isFieldsChanged: function(oFormData, oCopyData) {
			if(!oCopyData) return false; 
			const bIsEqualModels = deepEqual(oFormData, oCopyData);
			const aCopySuppliers = oCopyData.Suppliers.map(el => el.SupplierId);
			const aSelectedSuppliersId = this.byId("idSuppliersMultiComboBox").getSelectedKeys();
			const aChangedSuppliers = aSelectedSuppliersId.filter(el => !aCopySuppliers.includes(el));

			return !aChangedSuppliers.length && !bIsEqualModels ? true : false;
		},

		onCancelButtonPress: function() {
			const oCopyModel = this.getView().getModel("CopyModel");
			const oComponent = this.getOwnerComponent();
			const oFormModelData = this.getView().getModel("FormModel").getData();
			const bAllEmptyFields = Object.keys(oFormModelData)
										.slice(0, -2)
										.every(el => !oFormModelData[el] || !oFormModelData[el]?.length);
			const bIsChangedFields = this.isFieldsChanged(oFormModelData, oCopyModel?.getData());
			
			if(bAllEmptyFields) {
				oComponent.getRouter().navTo("ListReport");
			} else if(!bIsChangedFields) {
				this.getView().getModel("EditModel").setProperty("/EditMode", false);
			} else {
				this.onConfirmationMessageBoxPress(oComponent);		
			}	
		},

		rewriteProductsIds: function() {
			const aProducts = this.getView().getModel().getProperty("/Products");
			aProducts.map((el, id) => {
				el.Id = String(id + 1);
				return el;
			})
		},

		removeProduct: function() {
			const oComponent = this.getOwnerComponent()
			const sCurrentId = this.getView().getBindingContext().getObject("Id");
			const oModel = this.getView().getModel();
			const aCurrentProducts = oModel.getProperty("/Products").filter(el => el.Id !== sCurrentId);

			oModel.setProperty("/Products", aCurrentProducts);
			this.rewriteProductsIds();
			oComponent.getRouter().navTo("ListReport");	
			MessageToast.show(this.getTextFromI18n("ProductWasNotRemovedMessage"), {
				closeOnBrowserNavigation:false
			})
		},

		onDeleteProductPress: function() {
			MessageBox.warning(this.getTextFromI18n("DeleteOneProductWarningMessage"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: (sAction) => {	
					if(sAction === MessageBox.Action.OK) {
						this.removeProduct();	
					}
				}
			});
		},

		getSuppliersId: function(data) {
			return data.map(el => el.SupplierId)
		},

		onUpdateProductPress: function() {
			const oCtx = this.getView().getBindingContext();
			const sCurrentId = oCtx.getObject("Id")
			const oCurrentProduct = oCtx.getProperty("/Products").find(el => el.Id == sCurrentId);
			const oFormModel = this.getView().getModel("FormModel");
			const oCopyProductModel = new JSONModel(Object.assign({}, oCurrentProduct));

			oFormModel.setProperty("/", oCurrentProduct);
		
			this.getView().getModel("EditModel").setProperty("/EditMode", true)
			this.getView().setModel(oCopyProductModel, "CopyModel")
		},

		onSaveProductPress: function() {
			const oView = this.getView();
			const oModel = oView.getModel();
			const oFormModel = this.getView().getModel("FormModel");
			const aSelectedSuppliersId = this.byId("idSuppliersMultiComboBox").getSelectedKeys();
			const aSelectedSuppliers = aSelectedSuppliersId.map(el => ({SupplierId: el}));
			const oDateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd'T'HH:mm:ss"
			});

			oFormModel.setProperty("/UpdatedAt", oDateFormat.format(new Date()))
			oFormModel.setProperty("/Suppliers", aSelectedSuppliers)
			oModel.refresh()
			this.getOwnerComponent().getRouter().navTo("ListReport");	
			
			MessageToast.show(this.getTextFromI18n("ProductWasUpdatedMessage"), {
				closeOnBrowserNavigation: false
			});
		}
	});
});
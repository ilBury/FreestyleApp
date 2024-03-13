sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/Core",
	"sap/base/util/deepEqual",
	"sap/ui/core/Messaging",
	'sap/ui/core/message/Message',
	'sap/ui/core/library'
], function (Controller,
	JSONModel,
	MessageToast,
	MessageBox,
	DateFormat,
	Core,
	deepEqual,
	Messaging,
	Message,
	library) {
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
			Messaging.registerObject(this.getView(), true)
			
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

			this.getView().getModel("CopyModel")?.setProperty("/", null)
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

		getFormFields: function() {
			return [
				this.byId("idNameInput"),
				this.byId("idPriceInput"),
				this.byId("idQuantityInput"),
				this.byId("idCategoriesSelect"),
				this.byId("idAvailabilitySelect"),
				this.byId("idCurrencyInput")
			]
		},

		validateField: function(oControl) {
			const aMessages = Messaging.getMessageModel().getData();
			const sSelectControl = "sap.m.Select";
			const sCurrentControlName = oControl.getMetadata().getName();
			const sValue = sCurrentControlName === sSelectControl ? oControl.getSelectedKey() : oControl.getValue();
			const sCurrentBindingPath = sCurrentControlName === sSelectControl ? oControl.getBindingPath("selectedKey") : oControl.getBindingPath("value")
			aMessages.forEach(el => {
				if(el.target === sCurrentBindingPath) {
					Messaging.removeMessages(el)
				}	
			})

			if(!sValue) {
				Messaging.addMessages(
					new Message({
						message: "Should be required",
						type: library.MessageType.Error,
						target: sCurrentBindingPath,
						processor: this.getView().getModel("FormModel")
					})
				)
			}
		},

		onCreateProductPress: function() {
			const oView = this.getView();
			const oModel = oView.getModel();
			const oFormModel = oView.getModel("FormModel");
			const aProducts = oModel.getProperty("/Products");
			const nProductId = aProducts.length + 1;
			const aSuppliers = oFormModel.getProperty("/Suppliers").map(el => ({SupplierId: el}));
			const sAvailability = oFormModel.getProperty("/Availability");
			const oDateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd'T'HH:mm:ss"
			});
			const aFormFields = this.getFormFields();

			aFormFields.forEach(oControl => this.validateField(oControl));
			const aMessages = Messaging.getMessageModel().getData();

			if(!aMessages.length) {
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
			} else {
				const sSelectControl = "sap.m.Select";
				aFormFields
					.filter(oControl => oControl.getMetadata().getName() !== sSelectControl)
					.find(oControl => oControl.getBinding("value").getPath() === aMessages[0].target)
					?.focus();
				MessageToast.show(this.getTextFromI18n("NotValidatedMessage"), {
					closeOnBrowserNavigation: false
				});
			}
		},

		onLiveChange: function(oEvent) {	
			
			this.validateField(oEvent.getSource())
		},

		onConfirmationMessageBoxPress: function(oComponent) {
			const oCopyModel = this.getView().getModel("CopyModel");
			
			const oCopyModelSuppliers = oCopyModel?.getProperty("/Suppliers").map(el => ({SupplierId: el}));
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
							oCopyModel.setProperty("/Suppliers", oCopyModelSuppliers)
							oModel.setProperty("/Products/" + (sCurrentId - 1), Object.assign({}, oCopyModel.getData()));
							this.getView().getModel("EditModel").setProperty("/EditMode", false);
						} else {
							oComponent.getRouter().navTo("ListReport");
						}	
					}
				}
			});
		},

		isFieldsChanged: function(oFormData, oCopyData) {
			if(!oCopyData) return false; 
			
			const aSelectedSuppliers = oFormData.Suppliers;			
			const bIsEqualModels = deepEqual(oFormData, oCopyData);
			const aCopySuppliers = oCopyData.Suppliers;
			const aChangedSuppliers = aSelectedSuppliers.filter(el => !aCopySuppliers.includes(el));

			
			return !aChangedSuppliers.length && bIsEqualModels ? false : true;
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
			} else if(!bIsChangedFields && oCopyModel?.getData()) {
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

		onUpdateProductPress: function() {
			const oCtx = this.getView().getBindingContext();
			const sCurrentId = oCtx.getObject("Id")
			const oCurrentProduct = oCtx.getProperty("/Products").find(el => el.Id == sCurrentId);
			const oFormModel = this.getView().getModel("FormModel");
			const oCopyProductModel = new JSONModel(Object.assign({}, oCurrentProduct));

			oFormModel.setData({
				...oCurrentProduct,
				Suppliers: oCurrentProduct.Suppliers.map(({SupplierId}) => SupplierId)
			})
			oCopyProductModel.setProperty("/Suppliers", oCurrentProduct.Suppliers.map(el => el.SupplierId))
			
			this.getView().getModel("EditModel").setProperty("/EditMode", true)
			this.getView().setModel(oCopyProductModel, "CopyModel")
		},

		onSaveProductPress: function() {
			const oFormModel = this.getView().getModel("FormModel");
			const oModel = this.getView().getModel();
			const aSelectedSuppliers = oFormModel.getData().Suppliers.map(el => ({SupplierId: el}));
			const oDateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd'T'HH:mm:ss"
			});
			const nProductPositionInArray = oFormModel.getData().Id - 1;
			const aFormFields = this.getFormFields();

			aFormFields.forEach(oControl => this.validateField(oControl));
			const aMessages = Messaging.getMessageModel().getData();
			
			if(!aMessages.length) {
				oFormModel.setProperty("/UpdatedAt", oDateFormat.format(new Date()))
				oFormModel.setProperty("/Suppliers", aSelectedSuppliers)
			
				oModel.setProperty("/Products/" + nProductPositionInArray, oFormModel.getData())
				this.getOwnerComponent().getRouter().navTo("ListReport");	
				
				MessageToast.show(this.getTextFromI18n("ProductWasUpdatedMessage"), {
					closeOnBrowserNavigation: false
				});
			} else {
				const sSelectControl = "sap.m.Select";
				aFormFields
					.filter(oControl => oControl.getMetadata().getName() !== sSelectControl)
					.find(oControl => oControl.getBinding("value").getPath() === aMessages[0].target)
					?.focus();
				MessageToast.show(this.getTextFromI18n("NotValidatedMessage"), {
					closeOnBrowserNavigation: false
				});
			}
		}
	});
});
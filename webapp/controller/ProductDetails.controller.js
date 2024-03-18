sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/format/DateFormat",
	"sap/base/util/deepEqual",
	"sap/ui/core/Messaging",
	'sap/ui/core/message/Message',
	'sap/ui/core/library',
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller,
	JSONModel,
	MessageToast,
	MessageBox,
	DateFormat,
	deepEqual,
	Messaging,
	Message,
	library,
	Fragment,
	Filter,
	FilterOperator) {
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
			const oSelectedSupModel = new JSONModel({
				Selected: []
			})
			const oViewModel = new JSONModel({
				selectedInDialogSuppliers: []
			})
			
			this.getView().setModel(oViewModel, "view")
			this.getView().setModel(oAvailabilityModel, "AvailabilityModel");
			this.getView().setModel(oSelectedSupModel, "SelectedSupModel");

            oRouter.getRoute("ProductDetails").attachPatternMatched(this.onPatternMatched, this);
        },

        onPatternMatched: function(oEvent) {
            const mRouteArguments = oEvent.getParameter("arguments");
            const sProductId = mRouteArguments.productId;
			const sNewProduct = "newProduct";
			const oEditModel = new JSONModel({
				EditMode: sProductId === sNewProduct
			});
			const oDateFormat = DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd'T'HH:mm:ss"
			});
			
			this.getView().setModel(oEditModel, "EditModel");
			const bEditMode = this.getView().getModel("EditModel").getProperty("/EditMode");
			const sKey = bEditMode ? "/Products/newProduct" : "/Products/" + (sProductId - 1);	
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
				CreatedAt: null,
				UpdatedAt: null
			})

			this.checkForCorrectPath(sProductId, bEditMode);
			this.getView().getModel("CopyModel")?.setProperty("/", null)
			this.getView().setModel(oFormModel, "FormModel");
			
            this.getView().bindObject({
                path: sKey
            })
        },

		checkForCorrectPath: function(sProductId, bEditMode) {
			const oModel = this.getView().getModel();
			const bCorrectId = oModel.getProperty("/Products").map((el) => el.Id).includes(sProductId);

			if(!bCorrectId && !bEditMode) {
				const oComponent = this.getOwnerComponent();
				oComponent.getRouter().getTargets().display("notFound");
			}
		},

		getTextFromI18n: function(sKey) {
			const i18nModel = this.getOwnerComponent().getModel("i18n");
			const oBundle = i18nModel.getResourceBundle();
      		return oBundle.getText(sKey)
		},

        getCurrentSupplier: function(data) {
			const oModel = this.getView().getModel();
			const aSuppliers = oModel.getProperty("/Suppliers");
			if(data instanceof Object)	{
				return aSuppliers.find((el) => !data.SupplierId === el.SupplierId)
			}
			
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
				oFormModel.setProperty("/CreatedAt", oDateFormat.format(new Date()));
				oFormModel.setProperty("/UpdatedAt", oDateFormat.format(new Date()));

				aProducts.push(oFormModel.getData())
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
					CreatedAt: null,
					UpdatedAt: null
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
			const oCopyModelSuppliers = oCopyModel?.getProperty("/Suppliers")?.map(el => ({SupplierId: el}));
			const oFormModel = this.getView().getModel("FormModel");
			const sCurrentId = this.getView().getBindingContext().getObject("Id")
			const oModel = this.getView().getModel();
			
			
			MessageBox
			.warning(this.getTextFromI18n(oCopyModel ? "LostChangesWarningMessage" : "LostDataWarningMessage"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: (sAction) => {
					if(sAction === MessageBox.Action.OK) {
						if(oCopyModelSuppliers) {
							oFormModel.setProperty("/", Object.assign({}, oCopyModel.getData()))
							oCopyModel.setProperty("/Suppliers", oCopyModelSuppliers)
							oModel.setProperty("/Products/" + (sCurrentId - 1), Object.assign({}, oCopyModel.getData()));
							this.getView().getModel("EditModel").setProperty("/EditMode", false);
							oFormModel.updateBindings(true);
							Messaging.getMessageModel().getData().forEach(el => Messaging.removeMessages(el))
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
			const bIsInvalidChanges = !!Messaging.getMessageModel().getData().length;
		
			if(bAllEmptyFields) {
				oComponent.getRouter().navTo("ListReport");
			} else if(!bIsChangedFields && oCopyModel?.getData() && !bIsInvalidChanges) {
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
			/* const oCopyModel = this.getView().getModel("CopyModel"); */
			
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
				oModel.setProperty("/Products/" + nProductPositionInArray, oFormModel.getData());
				
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
		},

		handleValueHelpRequest: function() {
			const oView = this.getView();
			const oTemp = this.getView().getModel("FormModel").getProperty("/Suppliers")
			
			const aSuppliers = this.getView().getModel().getProperty("/Suppliers");
			const aCurrentSuppliers = aSuppliers
										.filter(el => oTemp.includes(el.SupplierId))
										.map(el => el.SuppliersName);
			this.getView().getModel("view").setProperty("/selectedInDialogSuppliers", aCurrentSuppliers);
		
			if(!this.oDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "products.app.view.fragments.SuppliersDialog",
					controller: this
				}).then((oDialog) => {
					this.oDialog = oDialog
					oView.addDependent(this.oDialog);
					
					this.oDialog.open();
				})
			} else {
			
				this.oDialog.open()	
			}
		},
		_handleValueHelpSearch: function(oEvent) {
			const sValue = oEvent.getParameter("value");
			const aFilters = [
				new Filter("SuppliersName", FilterOperator.Contains, sValue),
				new Filter("Address", FilterOperator.Contains, sValue)
			]
			const oFilter = new Filter({
				filters: aFilters,
				and: false
			});
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose: function (oEvent) {
			const oFormModel = this.getView().getModel("FormModel");
			const nProductPositionInArray = oFormModel.getData().Id - 1;
			const aSelectedItems = oEvent.getParameter("selectedItems")?.map(el => el.getTitle());
			const aSuppliers = this.getView().getModel().getProperty("/Suppliers");
			const aSelectedItemsIds = aSuppliers.filter(el => aSelectedItems?.includes(el.SuppliersName))
										
			
			this.getView().getModel("FormModel").setProperty("/Suppliers", aSelectedItemsIds);
			this.getView().getModel().setProperty("/Products/" + nProductPositionInArray, oFormModel.getData())
			this.getView().getModel("FormModel").setProperty("/Suppliers", aSelectedItemsIds.map(el => el.SupplierId));
			this.cleanSelectedSuppliersTable()
		},

		cleanSelectedSuppliersTable: function() {
			const oTable = this.byId("idSuppliersTable");
			const aSelectedItemsIds = oTable.getSelectedItems();

			aSelectedItemsIds.forEach(el => {
				oTable.setSelectedItem(el, false)
			})
		}
	});
});
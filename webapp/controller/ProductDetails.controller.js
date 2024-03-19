sap.ui.define([
	"products/app/controller/BaseController.controller",
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
	"sap/ui/model/FilterOperator",
	'sap/m/Label',
	'sap/ui/table/Column',
	'sap/m/Text',
	"sap/m/Token",
	"../model/formatter",
	"../controller/mixin/CRUD"
], function (BaseController, JSONModel,	MessageToast, MessageBox, DateFormat, deepEqual, Messaging,	Message, library, Fragment,	Filter,	FilterOperator,	Label, UIColumn, Text, Token, formatter, crud) {
	"use strict";

	return BaseController.extend("products.app.controller.ProductDetails", {
		formatter: formatter,

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
				isButtonEnable: false
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
			
			this.getView().setModel(oEditModel, "EditModel");
			const bEditMode = this.getModel("EditModel").getProperty("/EditMode");
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
			this.getModel("CopyModel")?.setProperty("/", null)
			this.getView().setModel(oFormModel, "FormModel");
			this.getView().getModel("view").setProperty("/isButtonEnable", false)
            this.getView().bindObject({
                path: sKey
            })
	
        },
		checkForCorrectPath: function(sProductId, bEditMode) {
			const oModel = this.getModel();
			const bCorrectId = oModel.getProperty("/Products").map((el) => el.Id).includes(sProductId);

			if(!bCorrectId && !bEditMode) {
				const oComponent = this.getOwnerComponent();
				oComponent.getRouter().getTargets().display("notFound");
			}
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
						processor: this.getModel("FormModel")
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
			const oCopyModel = this.getModel("CopyModel");
			const oCopyModelSuppliers = oCopyModel?.getProperty("/Suppliers")?.map(el => ({SupplierId: el}));
			const oFormModel = this.getModel("FormModel");
			const sCurrentId = this.getView().getBindingContext().getObject("Id")
			const oModel = this.getModel();
			
			
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
							this.getModel("EditModel").setProperty("/EditMode", false);
							
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
			const oCopyModel = this.getModel("CopyModel");
			const oComponent = this.getOwnerComponent();
			const oFormModelData = this.getModel("FormModel").getData();
			const bAllEmptyFields = Object.keys(oFormModelData)
										.slice(0, -2)
										.every(el => !oFormModelData[el] || !oFormModelData[el]?.length);
			const bIsChangedFields = this.isFieldsChanged(oFormModelData, oCopyModel?.getData());
			const bIsInvalidChanges = !!Messaging.getMessageModel().getData().length;
		
			if(bAllEmptyFields) {
				oComponent.getRouter().navTo("ListReport");
			} else if(!bIsChangedFields && oCopyModel?.getData() && !bIsInvalidChanges) {
				this.getModel("EditModel").setProperty("/EditMode", false);
				
			} else {
				this.onConfirmationMessageBoxPress(oComponent);		
			}	
			this.getView().getModel("view").setProperty("/isButtonEnable", false)
		},

		rewriteProductsIds: function() {
			const aProducts = this.getModel().getProperty("/Products");
			aProducts.map((el, id) => {
				el.Id = String(id + 1);
				return el;
			})
		},

		removeProduct: function() {
			const oComponent = this.getOwnerComponent()
			const sCurrentId = this.getView().getBindingContext().getObject("Id");
			const oModel = this.getModel();
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
			const oFormModel = this.getModel("FormModel");
			const oCopyProductModel = new JSONModel(Object.assign({}, oCurrentProduct));

			oFormModel.setData({
				...oCurrentProduct,
				Suppliers: oCurrentProduct.Suppliers.map(({SupplierId}) => SupplierId)
			})
			
			oCopyProductModel.setProperty("/Suppliers", oCurrentProduct.Suppliers.map(el => el.SupplierId))
			
			this.getModel("EditModel").setProperty("/EditMode", true)
			this.getView().setModel(oCopyProductModel, "CopyModel")
		},

		onSaveProductPress: function() {
			const oFormModel = this.getModel("FormModel");
			const oModel = this.getModel();
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
				
				this.getModel("EditModel").setProperty("/EditMode", false)
		
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

		getSuppliersSelectedFilters: function(aCurrentSuppliersName) {
			const aFilters = aCurrentSuppliersName.map(el => {

				return new Filter("SuppliersName", FilterOperator.NE, el)
			})
			return aFilters.length ? aFilters : [new Filter("SuppliersName", FilterOperator.Contains, "")];
		},

		handleValueHelpRequest: function() {
			const oView = this.getView();
			const aCurrentSuppliers = this.getModel("FormModel").getProperty("/Suppliers");
			const aSuppliers = this.getModel().getProperty("/Suppliers");
			const aCurrentSuppliersName = aSuppliers
											.filter((el) => aCurrentSuppliers?.includes(el.SupplierId))
											.map(el => el.SuppliersName)
			const aCurrentTokens = [];
			Fragment.load({
				id: oView.getId(),
				name: "products.app.view.fragments.ValueHelpDialogSuppliers",
				controller: this
			}).then((oDialog) => {
				this.oDialog = oDialog;
				oView.addDependent(this.oDialog);
				this.oDialog.getTableAsync().then((oTable) => {
					
					if (oTable.bindRows) {
						console.log(aCurrentSuppliersName)
						const oFilter = new Filter({
							filters: this.getSuppliersSelectedFilters(aCurrentSuppliersName),
							and: true
						})
						oTable.bindAggregation("rows", {
							path: "/Suppliers",
							filters: oFilter,
							events: {
								dataReceived: function() {
									this.oDialog.update();
								}
							}
						});
						console.log(oTable.getBinding())
						const oColumnSupplierName = new UIColumn({
							label: new Label({text: "Name"}),
							template: new Text({wrapping: false, text: "{SuppliersName}"})
						});
						const oColumnSupplierAddress = new UIColumn({
							label: new Label({text: "Address"}), 
							template: new Text({wrapping: false, text: "{Address}"})
						});

						oTable.addColumn(oColumnSupplierName);
						oTable.addColumn(oColumnSupplierAddress);
					}
					this.oDialog.update();
				});
				
				this.setValueHelpTokens(aCurrentSuppliersName, aCurrentTokens)
				
				this.oDialog.open();
			})		
		},

		onValueHelpOkPress: function(oEvent) {
			const aTokens = oEvent.getParameter("tokens");
			const aSelectedSuppliersName = aTokens.map(el => el.getText());
			const aSuppliers = this.getModel().getProperty("/Suppliers");
			const oFormModel = this.getModel("FormModel");
			const aSelectedSuppliers = aSuppliers.filter(el => aSelectedSuppliersName.includes(el.SuppliersName));
			const aSelectedSuppliersId = aSelectedSuppliers.map(el => el.SupplierId);
			const sCurrentBindingPath = this.getView().getBindingContext().getPath();

			oFormModel.setProperty("/Suppliers", aSelectedSuppliersId);
			this.getModel().setProperty(sCurrentBindingPath + "/Suppliers", aSelectedSuppliers);	
			
			this.onValueHelpCancelPress();
		},

		setValueHelpTokens: function(aCurrentSuppliersName, aCurrentTokens) {
			aCurrentSuppliersName.forEach(sName => {
				aCurrentTokens.push(
					new Token({
						key: sName,
						text: sName
					})
				)
			})
	
			this.oDialog.setTokens(aCurrentTokens);
		},

		onValueHelpCancelPress: function () {
			this.oDialog.close();
		},

		onValueHelpAfterClose: function () {
			this.oDialog.setTokens([])
		},

		onSelectSuppliers: function(oEvent) {
			const aSelectedItems = oEvent.getSource().getSelectedItems();
			this.getView().getModel("view").setProperty("/isButtonEnable", !!aSelectedItems.length);	
		},

		cleanSelectedTableItems: function() {
			const oTable = this.byId("idSuppliersTable");
			oTable.getSelectedItems()?.forEach(el => {
				oTable.setSelectedItem(el, false)
			})
			this.getView().getModel("view").setProperty("/isButtonEnable", false)
		},

		onRemoveSuppliers: function() {
			crud.removeSupplier()
			const oTable = this.byId("idSuppliersTable");
			const aSelectedSuppliersId = oTable.getSelectedItems().map(el => el.getBindingContext().getObject("SupplierId"));
			const aCurrentSuppliersId = this.getModel("FormModel").getProperty("/Suppliers")
			const aNonSelectedSuppliersId = aCurrentSuppliersId.filter(el => !aSelectedSuppliersId.includes(el));
			const sCurrentBindingPath = this.getView().getBindingContext().getPath();
			
			this.getModel("FormModel").setProperty("/Suppliers", aNonSelectedSuppliersId);
			this.getModel()
				.setProperty(sCurrentBindingPath + "/Suppliers", aNonSelectedSuppliersId.map(el => ({SupplierId: el})));	
			this.cleanSelectedTableItems();
		},

		onRemoveSuppliersInCreateMode: function() {
			const oTable = this.byId("idCreateSuppliersTable");
			const aSuppliers = this.getModel().getProperty("/Suppliers");
			const aCurrentSuppliersId = this.getModel("FormModel").getProperty("/Suppliers");
			const aSelectedSuppliersName = oTable.getSelectedItems().map(el => el.getCells()[0].getText());
			const aNonSelectedSuppliersId = aSuppliers
											.filter(el => !aSelectedSuppliersName.includes(el.SuppliersName))
											.filter(el => aCurrentSuppliersId.includes(el.SupplierId))
											.map(el => el.SupplierId);
			
			this.getModel("FormModel").setProperty("/Suppliers", aNonSelectedSuppliersId)	
		}
	});
});
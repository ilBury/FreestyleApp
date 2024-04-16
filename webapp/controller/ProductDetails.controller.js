sap.ui.define([
	"products/app/controller/BaseController.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/core/Messaging",
	'sap/ui/core/message/Message',
	'sap/ui/core/library',
	"../model/formatter"
], function (BaseController, JSONModel,	MessageToast, MessageBox, Messaging, Message, library,  formatter) {
	"use strict";

	return BaseController.extend("products.app.controller.ProductDetails", {
		formatter: formatter,

        onInit: function() {	
            const oComponent = this.getOwnerComponent();
            const oRouter = oComponent.getRouter();
			const oViewModel = new JSONModel({
				isBusyIndicator: true,
				formsEditable: false
			})
			
			this.getView().setModel(oViewModel, "view")
			Messaging.registerObject(this.getView(), true);
            oRouter.getRoute("ProductDetails").attachPatternMatched(this.onPatternMatched, this);
        },

        onPatternMatched: function(oEvent) {
            const mRouteArguments = oEvent.getParameter("arguments");
            const sProductId = mRouteArguments.productId;
			const sProductMode = mRouteArguments.mode;
			const oEditModel = new JSONModel({
				CreateMode: sProductMode === "create",
				EditMode: sProductMode === "edit",
				DisplayMode: sProductMode === "view"
			});
			const oODataModel = this.getModel();
			const nNewProductId = this.createNewId();
			this.getView().setModel(oEditModel, "EditModel");
			const oFormModel = new JSONModel({
				ID: nNewProductId,
				Name: "",
				Description: "",
				Price: null,
				Category: {
					ID: null,
					Name: ""
				},
				Supplier: {
					ID: null,
					Name: "",
					Concurrency: 0,
					Address: {
						Street: "",
						City: "",
						State: "",
						ZipCode: "",
						Country: ""
					}
				},
				Rating: null,
				ReleaseDate: new Date(),
				DiscontinuedDate: null
			})
			this.getView().setModel(oFormModel, "FormModel");
			
			oODataModel.metadataLoaded().then(() => {			
				if(sProductMode === "create") {
					const oNewProductCtx = oODataModel.createEntry("/Products", {
						"headers": {"Content-ID": 40},
						properties: oFormModel.getData()
					});
					
					this.bindObjectView(oNewProductCtx.getPath());		
				} else {
					const sKey = oODataModel.createKey("/Products", {ID: sProductId});	
					this.bindObjectView(sKey);		
				}
				this.getModel("view").setProperty("/formsEditable", !(sProductMode === "view"))
			})		
        },

		bindObjectView: function(sPath) {	
			this.getView().bindObject({
				path: sPath,
				parameters: {
					expand: 'Supplier, Category'
				},
				events: {
					change: () => {
						const sCategoryId = this.getView().getBindingContext().getObject("Category")?.ID
						const sSupplierId = this.getView().getBindingContext().getObject("Supplier")?.ID
						this.getModel("FormModel").setProperty("/Supplier/ID", sSupplierId);
						this.getModel("FormModel").setProperty("/Category/ID", sCategoryId);
						this.getView().getModel("view").setProperty("/isBusyIndicator", false);
					}
				}
			})	
		},

		createNewId: function() {
			return Math.floor(Math.random() * 1000) + 1
		},

		getFormFields: function() {
			return [
				this.byId("idSmartNameField"),
				this.byId("idSmartPriceField"),
				this.byId("idSmartRatingField"),
				this.byId("idCategoriesSelect"),
				this.byId("idSupplierNameSelect")
			]
		},

		getCurrentMessagePath: function(oControl, sBinding) {
			const sInputValue = "value";
			return sInputValue === sBinding ? oControl.getBindingContext() + "/" + oControl.getBindingPath(sBinding) : oControl.getBindingPath(sBinding);
		},

		onLiveChange: function(oEvent) {
			this.validateField(oEvent.getSource())
		},

		validateField: function(oControl) {
			const aMessages = Messaging.getMessageModel().getData();
			const sSelectControl = "sap.m.Select";
			const sCurrentControlName = oControl.getMetadata().getName();
			const sValue = sCurrentControlName === sSelectControl ? oControl.getSelectedItem()?.getText() : oControl.getValue();
			const sCurrentBindingPath = sCurrentControlName === sSelectControl ? this.getCurrentMessagePath(oControl, "selectedKey") : this.getCurrentMessagePath(oControl, "value");
			
			aMessages.forEach(el => {	
				if(el.getTarget() === sCurrentBindingPath) {
					Messaging.removeMessages(el)
				}	
			})
			
			if(!sValue) {
				Messaging.addMessages(
					new Message({
						message: this.getTextFromI18n("RequiredMessage"),
						type: library.MessageType.Error,
						target: sCurrentBindingPath,
						processor: sCurrentControlName === sSelectControl ? this.getModel("FormModel") : this.getModel()
					})
				)
			}
		},

		updateCategory: function() {
			const sPath = `/Products(${this.getView().getBindingContext().getObject("ID")})/$links/Category`
			const sNewCategoryURI = this.byId("idCategoriesSelect").getSelectedItem().getBindingContext().getPath();
			const bIsCreateMode = this.getModel("EditModel").getProperty("/CreateMode");

			this.getModel().update(sPath, {
				uri: `https://services.odata.org/(S(3g0csrzc4YH1lrwejcqcoqpz))/V2/OData/OData.svc/${sNewCategoryURI}`		
			}, {
				"headers": {"Content-ID": this.createNewId()},
				success: () => {
					if(bIsCreateMode) {
						this.updateSupplier();
					}
				},
				error: (e) => {
					MessageBox.error(e)
				}
			})
		},

		updateSupplier: function() {
			const sPath = `/Products(${this.getView().getBindingContext().getObject("ID")})/$links/Supplier`
			const sNewSupplierURI = this.byId("idSupplierNameSelect").getSelectedItem().getBindingContext().getPath();
			const bIsCreateMode = this.getModel("EditModel").getProperty("/CreateMode");
			
			this.getModel().update(sPath, {
				uri: `https://services.odata.org/(S(3g0csrzc4YH1lrwejcqcoqpz))/V2/OData/OData.svc/${sNewSupplierURI}`		
			}, {
				"headers": {"Content-ID": this.createNewId()},
				success: () => {
					if(bIsCreateMode) {
						this.getOwnerComponent().getRouter().navTo("ListReport");
					}
				},
				error: (e) => {
					MessageBox.error(e)
				}
			})
		},

		onCreateProductPress: function() {
			const oODataModel = this.getModel();
			const aFormFields = this.getFormFields();
			aFormFields.forEach(oControl => this.validateField(oControl));
			const aMessages = Messaging.getMessageModel().getData();

			if(!aMessages.length) {		
				oODataModel.submitChanges({
					"headers": {"Content-ID": this.createNewId()},
					success: () => {
						this.updateCategory();
						oODataModel.resetChanges(undefined, true);	
					},
					error: (e) => {
						MessageBox.error(e)
					}
				});
						
				MessageToast.show(this.getTextFromI18n("CreatedProductText"), {
					closeOnBrowserNavigation: false
				});		
			} else {	
				this.displayNotValidMessage(aFormFields, aMessages);
			}	
		},

		getControlPath: function(oControl) {
			const sSelectControl = "sap.m.Select";

			return oControl.getMetadata().getName() === sSelectControl ? oControl.getBinding("selectedKey").getPath() : oControl.getBinding("value").getPath();
		},

		displayNotValidMessage: function(aFormFields, aMessages) {
			aFormFields
				.find(oControl => aMessages[0].target.includes(this.getControlPath(oControl)))
				?.focus();

			MessageToast.show(this.getTextFromI18n("NotValidatedMessage"), {
				closeOnBrowserNavigation: false
			});
		},

		onCategoryChange: function(oControl) {
			const bIsCreateMode = this.getModel("EditModel").getProperty("/CreateMode");

			if(!bIsCreateMode) {
				this.updateCategory();
			}
			this.onLiveChange(oControl);
		},

		onSupplierChange: function(oControl) {
			const bIsCreateMode = this.getModel("EditModel").getProperty("/CreateMode");

			if(!bIsCreateMode) {
				this.updateSupplier();
			}
			this.onLiveChange(oControl);
		},

		onSaveProductPress: function() {
			const oODataModel = this.getModel();
			const aFormFields = this.getFormFields();
			aFormFields.forEach(oControl => this.validateField(oControl));
			const aMessages = Messaging.getMessageModel().getData();
			
			if(!aMessages.length) {
				oODataModel.submitChanges({
					"headers": {"Content-ID": 61},
					success: () => {
						this.getModel("EditModel").setProperty("/EditMode", false);
						this.getModel("EditModel").setProperty("/DisplayMode", true);
						MessageToast.show(this.getTextFromI18n("ProductWasUpdatedMessage"), {
							closeOnBrowserNavigation: false
						});
						
						this.changeRouteMode("view");
					},
					error: (e) => {
						MessageBox.error(e)
					}
				});
						
			} else {
				this.displayNotValidMessage(aFormFields, aMessages);
			}
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

		removeProduct: function() {
			const oComponent = this.getOwnerComponent()
			const sCurrentId = this.getView().getBindingContext().getObject("ID");
			const oODataModel = this.getModel();
			const sKey = oODataModel.createKey("/Products", {ID: sCurrentId});

			oODataModel.remove(sKey, {
				"headers": {"Content-ID": 31},
				success: () => {
					oComponent.getRouter().navTo("ListReport");	
					MessageToast.show(this.getTextFromI18n("ProductWasRemovedMessage"), {
						closeOnBrowserNavigation:false
					})
				},
				error: (e) => {
					MessageBox.error(e)
				}
			})	
		},

		changeRouteMode: function(sMode) {
			const oCtx = this.getView().getBindingContext();
			const sCurrentId = oCtx.getObject("ID")
			const oComponent = this.getOwnerComponent();
			
			oComponent.getRouter().navTo(
				"ProductDetails",
				{
					productId: sCurrentId,
					mode: sMode
				},
			 	true
			)	
		},

		onUpdateProductPress: function() {
			this.changeRouteMode("edit");	
		},

		onCancelButtonPress: function() {
			const oODataModel = this.getModel();
			const bIsChangedFields = oODataModel.hasPendingChanges();
			const bIsEditMode = this.getModel("EditModel").getProperty("/EditMode");
			
			if(!bIsChangedFields) {
				this.changeRouteMode("view");
			} else {
				this.onConfirmationMessageBoxPress(bIsEditMode);	
			} 
		},

		onConfirmationMessageBoxPress: function(bIsEditMode) {
			const oODataModel = this.getModel();
			MessageBox
			.warning(this.getTextFromI18n(bIsEditMode ? "LostChangesWarningMessage" : "LostDataWarningMessage"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: (sAction) => {
					if(sAction === MessageBox.Action.OK) {
						if(bIsEditMode) {
							oODataModel.resetChanges();
							this.changeRouteMode("view");
							Messaging.getMessageModel().getData().forEach(el => Messaging.removeMessages(el))
						} else {
							this.getOwnerComponent().getRouter().navTo("ListReport");
						}	
					}
				}
			});
		},
	});
});
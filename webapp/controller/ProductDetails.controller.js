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
			const oSelectedSupModel = new JSONModel({
				Selected: []
			})
			const oViewModel = new JSONModel({
				isBusyIndicator: true
			})
			
			this.getView().setModel(oViewModel, "view")
			this.getView().setModel(oSelectedSupModel, "SelectedSupModel");

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
			const nNewProductId = this.createNewProductId();
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
						
						const sSupplierId = this.getView().getBindingContext().getObject("Supplier")?.ID
						this.getModel("FormModel").setProperty("/Supplier/ID", sSupplierId);
						const sCategoryId = this.getView().getBindingContext().getObject("Category")?.ID
						
						this.getModel("FormModel").setProperty("/Category/ID", sCategoryId);
						this.getView().getModel("view").setProperty("/isBusyIndicator", false);
					}
				}
			})	
		},

		createNewProductId: function() {
			return Math.floor(Math.random() * 1000) + 1
		},

		getFormFields: function() {
			return [
				this.byId("idNameInput"),
				this.byId("idPriceInput"),
				this.byId("idRatingInput"),
				this.byId("idCategoriesSelect"),
				this.byId("idSupplierNameSelect")
			]
		},

		getCurrentMessagePath: function(oControl, sBinding) {
			const sInputValue = "value";
			return sInputValue === sBinding ? oControl.getBindingContext() + "/" + oControl.getBindingPath(sBinding) : oControl.getBindingPath(sBinding);
		},

		validateField: function(oControl) {
			const aMessages = Messaging.getMessageModel().getData();
			const sSelectControl = "sap.m.Select";
			const sCurrentControlName = oControl.getMetadata().getName();
			const sValue = sCurrentControlName === sSelectControl ? oControl.getSelectedItem()?.getText() : oControl.getValue();
			const sCurrentBindingPath = sCurrentControlName === sSelectControl ? this.getCurrentMessagePath(oControl, "selectedKey") : this.getCurrentMessagePath(oControl, "value");
			
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
						processor: sCurrentControlName === sSelectControl ? this.getModel("FormModel") : this.getModel()
					})
				)
			}
		},

		onLiveChange: function(oEvent) {	
			this.validateField(oEvent.getSource())
		},

		updateCategory: function() {
			const newCategoryURI = this.byId("idCategoriesSelect").getSelectedItem().getBindingContext().getPath();		
			const path = `/Products(${this.getView().getBindingContext().getObject("ID")})/$links/Category`
			this.getModel().update(path, {
				uri: `https://services.odata.org/(S(3g0wqswc4au3yrwcut9coqpw))/V2/OData/OData.svc${newCategoryURI}`			
			},
			{
				"headers": {"Content-ID": 77}
			})
		},

		updateSupplier: function() {
			const newSupplierURI = this.byId("idSupplierNameSelect").getSelectedItem().getBindingContext().getPath();		
			const path = `/Products(${this.getView().getBindingContext().getObject("ID")})/$links/Supplier`
			this.getModel().update(path, {
				uri: `https://services.odata.org/(S(3g0wqswc4au3yrwcut9coqpw))/V2/OData/OData.svc${newSupplierURI}`			
			},
			{
				"headers": {"Content-ID": 78}
			})
			
		},

		onCreateProductPress: function() {
			const oODataModel = this.getModel();
			const aFormFields = this.getFormFields();
			aFormFields.forEach(oControl => this.validateField(oControl));
			const aMessages = Messaging.getMessageModel().getData();
			
			if(!aMessages.length) {	
				
				oODataModel.submitChanges({
					"headers": {"Content-ID": this.createNewProductId()},
					success: () => {
						this.updateCategory();
						this.updateSupplier();
						this.getModel().resetChanges(undefined, true)
						this.getOwnerComponent().getRouter().navTo("ListReport");
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

		onSuppliersSelectChange: function(oControl) {	
			const bIsCreateMode = this.getModel("EditModel").getProperty("/CreateMode");
			if(!bIsCreateMode) {
				const path = `${this.getView().getBindingContext().getPath()}/$links/Supplier`
				const newSupplierURI = oControl.getParameter("selectedItem").getBindingContext().getPath()
				
				this.getModel().update(path, {
					uri: `https://services.odata.org/(S(3g0wqswc4au3yrwcut9coqpw))/V2/OData/OData.svc${newSupplierURI}`		
				}, {
					"headers": {"Content-ID": 99}
				})
			}
			this.onLiveChange(oControl);
		},

		onCategoryChange: function(oControl) {
			const bIsCreateMode = this.getModel("EditModel").getProperty("/CreateMode");

			if(!bIsCreateMode) {
				const path = `${this.getView().getBindingContext().getPath()}/$links/Category`
				const newCategoryURI = oControl.getParameter("selectedItem").getBindingContext().getPath()
				
				this.getModel().update(path, {
					uri: `https://services.odata.org/(S(3g0wqswc4au3yrwcut9coqpw))/V2/OData/OData.svc${newCategoryURI}`		
				}, {
					"headers": {"Content-ID": 71}
				})
			}
			this.onLiveChange(oControl);
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

		onSaveProductPress: function() {
			const oODataModel = this.getModel();
			const aFormFields = this.getFormFields();
			
			aFormFields.forEach(oControl => this.validateField(oControl));
			const aMessages = Messaging.getMessageModel().getData();
			
			if(!aMessages.length) {
				
				oODataModel.submitChanges({
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
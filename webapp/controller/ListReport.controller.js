sap.ui.define([
	"products/app/controller/BaseController.controller",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessageBox',
	"sap/m/MessageToast",
	"../model/formatter"
], function (BaseController, JSONModel,  MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("products.app.controller.ListReport", {

		onInit: function() {
		
			const oViewModel = new JSONModel({
				isButtonEnable: false,
				searchField: "",
				selectedInDialogSuppliers: []
			})
			const oTable = this.byId("idSmartTable").getTable();
			oTable.setMode("MultiSelect");
		
			
			oTable.attachSelectionChange(this.onTableSelectionChange, this);
		
			this.getView().setModel(oViewModel, "view");
		},

		createNewContentId: function() {
			return Math.floor(Math.random() * 1000) + 1
		},
	
		onNavToObjectPage: function(oEvent) {
			const sNumberRegex = /[0-9]{1,}/gm;
			const sPath = oEvent.getSource().getBindingContext().getPath();
			const sProductId = sPath.match(sNumberRegex)[0];
			const oComponent = this.getOwnerComponent();
			
			oComponent.getRouter().navTo("ProductDetails", {
				productId: sProductId,
				mode: "view"
			})	
		},

		onCreateButtonPress: function() {
			const sProductId = "newProduct";
			const oComponent = this.getOwnerComponent();
			oComponent.getRouter().navTo("ProductDetails", {
				productId: sProductId,
				mode: "create"
			})	
		},

		onTableSelectionChange: function() {
			const oViewModel = this.getModel("view");
			const aSelectedItems = this.byId("idSmartTable").getTable().getSelectedItems();

			oViewModel.setProperty("/isButtonEnable", !!aSelectedItems.length)
		},

		deleteProducts: function() {		
			const oTable = this.byId("idSmartTable").getTable();
			const oODataModel = this.getModel();
			const aSelectedItemsPath = oTable.getSelectedItems()?.map(el => el.getBindingContext().getPath());
			
			aSelectedItemsPath.forEach(sKey => {
				
				oODataModel.remove(sKey, {
					"headers": {"Content-ID": this.createNewContentId()},
					success: () => {
						this.getModel("view").setProperty("/isButtonEnable", false)
						MessageToast.show(this.getTextFromI18n("ProductWasRemovedMessage"));
					},
					error: (e) => {
						MessageBox.error(e)
					}
				})
			})
		},

		onDeleteButtonPress: function() {
			MessageBox.warning(this.getTextFromI18n("DeleteProductsWarningMessage"), {
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: (sAction) => {
					if(sAction === MessageBox.Action.OK) {
						this.deleteProducts();
					} 
				}
			});
		},
	});
});

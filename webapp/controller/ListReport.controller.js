sap.ui.define([
	"products/app/controller/BaseController.controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/Token",
	"sap/ui/core/Fragment",
	'sap/m/MessageBox',
	"sap/m/MessageToast",
	"../model/formatter"
], function (BaseController, JSONModel, Token, Fragment,  MessageBox, MessageToast, formatter) {
	"use strict";

	return BaseController.extend("products.app.controller.ListReport", {
		formatter: formatter,

		onInit: function() {
			const oRouter = this.getOwnerComponent().getRouter();
			const oPriceRangeModel = new JSONModel({
				Range: [
					{
						id: "1",
						value: this.getTextFromI18n("AnyText")
					},
					{
						id: "2",
						value: this.getTextFromI18n("UnderText") + "\t" + "50"
					},
					{
						id: "3",
						value: "50-100"
					},
					{
						id: "4",
						value: "100-250"
					},
					{
						id: "5",
						value: "250-500"
					}, 
					{
						id: "6",
						value: this.getTextFromI18n("OverText") + "\t" + "500"
					}
				],
				SelectedKey: "1"
			})
			const oAvailabilityModel = new JSONModel({
				Availability: [
					{
						key: false,
						value: this.getTextFromI18n("InStockText")
					},
					{
						key: true,
						value: this.getTextFromI18n("OutOfStockText")
					}
				]
			})
			const oViewModel = new JSONModel({
				isButtonEnable: false,
				searchField: "",
				selectedInDialogSuppliers: []
			})
			const oTable = this.byId("idSmartTable").getTable();
			oTable.setMode("MultiSelect");
			oTable.attachSelectionChange(this.onTableSelectionChange, this);
			this.getView().setModel(oViewModel, "view");
			this.getView().setModel(oPriceRangeModel, "PriceModel");
			this.getView().setModel(oAvailabilityModel, "AvailabilityModel");
		},

		createNewContentId: function() {
			return Math.floor(Math.random() * 1000) + 1
		},

		handlerTokenUpdate: function(oEvent) {
			const oMultiInput = this.byId("multiInput");
			
			if (oEvent?.getParameter("type") === "removed") {
				const aRemovedTokens = oEvent.getParameter("removedTokens");
				const aRemainingTokens = oMultiInput.getTokens().filter(function (token) {
					return !aRemovedTokens.includes(token);
				});	
				oMultiInput.setTokens(aRemainingTokens)
				this.onFilter()
			}
		},

		handleValueHelpRequest: function() {

			const oView = this.getView();
			
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
				const oMultiInput = this.byId("multiInput");
				const aSelectedTokens = oMultiInput.getTokens().map(el => el.getText());
				
				this.getModel("view").setProperty("/selectedInDialogSuppliers", aSelectedTokens);
		
				this.oDialog.open()	
			}
		},
		
		addNewSupplierTokens: function(oMultiInput, aSelectedItems) {
			const aInputTokensText = oMultiInput.getTokens().map(el => el.getText());
			aSelectedItems.forEach(function (oItem) {
				if(!aInputTokensText.includes(oItem.getTitle())) {
					
					oMultiInput.addToken(new Token({
						text: oItem.getTitle()
					}));
					
				}
			});
		},

		_handleValueHelpClose: function (oEvent) {
			const aSelectedItems = oEvent.getParameter("selectedItems"),
				oMultiInput = this.byId("multiInput");
			
			if (aSelectedItems && aSelectedItems.length > 0) {
				this.addNewSupplierTokens(oMultiInput, aSelectedItems);
			}	
			if(aSelectedItems?.length < oMultiInput.getTokens().length) {
				oMultiInput.removeAllTokens();
				this.addNewSupplierTokens(oMultiInput, aSelectedItems);
			}
		
			this.onFilter()
		},

		onNavToObjectPage: function(oEvent) {
			const oSource = oEvent.getSource();
			const oCtx = oSource.getBindingContext();
			const oComponent = this.getOwnerComponent();
			
			oComponent.getRouter().navTo("ProductDetails", {
				productId: oCtx.getObject("ID"),
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

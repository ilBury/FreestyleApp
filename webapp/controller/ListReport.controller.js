sap.ui.define([
	"products/app/controller/BaseController.controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Token",
	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter",
	'sap/m/MessageBox',
	"sap/m/MessageToast",
	"../model/formatter"
], function (BaseController, JSONModel, Filter, FilterOperator, Token, Fragment, Sorter, MessageBox, MessageToast, formatter) {
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
			
			

			this.getView().setModel(oViewModel, "view");
			this.getView().setModel(oPriceRangeModel, "PriceModel");
			this.getView().setModel(oAvailabilityModel, "AvailabilityModel");
			oRouter.attachRouteMatched(this.onRouteMatched, this);
		},


		
		onRouteMatched: function() {
			const oTable = this.byId("idProductsTable");
			const oItemsBinding = oTable.getBinding("items");
			const oSorter = new Sorter("ReleaseDate", "ASC");
			oItemsBinding.refresh()
			oItemsBinding.sort(oSorter);	
		},

		getCombinedFilter: function() {
			const sQuerySearch = this.getView().getModel("view").getProperty("/searchField").trim();
			const aSearchFilters = [
				new Filter("Name", FilterOperator.Contains, sQuerySearch),
				new Filter("Description", FilterOperator.Contains, sQuerySearch)
			]
			const oSearchFilter = new Filter({
				filters: aSearchFilters,
				and: false
			});

			const oCategoryFilters = new Filter({
				filters: this.getCategoriesFilters(),
				and: false
			})
			const oPriceFilter = new Filter({
				filters: this.getPriceFilter(),
				and: false
			})

			const oSuppliersFilters = new Filter({
				filters: this.getSuppliersFilters(),
				and: false
			})
			
			return new Filter({
				filters: [oSearchFilter, oCategoryFilters, oPriceFilter, oSuppliersFilters],
				and: true
			});
		},

		getPriceFilter: function() {
			const oPriceModel = this.getModel("PriceModel");
			const sSelectedKey = oPriceModel.getProperty("/SelectedKey");
			const aPricesRange = oPriceModel.getProperty("/Range");
			const [oCurrentPriceRange] = aPricesRange.filter(el => el.id === sSelectedKey);
			const sRegNumbers = /[\wa-zA-Z]+|\d+/g;
			const aCurrentPriceRange = oCurrentPriceRange.value.match(sRegNumbers);
			const oWords = {
				any: this.getTextFromI18n("AnyText"),
				under: this.getTextFromI18n("UnderText"),
				over: this.getTextFromI18n("OverText")
			}
			const [sFirstRange, sSecondRange] = aCurrentPriceRange;
			switch(sFirstRange) {
				case oWords.any: return [new Filter("Price", FilterOperator.NE, null)]; 
				case oWords.under: return [new Filter("Price", FilterOperator.BT, 0, Number(sSecondRange))];
				case oWords.over: return [new Filter("Price", FilterOperator.GT, Number(sSecondRange))];
				default: return [new Filter("Price", FilterOperator.BT, Number(sFirstRange), Number(sSecondRange))];
			}
		},

		onFilter: function() {
			const oTable = this.byId("idProductsTable");
			const oItemsBinding = oTable.getBinding("items");
			const oFilter = this.getCombinedFilter();
			
			oItemsBinding.filter(oFilter);
			
		},

		getCategoriesFilters: function() {
			const oCategorySelect = this.byId("categorySelect");			
			const aCategoryNames = oCategorySelect.getSelectedItems().map(el => el.getText());
			const aFilters = aCategoryNames.map((el) => {
				return new Filter("Category/Name", FilterOperator.Contains, el)
			})
			
			return aFilters.length ? aFilters : [new Filter("Category/Name", FilterOperator.Contains, "")];
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

		getSuppliersFilters: function() {
			const oMultiInput = this.byId("multiInput");
			const aSuppliersNames = oMultiInput.getTokens().map(el => el.getText());
			const aFilters = aSuppliersNames.map((el) => {
				return new Filter("Supplier/Name", FilterOperator.Contains, el)
			})
		
			return aFilters.length ? aFilters : [new Filter("Supplier/Name", FilterOperator.Contains, "")];
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

		onTableSelectionChange: function(oEvent) {
			const oViewModel = this.getModel("view");
			const aSelectedItems = oEvent.getSource().getSelectedItems();

			oViewModel.setProperty("/isButtonEnable", !!aSelectedItems.length)
		},

		deleteProducts: function() {		
			const oTable = this.byId("idProductsTable");
			const oODataModel = this.getModel();
			const aSelectedItemsIds = oTable.getSelectedItems().map(el => el.getBindingContext().getObject("ID"));
			aSelectedItemsIds.forEach(el => {
				const sKey = oODataModel.createKey("/Products", {ID: el});
				oODataModel.remove(sKey, {
					success: () => {
						this.cleanSelectedTableItems();
						MessageToast.show(this.getTextFromI18n("ProductWasRemovedMessage"));
					}
				})
			})
		},

		cleanSelectedTableItems: function() {
			const oTable = this.byId("idProductsTable");
			oTable.getSelectedItems()?.forEach(el => {
				oTable.setSelectedItem(el, false)
			})
		},

		onDeleteButtonPress: function(oEvent) {
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

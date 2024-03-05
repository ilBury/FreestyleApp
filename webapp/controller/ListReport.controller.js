sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Token",
	"sap/ui/core/Fragment",
	"sap/base/strings/formatMessage"
], function (Controller, JSONModel, Filter, FilterOperator, Token, Fragment, formatMessage) {
	"use strict";

	return Controller.extend("products.app.controller.ListReport", {

		formatMessage: formatMessage,
		
		onInit: function() {
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
						key: "all",
						value: ""
					}, 
					{
						key: "false",
						value: this.getTextFromI18n("InStockText")
					},
					{
						key: "true",
						value: this.getTextFromI18n("OutOfStockText")
					}
				],
				SelectedKey: "all"
			})
			const oSelectedSupModel = new JSONModel({
				Selected: []
			})
			const oSearcherModel = new JSONModel({
				field: ""
			})

			this.getView().setModel(oPriceRangeModel, "PriceModel");
			this.getView().setModel(oAvailabilityModel, "AvailabilityModel");
			this.getView().setModel(oSelectedSupModel, "SelectedSupModel");
			this.getView().setModel(oSearcherModel, "SearchModel");
		},

		getTextFromI18n: function(sKey) {
			const i18nModel = this.getOwnerComponent().getModel("i18n");
			const oBundle = i18nModel.getResourceBundle();
      		return oBundle.getText(sKey)
		},

		getPriceFilter: function() {
			const oPriceModel = this.getView().getModel("PriceModel");
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

		handlerTokenUpdate: function(oEvent) {
			const oMultiInput = this.byId("multiInput");
			
			if (oEvent?.getParameter("type") === "removed") {
				const oModel = this.getView().getModel();
				const aSuppliers = oModel.getProperty("/Suppliers");
				
				const aRemovedTokens = oEvent.getParameter("removedTokens");
			
				const aRemainingTokens = oMultiInput.getTokens().filter(function (token) {
					return !aRemovedTokens.includes(token);
				});
				
				const aSelectedTokens = aRemainingTokens.map(el => el.getText());
				const aSelectedId = aSuppliers
										.filter((el) => aSelectedTokens.includes(el.SuppliersName))
										.map((el) => el.SupplierId);
				
				this.onFilter(aSelectedId);
				
			}
		},

		getSuppliersName: function(data) {
			const oModel = this.getView().getModel();
			const aSuppliers = oModel.getProperty("/Suppliers");	
			
			return aSuppliers
					.filter((el) => data?.includes(el.SupplierId))
					.map(el => el.SuppliersName)
					.join(", ");
		},

		getCategoriesName: function(data) {
			const oModel = this.getView().getModel();
			const aCategories = oModel.getProperty("/Categories");	

			return aCategories
					.filter((el) => data?.includes(el.Id))
					.map(el => el.Name)
					.join("")
		},

		getCombinedFilter: function(aSelectedId) {
			const oView = this.getView();
			const oAvailabilityModel = oView.getModel("AvailabilityModel");
			const sQuerySearch = oView.getModel("SearchModel").getProperty("/field").trim();
			const sSelectedKey = oAvailabilityModel.getProperty("/SelectedKey");
			
			const sAvailability = "all";
			const oAvailabilityFilter = new Filter(
				"Availability", 
				FilterOperator.NE,
				sSelectedKey === sAvailability ? sSelectedKey : JSON.parse(sSelectedKey.toLowerCase())
			)

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
			
			const oSuppliersFilters = new Filter({
				filters: this.getSuppliersFilters(aSelectedId),
				and: false
			})
			const oPriceFilter = new Filter({
				filters: this.getPriceFilter(),
				and: false
			})
			return new Filter({
				filters: [oSearchFilter, oAvailabilityFilter, oCategoryFilters, oSuppliersFilters, oPriceFilter],
				and: true
			});
		},

		onFilter: function(aSelectedId = null) {
			const oTable = this.byId("table");
			const oItemsBinding = oTable.getBinding("items");
			
			const oFilter = this.getCombinedFilter(aSelectedId);
			
			oItemsBinding.filter(oFilter);
		},

		getSuppliersFilters: function(aSelectedId) {
			const oMultiInput = this.byId("multiInput");
			const oModel = this.getView().getModel();
			const aAllSuppliers = oModel.getProperty("/Suppliers");
			const aSuppliersItems = oMultiInput.getTokens().map(el => el.getText());
			const aFilters = [];
			let aSuppliersId = null;
			
			if(aSelectedId) {
				aSuppliersId = aSelectedId;
			} else {
				aSuppliersId = aAllSuppliers
										.filter(el => aSuppliersItems.includes(el.SuppliersName))
										.map(el => el.SupplierId);					
			}
			
			aSuppliersId.forEach((el) => {
				aFilters.push(
					new Filter({
						path: "Suppliers",
						operator: FilterOperator.EQ,
						value1: el,
						test: (supplier) => {
							const aResult = supplier.filter((item) => {
							
								return	item === el
							});

							return !!aResult.length;
						}
					})
				)
			})

			return aFilters.length ? aFilters : [new Filter("Suppliers/0", FilterOperator.Contains, "")];
		},

		getCategoriesFilters: function() {
			const oModel = this.getView().getModel();
			const aCategories = oModel.getProperty("/Categories");
			const oCategorySelect = this.byId("categorySelect");			
			const aCategoryNames = oCategorySelect.getSelectedItems().map(el => el.getText());
			const aCategoriesIds = aCategories
									.filter(el => aCategoryNames.includes(el.Name))
									.map(el => el.Id);
			
			const aFilters = aCategoriesIds.map((el) => {
				return new Filter("Category", FilterOperator.Contains, el)
			})
			
			return aFilters.length ? aFilters : [new Filter("Category", FilterOperator.Contains, "")];
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
				
				this.getView().getModel("SelectedSupModel").setProperty("/Selected", aSelectedTokens);
		
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
		
			this.onFilter(null)

		},

		onNavToObjectPage: function(oEvent) {
			const oSource = oEvent.getSource();
			const oCtx = oSource.getBindingContext();
			const oComponent = this.getOwnerComponent();
		
			oComponent.getRouter().navTo("ObjectPage", {
				productId: oCtx.getObject("Id")
			})
		},

		onCreateButtonPress: function(oEvent) {
			const oModel = this.getView().getModel();
			const sProductId = oModel.getProperty("/Products").length + 1;
			const oComponent = this.getOwnerComponent();
			oComponent.getRouter().navTo("ObjectPage", {
				productId: sProductId
			})
			
			
		}
	});
});

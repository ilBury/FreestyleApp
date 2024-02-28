sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/Token",
	"sap/ui/core/Fragment"
], function (Controller, JSONModel, Filter, FilterOperator, Token, Fragment) {
	"use strict";

	return Controller.extend("products.app.controller.ListReport", {
		
		onInit: function() {
			const oModelProducts = new JSONModel();
			const oModelCategories = new JSONModel();
			const oModelSuppliers = new JSONModel();
			const oPriceRangeModel = new JSONModel({
				Range: [
					{
						id: "1",
						value: "any"
					},
					{
						id: "2",
						value: "under 50"
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
						value: "over 500"
					}
				]
			})

			const sProductsJson = "../model/products.json";
			const sCategoriesJson = "../model/categories.json";
			const sSuppliersJson = "../model/suppliers.json";

			oModelProducts.loadData(sProductsJson, "", false);
			oModelCategories.loadData(sCategoriesJson, "", false);
			oModelSuppliers.loadData(sSuppliersJson, "", false);

			oModelCategories.setData(oModelSuppliers.getData(), true);
			oModelProducts.setData(oModelCategories.getData(), true);
			
			this.getView().setModel(oModelProducts);
			this.getView().setModel(oPriceRangeModel, "PriceModel")
		},

		getPriceFilter: function() {
			const sSelectedKey = this.byId("priceSelect").getSelectedKey();
			const oPriceModel = this.getView().getModel("PriceModel");
			const aPricesRange = oPriceModel.getProperty("/Range");
			const [oCurrentPriceRange] = aPricesRange.filter(el => el.id === sSelectedKey);
			const sRegNumbers = /[\wa-zA-Z]+|\d+/g;
			const aCurrentPriceRange = oCurrentPriceRange.value.match(sRegNumbers);
			const oWords = {
				any: "any",
				under: "under",
				over: "over"
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
					.filter((el) => data.includes(el.SupplierId))
					.map(el => el.SuppliersName)
					.join(", ");
		},

		getCategoriesName: function(data) {
			const oModel = this.getView().getModel();
			const aCategories = oModel.getProperty("/Categories");	

			return aCategories
					.filter((el) => data.includes(el.Id))
					.map(el => el.Name)
					.join("")
		},

		getCombinedFilter: function(aSelectedId) {
			const sQuerySearch = this.byId("searcher").getValue();
			const sSelectedKey = this.byId("availabilitySelect").getSelectedKey();
			
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
						path: "Supplier",
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

			return aFilters.length ? aFilters : [new Filter("Supplier/0", FilterOperator.Contains, "")];
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

		handleValueHelpRequest: function(oEvent) {
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
				const aDialogList = this.byId("valueHelpDialog");
				const aSelectedTokens = oMultiInput.getTokens().map(el => el.getText());
				aDialogList.getItems().map(el => el.setSelected(false));
				aDialogList
					.getItems()
					.filter(el => aSelectedTokens.includes(el.getTitle()))
					.map(el => el.setSelected(true));
				
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
		
			this.onFilter()
		},

		onNavToObjectPage: function(oEvent) {
			const oSource = oEvent.getSource();
			const oCtx = oSource.getBindingContext();
			const oComponent = this.getOwnerComponent();

			oComponent.getRouter().navTo("ObjectPage", {
				productId: oCtx.getObject("Id")
			})
		}
	});
});

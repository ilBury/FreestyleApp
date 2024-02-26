sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/model/json/JSONModel',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/m/Token',
], function (Controller, JSONModel, Filter, FilterOperator, Token) {
	"use strict";

	return Controller.extend("products.app.controller.PageOverview", {
		
		onInit: function() {
			const oModel = new JSONModel();
			oModel.loadData("../model/products.json");
		
			this.getView().setModel(oModel);
		},

		onAfterRendering: function() {
			const oMultiInput = this.byId("multiInput");
			oMultiInput.attachTokenUpdate((event) => {
				if (event.getParameter("type") === "removed") {
					const oModel = this.getView().getModel();
					const aSuppliers = oModel.getProperty("/Suppliers");
					
					const aRemovedTokens = event.getParameter("removedTokens");
				
					const aRemainingTokens = oMultiInput.getTokens().filter(function (token) {
					  return !aRemovedTokens.includes(token);
					});
					
					const aSelectedTokens = aRemainingTokens.map(el => el.getText());
					const aSelectedId = aSuppliers
											.filter((el) => aSelectedTokens.includes(el.SuppliersName))
											.map((el) => el.SupplierId);
					
					this.onFilter(aSelectedId);
				}
			})
		},

		getSuppliersName: function(data) {
			const oModel = this.getView().getModel();
			const aSuppliers = oModel.getProperty("/Suppliers");			
			
			return aSuppliers
					.filter((el) => data.includes(el.SupplierId))
					.map(el => el.SuppliersName)
					.join(", ");
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
				new Filter("Descrition", FilterOperator.Contains, sQuerySearch)
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
				and: true
			})
			return new Filter({
				filters: [oSearchFilter, oAvailabilityFilter, oCategoryFilters, oSuppliersFilters],
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
			const oCategorySelect = this.byId("categorySelect");
			const aCategoryItems = oCategorySelect.getSelectedItems();
			
			const aFilters = aCategoryItems.map((el) => {
				return new Filter("Category", FilterOperator.Contains, el.getText())
			})
			
			return aFilters.length ? aFilters : [new Filter("Category", FilterOperator.Contains, "")];
		},

		

		handleValueHelp: function(event) {
			const oView = this.getView();
			const oModel = oView.getModel();
			if (!this.oDialog) {	
				this.oDialog = sap.ui.xmlfragment(oView.getId(), "products.app.view.fragments.SuppliersDialog", this);

				oView.addDependent(this.oDialog);
			}
		
			this.oDialog.setModel(oModel);

			this.oDialog.open();
		},

		markSelectedFields: function() {
			const oMultiInput = this.byId("multiInput");
			const aSelectedItems = oMultiInput.getTokens().map(el => el.getText());
			const aItems = this.oDialog.getItems();
			
			aItems.forEach(el => {
				if(aSelectedItems.includes(el.getTitle())) {
					el.setSelected(true)
				}
			})

		},

		_handleValueHelpSearch: function(event) {
			const sValue = event.getParameter("value");
			const oFilter = new Filter(
				"SuppliersName",
				FilterOperator.Contains,
				sValue
			);
			event.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose: function (event) {
			const aSelectedItems = event.getParameter("selectedItems"),
				oMultiInput = this.byId("multiInput");
		
			if (aSelectedItems && aSelectedItems.length > 0) {
				aSelectedItems.forEach(function (oItem) {
					oMultiInput.addToken(new Token({
						text: oItem.getTitle()
					}));
				});
			}
			this.onFilter()
		}

	});
});

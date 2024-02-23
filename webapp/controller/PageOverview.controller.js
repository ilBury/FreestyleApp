sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/model/json/JSONModel',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("leverx.app.controller.PageOverview", {
		
		onInit: function() {
			const oModel = new JSONModel();
			oModel.loadData("../localData/products.json");
			this.temp = true;
			this.getView().setModel(oModel);
			
		},
		onAfterRendering: function() {
			
		},

		getSuppliersName: function(data) {
			return data.map(el => el.Name).join(", ");
		},

		getCombinedFilter: function() {
			const sQuerySearch = this.byId("searcher").getValue();
			const sSelectedKey = this.byId("availabilitySelect").getSelectedKey();
			const sSelectedItem = this.byId("categorySelect").getSelectedItems().getText();
			const sAvailability = "all";
			const oAvailabilityFilter = new Filter(
				"Availability", 
				FilterOperator.NE,
				sSelectedKey === sAvailability ? sSelectedKey : JSON.parse(sSelectedKey.toLowerCase())
			)
			const aFilters = [
				new Filter("Name", FilterOperator.Contains, sQuerySearch),
				new Filter("Descrition", FilterOperator.Contains, sQuerySearch)
			]
			const oCategoryFilter = new Filter("Category", FilterOperator.Contains, sSelectedItem);
			const oSearchFilter = new Filter({
				filters: aFilters,
				and: false
			});

			return new Filter({
				filters: [oSearchFilter, oAvailabilityFilter, oCategoryFilter],
				and: true
			});
		},

		onFilter: function() {
			const oTable = this.byId("table");
			const oItemsBinding = oTable.getBinding("items");
			const oFilter = this.getCombinedFilter();

			oItemsBinding.filter(oFilter);
		}

	});
});

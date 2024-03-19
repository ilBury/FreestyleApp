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
			const oSorter = new Sorter("CreatedAt", "ASC");
			
			oItemsBinding.sort(oSorter);
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

		handlerTokenUpdate: function(oEvent) {
			const oMultiInput = this.byId("multiInput");
			
			if (oEvent?.getParameter("type") === "removed") {
				const oModel = this.getModel();
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

		getCombinedFilter: function(aSelectedId) {
			const sQuerySearch = this.getView().getModel("view").getProperty("/searchField").trim();
		
			const oAvailabilityFilter = new Filter({
				filters: this.getAvailabilitiesFilters(),
				and: false
			})

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
			const oTable = this.byId("idProductsTable");
			const oItemsBinding = oTable.getBinding("items");
			const oFilter = this.getCombinedFilter(aSelectedId);
			
			oItemsBinding.filter(oFilter);
		},

		getCategoriesFilters: function() {
			const oModel = this.getModel();
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

		getAvailabilitiesFilters: function() {
			const aAvailabilities = this.getView().getModel("AvailabilityModel").getProperty("/Availability");
			const oAvailabilitySelect = this.byId("availabilitySelect");
			const aAvailabilityNames = oAvailabilitySelect.getSelectedItems().map(el => el.getText());
			const aAvailabilitiesKeys = aAvailabilities
											.filter(el => aAvailabilityNames.includes(el.value))
											.map(el => el.key)
			const aFilters = aAvailabilitiesKeys.map(el => {
				return new Filter("Availability", FilterOperator.EQ, !el)
			})

			return aFilters.length ? aFilters : [new Filter("Availability", FilterOperator.NE, null)]
		},

		getSuppliersFilters: function(aSelectedId) {
			const oMultiInput = this.byId("multiInput");
			const oModel = this.getModel();
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
								
								return	item.SupplierId === el
							});

							return !!aResult.length;
						}
					})
				)
			})
	
			return aFilters.length ? aFilters : [new Filter("Suppliers/0/SupplierId", FilterOperator.Contains, "")];
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
		
			this.onFilter(null)

		},

		onNavToObjectPage: function(oEvent) {
			const oSource = oEvent.getSource();
			const oCtx = oSource.getBindingContext();
			const oComponent = this.getOwnerComponent();
			
			oComponent.getRouter().navTo("ProductDetails", {
				productId: oCtx.getObject("Id")
			})
		},

		onCreateButtonPress: function() {
			const sProductId = "newProduct";
			const oComponent = this.getOwnerComponent();
			oComponent.getRouter().navTo("ProductDetails", {
				productId: sProductId
			})	
		},
		
		rewriteProductsIds: function() {
			const aProducts = this.getModel().getProperty("/Products");
			aProducts.forEach((el, id) => {
				el.Id = String(id + 1);
				return el;
			})
		},

		cleanSelectedTableItems: function() {
			const oTable = this.byId("idProductsTable");
			oTable.getSelectedItems()?.forEach(el => {
				oTable.setSelectedItem(el, false)
			})
		},

		deleteProducts: function() {
			
			const oTable = this.byId("idProductsTable");
			const aSelectedItemsIds = oTable.getSelectedItems().map(el => el.getBindingContext().getObject("Id"));
			const aProducts = this.getModel().getProperty("/Products")
			const oViewModel = this.getModel("view");
			const aNonSelectedProducts = aProducts.filter(el => !aSelectedItemsIds.includes(el.Id));
			oViewModel.setProperty("/isButtonEnable", false);
			this.getModel().setProperty("/Products", aNonSelectedProducts);
			this.cleanSelectedTableItems();
			this.rewriteProductsIds();
			MessageToast.show(this.getTextFromI18n("ProductWasRemovedMessage"));
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

		onTableSelectionChange: function(oEvent) {
			const oViewModel = this.getModel("view");
			const aSelectedItems = oEvent.getSource().getSelectedItems();

			oViewModel.setProperty("/isButtonEnable", !!aSelectedItems.length)
		}
	});
});

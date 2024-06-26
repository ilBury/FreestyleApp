sap.ui.define([
	"app/products/controller/BaseController.controller",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessageBox',
	"sap/m/MessageToast",
	"sap/m/Text"
], function (BaseController, JSONModel,  MessageBox, MessageToast, Text) {
	"use strict";

	return BaseController.extend("app.products.controller.ListReport", {

		onInit: function() {
			const oRouter = this.getOwnerComponent().getRouter();
			const oViewModel = new JSONModel({
				isButtonEnable: false,
				searchField: "",
				selectedInDialogSuppliers: []
			})
			const oTable = this.byId("idSmartTable").getTable();
			oTable.setMode("MultiSelect");	
			
			oTable.attachSelectionChange(this.onTableSelectionChange, this);
		
			this.getView().setModel(oViewModel, "view");
			oRouter.attachRouteMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function() {
			const oTable = this.byId("idSmartTable").getTable();
			const oItemsBinding = oTable.getBinding("items");
			oItemsBinding?.refresh()
		},

		onCustomBtnPress: function() {
			MessageToast.show(this.getTextFromI18n("InfoText"))
		},

		onBeforeRebindTable: function(oEvent) {
			const oBindingParams = oEvent.getParameter("bindingParams");
			oBindingParams.sorter = [
				new sap.ui.model.Sorter("ReleaseDate", true) 
			];
		},

		createNewContentId: function() {
			return Math.floor(Math.random() * 1000) + 1
		},
	
		onNavToObjectPage: function(oEvent) {
			const oCtx = oEvent.getSource().getBindingContext();
			const sProductId = oCtx.getObject("ID");

			this.getOwnerComponent().getRouter().navTo("ProductDetails", {
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

		navToFeAppPress: function() {
			sap.ushell?.Container.getServiceAsync("CrossApplicationNavigation").then((oService) => {
                const sHref = (oService &&
                    oService.hrefForExternal({
                        target: {
                            semanticObject: "feproduct",
                            action: "display"
                        }   
                    })
                ) || ""
                oService.toExternal({target: {shellHash: sHref}})
            })
		},

		getDataByRating: function() {
			this.getView().getModel().callFunction("/GetProductsByRating", {
                method: "GET",
                urlParameters: {
                    rating: 4
                },
                success: (oData) => {
                    MessageBox.information(oData.results.map(el => el.Name).join(', '))
                },
                error: (oError) => {
                    MessageBox.error(oError.message)
                }
            })
		}
	});
});

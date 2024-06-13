sap.ui.define(
	[
	  "sap/ui/test/Opa5",
	  "sap/ui/test/actions/Press",
	  "sap/ui/test/matchers/Properties",
	  "sap/ui/test/matchers/AggregationLengthEquals",
	  "sap/ui/test/matchers/BindingPath",
	  "sap/m/MessageBox",
	],
	function (Opa5, Press, Properties, AggregationLengthEquals, BindingPath, MessageBox) {
	  "use strict";
	  const sViewName = "ListReport";
  
	  Opa5.createPageObjects({
		onTheListReport: {
			actions: {
				iSelectListItem() {
					return this.waitFor({
						controlType: "sap.m.CheckBox",
						viewName: sViewName,
						actions: new Press(),
						matchers: new BindingPath({
							path: "/Products(0)",
							modelName: "",
						}),
						success() {
							Opa5.assert.ok(
								true,
								"The first product is selected"
							);
						},
						errorMessage: "The table does not have a trigger",
					});
				},
				iPressOnProduct() {
					return this.waitFor({
						controlType: "sap.m.ColumnListItem",
						viewName: sViewName,
						actions: new Press(),
						matchers: new BindingPath({
							path: "/Products(1)",
							modelName: "",
						}),
						success() {
							Opa5.assert.ok(true, "The product is chosen");
						},
						errorMessage: "Can't choose the product",
					});
				},
				iPressOnDeleteButton() {
					return this.waitFor({
						id: "idProductsDeleteButton",
						viewName: sViewName,
						actions: new Press(),
						success() {
							Opa5.assert.ok(
								true,
								"The Delete button is pressed"
							);
						},
						errorMessage: "Can't press delete button",
					});
				},
				iPressOnCreateButton() {
					return this.waitFor({
						id: "idProductCreateButton",
						viewName: sViewName,
						actions: new Press(),
						success() {
							Opa5.assert.ok(
								true,
								"The create button is pressed"
							);
						},
						errorMessage: "Can't press create button",
					});
				},
				iClickOnConfirmDeleteButton() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: sViewName,
						searchOpenDialogs: true,
						actions: new Press(),
						matchers: new Properties({
							text: MessageBox.Action.OK,
						}),
						success() {
							Opa5.assert.ok(
								true,
								"The confirm delete button is pressed"
							);
						},
						errorMessage: "Can't press delete confirm button",
					});
				}
			},
			assertions: {
				iShouldSeeThePageView() {
					return this.waitFor({
					id: "dynamicPageId",
					viewName: sViewName,
					success() {
						Opa5.assert.ok(true, `The ${sViewName} view is displayed`);
					},
					errorMessage: `Did not find the ${sViewName} view`
					});
				},
				theTableShouldHaveProducts(iAmountItems) {
					return this.waitFor({
					id: "idListReportTable",
					viewName: sViewName,
					matchers: new AggregationLengthEquals({
						name: "items",
						length: iAmountItems
					}),
					success: function () {
						Opa5.assert.ok(true, `The table has ${iAmountItems} items on the productList page`);
					},
					errorMessage: "The table does not contain all items"
					});
				},
				theDeleteButtonShouldHaveEnablement(bValue) {
					return this.waitFor({
						autoWait: true,
						enabled: bValue,
						id: "idProductsDeleteButton",
						viewName: sViewName,
						success() {
							Opa5.assert.ok(
								true,
								`The Delete button is enabled: ${bValue}`
							);
						},
						errorMessage: "The Delete button isn't available",
					});
				},
				iShouldSeeConfirmationDialog() {
					return this.waitFor({
						viewName: sViewName,
						controlType: "sap.m.Dialog",
						searchOpenDialogs: true,
						success() {
							Opa5.assert.ok(
								true,
								"The confirmation dialog is visible"
							);
						},
						errorMessage:
							"The confirmation dialog is not visible",
					});
				},
			
			}
		}
	  });
	}
  );
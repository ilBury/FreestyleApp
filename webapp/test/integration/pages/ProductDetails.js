sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press", 
	"sap/m/MessageBox",
	"sap/ui/test/matchers/Properties"],
	function (Opa5, Press, MessageBox, Properties) {
		"use strict";
		const sViewName = "ProductDetails";

		Opa5.createPageObjects({
			onTheProductDetails: {
				actions: {
					iPressOnCancelButton() {
						return this.waitFor({
							id: "idCancelButton",
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
					iPressOnDiscardButton() {
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
					},
					iPressOnCreateButton() {
						return this.waitFor({
							id: "idCreateButton",
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
					iPressOnUpdateButton() {
						return this.waitFor({
							id: "idUpdateButton",
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
					iPressOnSaveButton() {
						return this.waitFor({
							id: "idSaveButton",
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
					}
				},

				assertions: {
					iShouldSeeThePageView() {
						return this.waitFor({
							autoWait: true,
							id: "idProductDetailsThePageView",
							viewName: sViewName,
							success() {
								Opa5.assert.ok(
									true,
									`The ${sViewName} view is displayed`
								);
							},
							errorMessage: `Did not find the ${sViewName} view`,
						});
					},
					iShouldSeeCreateMode() {
						return this.waitFor({
							id: "idProductDetailsThePageView",
							viewName: sViewName,
							success() {
								Opa5.assert.ok(
									true,
									"The create mode is visible"
								);
							},
							errorMessage: "The create mode is not visible",
						});
					},
					iShouldSeeConfirmationPopover() {
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
					iShouldSeeEditMode() {
						return this.waitFor({
							id: "idProductDetailsThePageView",
							viewName: sViewName,
							success() {
								Opa5.assert.ok(
									true,
									"The create mode is visible"
								);
							},
							errorMessage: "The create mode is not visible",
						});
					}
				},
			},
		});
	}
);

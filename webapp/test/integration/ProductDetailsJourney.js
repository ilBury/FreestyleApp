sap.ui.define(
	[
		"sap/ui/test/opaQunit",
		"./pages/ListReport",
		"./pages/ProductDetails",
	],
	function (opaTest) {
		"use strict";

		QUnit.module("ProductDetails Journey");

		opaTest(
			"Should press the 'Cancel' button after which discard dialog  is open",
			function (Given, When, Then) {
				When.onTheProductDetails.iPressOnCancelButton();
				Then.onTheProductDetails.iShouldSeeConfirmationPopover();
			}
		);

		opaTest(
			"Should press the 'Ok' button after which products page is open",
			function (Given, When, Then) {
				When.onTheProductDetails.iPressOnDiscardButton();
				Then.onTheListReport.iShouldSeeThePageView();

				Then.iTeardownMyApp();
			}
		);
	}
);

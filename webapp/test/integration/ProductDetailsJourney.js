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


		opaTest(
			"Should choose the product after which product details page is open  in 'view' mode",
			function (Given, When, Then) {
			  Given.iStartMyApp();
			  
			  When.onTheListReport.iPressOnProduct();
			  Then.onTheProductDetails.iShouldSeeThePageView();
			}
		);

		opaTest(
			"Should press the 'update' button after which see edit mode",
			function (Given, When, Then) {	
				When.onTheProductDetails.iPressOnUpdateButton();
				Then.onTheProductDetails.iShouldSeeEditMode();	
			}
		);

		opaTest(
			"Should press the 'save' button after which save all changes",
			function (Given, When, Then) {
				When.onTheProductDetails.iPressOnSaveButton();
				Then.onTheProductDetails.iShouldSeeThePageView();
				
				Then.iTeardownMyApp();
			}
		);
	}
);

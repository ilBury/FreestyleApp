sap.ui.define([
    "sap/ui/test/opaQunit", 
    "./pages/ListReport", 
    "./pages/ProductDetails"
  ], 
  function (opaTest) {
    "use strict";
  
    QUnit.module("ListReport Journey");
  
    opaTest(
      "Should see the table with 9 products and disabled delete button",
      function (Given, When, Then) {
        Given.iStartMyApp();
      
        Then.onTheListReport.theTableShouldHaveProducts(9);
        Then.onTheListReport.theDeleteButtonShouldHaveEnablement(false);
    });
  
    opaTest(
      "Should be possible to select a product, after which the delete button will be enabled.", 
      function (Given, When, Then) {
        When.onTheListReport.iSelectListItem();
        Then.onTheListReport.theDeleteButtonShouldHaveEnablement(true);   
    });

    opaTest(
      "Should press the 'Delete' button after which 'confirmation' dialog is open", 
      function (Given, When, Then) {
        When.onTheListReport.iPressOnDeleteButton();
        Then.onTheListReport.iShouldSeeConfirmationDialog();  
    });

    opaTest(
			"Should confirm product deletion and see table with 8 products",
			function (Given, When, Then) {
				When.onTheListReport.iPressOnConfirmDeleteButton();
				Then.onTheListReport.theTableShouldHaveProducts(8);

				Then.iTeardownMyApp();
			}
		);

    opaTest(
			"Should get data by rating using function import",
			function (Given, When, Then) {
        Given.iStartMyApp();

				When.onTheListReport.iPressOnGetDataByRatingButton();
				Then.onTheListReport.iShouldSeeDataByRating();

				Then.iTeardownMyApp();
			}
		);

    opaTest(
			"Should press the 'Create' button after which product details page is open in 'create' mode",
			function (Given, When, Then) {
				Given.iStartMyApp();
				When.onTheListReport.iPressOnCreateButton();
				Then.onTheProductDetails.iShouldSeeCreateMode();
			}
		);
  });
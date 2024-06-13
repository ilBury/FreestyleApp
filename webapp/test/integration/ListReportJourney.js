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
        Then.iTeardownMyApp();
    });

    opaTest(
      "Should choose the product after which product details page is open  in 'view' mode",
      function (Given, When, Then) {
        Given.iStartMyApp();
        When.onTheListReport.iPressOnProduct();
        Then.onTheProductDetails.iShouldSeeThePageView();

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
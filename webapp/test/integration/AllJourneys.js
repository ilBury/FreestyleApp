sap.ui.define([
	"sap/ui/test/Opa5",
    "./arrangements/Startup",
    "./NavigationJourney",
    "./ListReportJourney",
    "./ProductDetailsJourney"
], function(
	Opa5,
    Startup
) {
	"use strict";

	Opa5.extendConfig({
        arrangements: new Startup(),
        viewNamespace: "app.products.view",
        autoWait: true
    })
});
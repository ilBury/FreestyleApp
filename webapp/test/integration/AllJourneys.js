sap.ui.define([
	"sap/ui/test/Opa5",
    "./arrangements/Startup",
	"app/products/localService/mockserver",
    "./NavigationJourney",
    "./ListReportJourney",
    "./ProductDetailsJourney"
], function(
	Opa5,
    Startup,
    mockserver
) {
	"use strict";

    mockserver.init();
	Opa5.extendConfig({
        arrangements: new Startup(),
        viewNamespace: "app.products.view",
        autoWait: true
    })
});
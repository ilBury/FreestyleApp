sap.ui.define([
	"../../../model/formatter",
    "sap/ui/model/resource/ResourceModel"
], function(
	formatter,
    ResourceModel
) {
	"use strict";

    function getTextFromI18n() {
        return new ResourceModel({
            bundleUrl: sap.ui.require.toUrl("app/products/i18n/i18n.properties")
        }).getResourceBundle()
    }

    QUnit.module("Formatter - getCorrectDiscontinuedDate", {
        before() {
            this.getTextFromI18n = getTextFromI18n();
            formatter.getTextFromI18n = this.getTextFromI18n;
        }
    });
	
    QUnit.test("should return date when oDate is provided", function(assert) {
        const oDate = "2024-06-10"
        const result = formatter.getCorrectDiscontinuedDate(oDate);
        assert.strictEqual(result, oDate, "The function returns the date when oDate is provided");
    })

    QUnit.test("should return InProductionText when oDate is not provided", function(assert) {
        const result = formatter.getCorrectDiscontinuedDate(null);
        assert.strictEqual(result, this.getTextFromI18n.getText("InProductionText") , "The function returns the correct text when oDate is not provided")
    })

});
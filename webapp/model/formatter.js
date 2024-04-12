sap.ui.define([
], () => {
	"use strict";

	return  {
	
		getCorrectDiscontinuedDate: function(oDate) {
			return oDate ? oDate : this.getTextFromI18n("InProductionText");
		},
    };
});
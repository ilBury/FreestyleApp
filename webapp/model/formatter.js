sap.ui.define([], () => {
	"use strict";

	return  {
	
        getCategoriesName: function(data) {
			const oModel = this.getModel();
			const aCategories = oModel.getProperty("/Categories");	

			return aCategories
					.filter((el) => data?.includes(el.Id))
					.map(el => el.Name)
					.join("")
		},

		getSuppliersName: function(data) {
			const oModel = this.getView().getModel();
			const aSuppliers = oModel.getProperty("/Suppliers");
			const aCurrentSuppliers = data?.map(el => el.SupplierId);
	
			return aSuppliers
					.filter((el) => aCurrentSuppliers?.includes(el.SupplierId))
					.map(el => el.SuppliersName)
					.join(", ");
		},

        getCurrentSupplier: function(data) {
			const oModel = this.getModel();
			const aSuppliers = oModel.getProperty("/Suppliers");
			if(data instanceof Object)	{
				return aSuppliers.find((el) => !data.SupplierId === el.SupplierId)
			}
			
			return aSuppliers.find((el) => data?.includes(el.SupplierId))
		}
    };
});
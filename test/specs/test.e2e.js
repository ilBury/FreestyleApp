const { reverse } = require('dns');
const { browser } = require('webdriverio');
describe('My Freestyle app', () => {
    
    it('should load the app and check delete product functionality', async () => {
        
        const table = await $('#idListReportTable');
        await table.waitForDisplayed();

        const tableVisible = await table.isDisplayed();
        expect(tableVisible).toBe(true);

        const tableRow  = await table.$('ui5-li');
        await tableRow.waitForDisplayed();

        const checkBox = await tableRow.$('input[type="checkbox"]');
        await checkBox.click();

        const deleteButton = await $('#idProductsDeleteButton');
        await deleteButton.waitForEnabled();
        expect(await deleteButton.isEnabled()).toBe(true);

        await deleteButton.click();

        const confirmDialog = await $('div.sapMMessageBox');
        await confirmDialog.waitForDisplayed();
        
        const confirmBtn = await $('button=OK');
        await confirmBtn.click();

        //await while element will disappear from the table
        await tableRow.waitForExist({reverse: true})

        const isElementPresent = await tableRow.isExisting();
        expect(isElementPresent).toBe(false);
    })

    it('check navigate and update product functionality', async () => {
        const table = await $('#idListReportTable');
        await table.waitForDisplayed();

        const tableVisible = await table.isDisplayed();
        expect(tableVisible).toBe(true);

        const tableRow  = await table.$('ui5-li');
        await tableRow.waitForDisplayed();

        tableRow.click();
        await browser.waitUntil(async () => {
            const url = await browser.getUrl();
            return url.includes('product');
        })

        const productDetailsPage = await $("#idProductDetailsThePageView");
        await productDetailsPage.waitForDisplayed();

        const updateButton = await $("#idUpdateButton");
        await updateButton.waitForDisplayed();

        updateButton.click();

        await browser.waitUntil(async () => {
            const url = await browser.getUrl();
            return url.includes('edit');
        }) 
        const saveButton = await $('#idSaveButton');
        await saveButton.waitForDisplayed();

        saveButton.click();

        const viewMode = await browser.waitUntil(async () => {
            const url = await browser.getUrl();
            return url.includes('view');
        })
        expect(viewMode).toBe(true);
    })
})


describe('My Freestyle app', () => {
    
    it('should load the app and check title', async () => {
        /* const { default: _ui5Service } = require("wdio-ui5-service")
        const ui5Service = new _ui5Service()

        
        await ui5Service.injectUI5() */
        
        /* const title = await browser.getTitle();
        expect(title).toBe("Products"); */
        

        
        
        
        /* await smartFilterBar.waitForDisplayed({reverse: true}); */

/* 
        await browser.debug(); */
        const smartTable = await browser.asControl({selector: {id: "idSmarasdtTable" }});
        expect(await smartTable).toBeDisplayed();

    })
})


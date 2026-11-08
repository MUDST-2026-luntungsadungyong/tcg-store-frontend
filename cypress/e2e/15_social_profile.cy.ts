describe('Social profile layout', () => {
  for (const [width, height] of [[375, 812], [812, 375], [1440, 900]]) {
    it(`fits ${width}x${height} and retains profile actions`, () => {
      cy.viewport(width, height);
      cy.loginByMock('CUSTOMER');
      cy.visit('/profile');
      cy.contains('h1', 'Test CUSTOMER').should('be.visible');
      cy.get('button[aria-label="Change profile photo"]').should('be.visible');
      cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(width));
      cy.contains('button', 'Edit profile').click();
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('button', 'Cancel').click();
      cy.get('[role="dialog"]').should('not.exist');
      cy.contains('button', 'Edit contact').click();
      cy.get('[role="dialog"]').should('be.visible').within(() => {
        cy.get('input#phone').should('be.visible');
        cy.get('input#line').should('be.visible');
        cy.get('input#facebook').should('be.visible');
      });
      cy.screenshot(`contact-editor-${width}x${height}`, { capture: 'viewport' });
      cy.contains('button', 'Cancel').click();
      cy.get('[role="dialog"]').should('not.exist');
    });
  }
});


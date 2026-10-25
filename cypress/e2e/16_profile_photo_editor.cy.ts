describe('Profile photo editor', () => {
  for (const width of [375, 1280]) {
    it(`crops and exports a photo at ${width}px`, () => {
      cy.viewport(width, 850);
      cy.loginByMock('CUSTOMER');
      cy.intercept('POST', '**/users/profile/avatar', {
        statusCode: 200,
        body: { id: '1', name: 'Test CUSTOMER', email: 'customer@mythix.com', role: 'USER', avatarUrl: '/assets/whats_new_91_28.png' },
      }).as('uploadPhoto');
      cy.intercept('GET', '**/users/profile/avatar', { fixture: '../../public/assets/whats_new_91_28.png', headers: { 'content-type': 'image/png' } }).as('loadAvatar');
      cy.visit('/profile');
      cy.get('input[type="file"]').selectFile('public/assets/whats_new_91_28.png', { force: true });
      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('button', 'Save photo').should('be.enabled');
      cy.get('input[aria-label="Zoom"]').invoke('val', '1.8').trigger('change').trigger('input');
      cy.contains('button', 'Rotate').click();
      cy.get('canvas').should('have.attr', 'width', '512');
      cy.contains('button', 'Reset').click();
      cy.get('input[aria-label="Zoom"]').should('have.value', '1');
      cy.screenshot(`photo-editor-${width}`, { capture: 'viewport' });
      cy.contains('button', 'Save photo').click();
      cy.wait('@uploadPhoto').its('request.headers.content-type').should('include', 'multipart/form-data');
      cy.get('[role="dialog"]').should('not.exist');
      cy.get('img[alt="Test CUSTOMER\'s profile"]').should('have.attr', 'src', '/assets/whats_new_91_28.png');
      cy.get('button[aria-label="Change profile photo"]').click();
      cy.contains('Adjust your current photo').should('be.visible');
      cy.contains('button', 'Upload new photo').should('be.visible');
      cy.contains('button', 'Save photo').should('be.enabled').click();
      cy.wait('@uploadPhoto');
      cy.get('[role="dialog"]').should('not.exist');
    });
  }
});

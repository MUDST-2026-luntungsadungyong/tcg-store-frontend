describe('Profile photo after login (HTTP fixtures)', () => {
  it('shows a saved photo immediately and updates the session only after a successful removal', () => {
    const avatarUrl = '/assets/whats_new_91_28.png';
    const user = { id: '42', name: 'Avatar Test', email: 'avatar@example.com', role: 'USER' };
    cy.viewport(1280, 900);
    cy.intercept('GET', '**/api/products*', { items: [] });
    cy.intercept('GET', '**/api/users/profile', { statusCode: 503 }).as('profile');
    cy.intercept('GET', '**/api/users/profile/avatar', {
      fixture: '../../public/assets/whats_new_91_28.png',
      headers: { 'content-type': 'image/png' },
    });
    cy.intercept('POST', '**/api/auth/login', {
      token: 'e2e-avatar-session',
      user: { ...user, avatarUrl },
    }).as('login');
    cy.intercept('DELETE', '**/api/users/profile/avatar', { statusCode: 503 }).as('failedRemoval');

    cy.visit('/login');
    cy.get('#email').type('avatar@example.com');
    cy.get('#password').type('avatar-password', { log: false });
    cy.get('form button[type="submit"]').click();
    cy.wait('@login');

    cy.get('button[aria-label="Open account menu"] img')
      .should('have.attr', 'src', avatarUrl);
    cy.get('button[aria-label="Open account menu"] img').should(($image) => {
      expect(($image[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
    });
    cy.get('@profile.all').should('have.length', 0);

    cy.get('button[aria-label="Open account menu"]').click();
    cy.get('a[href="/profile"]:visible').click();
    cy.get('button[aria-label="Change profile photo"]').click();
    cy.contains('[role="dialog"] button', 'Remove photo').click();
    cy.wait('@failedRemoval');
    cy.contains('[role="alert"]', 'Unable to remove your photo.').should('be.visible');
    cy.get('button[aria-label="Open account menu"] img').should('have.attr', 'src', avatarUrl);

    cy.intercept('DELETE', '**/api/users/profile/avatar', { ...user, avatarUrl: null }).as('removal');
    cy.contains('[role="dialog"] button', 'Remove photo').click();
    cy.wait('@removal');
    cy.get('[role="dialog"]').should('not.exist');
    cy.get('button[aria-label="Open account menu"] img').should('not.exist');
    cy.get('button[aria-label="Open account menu"]').should('contain.text', 'A');
  });
});

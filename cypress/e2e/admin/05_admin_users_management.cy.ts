/// <reference types="cypress" />

describe('US-11: Admin Users Management', () => {
  beforeEach(() => {
    cy.loginByMock('ADMIN');
  });

  it('should list administrators', () => {
    cy.intercept('GET', '**/api/admin/users*', {
      statusCode: 200,
      body: [
        { id: '1', name: 'Admin One', email: 'one@admin.com', role: 'ADMIN', sellerStatus: 'NONE' },
        { id: '2', name: 'Admin Two', email: 'two@admin.com', role: 'ADMIN', sellerStatus: 'NONE' }
      ]
    }).as('getAdmins');

    cy.visit('/admin/users');
    cy.wait('@getAdmins');

    cy.contains('Admin One').should('be.visible');
    cy.contains('two@admin.com').should('be.visible');
  });

  it('should allow adding a new administrator', () => {
    cy.intercept('GET', '**/api/admin/users*', { statusCode: 200, body: [] }).as('getAdmins');
    cy.intercept('POST', '**/api/admin/users', {
      statusCode: 201,
      body: { id: '3', name: 'New Admin', email: 'new@admin.com', role: 'ADMIN', sellerStatus: 'NONE' }
    }).as('addAdmin');

    cy.visit('/admin/users');
    cy.wait('@getAdmins');

    // Click top-level 'Add admin' button (Assuming there's a button for it)
    cy.contains('button', /Add admin/i).click();

    cy.get('[role="dialog"]').should('be.visible');
    cy.contains('label', 'Name').find('input').type('New Admin');
    cy.contains('label', 'Email').find('input').type('new@admin.com');
    cy.contains('label', 'Password').find('input').type('securepassword123');

    cy.get('[role="dialog"]').contains('button', /Add administrator/i).click();

    cy.wait('@addAdmin').its('request.body').should('deep.equal', {
      name: 'New Admin',
      email: 'new@admin.com',
      password: 'securepassword123'
    });

    cy.contains(/added successfully/i).should('be.visible');
    cy.contains('New Admin').should('be.visible');
  });

  it('should allow deleting an administrator', () => {
    cy.intercept('GET', '**/api/admin/users*', {
      statusCode: 200,
      body: [{ id: '1', name: 'Admin One', email: 'one@admin.com', role: 'ADMIN', sellerStatus: 'NONE' }]
    }).as('getAdmins');
    cy.intercept('DELETE', '**/api/admin/users/1', { statusCode: 200 }).as('deleteAdmin');

    cy.visit('/admin/users');
    cy.wait('@getAdmins');

    cy.contains('button', /Delete/i).click();
    
    // In delete confirm modal
    cy.get('[role="dialog"]').contains('button', /^Delete$/i).click();

    cy.wait('@deleteAdmin');
    
    cy.contains(/has been deleted/i).should('be.visible');
    cy.contains('Admin One').should('not.exist');
  });
});

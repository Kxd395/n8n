import { TemplatesPage } from '../pages/templates';
import { WorkflowPage } from '../pages/workflow';

import OnboardingWorkflow from '../fixtures/Onboarding_workflow.json';
import WorkflowTemplate from '../fixtures/Workflow_template_write_http_query.json';
import { TemplateWorkflowPage } from '../pages/template-workflow';

const templatesPage = new TemplatesPage();
const workflowPage = new WorkflowPage();
const templateWorkflowPage = new TemplateWorkflowPage();

describe('Templates', () => {
	it('can open onboarding flow', () => {
		templatesPage.actions.openOnboardingFlow(1234, OnboardingWorkflow.name, OnboardingWorkflow);
		cy.url().then(($url) => {
			expect($url).to.match(/.*\/workflow\/.*?onboardingId=1234$/);
		})

		workflowPage.actions.shouldHaveWorkflowName(`Demo: ${name}`);

		workflowPage.getters.canvasNodes().should('have.length', 4);
		workflowPage.getters.stickies().should('have.length', 1);
		workflowPage.getters.canvasNodes().first().should('have.descendants', '.node-pin-data-icon');
	});

	it('can import template', () => {
		templatesPage.actions.importTemplate(1234, OnboardingWorkflow.name, OnboardingWorkflow);

		cy.url().then(($url) => {
			expect($url).to.include('/workflow/new?templateId=1234');
		});

		workflowPage.getters.canvasNodes().should('have.length', 4);
		workflowPage.getters.stickies().should('have.length', 1);
		workflowPage.actions.shouldHaveWorkflowName(OnboardingWorkflow.name);
	});

	it('should save template id with the workflow', () => {
		cy.visit(templatesPage.url);
		cy.intercept('GET', '**/api/templates/**').as('loadApi');
		cy.get('.el-skeleton.n8n-loading').should('not.exist');
		templatesPage.getters.firstTemplateCard().should('exist');
		cy.wait('@loadApi');
		templatesPage.getters.firstTemplateCard().click();
		cy.url().should('include', '/templates/');

		cy.url().then(($url) => {
			const templateId = $url.split('/').pop();

			templatesPage.getters.useTemplateButton().click();
			cy.url().should('include', '/workflow/new');
			workflowPage.actions.saveWorkflowOnButtonClick();

			workflowPage.actions.selectAll();
			workflowPage.actions.hitCopy();

			cy.grantBrowserPermissions('clipboardReadWrite', 'clipboardSanitizedWrite');
			// Check workflow JSON by copying it to clipboard
			cy.readClipboard().then((workflowJSON) => {
				expect(workflowJSON).to.contain(`"templateId": "${templateId}"`);
			});
		});
	});

	it('can open template with images and hides workflow screenshots', () => {
		templateWorkflowPage.actions.openTemplate(WorkflowTemplate);

		templateWorkflowPage.getters.description().find('img').should('have.length', 1);
	});

	it('renders search elements correctly', () => {
		cy.visit(templatesPage.url);
		templatesPage.getters.searchInput().should('exist');
		templatesPage.getters.allCategoriesFilter().should('exist');
		templatesPage.getters.categoryFilters().should('have.length.greaterThan', 1);
		templatesPage.getters.templateCards().should('have.length.greaterThan', 0);
	});

	it('can filter templates by category', () => {
		cy.visit(templatesPage.url);
		templatesPage.getters.templatesLoadingContainer().should('not.exist');
		templatesPage.getters.categoryFilter('sales').should('exist');
		let initialTemplateCount = 0;
		let initialCollectionCount = 0;

		templatesPage.getters.templateCountLabel().then(($el) => {
			initialTemplateCount = Number($el.text());
			templatesPage.getters.collectionCountLabel().then(($el) => {
				initialCollectionCount = Number($el.text());

				templatesPage.getters.categoryFilter('sales').click();
				templatesPage.getters.templatesLoadingContainer().should('not.exist');

				// Should have less templates and collections after selecting a category
				templatesPage.getters.templateCountLabel().should(($el) => {
					expect(Number($el.text())).to.be.lessThan(initialTemplateCount);
				});
				templatesPage.getters.collectionCountLabel().should(($el) => {
					expect(Number($el.text())).to.be.lessThan(initialCollectionCount);
				});
			});
		});
	});

	it('should preserve search query in URL', () => {
		cy.visit(templatesPage.url);
		templatesPage.getters.templatesLoadingContainer().should('not.exist');
		templatesPage.getters.categoryFilter('sales').should('exist');
		templatesPage.getters.categoryFilter('sales').click();
		templatesPage.getters.searchInput().type('auto');

		cy.url().should('include', '?categories=');
		cy.url().should('include', '&search=');

		cy.reload();

		// Should preserve search query in URL
		cy.url().should('include', '?categories=');
		cy.url().should('include', '&search=');

		// Sales category should still be selected
		templatesPage.getters.categoryFilter('sales').find('label').should('have.class', 'is-checked');
		// Search input should still have the search query
		templatesPage.getters.searchInput().should('have.value', 'auto');
		// Sales checkbox should be pushed to the top
		templatesPage.getters.categoryFilters().eq(1).then(($el) => {
			expect($el.text()).to.equal('Sales');
		});
	});
});

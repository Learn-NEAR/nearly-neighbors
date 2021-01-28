import { VMContext, u128 } from 'near-sdk-as';
import * as contract from '../assembly';
import { toYocto, MIN_ACCOUNT_BALANCE } from '../../utils';

/**
 * == CONFIG VALUES ============================================================
 */
const TITLE = 'common grounds';
const DESCRIPTION = 'your neighborhood coffee spot';
const PROPOSAL_ACCOUNT_ID = 'neighbors.proposal';
const FACTORY_ACCOUNT_ID = 'neighbors.factory';
const CONTRIBUTOR_ACCOUNT_ID = 'dawn';

/**
 * == HELPER FUNCTIONS =========================================================
 */
const useFactoryAsPredecessor = (): void => {
  VMContext.setPredecessor_account_id(FACTORY_ACCOUNT_ID);
};

const setCurrentAccount = (): void => {
  VMContext.setCurrent_account_id('alice');
};

const attachMinBalance = (): void => {
  VMContext.setAttached_deposit(MIN_ACCOUNT_BALANCE);
};

const doInitialize = (): void => {
  contract.initialize(PROPOSAL_ACCOUNT_ID);
};

const doConfigure = (): void => {
  contract.configure(TITLE, DESCRIPTION);
};

const initAndConfig = (): void => {
  attachMinBalance();
  doInitialize();
  doConfigure();
};

describe('20.nearly-neighbors.project', () => {
  beforeEach(setCurrentAccount);
  beforeEach(useFactoryAsPredecessor);

  describe('initialize(proposal: AccountId): void', () => {
    it('creates a new project, storing the factory and proposal IDs', () => {
      attachMinBalance();
      contract.initialize(PROPOSAL_ACCOUNT_ID);

      expect(contract.get_factory()).toBe(FACTORY_ACCOUNT_ID);
      expect(contract.get_proposal()).toBe(PROPOSAL_ACCOUNT_ID);
    });
  });

  describe('configure(title, description): void', () => {
    beforeEach(attachMinBalance);
    beforeEach(doInitialize);

    it('adds details and funding data to project', () => {
      doConfigure();

      const project = contract.get_project();
      expect(project.details).not.toBeNull();
      expect(project.details!.title).toBe(TITLE);
      expect(project.details!.description).toBe(DESCRIPTION);

      expect(project.funding).not.toBeNull();
      expect(project.funding!.total).not.toBeNull();
      expect(project.funding!.spent).not.toBeNull();
    });

    it('switches is_configured() to true', () => {
      expect(contract.is_configured()).toBe(false);
      doConfigure();
      expect(contract.is_configured()).toBe(true);
    });
  });

  describe('add_contributor(account: AccountId, contribution: Contribution): void', () => {
    beforeEach(initAndConfig);

    it('assigns an additional contributor to the contributors map', () => {
      expect(
        contract.get_contributors().get(CONTRIBUTOR_ACCOUNT_ID, null)
      ).toBeNull();

      const contribution = new contract.Contribution(
        CONTRIBUTOR_ACCOUNT_ID,
        'Build out the counter',
        toYocto(10)
      );

      contract.add_contributor(CONTRIBUTOR_ACCOUNT_ID, contribution);

      const contributors = contract.get_contributors();
      const contributor = contributors.get(CONTRIBUTOR_ACCOUNT_ID, null);
      expect(contributor).not.toBeNull();
      expect(contributor!.account).toBe(CONTRIBUTOR_ACCOUNT_ID);
      expect(contributor!.task).toBe('Build out the counter');
      expect(contributor!.amount).toBe(toYocto(10));
      expect(contributor!.status).toBe(1 as i8);
    });
  });

  describe('add_expense(label, tags, amount): void', () => {
    beforeEach(initAndConfig);

    it('adds a new expense', () => {
      expect(contract.get_expenses().length).toBe(0);

      const label = 'roaster'
      const amount = toYocto(4)

      contract.add_expense(label, amount)

      expect(contract.get_expenses().length).toBe(1);

      const expense = contract.get_expenses()[0];
      expect(expense).not.toBeNull();
      expect(expense!.label).toBe(label);
      expect(expense!.amount).toBe(amount);
    });
  });
});

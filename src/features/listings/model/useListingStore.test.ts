import { beforeEach, describe, expect, it } from 'vitest';

import { useListingStore } from './useListingStore';

describe('useListingStore query and view state', () => {
  beforeEach(() => {
    useListingStore.setState({
      searchQuery: '',
      gameFilter: 'ALL',
      statusFilter: 'ALL',
      viewMode: 'table',
      currentPage: 3,
    });
  });

  it('resets pagination when the seller changes query filters or view', () => {
    const store = useListingStore.getState();

    store.setSearchQuery('Pikachu');
    expect(useListingStore.getState()).toMatchObject({
      searchQuery: 'Pikachu',
      currentPage: 1,
    });

    useListingStore.setState({ currentPage: 3 });
    useListingStore.getState().setGameFilter('Pokemon');
    expect(useListingStore.getState()).toMatchObject({
      gameFilter: 'Pokemon',
      currentPage: 1,
    });

    useListingStore.setState({ currentPage: 3 });
    useListingStore.getState().setVisibilityFilter('HIDE');
    expect(useListingStore.getState()).toMatchObject({
      statusFilter: 'HIDE',
      currentPage: 1,
    });

    useListingStore.setState({ currentPage: 3 });
    useListingStore.getState().setViewMode('grid');
    expect(useListingStore.getState()).toMatchObject({
      viewMode: 'grid',
      currentPage: 1,
    });
  });

  it('never allows the current page to move below one', () => {
    useListingStore.getState().setCurrentPage(0);
    expect(useListingStore.getState().currentPage).toBe(1);

    useListingStore.getState().setCurrentPage(-10.7);
    expect(useListingStore.getState().currentPage).toBe(1);
  });
});

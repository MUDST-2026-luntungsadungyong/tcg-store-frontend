import { create } from 'zustand';

export interface FilterState {
  searchQuery: string;
  game: string[];
  condition: string[];
  priceRange: [number, number]; // [min, max]
  qcOnly: boolean;
  rating: number; // 0-5 stars
}

interface FilterStore extends FilterState {
  setSearchQuery: (query: string) => void;
  toggleGame: (gameName: string) => void;
  toggleCondition: (conditionName: string) => void;
  setPriceRange: (min: number, max: number) => void;
  toggleQcOnly: () => void;
  setRating: (rating: number) => void;
  resetFilters: () => void;
}

const initialState: FilterState = {
  searchQuery: '',
  game: [],
  condition: [],
  priceRange: [0, 9999999],
  qcOnly: false,
  rating: 0,
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...initialState,
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  toggleGame: (gameName) => set((state) => ({
    game: state.game.includes(gameName)
      ? state.game.filter(g => g !== gameName)
      : [...state.game, gameName]
  })),
  
  toggleCondition: (conditionName) => set((state) => ({
    condition: state.condition.includes(conditionName)
      ? state.condition.filter(c => c !== conditionName)
      : [...state.condition, conditionName]
  })),
  
  setPriceRange: (min, max) => set({ priceRange: [min, max] }),
  
  toggleQcOnly: () => set((state) => ({ qcOnly: !state.qcOnly })),
  
  setRating: (rating) => set({ rating }),
  
  resetFilters: () => set(initialState),
}));

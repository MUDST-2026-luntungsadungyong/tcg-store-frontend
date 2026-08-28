import { create } from 'zustand';

export interface FilterState {
  searchQuery: string;
  game: string[];
  condition: string[];
  priceRange: [number, number]; // [min, max]
  qcOnly: boolean;
  rating: number; // 0-5 stars
  rarity: string[];
  stage: string[];
}

interface FilterStore extends FilterState {
  setSearchQuery: (query: string) => void;
  toggleGame: (gameName: string) => void;
  toggleCondition: (conditionName: string) => void;
  setPriceRange: (min: number, max: number) => void;
  toggleQcOnly: () => void;
  setRating: (rating: number) => void;
  toggleRarity: (rarityName: string) => void;
  toggleStage: (stageName: string) => void;
  resetFilters: () => void;
}

const initialState: FilterState = {
  searchQuery: '',
  game: [],
  condition: [],
  priceRange: [0, 9999999],
  qcOnly: false,
  rating: 0,
  rarity: [],
  stage: [],
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
  
  toggleRarity: (rarityName) => set((state) => ({
    rarity: state.rarity.includes(rarityName)
      ? state.rarity.filter(r => r !== rarityName)
      : [...state.rarity, rarityName]
  })),

  toggleStage: (stageName) => set((state) => ({
    stage: state.stage.includes(stageName)
      ? state.stage.filter(s => s !== stageName)
      : [...state.stage, stageName]
  })),

  resetFilters: () => set(initialState),
}));

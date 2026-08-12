import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FilterState {
  filters: Record<string, Record<string, any>>;
  setFilter: (module: string, key: string, value: any) => void;
  setFilters: (module: string, filters: Record<string, any>) => void;
  clearFilters: (module: string) => void;
  getFilters: (module: string) => Record<string, any>;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      filters: {},
      setFilter: (module, key, value) => set((state) => ({
        filters: {
          ...state.filters,
          [module]: {
            ...(state.filters[module] || {}),
            [key]: value,
          },
        },
      })),
      setFilters: (module, newFilters) => set((state) => ({
        filters: {
          ...state.filters,
          [module]: newFilters,
        },
      })),
      clearFilters: (module) => set((state) => {
        const nextFilters = { ...state.filters };
        delete nextFilters[module];
        return { filters: nextFilters };
      }),
      getFilters: (module) => {
        return get().filters[module] || {};
      },
    }),
    {
      name: 'app-filters-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

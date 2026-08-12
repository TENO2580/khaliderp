import { create } from 'zustand';

export interface PhotoDraft {
  id: string;
  uri: string;
  width: number;
  height: number;
  type?: 'image' | 'video';
  createdAt: number;
}

interface PhotoState {
  photos: PhotoDraft[];
  addPhoto: (photo: Omit<PhotoDraft, 'id' | 'createdAt'>) => void;
  removePhoto: (id: string) => void;
  clearPhotos: () => void;
}

export const usePhotoStore = create<PhotoState>((set) => ({
  photos: [],
  
  addPhoto: (photoData) => {
    const newPhoto: PhotoDraft = {
      ...photoData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };
    
    set((state) => ({
      photos: [...state.photos, newPhoto]
    }));
  },
  
  removePhoto: (id) => {
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id)
    }));
  },
  
  clearPhotos: () => {
    set({ photos: [] });
  }
}));

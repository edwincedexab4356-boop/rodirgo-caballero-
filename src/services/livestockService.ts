/**
 * SERVICIO DE GANADO (LIVESTOCK) - CONECTADO CON FIRESTORE
 * Colección: 'animals'
 */

import { Animal, AnimalSex, AnimalStatus } from '../types';
import { activityService } from './activityService';
import { tryFirestoreGet, tryFirestoreSet, tryFirestoreDelete } from './firestoreHelper';

const COLLECTION_NAME = 'animals';
const LOCAL_STORAGE_KEY = 'agrogestion_animals_data';

let animalsStore: Animal[] = [];
let isLoaded = false;

function loadFromStorage(): Animal[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveToStorage(animals: Animal[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(animals));
  } catch (err) {
    console.error('Error saving animals to localStorage:', err);
  }
}

export interface LivestockFilters {
  searchTerm?: string;
  breed?: string;
  sex?: AnimalSex | 'Todos';
  status?: AnimalStatus | 'Todos';
  location?: string;
}

export const livestockService = {
  async getAll(): Promise<Animal[]> {
    if (!isLoaded) {
      animalsStore = loadFromStorage();
      const res = await tryFirestoreGet<Animal>(COLLECTION_NAME, animalsStore);
      if (res.fromFirestore && res.data.length > 0) {
        animalsStore = res.data;
        saveToStorage(animalsStore);
      }
      isLoaded = true;
    }
    return [...animalsStore];
  },

  async getFiltered(filters: LivestockFilters): Promise<Animal[]> {
    const all = await this.getAll();
    let result = [...all];

    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const term = filters.searchTerm.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.code.toLowerCase().includes(term) ||
          (a.name && a.name.toLowerCase().includes(term)) ||
          a.breed.toLowerCase().includes(term) ||
          a.location.toLowerCase().includes(term)
      );
    }

    if (filters.breed && filters.breed !== 'Todas') {
      result = result.filter((a) => a.breed === filters.breed);
    }

    if (filters.sex && filters.sex !== 'Todos') {
      result = result.filter((a) => a.sex === filters.sex);
    }

    if (filters.status && filters.status !== 'Todos') {
      result = result.filter((a) => a.status === filters.status);
    }

    if (filters.location && filters.location !== 'Todas') {
      result = result.filter((a) => a.location === filters.location);
    }

    return result;
  },

  async addAnimal(animalData: Omit<Animal, 'id'>, operatorName = 'Rodrigo Caballero'): Promise<Animal> {
    await this.getAll();
    const newAnimal: Animal = {
      ...animalData,
      id: `an-${Date.now()}`,
    };
    animalsStore.unshift(newAnimal);
    saveToStorage(animalsStore);

    await tryFirestoreSet(COLLECTION_NAME, newAnimal.id, newAnimal);

    activityService.log({
      userName: operatorName,
      action: `Alta de ganado: ${newAnimal.code} (${newAnimal.breed})`,
      module: 'Ganado',
      details: `Peso inicial: ${newAnimal.weightKg} kg, Ubicación: ${newAnimal.location}`
    });

    return newAnimal;
  },

  async updateAnimal(id: string, updates: Partial<Animal>, operatorName = 'Rodrigo Caballero'): Promise<Animal> {
    await this.getAll();
    const index = animalsStore.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Animal no encontrado en el registro.');

    const updated = { ...animalsStore[index], ...updates };
    animalsStore[index] = updated;
    saveToStorage(animalsStore);

    await tryFirestoreSet(COLLECTION_NAME, id, updated);

    activityService.log({
      userName: operatorName,
      action: `Actualización de ganado: ${updated.code}`,
      module: 'Ganado',
      details: `Estado: ${updated.status}, Peso: ${updated.weightKg} kg, Ubicación: ${updated.location}`
    });

    return updated;
  },

  async deleteAnimal(id: string, operatorName = 'Rodrigo Caballero'): Promise<void> {
    await this.getAll();
    const animal = animalsStore.find((a) => a.id === id);
    animalsStore = animalsStore.filter((a) => a.id !== id);
    saveToStorage(animalsStore);

    await tryFirestoreDelete(COLLECTION_NAME, id);

    if (animal) {
      activityService.log({
        userName: operatorName,
        action: `Baja/Eliminación de ganado: ${animal.code}`,
        module: 'Ganado',
        details: `Raza: ${animal.breed}, Ubicación: ${animal.location}`
      });
    }
  },

  getAvailableLocations(): string[] {
    const locations = new Set<string>();
    animalsStore.forEach((a) => {
      if (a.location) locations.add(a.location);
    });
    return Array.from(locations);
  },

  getAvailableBreeds(): string[] {
    const breeds = new Set<string>();
    animalsStore.forEach((a) => {
      if (a.breed) breeds.add(a.breed);
    });
    return Array.from(breeds);
  }
};

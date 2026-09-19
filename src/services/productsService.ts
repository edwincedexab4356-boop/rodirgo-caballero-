/**
 * SERVICIO DE PRODUCTOS COMERCIALES DEL RANCHO - CONECTADO CON FIRESTORE
 * Colección: 'products'
 */

import { Product } from '../types';
import { activityService } from './activityService';
import { tryFirestoreGet, tryFirestoreSet, tryFirestoreDelete } from './firestoreHelper';

const COLLECTION_NAME = 'products';
const LOCAL_STORAGE_KEY = 'agrogestion_products_data';

let productsStore: Product[] = [];
let isLoaded = false;

function loadFromStorage(): Product[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveToStorage(products: Product[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Error saving products to localStorage:', err);
  }
}

export const productsService = {
  async getAll(): Promise<Product[]> {
    if (!isLoaded) {
      productsStore = loadFromStorage();
      const res = await tryFirestoreGet<Product>(COLLECTION_NAME, productsStore);
      if (res.fromFirestore && res.data.length > 0) {
        productsStore = res.data;
        saveToStorage(productsStore);
      }
      isLoaded = true;
    }
    return [...productsStore];
  },

  async addProduct(
    productData: Omit<Product, 'id' | 'createdAt'>,
    operatorName = 'Rodrigo Caballero'
  ): Promise<Product> {
    await this.getAll();

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    productsStore.unshift(newProduct);
    saveToStorage(productsStore);

    await tryFirestoreSet(COLLECTION_NAME, newProduct.id, newProduct);

    activityService.log({
      userName: operatorName,
      action: `Creación de producto: ${newProduct.name}`,
      module: 'Productos',
      details: `Precio: $${newProduct.price} / ${newProduct.unit}, Stock: ${newProduct.quantity}`
    });

    return newProduct;
  },

  async updateProduct(
    id: string,
    updates: Partial<Product>,
    operatorName = 'Rodrigo Caballero'
  ): Promise<Product> {
    await this.getAll();
    const index = productsStore.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado.');

    const updated = { ...productsStore[index], ...updates };
    productsStore[index] = updated;
    saveToStorage(productsStore);

    await tryFirestoreSet(COLLECTION_NAME, id, updated);

    activityService.log({
      userName: operatorName,
      action: `Modificación de producto: ${updated.name}`,
      module: 'Productos',
      details: `Precio actualizado: $${updated.price}`
    });

    return updated;
  },

  async deleteProduct(id: string, operatorName = 'Rodrigo Caballero'): Promise<void> {
    await this.getAll();
    const product = productsStore.find((p) => p.id === id);
    productsStore = productsStore.filter((p) => p.id !== id);
    saveToStorage(productsStore);

    await tryFirestoreDelete(COLLECTION_NAME, id);

    if (product) {
      activityService.log({
        userName: operatorName,
        action: `Eliminación de producto: ${product.name}`,
        module: 'Productos',
        details: `Categoría: ${product.category}`
      });
    }
  }
};

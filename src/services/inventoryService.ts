/**
 * SERVICIO DE INVENTARIO Y MOVIMIENTOS - CONECTADO CON FIRESTORE
 * Colecciones: 'inventory', 'inventory_movements'
 */

import { InventoryItem, InventoryMovement, MovementType } from '../types';
import { activityService } from './activityService';
import { tryFirestoreGet, tryFirestoreSet, tryFirestoreDelete } from './firestoreHelper';

const ITEMS_COLLECTION = 'inventory';
const MOVEMENTS_COLLECTION = 'inventory_movements';
const STORAGE_ITEMS_KEY = 'agrogestion_inventory_items';
const STORAGE_MOVEMENTS_KEY = 'agrogestion_inventory_movements';

let inventoryStore: InventoryItem[] = [];
let movementsStore: InventoryMovement[] = [];
let isLoaded = false;

function loadFromStorage() {
  try {
    const items = localStorage.getItem(STORAGE_ITEMS_KEY);
    const movs = localStorage.getItem(STORAGE_MOVEMENTS_KEY);
    inventoryStore = items ? JSON.parse(items) : [];
    movementsStore = movs ? JSON.parse(movs) : [];
  } catch {
    inventoryStore = [];
    movementsStore = [];
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(inventoryStore));
    localStorage.setItem(STORAGE_MOVEMENTS_KEY, JSON.stringify(movementsStore));
  } catch (err) {
    console.error('Error saving inventory to localStorage:', err);
  }
}

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    if (!isLoaded) {
      loadFromStorage();
      const resItems = await tryFirestoreGet<InventoryItem>(ITEMS_COLLECTION, inventoryStore);
      if (resItems.fromFirestore && resItems.data.length > 0) {
        inventoryStore = resItems.data;
      }
      const resMovs = await tryFirestoreGet<InventoryMovement>(MOVEMENTS_COLLECTION, movementsStore);
      if (resMovs.fromFirestore && resMovs.data.length > 0) {
        movementsStore = resMovs.data;
      }
      saveToStorage();
      isLoaded = true;
    }
    return [...inventoryStore];
  },

  async getMovements(): Promise<InventoryMovement[]> {
    await this.getAll();
    return [...movementsStore];
  },

  async addItem(
    itemData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'status'>,
    operatorName = 'Rodrigo Caballero'
  ): Promise<InventoryItem> {
    await this.getAll();
    
    let status: InventoryItem['status'] = 'Disponible';
    if (itemData.quantity <= 0) status = 'Agotado';
    else if (itemData.quantity <= itemData.minStock) status = 'Bajo';

    const newItem: InventoryItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
      status,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    inventoryStore.unshift(newItem);
    saveToStorage();

    await tryFirestoreSet(ITEMS_COLLECTION, newItem.id, newItem);

    activityService.log({
      userName: operatorName,
      action: `Nuevo ítem de inventario: ${newItem.name}`,
      module: 'Inventario',
      details: `Cantidad: ${newItem.quantity} ${newItem.unit}, Categoría: ${newItem.category}`
    });

    return newItem;
  },

  async updateItem(
    id: string,
    updates: Partial<InventoryItem>,
    operatorName = 'Rodrigo Caballero'
  ): Promise<InventoryItem> {
    await this.getAll();
    const index = inventoryStore.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Ítem de inventario no encontrado.');

    const current = inventoryStore[index];
    const newQty = updates.quantity !== undefined ? updates.quantity : current.quantity;
    const minStock = updates.minStock !== undefined ? updates.minStock : current.minStock;

    let status: InventoryItem['status'] = 'Disponible';
    if (newQty <= 0) status = 'Agotado';
    else if (newQty <= minStock) status = 'Bajo';

    const updated: InventoryItem = {
      ...current,
      ...updates,
      quantity: newQty,
      status,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    inventoryStore[index] = updated;
    saveToStorage();

    await tryFirestoreSet(ITEMS_COLLECTION, id, updated);

    activityService.log({
      userName: operatorName,
      action: `Modificación de inventario: ${updated.name}`,
      module: 'Inventario',
      details: `Nueva cantidad: ${updated.quantity} ${updated.unit}`
    });

    return updated;
  },

  async registerMovement(
    itemId: string,
    type: MovementType,
    quantity: number,
    reason: string,
    operatorName = 'Rodrigo Caballero'
  ): Promise<{ item: InventoryItem; movement: InventoryMovement }> {
    await this.getAll();
    const itemIndex = inventoryStore.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) throw new Error('Ítem no encontrado en almacén.');

    const item = inventoryStore[itemIndex];

    if (type === 'Salida' && item.quantity < quantity) {
      throw new Error(`Stock insuficiente. Disponible: ${item.quantity} ${item.unit}, Solicitado: ${quantity} ${item.unit}`);
    }

    const newQty = type === 'Entrada' ? item.quantity + quantity : item.quantity - quantity;
    let status: InventoryItem['status'] = 'Disponible';
    if (newQty <= 0) status = 'Agotado';
    else if (newQty <= item.minStock) status = 'Bajo';

    const now = new Date();
    const dateStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      type,
      quantity,
      unit: item.unit,
      date: dateStr,
      reason,
      registeredBy: operatorName,
    };

    movementsStore.unshift(movement);

    const updatedItem: InventoryItem = {
      ...item,
      quantity: newQty,
      status,
      lastUpdated: now.toISOString().split('T')[0],
    };
    inventoryStore[itemIndex] = updatedItem;
    saveToStorage();

    await tryFirestoreSet(MOVEMENTS_COLLECTION, movement.id, movement);
    await tryFirestoreSet(ITEMS_COLLECTION, updatedItem.id, updatedItem);

    activityService.log({
      userName: operatorName,
      action: `${type} de inventario: ${item.name}`,
      module: 'Inventario',
      details: `${type === 'Entrada' ? '+' : '-'}${quantity} ${item.unit}. Motivo: ${reason}`
    });

    return { item: updatedItem, movement };
  },

  async deleteItem(id: string, operatorName = 'Rodrigo Caballero'): Promise<void> {
    await this.getAll();
    const item = inventoryStore.find((i) => i.id === id);
    inventoryStore = inventoryStore.filter((i) => i.id !== id);
    saveToStorage();

    await tryFirestoreDelete(ITEMS_COLLECTION, id);

    if (item) {
      activityService.log({
        userName: operatorName,
        action: `Eliminación de ítem de inventario: ${item.name}`,
        module: 'Inventario',
        details: `Categoría: ${item.category}`
      });
    }
  }
};

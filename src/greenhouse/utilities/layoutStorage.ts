import type { SavedLayout } from "../types/layout";

const STORAGE_KEY = "skyshards-designer-designs";

/**
 * Generate a unique ID for a layout
 */
function generateLayoutId(): string {
  return `layout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if data is in the correct format
 */
function isValidFormat(data: any): data is SavedLayout[] {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return true; // Empty array is valid
  
  const firstItem = data[0];
  // Check for required fields
  return (
    'id' in firstItem &&
    'name' in firstItem &&
    'savedAt' in firstItem &&
    'modifiedAt' in firstItem &&
    'inputs' in firstItem &&
    'targets' in firstItem
  );
}

/**
 * Save layouts to localStorage. Returns false if the write did not happen.
 *
 * This one persists work the user typed in themselves, so a failure has to be
 * reportable rather than silent: a full quota is the realistic cause, and the
 * caller needs to be able to say so instead of showing "Layout saved" over a
 * layout that was never written. Every caller checks the result.
 */
export function saveLayouts(layouts: SavedLayout[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
    return true;
  } catch (error) {
    console.error('[Layout Storage] Error saving layouts:', error);
    return false;
  }
}

/**
 * Load layouts from localStorage
 */
export function loadLayouts(): SavedLayout[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    if (!isValidFormat(parsed)) {
      console.warn('[Layout Storage] Data not in expected format');
      return [];
    }
    
    return parsed;
  } catch (error) {
    console.error('[Layout Storage] Error loading layouts:', error);
    return [];
  }
}

/**
 * Get a single layout by ID
 */
export function getLayoutById(id: string): SavedLayout | null {
  const layouts = loadLayouts();
  return layouts.find(l => l.id === id) || null;
}

/**
 * Delete a layout by ID
 */
export function deleteLayout(id: string): boolean {
  try {
    const layouts = loadLayouts();
    const filtered = layouts.filter(l => l.id !== id);
    
    if (filtered.length === layouts.length) {
      return false; // Nothing was deleted
    }
    
    return saveLayouts(filtered);
  } catch (error) {
    console.error('[Layout Storage] Error deleting layout:', error);
    return false;
  }
}

/**
 * Check if a layout name already exists
 */
export function layoutNameExists(name: string, excludeId?: string): boolean {
  const layouts = loadLayouts();
  return layouts.some(l => l.name === name && l.id !== excludeId);
}

/**
 * Rename a layout
 */
export function renameLayout(id: string, newName: string): boolean {
  try {
    const layouts = loadLayouts();
    const layoutIndex = layouts.findIndex(l => l.id === id);
    
    if (layoutIndex === -1) {
      return false; // Layout not found
    }
    
    // Check if new name already exists (excluding current layout)
    if (layoutNameExists(newName, id)) {
      console.warn('[Layout Storage] Cannot rename: name already exists');
      return false;
    }
    
    // Update name and modifiedAt
    layouts[layoutIndex] = {
      ...layouts[layoutIndex],
      name: newName,
      modifiedAt: Date.now(),
    };
    
    return saveLayouts(layouts);
  } catch (error) {
    console.error('[Layout Storage] Error renaming layout:', error);
    return false;
  }
}

/**
 * Update an existing layout (overwrite)
 */
export function updateLayout(id: string, layout: Omit<SavedLayout, 'id' | 'savedAt'>): boolean {
  try {
    const layouts = loadLayouts();
    const layoutIndex = layouts.findIndex(l => l.id === id);
    
    if (layoutIndex === -1) {
      return false; // Layout not found
    }
    
    // Keep the original id and savedAt
    layouts[layoutIndex] = {
      ...layout,
      id,
      savedAt: layouts[layoutIndex].savedAt,
      modifiedAt: Date.now(),
    };
    
    return saveLayouts(layouts);
  } catch (error) {
    console.error('[Layout Storage] Error updating layout:', error);
    return false;
  }
}

/**
 * Generate unique layout ID (exported for external use)
 */
export { generateLayoutId };

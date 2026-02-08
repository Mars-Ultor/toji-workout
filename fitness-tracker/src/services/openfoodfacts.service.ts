import type { Food } from '../types/nutrition.types';

const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  'energy-kcal_serving'?: number;
  proteins_100g?: number;
  proteins_serving?: number;
  carbohydrates_100g?: number;
  carbohydrates_serving?: number;
  fat_100g?: number;
  fat_serving?: number;
  fiber_100g?: number;
  fiber_serving?: number;
}

interface OFFProduct {
  product_name?: string;
  brands?: string;
  code?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments: OFFNutriments;
  image_front_url?: string;
}

interface OFFResponse {
  status: number; // 1 = found, 0 = not found
  product?: OFFProduct;
}

/**
 * Look up a product by barcode using Open Food Facts API.
 * No API key required — this is a free, open-source database.
 */
export async function lookupBarcode(barcode: string): Promise<Food | null> {
  const url = `${OFF_BASE_URL}/product/${barcode}.json`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TojiFitnessTracker/1.0 (contact@toji-workout.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`Open Food Facts API error: ${response.status}`);
  }

  const data: OFFResponse = await response.json();

  if (data.status !== 1 || !data.product) {
    return null;
  }

  return mapOFFToFood(data.product, barcode);
}

/**
 * Map an Open Food Facts product to our internal Food type.
 */
function mapOFFToFood(product: OFFProduct, barcode: string): Food {
  const n = product.nutriments;

  // Prefer per-serving values if available, otherwise use per-100g
  const hasServing = product.serving_quantity && product.serving_quantity > 0;
  
  let calories: number;
  let protein: number;
  let carbs: number;
  let fats: number;
  let fiber: number | undefined;
  let servingSize: number;
  let servingUnit: string;

  if (hasServing && n['energy-kcal_serving'] != null) {
    calories = Math.round(n['energy-kcal_serving'] || 0);
    protein = Math.round((n.proteins_serving || 0) * 10) / 10;
    carbs = Math.round((n.carbohydrates_serving || 0) * 10) / 10;
    fats = Math.round((n.fat_serving || 0) * 10) / 10;
    fiber = n.fiber_serving ? Math.round(n.fiber_serving * 10) / 10 : undefined;
    servingSize = product.serving_quantity!;
    servingUnit = parseServingUnit(product.serving_size || '') || 'g';
  } else {
    // Fall back to per-100g
    calories = Math.round(n['energy-kcal_100g'] || 0);
    protein = Math.round((n.proteins_100g || 0) * 10) / 10;
    carbs = Math.round((n.carbohydrates_100g || 0) * 10) / 10;
    fats = Math.round((n.fat_100g || 0) * 10) / 10;
    fiber = n.fiber_100g ? Math.round(n.fiber_100g * 10) / 10 : undefined;
    servingSize = 100;
    servingUnit = 'g';
  }

  const name = product.product_name || `Unknown Product (${barcode})`;
  const brand = product.brands?.split(',')[0]?.trim();

  return {
    id: `off-${barcode}`,
    name: brand ? `${name} (${brand})` : name,
    brand: brand || undefined,
    barcode,
    servingSize,
    servingUnit,
    macros: {
      calories,
      protein,
      carbs,
      fats,
      fiber,
    },
    verified: true,
  };
}

/**
 * Parse the serving unit from an Open Food Facts serving_size string.
 * Examples: "30g", "1 cup (240ml)", "250 ml"
 */
function parseServingUnit(servingSize: string): string {
  const lower = servingSize.toLowerCase();
  if (lower.includes('ml')) return 'ml';
  if (lower.includes('oz')) return 'oz';
  if (lower.includes('cup')) return 'cup';
  return 'g';
}

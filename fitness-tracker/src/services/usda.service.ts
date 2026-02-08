import type { Food } from '../types/nutrition.types';

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Get the USDA API key from environment or use the demo key.
 * Demo key: limited to 30 requests/hour, 1000/day.
 */
function getApiKey(): string {
  return import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY';
}

interface USDAFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFoodItem {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  dataType: string;
  gtinUpc?: string;
  foodNutrients: USDAFoodNutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
}

interface USDASearchResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: USDAFoodItem[];
}

/**
 * Search USDA FoodData Central for foods by query.
 * @param query - Search term (e.g. "chicken breast")
 * @param pageSize - Number of results (default 15, max 200)
 */
export async function searchUSDAFoods(
  query: string,
  pageSize: number = 15
): Promise<Food[]> {
  const apiKey = getApiKey();
  const url = `${USDA_BASE_URL}/foods/search?api_key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      pageSize,
      dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)', 'Branded'],
    }),
  });
  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`);
  }

  const data: USDASearchResponse = await response.json();
  return (data.foods || []).map(mapUSDAToFood);
}

/**
 * Look up a specific USDA food by FDC ID.
 */
export async function getUSDAFoodById(fdcId: number): Promise<Food | null> {
  const apiKey = getApiKey();
  const url = `${USDA_BASE_URL}/food/${fdcId}?api_key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data: USDAFoodItem = await response.json();
  return mapUSDAToFood(data);
}

/**
 * Map a USDA food item to our internal Food type.
 */
function mapUSDAToFood(item: USDAFoodItem): Food {
  const getNutrient = (id: number): number => {
    const nutrient = item.foodNutrients.find((n) => n.nutrientId === id);
    return nutrient ? Math.round(nutrient.value * 10) / 10 : 0;
  };

  // USDA nutrient IDs:
  // 1008 = Energy (kcal)
  // 1003 = Protein
  // 1005 = Carbohydrate
  // 1004 = Total lipid (fat)
  // 1079 = Fiber
  const calories = getNutrient(1008);
  const protein = getNutrient(1003);
  const carbs = getNutrient(1005);
  const fats = getNutrient(1004);
  const fiber = getNutrient(1079);

  const servingSize = item.servingSize || 100;
  const servingUnit = item.servingSizeUnit?.toLowerCase() || 'g';

  // Clean up the name — USDA descriptions are often ALL CAPS
  const name = formatFoodName(item.description);
  const brand = item.brandName || item.brandOwner;

  return {
    id: `usda-${item.fdcId}`,
    name: brand ? `${name} (${brand})` : name,
    brand: brand || undefined,
    barcode: item.gtinUpc || undefined,
    servingSize,
    servingUnit,
    macros: {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fats: Math.round(fats * 10) / 10,
      fiber: fiber > 0 ? Math.round(fiber * 10) / 10 : undefined,
    },
    verified: true,
  };
}

/**
 * Convert ALL CAPS USDA names to Title Case.
 */
function formatFoodName(name: string): string {
  // If mostly uppercase, convert to title case
  if (name === name.toUpperCase()) {
    return name
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return name;
}

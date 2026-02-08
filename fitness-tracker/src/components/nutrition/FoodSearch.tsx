import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, Globe, ChefHat } from 'lucide-react';
import { Input } from '../shared/Input';
import { useDebounce } from '../../hooks/useDebounce';
import { getPublicFoods, getCustomFoods, DEFAULT_FOODS } from '../../services/food.service';
import { searchUSDAFoods } from '../../services/usda.service';
import { getRecipes, recipeToFood } from '../../services/recipe.service';
import { useAuthStore } from '../../store/authStore';
import type { Food } from '../../types/nutrition.types';

const VIRTUAL_ITEM_HEIGHT = 56; // px per result row
const VIRTUAL_OVERSCAN = 5; // extra items rendered above/below viewport

type SearchSource = 'local' | 'usda' | 'recipes';

interface FoodSearchProps {
  onSelect: (food: Food) => void;
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [allRecipes, setAllRecipes] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<SearchSource>('local');
  const [usdaResults, setUsdaResults] = useState<Food[]>([]);
  const [usdaLoading, setUsdaLoading] = useState(false);

  // Virtual scrolling state
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Load local foods and recipes from Firestore on mount
  useEffect(() => {
    let cancelled = false;

    async function loadFoods() {
      setLoading(true);
      try {
        const [publicFoods, customFoods, recipes] = await Promise.all([
          getPublicFoods().catch(() => []),
          user ? getCustomFoods(user.uid).catch(() => []) : Promise.resolve([]),
          user ? getRecipes(user.uid).catch(() => []) : Promise.resolve([]),
        ]);

        if (cancelled) return;

        const pub = publicFoods.length > 0 ? publicFoods : DEFAULT_FOODS;
        const merged = [...pub, ...customFoods];

        const seen = new Set<string>();
        const unique = merged.filter((f) => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });

        setAllFoods(unique);
        setAllRecipes(recipes.map(recipeToFood));
      } catch {
        setAllFoods(DEFAULT_FOODS);
        setAllRecipes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFoods();
    return () => { cancelled = true; };
  }, [user]);

  // Search USDA when source is 'usda' and query changes
  useEffect(() => {
    if (source !== 'usda' || debouncedQuery.length < 2) {
      setUsdaResults([]);
      return;
    }

    let cancelled = false;
    async function searchUSDA() {
      setUsdaLoading(true);
      try {
        const results = await searchUSDAFoods(debouncedQuery, 25);
        if (!cancelled) setUsdaResults(results);
      } catch {
        if (!cancelled) setUsdaResults([]);
      } finally {
        if (!cancelled) setUsdaLoading(false);
      }
    }

    searchUSDA();
    return () => { cancelled = true; };
  }, [debouncedQuery, source]);

  // Filter results based on source
  const results = debouncedQuery.length > 0
    ? source === 'local'
      ? allFoods.filter((f) =>
          f.name.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
      : source === 'usda'
      ? usdaResults
      : allRecipes.filter((r) =>
          r.name.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
    : [];

  // Virtual scrolling calculations
  const containerHeight = 320;
  const totalHeight = results.length * VIRTUAL_ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_ITEM_HEIGHT) - VIRTUAL_OVERSCAN);
  const endIndex = Math.min(
    results.length,
    Math.ceil((scrollTop + containerHeight) / VIRTUAL_ITEM_HEIGHT) + VIRTUAL_OVERSCAN
  );
  const visibleItems = results.slice(startIndex, endIndex);
  const offsetY = startIndex * VIRTUAL_ITEM_HEIGHT;

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [debouncedQuery, source]);

  const isSearching = source === 'local' || source === 'recipes'
    ? (query.length > 0 && query !== debouncedQuery)
    : usdaLoading;

  const getSourceBadge = (food: Food) => {
    if (food.id.startsWith('recipe-')) return { text: 'recipe', color: 'text-purple-400 bg-purple-900/30' };
    if (food.id.startsWith('usda-')) return { text: 'USDA', color: 'text-green-400 bg-green-900/30' };
    if (!food.verified) return { text: 'custom', color: 'text-cyan-400 bg-cyan-900/30' };
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Source Tabs */}
      <div className="flex gap-1 bg-gray-800/50 rounded-lg p-0.5">
        <button
          onClick={() => setSource('local')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            source === 'local'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Search size={12} className="inline mr-1" />
          My Foods
        </button>
        <button
          onClick={() => setSource('recipes')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            source === 'recipes'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <ChefHat size={12} className="inline mr-1" />
          Recipes
        </button>
        <button
          onClick={() => setSource('usda')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            source === 'usda'
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Globe size={12} className="inline mr-1" />
          USDA
        </button>
      </div>

      <Input
        placeholder={
          source === 'local'
            ? 'Search your foods...'
            : source === 'recipes'
            ? 'Search your recipes...'
            : 'Search USDA database...'
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        icon={isSearching || loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
      />

      {results.length > 0 && (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="max-h-80 overflow-y-auto"
          style={{ position: 'relative' }}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
              {visibleItems.map((food) => {
                const badge = getSourceBadge(food);
                return (
                  <button
                    key={food.id}
                    onClick={() => {
                      onSelect(food);
                      setQuery('');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors group"
                    style={{ height: VIRTUAL_ITEM_HEIGHT }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                          {food.name}
                          {badge && (
                            <span className={`ml-1.5 text-[10px] ${badge.color} px-1 py-0.5 rounded`}>
                              {badge.text}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {food.brand ? `${food.brand} · ` : ''}
                          {food.servingSize}{food.servingUnit}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium text-gray-300">
                          {food.macros.calories} kcal
                        </div>
                        <div className="text-[10px] text-gray-500">
                          P:{food.macros.protein}g C:{food.macros.carbs}g F:{food.macros.fats}g
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {debouncedQuery.length > 0 && !isSearching && results.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          {source === 'local'
            ? 'No foods found. Try recipes or USDA database.'
            : source === 'recipes'
            ? 'No recipes found.'
            : 'No USDA results found.'}
        </p>
      )}

      {debouncedQuery.length > 0 && results.length > 0 && (
        <p className="text-[10px] text-gray-600 text-center">
          {results.length} result{results.length !== 1 ? 's' : ''}
          {source === 'usda' && ' from USDA'}
          {source === 'recipes' && ' from your recipes'}
        </p>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { RecipeBuilder } from './RecipeBuilder';
import { ChefHat, Trash2, Edit, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { getRecipes, deleteRecipe } from '../../services/recipe.service';
import type { Recipe } from '../../types/nutrition.types';

export function RecipesDatabase() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();

  const loadRecipes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getRecipes(user.uid);
      setRecipes(data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      addToast({ message: 'Failed to load recipes', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    loadRecipes();
  }, [user, loadRecipes]);

  const handleDelete = async (recipeId: string, recipeName: string) => {
    if (!user) return;
    if (!confirm(`Delete "${recipeName}"?`)) return;

    try {
      await deleteRecipe(user.uid, recipeId);
      setRecipes(recipes.filter((r) => r.id !== recipeId));
      addToast({ message: 'Recipe deleted', type: 'success' });
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      addToast({ message: 'Failed to delete recipe', type: 'error' });
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowBuilder(true);
  };

  const handleCreate = () => {
    setEditingRecipe(undefined);
    setShowBuilder(true);
  };

  const handleBuilderClose = () => {
    setShowBuilder(false);
    setEditingRecipe(undefined);
  };

  const handleSaved = () => {
    loadRecipes();
  };

  if (!user) return null;

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChefHat size={20} className="text-red-400" />
            <h2 className="text-lg font-semibold text-white">My Recipes</h2>
          </div>
          <Button onClick={handleCreate} size="sm">
            <Plus size={16} />
            Create Recipe
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-8">
            <ChefHat size={32} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm text-gray-500 mb-3">No recipes yet</p>
            <Button onClick={handleCreate} size="sm" variant="secondary">
              Create Your First Recipe
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-gray-800 rounded-lg p-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-200 truncate">
                      {recipe.name}
                    </h3>
                    <span className="text-[10px] text-gray-500 flex-shrink-0">
                      {recipe.servingsCount} {recipe.servingsCount === 1 ? 'serving' : 'servings'}
                    </span>
                  </div>
                  {recipe.description && (
                    <p className="text-xs text-gray-500 truncate">{recipe.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {recipe.macrosPerServing.calories} kcal · 
                    P:{recipe.macrosPerServing.protein}g · 
                    C:{recipe.macrosPerServing.carbs}g · 
                    F:{recipe.macrosPerServing.fats}g
                  </div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => handleEdit(recipe)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title="Edit recipe"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(recipe.id, recipe.name)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                    title="Delete recipe"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <RecipeBuilder
        isOpen={showBuilder}
        onClose={handleBuilderClose}
        onSaved={handleSaved}
        existingRecipe={editingRecipe}
      />
    </>
  );
}

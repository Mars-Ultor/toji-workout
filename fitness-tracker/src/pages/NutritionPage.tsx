import { Header } from '../components/layout/Header';
import { NutritionDashboard } from '../components/nutrition/NutritionDashboard';
import { NutritionTargetsEditor } from '../components/nutrition/NutritionTargetsEditor';
import { CustomFoodsDatabase } from '../components/nutrition/CustomFoodsDatabase';
import { RecipesDatabase } from '../components/nutrition/RecipesDatabase';

export default function NutritionPage() {
  return (
    <div className="space-y-6">
      <Header title="Nutrition" subtitle="Track your daily intake" />
      <NutritionTargetsEditor />
      <NutritionDashboard />
      <RecipesDatabase />
      <CustomFoodsDatabase />
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      
      return (data || []) as Category[];
    },
  });
};

export const useCategoriesWithCounts = () => {
  return useQuery({
    queryKey: ["categories-with-counts"],
    queryFn: async () => {
      const { data: categories, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;

      const allCategories = (categories || []) as Category[];

      // Get course counts for each category
      const categoriesWithCounts = await Promise.all(
        allCategories.map(async (category) => {
          const { count } = await supabase
            .from("courses")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("status", "approved");

          return {
            ...category,
            courseCount: count || 0,
          };
        })
      );

      return categoriesWithCounts;
    },
  });
};

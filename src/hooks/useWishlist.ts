import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useWishlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("wishlists")
        .select("course_id")
        .eq("student_id", user.id);

      if (error) throw error;
      return data.map((item) => item.course_id);
    },
    enabled: !!user?.id,
  });

  const addToWishlist = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("wishlists")
        .insert({ student_id: user.id, course_id: courseId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Added to wishlist");
    },
    onError: () => {
      toast.error("Failed to add to wishlist");
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("student_id", user.id)
        .eq("course_id", courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
    onError: () => {
      toast.error("Failed to remove from wishlist");
    },
  });

  const isInWishlist = (courseId: string) => {
    return wishlistItems.includes(courseId);
  };

  const toggleWishlist = (courseId: string) => {
    if (!user?.id) {
      toast.error("Please sign in to add to wishlist");
      return;
    }

    if (isInWishlist(courseId)) {
      removeFromWishlist.mutate(courseId);
    } else {
      addToWishlist.mutate(courseId);
    }
  };

  return {
    wishlistItems,
    isLoading,
    isInWishlist,
    toggleWishlist,
    addToWishlist: addToWishlist.mutate,
    removeFromWishlist: removeFromWishlist.mutate,
  };
};

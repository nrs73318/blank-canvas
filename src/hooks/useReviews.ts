import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useReviews = (courseId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addReview = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("reviews")
        .insert({
          course_id: courseId,
          student_id: user.id,
          rating,
          comment,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-details", courseId] });
      toast.success("Review submitted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({ reviewId, rating, comment }: { reviewId: string; rating: number; comment: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("reviews")
        .update({ rating, comment, updated_at: new Date().toISOString() })
        .eq("id", reviewId)
        .eq("student_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-details", courseId] });
      toast.success("Review updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update review");
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId)
        .eq("student_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-details", courseId] });
      toast.success("Review deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete review");
    },
  });

  return {
    addReview: addReview.mutate,
    updateReview: updateReview.mutate,
    deleteReview: deleteReview.mutate,
  };
};

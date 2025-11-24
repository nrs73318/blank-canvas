import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useLessonComments = (lessonId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["lesson-comments", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_comments")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      // Merge user data with comments
      return data.map((comment) => ({
        ...comment,
        student: users?.find((s) => s.id === comment.user_id) || {
          full_name: "Unknown",
          avatar_url: null,
        },
      }));
    },
    enabled: !!lessonId,
  });

  const addComment = useMutation({
    mutationFn: async ({ comment, parentId }: { comment: string; parentId?: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase.from("lesson_comments").insert({
        lesson_id: lessonId,
        user_id: user.id,
        content: comment,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
      toast.success("Comment added");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  const updateComment = useMutation({
    mutationFn: async ({ commentId, comment }: { commentId: string; comment: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("lesson_comments")
        .update({ content: comment })
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
      toast.success("Comment updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update comment");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("lesson_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
      toast.success("Comment deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete comment");
    },
  });

  return {
    comments,
    isLoading,
    addComment: addComment.mutate,
    updateComment: updateComment.mutate,
    deleteComment: deleteComment.mutate,
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useConversations = (instructorFilter?: boolean) => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id, instructorFilter],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, is_read")
        .eq("user_id", user.id);

      if (partError) throw partError;

      const conversationIds = participations.map((p) => p.conversation_id);

      if (conversationIds.length === 0) return [];

      let conversationQuery = supabase
        .from("conversations")
        .select("*, course_id")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      // If instructor filter is enabled and user is an instructor, only show course-related conversations
      if (instructorFilter && userRole === "instructor") {
        const { data: instructorCourses } = await supabase
          .from("courses")
          .select("id")
          .eq("instructor_id", user.id);

        const courseIds = instructorCourses?.map((c) => c.id) || [];
        if (courseIds.length > 0) {
          conversationQuery = conversationQuery.in("course_id", courseIds);
        } else {
          // If instructor has no courses, return empty
          return [];
        }
      }

      const { data: conversations, error: convError } = await conversationQuery;

      if (convError) throw convError;

      // Fetch all participants for each conversation
      const { data: allParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", conversationIds);

      // Fetch profiles for other participants
      const otherUserIds = allParticipants
        ?.filter((p) => p.user_id !== user.id)
        .map((p) => p.user_id) || [];

      const uniqueUserIds = [...new Set(otherUserIds)];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", uniqueUserIds);

      // Fetch last message for each conversation
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      return conversations.map((conv) => {
        const participant = allParticipants?.find(
          (p) => p.conversation_id === conv.id && p.user_id !== user.id
        );
        const profile = profiles?.find((p) => p.id === participant?.user_id);
        const lastMessage = lastMessages?.find((m) => m.conversation_id === conv.id);
        const isRead = participations.find((p) => p.conversation_id === conv.id)?.is_read;

        return {
          ...conv,
          other_user: profile || { full_name: "Unknown User", avatar_url: null },
          last_message: lastMessage?.content || "",
          last_message_at: lastMessage?.created_at,
          is_read: isRead,
        };
      });
    },
    enabled: !!user?.id,
  });

  const createConversation = useMutation({
    mutationFn: async ({
      recipientId,
      subject,
      courseId,
    }: {
      recipientId: string;
      subject: string;
      courseId?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Check if conversation already exists
      const { data: existingParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const existingConvIds = existingParticipations?.map((p) => p.conversation_id) || [];

      if (existingConvIds.length > 0) {
        const { data: recipientParticipations } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", recipientId)
          .in("conversation_id", existingConvIds);

        if (recipientParticipations && recipientParticipations.length > 0) {
          return recipientParticipations[0].conversation_id;
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          subject,
          course_id: courseId || null,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conversation.id, user_id: user.id, is_read: true },
          { conversation_id: conversation.id, user_id: recipientId, is_read: false },
        ]);

      if (partError) throw partError;

      return conversation.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversation created");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create conversation");
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("conversation_participants")
        .update({ is_read: true, last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    conversations,
    isLoading,
    createConversation: createConversation.mutate,
    markAsRead: markAsRead.mutate,
  };
};

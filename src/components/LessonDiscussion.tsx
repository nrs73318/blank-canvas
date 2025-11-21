import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Loader2 } from "lucide-react";
import { useLessonComments } from "@/hooks/useLessonComments";

interface LessonDiscussionProps {
  lessonId: string;
}

export const LessonDiscussion = ({ lessonId }: LessonDiscussionProps) => {
  const { user } = useAuth();
  const { comments, isLoading, addComment, updateComment, deleteComment } = useLessonComments(lessonId);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addComment({ comment: newComment });
    setNewComment("");
  };

  const handleEdit = (commentId: string, currentText: string) => {
    setEditingId(commentId);
    setEditText(currentText);
  };

  const handleUpdate = (commentId: string) => {
    if (!editText.trim()) return;
    updateComment({ commentId, comment: editText });
    setEditingId(null);
    setEditText("");
  };

  const handleReply = (parentId: string) => {
    if (!replyText.trim()) return;
    addComment({ comment: replyText, parentId });
    setReplyingTo(null);
    setReplyText("");
  };

  // Organize comments into threads
  const topLevelComments = comments.filter((c: any) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c: any) => c.parent_id === parentId);

  const CommentItem = ({ comment, depth = 0 }: { comment: any; depth?: number }) => (
    <div className={`${depth > 0 ? "ml-8 mt-4" : "mt-4"}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.student.avatar_url || ""} />
          <AvatarFallback>{comment.student.full_name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">{comment.student.full_name}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            {editingId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(comment.id)}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setEditText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{comment.comment}</p>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setReplyingTo(comment.id)}
            >
              Reply
            </Button>
            {comment.student_id === user?.id && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleEdit(comment.id, comment.comment)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => deleteComment(comment.id)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
          {replyingTo === comment.id && (
            <div className="mt-2 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleReply(comment.id)}>
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {getReplies(comment.id).map((reply: any) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold">Discussion</h3>
          <span className="text-sm text-muted-foreground">({comments.length})</span>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ask a question or share your thoughts..."
            className="mb-2"
          />
          <Button type="submit">Post Comment</Button>
        </form>

        <div className="space-y-4">
          {topLevelComments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No comments yet. Start the discussion!
            </p>
          ) : (
            topLevelComments.map((comment: any) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

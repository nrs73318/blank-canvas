import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  student: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ReviewSectionProps {
  courseId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  isEnrolled: boolean;
}

export const ReviewSection = ({
  courseId,
  reviews,
  averageRating,
  totalReviews,
  isEnrolled,
}: ReviewSectionProps) => {
  const { user } = useAuth();
  const { addReview, updateReview, deleteReview } = useReviews(courseId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState<string | null>(null);

  const userReview = reviews.find((r: any) => r.student_id === user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }
    if (!isEnrolled) {
      toast.error("You must be enrolled to leave a review");
      return;
    }

    if (isEditing) {
      updateReview({ reviewId: isEditing, rating, comment });
      setIsEditing(null);
    } else {
      addReview({ rating, comment });
    }
    setComment("");
    setRating(5);
  };

  const handleEdit = (review: any) => {
    setIsEditing(review.id);
    setRating(review.rating);
    setComment(review.comment);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Reviews</h2>
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 fill-accent text-accent" />
            <span className="text-2xl font-bold">{averageRating || 0}</span>
            <span className="text-muted-foreground">({totalReviews} reviews)</span>
          </div>
        </div>

        {isEnrolled && !userReview && !isEditing && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">Leave a Review</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 cursor-pointer transition-colors ${
                    star <= rating ? "fill-accent text-accent" : "text-muted-foreground"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this course..."
              className="mb-4"
              required
            />
            <Button type="submit">Submit Review</Button>
          </form>
        )}

        {isEditing && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">Edit Your Review</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 cursor-pointer transition-colors ${
                    star <= rating ? "fill-accent text-accent" : "text-muted-foreground"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this course..."
              className="mb-4"
              required
            />
            <div className="flex gap-2">
              <Button type="submit">Update Review</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(null);
                  setComment("");
                  setRating(5);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No reviews yet. Be the first to review this course!
            </p>
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={review.student.avatar_url || ""} />
                    <AvatarFallback>
                      {review.student.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold">{review.student.full_name}</div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-accent text-accent"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                        {review.student_id === user?.id && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(review)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReview(review.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

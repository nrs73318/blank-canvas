import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Users, Star, BookOpen, Award, PlayCircle, CheckCircle, Heart, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ReviewSection } from "@/components/ReviewSection";
import { ContactInstructorButton } from "@/components/ContactInstructorButton";
import { useCourseDetails } from "@/hooks/useCourseDetails";
import { useWishlist } from "@/hooks/useWishlist";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: course, isLoading, error } = useCourseDetails(id);
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  // Check enrollment separately for current user (must be before any returns)
  const [isEnrolled, setIsEnrolled] = React.useState(false);

  // Log error for debugging
  React.useEffect(() => {
    if (error) {
      console.error("Course details error:", error);
    }
  }, [error]);
  
  React.useEffect(() => {
    const checkEnrollment = async () => {
      if (!user || !id) {
        setIsEnrolled(false);
        return;
      }
      
      const { data } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_id", id)
        .maybeSingle();
      
      setIsEnrolled(!!data);
    };
    
    checkEnrollment();
  }, [user, id]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please sign in to enroll");
      navigate("/auth/login");
      return;
    }

    if (!id) return;

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", id)
      .maybeSingle();

    if (existingEnrollment) {
      navigate(`/courses/${id}/learn`);
      return;
    }

    // Create enrollment
    const { error } = await supabase
      .from("enrollments")
      .insert({
        student_id: user.id,
        course_id: id,
      });

    if (error) {
      console.error("Enrollment error:", error);
      toast.error("Failed to enroll in course");
      return;
    }

    toast.success("Successfully enrolled!");
    navigate(`/courses/${id}/learn`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground mb-4">
          {error ? "Error loading course" : "Course not found"}
        </p>
        {error && (
          <p className="text-sm text-destructive">{error.message}</p>
        )}
        <Link to="/courses">
          <Button>Browse Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-primary text-primary-foreground">
          <div className="container py-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary">{course.category?.name || "Uncategorized"}</Badge>
                  <Badge variant="outline" className="border-primary-foreground/20 text-primary-foreground">
                    {course.level}
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{course.title}</h1>
                <p className="text-lg opacity-90 mb-6">{course.description}</p>

                <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-accent text-accent" />
                    <span className="font-semibold">{course.averageRating || 0}</span>
                    <span className="opacity-80">({course.totalReviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{course.totalStudents} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{course.duration_hours || 0}h</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-12 w-12 border-2 border-primary-foreground/20">
                    <AvatarImage src={course.instructor_profile?.avatar_url || ""} />
                    <AvatarFallback>
                      {course.instructor_profile?.full_name?.charAt(0) || "I"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{course.instructor_profile?.full_name || "Unknown Instructor"}</div>
                    <div className="text-sm opacity-80">Instructor</div>
                  </div>
                </div>
              </div>

              <Card className="shadow-strong">
                <CardContent className="p-6">
                  <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center overflow-hidden">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PlayCircle className="h-16 w-16 text-primary" />
                    )}
                  </div>
                  <div className="text-3xl font-bold text-primary mb-6">
                    {course.price > 0 ? `$${course.price}` : "Free"}
                  </div>
                  {isEnrolled ? (
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full mb-4"
                      onClick={() => navigate(`/courses/${id}/learn`)}
                    >
                      Continue Learning
                    </Button>
                  ) : (
                    <Button variant="hero" size="lg" className="w-full mb-4" onClick={handleEnroll}>
                      Enroll Now
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full mb-4"
                    onClick={() => id && toggleWishlist(id)}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${id && isInWishlist(id) ? "fill-current" : ""}`} />
                    {id && isInWishlist(id) ? "Remove from Wishlist" : "Add to Wishlist"}
                  </Button>
                  {id && course.instructor_id && (
                    <ContactInstructorButton
                      instructorId={course.instructor_id}
                      courseId={id}
                      courseName={course.title}
                      variant="outline"
                    />
                  )}
                  <Separator className="my-6" />
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span>{course.lessons?.length || 0} lessons</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Course Content */}
        <section className="py-12">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                {/* What You'll Learn */}
                {course.objectives && course.objectives.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-6">What You'll Learn</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {course.objectives.map((objective: string, index: number) => (
                          <div key={index} className="flex gap-3">
                            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span>{objective}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Curriculum */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
                    <div className="space-y-4">
                      {course.lessons && course.lessons.length > 0 ? (
                        course.lessons.map((lesson: any, index: number) => (
                          <div key={lesson.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                                  {index + 1}
                                </div>
                                <div>
                                  <h3 className="font-semibold">{lesson.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="capitalize">{lesson.lesson_type}</span>
                                    {lesson.duration_minutes > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{lesson.duration_minutes} min</span>
                                      </>
                                    )}
                                    {lesson.is_preview && (
                                      <>
                                        <span>•</span>
                                        <Badge variant="secondary" className="text-xs">Preview</Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No lessons available yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews */}
                <ReviewSection
                  courseId={id!}
                  reviews={course.reviews || []}
                  averageRating={course.averageRating}
                  totalReviews={course.totalReviews}
                  isEnrolled={isEnrolled}
                />
              </div>

              {/* Instructor */}
              <div>
                <Card className="sticky top-24">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Instructor</h2>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={course.instructor_profile?.avatar_url || ""} />
                        <AvatarFallback>
                          {course.instructor_profile?.full_name?.charAt(0) || "I"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{course.instructor_profile?.full_name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">Course Instructor</div>
                      </div>
                    </div>
                    {course.instructor_profile?.bio && (
                      <p className="text-sm text-muted-foreground">{course.instructor_profile.bio}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default CourseDetails;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Award, TrendingUp, PlayCircle, Heart, CheckCircle2, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { useAuth } from "@/contexts/AuthContext";
import { useRecommendedCourses } from "@/hooks/useCourses";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  
  const { data: enrolledCourses = [] } = useQuery({
    queryKey: ["enrolled-courses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          courses (
            *,
            profiles:instructor_id(full_name),
            lessons(id, title, order_index)
          )
        `)
        .eq("student_id", user.id)
        .order("enrolled_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["student-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { courses: 0, hours: 0, certificates: 0 };
      
      const { count: coursesCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user.id);
      
      const enrollmentIds = enrolledCourses.map((e: any) => e.id);
      const { count: certificatesCount } = enrollmentIds.length > 0
        ? await supabase
            .from("certificates")
            .select("*", { count: "exact", head: true })
            .in("enrollment_id", enrollmentIds)
        : { count: 0 };
      
      const totalHours = enrolledCourses.reduce((sum: number, e: any) => 
        sum + (e.courses?.duration_hours || 0), 0
      );
      
      const avgProgress = enrolledCourses.length > 0
        ? enrolledCourses.reduce((sum: number, e: any) => sum + e.progress_percentage, 0) / enrolledCourses.length
        : 0;
      
      return {
        courses: coursesCount || 0,
        hours: totalHours,
        certificates: certificatesCount || 0,
        progress: Math.round(avgProgress),
      };
    },
    enabled: !!user?.id && enrolledCourses.length > 0,
  });

  const { data: recommendedCourses = [] } = useRecommendedCourses(user?.id);

  // Fetch wishlist courses
  const { data: wishlistCourses = [] } = useQuery({
    queryKey: ["wishlist-courses", wishlistItems],
    queryFn: async () => {
      if (!wishlistItems.length) return [];
      
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          profiles:instructor_id(full_name, avatar_url),
          category:categories(name),
          reviews(rating),
          enrollments(id)
        `)
        .in("id", wishlistItems)
        .eq("status", "approved");
      
      if (error) throw error;
      return data || [];
    },
    enabled: wishlistItems.length > 0,
  });

  const statsData = [
    { label: "Enrolled Courses", value: stats?.courses || 0, icon: BookOpen, color: "text-blue-500" },
    { label: "Hours Learned", value: stats?.hours || 0, icon: Clock, color: "text-green-500" },
    { label: "Certificates", value: stats?.certificates || 0, icon: Award, color: "text-purple-500" },
    { label: "Progress", value: `${stats?.progress || 0}%`, icon: TrendingUp, color: "text-orange-500" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-muted/50">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Learning Dashboard</h1>
            <p className="text-muted-foreground">Track your progress and continue learning</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsData.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* In Progress Courses */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Continue Learning</CardTitle>
                <Link to="/courses">
                  <Button variant="ghost">Browse More →</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {enrolledCourses.filter((e: any) => e.progress_percentage < 100).length > 0 ? (
                <div className="space-y-6">
                  {enrolledCourses.filter((e: any) => e.progress_percentage < 100).map((enrollment: any) => {
                    const course = enrollment.courses;
                    const nextLesson = course?.lessons?.[0];
                    
                    return (
                      <div
                        key={enrollment.id}
                        className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:shadow-soft transition-all"
                      >
                        <div className="relative w-full sm:w-48 aspect-video bg-muted rounded overflow-hidden shrink-0">
                          <img
                            src={course?.thumbnail_url || "/placeholder.svg"}
                            alt={course?.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <PlayCircle className="h-12 w-12 text-primary-foreground" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{course?.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              by {course?.profiles?.full_name || "Unknown Instructor"}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{enrollment.progress_percentage}%</span>
                            </div>
                            <Progress value={enrollment.progress_percentage} className="h-2" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              {nextLesson && (
                                <>
                                  <span className="text-muted-foreground">Next: </span>
                                  <span className="font-medium">{nextLesson.title}</span>
                                </>
                              )}
                            </div>
                            <Link to={`/courses/${course?.id}/learn`}>
                              <Button variant="hero">Continue Learning</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    You haven't enrolled in any courses yet
                  </p>
                  <Link to="/courses">
                    <Button variant="hero">Browse Courses</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Courses */}
          {enrolledCourses.filter((e: any) => e.progress_percentage >= 100).length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Completed Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledCourses.filter((e: any) => e.progress_percentage >= 100).map((enrollment: any) => {
                    const course = enrollment.courses;
                    return (
                      <div
                        key={enrollment.id}
                        className="flex gap-4 p-4 border rounded-lg hover:shadow-soft transition-all"
                      >
                        <div className="relative w-32 aspect-video bg-muted rounded overflow-hidden shrink-0">
                          <img
                            src={course?.thumbnail_url || "/placeholder.svg"}
                            alt={course?.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-sm">{course?.title}</h3>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Completed
                          </Badge>
                          <Link to={`/courses/${course?.id}/learn`}>
                            <Button variant="outline" size="sm" className="w-full">
                              Review Course
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wishlist */}
          {wishlistCourses.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    My Wishlist
                  </CardTitle>
                  <Link to="/courses">
                    <Button variant="ghost">Browse More →</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistCourses.map((course: any) => (
                    <div key={course.id} className="relative group">
                      <button
                        onClick={() => removeFromWishlist(course.id)}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Remove from wishlist"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <CourseCard
                        id={course.id}
                        title={course.title}
                        instructor={course.profiles?.full_name || "Unknown Instructor"}
                        duration={`${course.duration_hours || 0}h`}
                        students={course.enrollments?.length || 0}
                        rating={
                          course.reviews && course.reviews.length > 0
                            ? parseFloat((
                                course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
                                course.reviews.length
                              ).toFixed(1))
                            : 0.0
                        }
                        price={course.price > 0 ? `$${course.price}` : "Free"}
                        image={course.thumbnail_url || "/placeholder.svg"}
                        category={course.category?.name || "Uncategorized"}
                        level={course.level}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Courses */}
          {recommendedCourses.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recommended for You</CardTitle>
                  <Link to="/courses">
                    <Button variant="ghost">View All →</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedCourses.slice(0, 3).map((course) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      instructor={course.instructor_profile?.full_name || "Unknown Instructor"}
                      duration={`${course.duration_hours || 0}h`}
                      students={course.enrollments?.length || 0}
                      rating={
                        course.reviews && course.reviews.length > 0
                          ? parseFloat((
                              course.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
                              course.reviews.length
                            ).toFixed(1))
                          : 0.0
                      }
                      price={course.price > 0 ? `$${course.price}` : "Free"}
                      image={course.thumbnail_url || "/placeholder.svg"}
                      category={course.category?.name || "Uncategorized"}
                      level={course.level}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements & Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {stats?.certificates ? `You have earned ${stats.certificates} certificate${stats.certificates > 1 ? 's' : ''}!` : 'Complete your first course to earn a certificate!'}
                </p>
                <Link to="/courses">
                  <Button variant="hero">Browse Courses</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StudentDashboard;

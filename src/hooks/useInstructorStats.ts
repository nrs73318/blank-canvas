import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useInstructorStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["instructor-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Fetch instructor's courses
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch enrollments for these courses
      const courseIds = courses?.map(c => c.id) || [];
      
      let totalStudents = 0;
      let totalRevenue = 0;
      let courseStats = [];

      if (courseIds.length > 0) {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("id, course_id")
          .in("course_id", courseIds);

        totalStudents = enrollments?.length || 0;

        // Fetch payments for revenue
        const { data: payments } = await supabase
          .from("payments")
          .select("amount, course_id")
          .in("course_id", courseIds)
          .eq("status", "completed");

        totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        // Calculate per-course stats
        courseStats = await Promise.all(
          courses.map(async (course) => {
            const courseEnrollments = enrollments?.filter(e => e.course_id === course.id) || [];
            const coursePayments = payments?.filter(p => p.course_id === course.id) || [];
            const courseRevenue = coursePayments.reduce((sum, p) => sum + Number(p.amount), 0);

            // Fetch reviews for rating
            const { data: reviews } = await supabase
              .from("reviews")
              .select("rating")
              .eq("course_id", course.id);

            const avgRating = reviews?.length
              ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
              : "0";

            return {
              ...course,
              students: courseEnrollments.length,
              revenue: `$${courseRevenue.toFixed(2)}`,
              rating: avgRating,
            };
          })
        );
      }

      // Calculate average rating across all courses
      const { data: allReviews } = await supabase
        .from("reviews")
        .select("rating")
        .in("course_id", courseIds);

      const avgRating = allReviews?.length
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : "0";

      return {
        totalStudents,
        totalRevenue,
        totalCourses: courses?.length || 0,
        avgRating,
        courses: courseStats,
      };
    },
    enabled: !!user?.id,
  });
};

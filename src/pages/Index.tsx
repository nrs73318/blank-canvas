import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Code, Palette, Brain, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { useFeaturedCourses } from "@/hooks/useCourses";
import { useCategoriesWithCounts } from "@/hooks/useCategories";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { data: featuredCourses = [] } = useFeaturedCourses(6);
  const { data: categories = [] } = useCategoriesWithCounts();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/courses");
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Learn Without Limits
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Master new skills with expert instructors. Start your learning journey today with thousands of courses.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-background"
                />
              </div>
              <Button type="submit" variant="accent" size="lg" className="h-12 px-8">
                Explore Courses
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Popular Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.slice(0, 4).map((category) => {
              const totalCourses = category.courseCount || 0;
              
              return (
                <Link
                  key={category.id}
                  to={`/courses?category=${category.id}`}
                  className="group"
                >
                  <div className="bg-background p-6 rounded-lg shadow-soft hover:shadow-medium transition-all">
                    <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground">{totalCourses} courses</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Featured Courses</h2>
            <Link to="/courses">
              <Button variant="ghost">View All →</Button>
            </Link>
          </div>
          {featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
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
                      : 5.0
                  }
                  price={course.price > 0 ? `$${course.price}` : "Free"}
                  image={course.thumbnail_url || "/placeholder.svg"}
                  category={course.category?.name || "Uncategorized"}
                  level={course.level}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No courses available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-16">
        <div className="container">
          <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground shadow-strong">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of students already learning on LearnHub. Start your journey today!
            </p>
            <Link to="/auth/register">
              <Button variant="accent" size="lg" className="px-8">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

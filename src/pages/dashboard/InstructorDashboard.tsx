import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, DollarSign, TrendingUp, Plus, Edit, BarChart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useInstructorStats } from "@/hooks/useInstructorStats";

const InstructorDashboard = () => {
  const { data: statsData, isLoading } = useInstructorStats();

  const stats = [
    { label: "Total Students", value: statsData?.totalStudents.toLocaleString() || "0", icon: Users, color: "text-blue-500" },
    { label: "Total Revenue", value: `$${statsData?.totalRevenue.toFixed(2) || "0"}`, icon: DollarSign, color: "text-green-500" },
    { label: "Courses", value: statsData?.totalCourses.toString() || "0", icon: BookOpen, color: "text-purple-500" },
    { label: "Avg Rating", value: statsData?.avgRating || "0", icon: TrendingUp, color: "text-orange-500" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-muted/50">
        <div className="container py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Instructor Dashboard</h1>
              <p className="text-muted-foreground">Manage your courses and track performance</p>
            </div>
            <Link to="/instructor/courses/create">
              <Button variant="hero" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create New Course
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
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

          {/* My Courses */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {!statsData?.courses || statsData.courses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No courses yet. Create your first course to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statsData.courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:shadow-soft transition-all"
                  >
                    <div className="w-full sm:w-48 aspect-video bg-muted rounded overflow-hidden shrink-0">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                          <Badge variant="secondary">{course.status}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Students</p>
                          <p className="font-semibold">{course.students.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="font-semibold">{course.revenue}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rating</p>
                          <p className="font-semibold">{course.rating} ⭐</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/instructor/courses/${course.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Course
                          </Button>
                        </Link>
                        <Link to={`/courses/${course.id}`}>
                          <Button variant="outline" size="sm">
                            <BarChart className="h-4 w-4 mr-2" />
                            View Course
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/instructor/courses/create">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Course
                  </Button>
                </Link>
                <Link to="/messages">
                  <Button variant="outline" className="w-full justify-start" size="lg">
                    <Users className="h-5 w-5 mr-2" />
                    View Messages
                  </Button>
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

export default InstructorDashboard;

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, CheckCircle, XCircle, Clock, TrendingUp, MessageSquare } from "lucide-react";
import { ComplaintsPanel } from "./ComplaintsPanel";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Stats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  pendingCourses: number;
  approvedCourses: number;
  rejectedCourses: number;
}

interface Course {
  id: string;
  title: string;
  status: string;
  created_at: string;
  instructor_id: string;
  profiles: {
    full_name: string;
  };
}

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    pendingCourses: 0,
    approvedCourses: 0,
    rejectedCourses: 0,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (!user || userRole !== "admin") {
      navigate("/");
      return;
    }
    
    fetchStats();
    fetchCourses();
  }, [user, userRole]);

  const fetchStats = async () => {
    try {
      // Get student count
      const { count: studentCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");

      // Get instructor count
      const { count: instructorCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "instructor");

      // Get course counts
      const { data: courseCounts } = await supabase
        .from("courses")
        .select("status") as any;

      const pending = courseCounts?.filter((c: any) => c.status === "pending").length || 0;
      const approved = courseCounts?.filter((c: any) => c.status === "approved").length || 0;
      const rejected = courseCounts?.filter((c: any) => c.status === "rejected").length || 0;

      setStats({
        totalStudents: studentCount || 0,
        totalInstructors: instructorCount || 0,
        totalCourses: approved, // Only count approved courses
        pendingCourses: pending,
        approvedCourses: approved,
        rejectedCourses: rejected,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch instructor profiles separately
      if (coursesData && coursesData.length > 0) {
        const instructorIds = [...new Set(coursesData.map(c => c.instructor_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", instructorIds);

        // Map profiles to courses
        const coursesWithProfiles = coursesData.map(course => ({
          ...course,
          profiles: profilesData?.find(p => p.id === course.instructor_id) || { full_name: "Unknown" }
        }));

        setCourses(coursesWithProfiles as any);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    }
  };

  const handleApproveCourse = async (courseId: string) => {
    setActionLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("courses")
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", courseId);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("course_review_history")
        .insert({
          course_id: courseId,
          reviewer_id: user?.id,
          action: "approved",
        });

      if (historyError) throw historyError;

      toast.success("Course approved successfully!");
      fetchStats();
      fetchCourses();
    } catch (error) {
      console.error("Error approving course:", error);
      toast.error("Failed to approve course");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCourse = async () => {
    if (!selectedCourse || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setActionLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("courses")
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedCourse.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("course_review_history")
        .insert({
          course_id: selectedCourse.id,
          reviewer_id: user?.id,
          action: "rejected",
          reason: rejectionReason,
        });

      if (historyError) throw historyError;

      toast.success("Course rejected");
      setShowRejectDialog(false);
      setSelectedCourse(null);
      setRejectionReason("");
      fetchStats();
      fetchCourses();
    } catch (error) {
      console.error("Error rejecting course:", error);
      toast.error("Failed to reject course");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filterCourses = (status?: string) => {
    if (!status) return courses;
    return courses.filter((course) => course.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage platform users and course approvals</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.totalStudents}</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Instructors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.totalInstructors}</span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.totalCourses}</span>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.pendingCourses}</span>
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.approvedCourses}</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.rejectedCourses}</span>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Course Management</CardTitle>
            <CardDescription>Review and manage all courses on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Courses</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pendingCourses})</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <CourseTable
                  courses={filterCourses()}
                  onApprove={handleApproveCourse}
                  onReject={(course) => {
                    setSelectedCourse(course);
                    setShowRejectDialog(true);
                  }}
                  getStatusBadge={getStatusBadge}
                  actionLoading={actionLoading}
                />
              </TabsContent>

              <TabsContent value="pending" className="mt-4">
                <CourseTable
                  courses={filterCourses("pending")}
                  onApprove={handleApproveCourse}
                  onReject={(course) => {
                    setSelectedCourse(course);
                    setShowRejectDialog(true);
                  }}
                  getStatusBadge={getStatusBadge}
                  actionLoading={actionLoading}
                />
              </TabsContent>

              <TabsContent value="approved" className="mt-4">
                <CourseTable
                  courses={filterCourses("approved")}
                  onApprove={handleApproveCourse}
                  onReject={(course) => {
                    setSelectedCourse(course);
                    setShowRejectDialog(true);
                  }}
                  getStatusBadge={getStatusBadge}
                  actionLoading={actionLoading}
                  hideActions
                />
              </TabsContent>

              <TabsContent value="rejected" className="mt-4">
                <CourseTable
                  courses={filterCourses("rejected")}
                  onApprove={handleApproveCourse}
                  onReject={(course) => {
                    setSelectedCourse(course);
                    setShowRejectDialog(true);
                  }}
                  getStatusBadge={getStatusBadge}
                  actionLoading={actionLoading}
                  showReapprove
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Complaints Management */}
        <ComplaintsPanel />

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Course</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting "{selectedCourse?.title}". This will be sent to the instructor.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Explain why this course cannot be approved..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={5}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectCourse} disabled={actionLoading}>
                {actionLoading ? "Rejecting..." : "Reject Course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

interface CourseTableProps {
  courses: Course[];
  onApprove: (id: string) => void;
  onReject: (course: Course) => void;
  getStatusBadge: (status: string) => JSX.Element;
  actionLoading: boolean;
  hideActions?: boolean;
  showReapprove?: boolean;
}

const CourseTable = ({ courses, onApprove, onReject, getStatusBadge, actionLoading, hideActions, showReapprove }: CourseTableProps) => {
  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No courses found in this category.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Course Title</TableHead>
          <TableHead>Instructor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          {!hideActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.id}>
            <TableCell className="font-medium">{course.title}</TableCell>
            <TableCell>{course.profiles?.full_name || "Unknown"}</TableCell>
            <TableCell>{getStatusBadge(course.status)}</TableCell>
            <TableCell>{new Date(course.created_at).toLocaleDateString()}</TableCell>
            {!hideActions && (
              <TableCell className="text-right space-x-2">
                {(course.status === "pending" || showReapprove) && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                      onClick={() => onApprove(course.id)}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20"
                      onClick={() => onReject(course)}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AdminDashboard;

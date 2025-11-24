import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseBasicInfo from "@/components/instructor/CourseBasicInfo";
import CourseLessons from "@/components/instructor/CourseLessons";
import QuizManager from "@/components/instructor/QuizManager";

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");

  useEffect(() => {
    if (id && user) {
      fetchCourse();
    }
  }, [id, user]);

  useEffect(() => {
    // Refresh lessons when tab changes or course updates
    if (id) {
      fetchLessons();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .eq("instructor_id", user?.id)
        .single();

      if (error) throw error;
      setCourse(data);
      fetchLessons();
    } catch (error: any) {
      toast.error("Failed to load course");
      navigate("/dashboard/instructor");
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", id)
        .order("order_index");

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);
      
      // Set first quiz lesson as selected
      const quizLesson = lessonsData?.find((l) => l.lesson_type === "quiz");
      if (quizLesson && !selectedLessonId) {
        setSelectedLessonId(quizLesson.id);
      }
    } catch (error: any) {
      console.error("Failed to load lessons:", error);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      if (course.status === "approved") {
        toast.error("Course is already approved");
        return;
      }

      const { error } = await supabase
        .from("courses")
        .update({ status: "pending" })
        .eq("id", id);

      if (error) throw error;

      setCourse({ ...course, status: "pending" });
      toast.success("Course submitted for admin approval!");
    } catch (error: any) {
      toast.error(error.message);
    }
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

      <div className="flex-1 bg-muted/50">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="hero" 
                onClick={handleSubmitForApproval}
                disabled={course?.status === "pending" || course?.status === "approved"}
              >
                {course?.status === "pending" ? "Pending Approval" : 
                 course?.status === "approved" ? "Approved" : "Submit for Approval"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl">{course?.title}</CardTitle>
                <div className="flex gap-2">
                  {(course as any)?.status === "pending" && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Pending Approval
                    </Badge>
                  )}
                  {(course as any)?.status === "approved" && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Approved
                    </Badge>
                  )}
                  {(course as any)?.status === "rejected" && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                      Rejected
                    </Badge>
                  )}
                </div>
              </div>
              {(course as any)?.status === "rejected" && (course as any)?.rejection_reason && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-sm font-semibold text-red-600">Rejection Reason:</p>
                  <p className="text-sm text-red-600/80 mt-1">{(course as any).rejection_reason}</p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basics" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basics">Basic Info</TabsTrigger>
                  <TabsTrigger value="lessons">Lessons</TabsTrigger>
                  <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                </TabsList>

                <TabsContent value="basics">
                  <CourseBasicInfo course={course} onUpdate={setCourse} />
                </TabsContent>

                <TabsContent value="lessons">
                  <CourseLessons courseId={id!} onLessonsChange={fetchLessons} />
                </TabsContent>

                <TabsContent value="quizzes">
                  <div className="space-y-4">
                    {lessons.filter((l) => l.lesson_type === "quiz").length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                          <p className="mb-4">
                            No quiz lessons yet. Create a lesson with type "Quiz" first.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const tabsList = document.querySelector('[value="lessons"]') as HTMLElement;
                              tabsList?.click();
                            }}
                          >
                            Go to Lessons
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <Label htmlFor="lesson-select" className="whitespace-nowrap">
                            Select Quiz Lesson:
                          </Label>
                          <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                            <SelectTrigger id="lesson-select" className="flex-1">
                              <SelectValue placeholder="Choose a quiz lesson" />
                            </SelectTrigger>
                            <SelectContent>
                              {lessons
                                .filter((l) => l.lesson_type === "quiz")
                                .map((lesson) => (
                                  <SelectItem key={lesson.id} value={lesson.id}>
                                    {lesson.title}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedLessonId && <QuizManager lessonId={selectedLessonId} />}
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EditCourse;

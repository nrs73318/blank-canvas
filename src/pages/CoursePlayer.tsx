import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonDiscussion } from "@/components/LessonDiscussion";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, PlayCircle, FileText, Lock, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import PDFViewer from "@/components/PDFViewer";
import QuizPlayer from "@/components/QuizPlayer";

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);

  useEffect(() => {
    if (id && user) {
      checkEnrollmentAndFetch();
    }
  }, [id, user]);

  const checkEnrollmentAndFetch = async () => {
    try {
      // Check enrollment
      const { data: enrollmentData, error: enrollError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("course_id", id)
        .eq("student_id", user?.id)
        .maybeSingle();

      if (enrollError) {
        console.error("Enrollment error:", enrollError);
        toast.error("Error checking enrollment");
        navigate("/courses");
        return;
      }

      if (!enrollmentData) {
        toast.error("You are not enrolled in this course");
        navigate(`/courses/${id}`);
        return;
      }

      setEnrollment(enrollmentData);

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (courseError || !courseData) {
        console.error("Course error:", courseError);
        toast.error("Course not found");
        navigate("/courses");
        return;
      }
      
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", id)
        .order("order_index");

      if (lessonsError) {
        console.error("Lessons error:", lessonsError);
        toast.error("Failed to load lessons");
        return;
      }
      
      setLessons(lessonsData || []);

      // Fetch progress
      const { data: progressData, error: progressError } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("student_id", user?.id);

      if (progressError) {
        console.error("Progress error:", progressError);
      }

      setProgress(progressData || []);

      // Set first lesson as current
      if (lessonsData && lessonsData.length > 0) {
        setCurrentLesson(lessonsData[0]);
      }
    } catch (error: any) {
      console.error("Failed to load course:", error);
      toast.error("Failed to load course");
      navigate("/courses");
    } finally {
      setLoading(false);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some(
      (p) => p.lesson_id === lessonId && p.is_completed
    );
  };

  const handleMarkComplete = async (lessonId: string, completed: boolean) => {
    try {
      if (completed) {
        const { error } = await supabase.from("lesson_progress").insert({
          lesson_id: lessonId,
          student_id: user?.id,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lesson_progress")
          .delete()
          .eq("lesson_id", lessonId)
          .eq("student_id", user?.id);

        if (error) throw error;
      }

      // Refresh progress
      const { data: progressData } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("student_id", user?.id);

      setProgress(progressData || []);

      // Update enrollment progress
      const completedCount = progressData?.filter((p) => p.is_completed).length || 0;
      const progressPercentage = Math.round(
        (completedCount / lessons.length) * 100
      );

      await supabase
        .from("enrollments")
        .update({ progress_percentage: progressPercentage })
        .eq("id", enrollment.id);

      toast.success(completed ? "Lesson marked as complete" : "Lesson unmarked");
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

  const completedLessons = progress.filter((p) => p.is_completed).length;
  const progressPercentage = Math.round((completedLessons / lessons.length) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-muted/50">
        <div className="container py-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-0">
                  {currentLesson?.lesson_type === "video" && (
                    currentLesson?.video_url ? (
                      <VideoPlayer
                        src={currentLesson.video_url}
                        onProgress={(progress) => {
                          // Auto mark as complete when 90% watched
                          if (progress > 90 && !isLessonCompleted(currentLesson.id)) {
                            handleMarkComplete(currentLesson.id, true);
                          }
                        }}
                        onEnded={() => {
                          if (!isLessonCompleted(currentLesson.id)) {
                            handleMarkComplete(currentLesson.id, true);
                          }
                        }}
                      />
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">No video available for this lesson</p>
                      </div>
                    )
                  )}

                  {currentLesson?.lesson_type === "pdf" && (
                    <div className="p-6">
                      {currentLesson?.pdf_url ? (
                        <PDFViewer
                          src={currentLesson.pdf_url}
                          title={currentLesson.title}
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <FileText className="h-16 w-16 mx-auto mb-4" />
                          <p>No PDF document available for this lesson</p>
                        </div>
                      )}
                    </div>
                  )}

                  {currentLesson?.lesson_type === "text" && (
                    <div className="p-8">
                      <FileText className="h-12 w-12 text-primary mb-4" />
                      <h2 className="text-2xl font-bold mb-4">
                        {currentLesson?.title}
                      </h2>
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: currentLesson?.content || currentLesson?.description || "",
                        }}
                      />
                    </div>
                  )}

                  {currentLesson?.lesson_type === "quiz" && (
                    <div className="p-6">
                      <QuizPlayer
                        lessonId={currentLesson?.id}
                        onComplete={() => {
                          handleMarkComplete(currentLesson.id, true);
                          toast.success("Quiz completed! Moving to next lesson...");
                          const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
                          if (currentIndex < lessons.length - 1) {
                            setCurrentLesson(lessons[currentIndex + 1]);
                          }
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <Tabs defaultValue="overview">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="discussion">Discussion</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{currentLesson?.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {currentLesson?.duration_minutes} minutes
                          </p>
                        </div>
                        {currentLesson?.lesson_type !== "quiz" && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isLessonCompleted(currentLesson?.id)}
                              onCheckedChange={(checked) =>
                                handleMarkComplete(currentLesson?.id, checked as boolean)
                              }
                            />
                            <span className="text-sm">Mark as complete</span>
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        {currentLesson?.description}
                      </p>
                    </TabsContent>

                    <TabsContent value="notes" className="space-y-4">
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                        <p>Notes feature coming soon!</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="discussion">
                      {currentLesson && <LessonDiscussion lessonId={currentLesson.id} />}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Course Progress</h3>
                  <Progress value={progressPercentage} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {completedLessons} of {lessons.length} lessons completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Course Content</h3>
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <button
                        key={lesson.id}
                        onClick={() => setCurrentLesson(lesson)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          currentLesson?.id === lesson.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isLessonCompleted(lesson.id) ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          ) : lesson.lesson_type === "video" ? (
                            <PlayCircle className="h-5 w-5 shrink-0" />
                          ) : (
                            <FileText className="h-5 w-5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {index + 1}. {lesson.title}
                            </p>
                            <p className="text-xs opacity-80">
                              {lesson.duration_minutes} min
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;

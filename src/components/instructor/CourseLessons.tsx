import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Video, FileText } from "lucide-react";
import FileUploader from "@/components/FileUploader";

interface CourseLessonsProps {
  courseId: string;
  onLessonsChange?: () => void;
}

const CourseLessons = ({ courseId, onLessonsChange }: CourseLessonsProps) => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    lesson_type: "video" | "text" | "quiz" | "pdf";
    duration_minutes: string;
    order_index: string;
    video_url: string;
    pdf_url: string;
  }>({
    title: "",
    description: "",
    lesson_type: "video",
    duration_minutes: "",
    order_index: "",
    video_url: "",
    pdf_url: "",
  });

  useEffect(() => {
    fetchLessons();
  }, [courseId]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (error) throw error;
      setLessons(data || []);
    } catch (error: any) {
      toast.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const lessonData = {
        ...formData,
        course_id: courseId,
        duration_minutes: parseInt(formData.duration_minutes) || 0,
        order_index: parseInt(formData.order_index) || lessons.length,
      };

      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update(lessonData)
          .eq("id", editingLesson.id);

        if (error) throw error;
        toast.success("Lesson updated successfully!");
      } else {
        const { error } = await supabase.from("lessons").insert(lessonData);

        if (error) throw error;
        toast.success("Lesson created successfully!");
      }

      setDialogOpen(false);
      setEditingLesson(null);
      setFormData({
        title: "",
        description: "",
        lesson_type: "video",
        duration_minutes: "",
        order_index: "",
        video_url: "",
        pdf_url: "",
      });
      fetchLessons();
      onLessonsChange?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (lesson: any) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || "",
      lesson_type: lesson.lesson_type as "video" | "text" | "quiz" | "pdf",
      duration_minutes: lesson.duration_minutes?.toString() || "",
      order_index: lesson.order_index?.toString() || "",
      video_url: lesson.video_url || "",
      pdf_url: lesson.pdf_url || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      const { error } = await supabase.from("lessons").delete().eq("id", id);

      if (error) throw error;
      toast.success("Lesson deleted");
      fetchLessons();
      onLessonsChange?.();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading lessons...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Course Lessons</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLesson(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? "Edit Lesson" : "Add New Lesson"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Lesson Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.lesson_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, lesson_type: value as "video" | "text" | "quiz" | "pdf" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_minutes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="order">Order Index</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) =>
                    setFormData({ ...formData, order_index: e.target.value })
                  }
                />
              </div>

              {formData.lesson_type === "video" && (
                <div>
                  <Label>Video Upload</Label>
                  <FileUploader
                    bucket="lesson-videos"
                    path={`${courseId}`}
                    accept="video/*"
                    maxSize={500}
                    label="Select Video"
                    onUploadComplete={(url) => setFormData({ ...formData, video_url: url })}
                  />
                  {formData.video_url && (
                    <p className="text-sm text-green-600 mt-2">✓ Video uploaded</p>
                  )}
                </div>
              )}

              {formData.lesson_type === "pdf" && (
                <div>
                  <Label>PDF Upload</Label>
                  <FileUploader
                    bucket="lesson-pdfs"
                    path={`${courseId}`}
                    accept="application/pdf"
                    maxSize={50}
                    label="Select PDF"
                    onUploadComplete={(url) => setFormData({ ...formData, pdf_url: url })}
                  />
                  {formData.pdf_url && (
                    <p className="text-sm text-green-600 mt-2">✓ PDF uploaded</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingLesson ? "Update Lesson" : "Create Lesson"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No lessons yet. Click "Add Lesson" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {lesson.lesson_type === "video" ? (
                      <Video className="h-5 w-5 text-primary" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <h4 className="font-semibold">{lesson.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {lesson.duration_minutes} minutes • {lesson.lesson_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(lesson)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(lesson.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseLessons;

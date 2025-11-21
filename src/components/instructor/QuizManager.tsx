import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, HelpCircle } from "lucide-react";

interface QuizManagerProps {
  lessonId: string;
}

const QuizManager = ({ lessonId }: QuizManagerProps) => {
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  const [quizFormData, setQuizFormData] = useState({
    title: "",
    description: "",
    time_limit_minutes: "",
    passing_score: "70",
  });

  const [questionFormData, setQuestionFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: "",
    explanation: "",
    order_index: "",
  });

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  const fetchQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (quizError) throw quizError;
      
      if (quizData) {
        setQuiz(quizData);
        setQuizFormData({
          title: quizData.title,
          description: quizData.description || "",
          time_limit_minutes: quizData.time_limit_minutes?.toString() || "",
          passing_score: quizData.passing_score.toString(),
        });

        const { data: questionsData, error: questionsError } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", quizData.id)
          .order("order_index");

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
      }
    } catch (error: any) {
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const quizData = {
        lesson_id: lessonId,
        title: quizFormData.title,
        description: quizFormData.description,
        time_limit_minutes: quizFormData.time_limit_minutes
          ? parseInt(quizFormData.time_limit_minutes)
          : null,
        passing_score: parseInt(quizFormData.passing_score),
      };

      if (quiz) {
        const { error } = await supabase
          .from("quizzes")
          .update(quizData)
          .eq("id", quiz.id);

        if (error) throw error;
        toast.success("Quiz updated successfully!");
      } else {
        const { data, error } = await supabase
          .from("quizzes")
          .insert(quizData)
          .select()
          .single();

        if (error) throw error;
        setQuiz(data);
        toast.success("Quiz created successfully!");
      }

      setQuizDialogOpen(false);
      fetchQuiz();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quiz) {
      toast.error("Please create a quiz first");
      return;
    }

    const validOptions = questionFormData.options.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    if (!questionFormData.correct_answer) {
      toast.error("Please select a correct answer");
      return;
    }

    try {
      const questionData = {
        quiz_id: quiz.id,
        question: questionFormData.question,
        options: validOptions,
        correct_answer: questionFormData.correct_answer,
        explanation: questionFormData.explanation,
        order_index: questionFormData.order_index
          ? parseInt(questionFormData.order_index)
          : questions.length,
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from("quiz_questions")
          .update(questionData)
          .eq("id", editingQuestion.id);

        if (error) throw error;
        toast.success("Question updated successfully!");
      } else {
        const { error } = await supabase
          .from("quiz_questions")
          .insert(questionData);

        if (error) throw error;
        toast.success("Question created successfully!");
      }

      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      setQuestionFormData({
        question: "",
        options: ["", "", "", ""],
        correct_answer: "",
        explanation: "",
        order_index: "",
      });
      fetchQuiz();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setQuestionFormData({
      question: question.question,
      options: [...question.options, "", "", "", ""].slice(0, 4),
      correct_answer: question.correct_answer,
      explanation: question.explanation || "",
      order_index: question.order_index?.toString() || "",
    });
    setQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Question deleted");
      fetchQuiz();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading quiz...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quiz Settings</CardTitle>
            <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
              <DialogTrigger asChild>
                <Button variant={quiz ? "outline" : "default"}>
                  {quiz ? "Edit Quiz" : "Create Quiz"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{quiz ? "Edit Quiz" : "Create Quiz"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveQuiz} className="space-y-4">
                  <div>
                    <Label htmlFor="quiz-title">Quiz Title *</Label>
                    <Input
                      id="quiz-title"
                      required
                      value={quizFormData.title}
                      onChange={(e) =>
                        setQuizFormData({ ...quizFormData, title: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="quiz-description">Description</Label>
                    <Textarea
                      id="quiz-description"
                      value={quizFormData.description}
                      onChange={(e) =>
                        setQuizFormData({
                          ...quizFormData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                      <Input
                        id="time-limit"
                        type="number"
                        value={quizFormData.time_limit_minutes}
                        onChange={(e) =>
                          setQuizFormData({
                            ...quizFormData,
                            time_limit_minutes: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="passing-score">Passing Score (%) *</Label>
                      <Input
                        id="passing-score"
                        type="number"
                        required
                        min="0"
                        max="100"
                        value={quizFormData.passing_score}
                        onChange={(e) =>
                          setQuizFormData({
                            ...quizFormData,
                            passing_score: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {quiz ? "Update Quiz" : "Create Quiz"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setQuizDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        {quiz && (
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Title:</span> {quiz.title}
              </p>
              {quiz.description && (
                <p>
                  <span className="font-medium">Description:</span>{" "}
                  {quiz.description}
                </p>
              )}
              <p>
                <span className="font-medium">Time Limit:</span>{" "}
                {quiz.time_limit_minutes
                  ? `${quiz.time_limit_minutes} minutes`
                  : "No limit"}
              </p>
              <p>
                <span className="font-medium">Passing Score:</span>{" "}
                {quiz.passing_score}%
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {quiz && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Quiz Questions ({questions.length})</CardTitle>
              <Dialog
                open={questionDialogOpen}
                onOpenChange={setQuestionDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingQuestion(null);
                      setQuestionFormData({
                        question: "",
                        options: ["", "", "", ""],
                        correct_answer: "",
                        explanation: "",
                        order_index: "",
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingQuestion ? "Edit Question" : "Add Question"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveQuestion} className="space-y-4">
                    <div>
                      <Label htmlFor="question">Question *</Label>
                      <Textarea
                        id="question"
                        required
                        value={questionFormData.question}
                        onChange={(e) =>
                          setQuestionFormData({
                            ...questionFormData,
                            question: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Options (minimum 2) *</Label>
                      {questionFormData.options.map((option, index) => (
                        <Input
                          key={index}
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionFormData.options];
                            newOptions[index] = e.target.value;
                            setQuestionFormData({
                              ...questionFormData,
                              options: newOptions,
                            });
                          }}
                        />
                      ))}
                    </div>

                    <div>
                      <Label htmlFor="correct-answer">Correct Answer *</Label>
                      <Input
                        id="correct-answer"
                        required
                        value={questionFormData.correct_answer}
                        onChange={(e) =>
                          setQuestionFormData({
                            ...questionFormData,
                            correct_answer: e.target.value,
                          })
                        }
                        placeholder="Type the exact correct answer"
                      />
                    </div>

                    <div>
                      <Label htmlFor="explanation">Explanation (optional)</Label>
                      <Textarea
                        id="explanation"
                        value={questionFormData.explanation}
                        onChange={(e) =>
                          setQuestionFormData({
                            ...questionFormData,
                            explanation: e.target.value,
                          })
                        }
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1">
                        {editingQuestion ? "Update Question" : "Add Question"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setQuestionDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-4" />
                <p>No questions yet. Click "Add Question" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <Card key={question.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium mb-2">
                            {index + 1}. {question.question}
                          </p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {question.options.map((opt: string, i: number) => (
                              <div
                                key={i}
                                className={
                                  opt === question.correct_answer
                                    ? "text-green-600 font-medium"
                                    : ""
                                }
                              >
                                • {opt}
                                {opt === question.correct_answer && " ✓"}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuizManager;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Trophy, Clock } from "lucide-react";

interface QuizPlayerProps {
  lessonId: string;
  onComplete?: () => void;
}

const QuizPlayer = ({ lessonId, onComplete }: QuizPlayerProps) => {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("lesson_id", lessonId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      if (quizData.time_limit_minutes) {
        setTimeLeft(quizData.time_limit_minutes * 60);
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizData.id)
        .order("order_index");

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error: any) {
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (selectedAnswer) {
      setAnswers({ ...answers, [questions[currentQuestionIndex].id]: selectedAnswer });
      setSelectedAnswer("");

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        handleSubmitQuiz();
      }
    }
  };

  const handleSubmitQuiz = async () => {
    const finalAnswers = { ...answers };
    if (selectedAnswer && questions[currentQuestionIndex]) {
      finalAnswers[questions[currentQuestionIndex].id] = selectedAnswer;
    }

    let correctCount = 0;
    questions.forEach((q) => {
      if (finalAnswers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);

    const isPassed = finalScore >= quiz.passing_score;

    try {
      await supabase.from("quiz_attempts").insert({
        quiz_id: quiz.id,
        student_id: user?.id,
        score: finalScore,
        answers: finalAnswers,
        is_passed: isPassed,
      });

      if (isPassed && onComplete) {
        onComplete();
      }
    } catch (error: any) {
      toast.error("Failed to save quiz results");
    }

    setShowResults(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading quiz...</div>;
  }

  if (!quiz || questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No quiz available for this lesson</p>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const isPassed = score >= quiz.passing_score;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {isPassed ? (
              <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-20 w-20 text-destructive mx-auto mb-4" />
            )}
            <h3 className="text-3xl font-bold mb-2">{score}%</h3>
            <p className="text-muted-foreground">
              {isPassed ? "Congratulations! You passed!" : `You need ${quiz.passing_score}% to pass`}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Correct Answers:</span>
              <span className="font-semibold">
                {Math.round((score / 100) * questions.length)} / {questions.length}
              </span>
            </div>
            <Progress value={score} />
          </div>

          <div className="space-y-3">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correct_answer;

              return (
                <Card key={question.id} className={isCorrect ? "border-green-500" : "border-destructive"}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-2">
                          {index + 1}. {question.question}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your answer: <span className={isCorrect ? "text-green-500" : "text-destructive"}>{userAnswer}</span>
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-green-500">
                            Correct answer: {question.correct_answer}
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button onClick={() => window.location.reload()} className="w-full">
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const options = currentQuestion.options as string[];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{quiz.title}</CardTitle>
          {timeLeft !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className={timeLeft < 60 ? "text-destructive font-bold" : ""}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{quiz.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>Passing Score: {quiz.passing_score}%</span>
          </div>
          <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>

          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            <div className="space-y-3">
              {options.map((option: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handleNextQuestion}
          disabled={!selectedAnswer}
          className="w-full"
        >
          {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Submit Quiz"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuizPlayer;

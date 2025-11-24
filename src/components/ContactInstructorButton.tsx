import { useState } from "react";
import { Button } from "./ui/button";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface ContactInstructorButtonProps {
  instructorId: string;
  courseId: string;
  courseName: string;
  variant?: "default" | "outline" | "ghost";
}

export const ContactInstructorButton = ({
  instructorId,
  courseId,
  courseName,
  variant = "outline",
}: ContactInstructorButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { createConversation } = useConversations();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(`Question about ${courseName}`);

  const handleContact = () => {
    if (!user) {
      toast.error("Please login to contact the instructor");
      navigate("/login");
      return;
    }

    if (user.id === instructorId) {
      toast.error("You cannot message yourself");
      return;
    }

    createConversation(
      {
        recipientId: instructorId,
        subject,
        courseId,
      },
      {
        onSuccess: () => {
          setOpen(false);
          navigate("/messages");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Contact Instructor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Instructor</DialogTitle>
          <DialogDescription>
            Start a conversation with the instructor about this course.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What would you like to discuss?"
            />
          </div>
          <Button onClick={handleContact} className="w-full">
            Start Conversation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

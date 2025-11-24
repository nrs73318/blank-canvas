import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, ArrowLeft, MessageSquarePlus, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Messages = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  // Filter conversations for instructors to only show course-related ones
  const { conversations, isLoading: conversationsLoading, markAsRead } = useConversations(
    userRole === "instructor"
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const { messages, sendMessage } = useMessages(selectedConversationId);
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportCategory, setSupportCategory] = useState("inquiry");

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    markAsRead(conversationId);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    sendMessage(messageContent);
    setMessageContent("");
  };

  const handleContactSupport = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { error } = await supabase.from("complaints").insert({
        user_id: user?.id,
        subject: supportSubject,
        description: supportMessage,
        category: supportCategory,
        status: "open",
      });

      if (error) throw error;

      toast.success("Your message has been sent to admin support");
      setShowSupportDialog(false);
      setSupportSubject("");
      setSupportMessage("");
      setSupportCategory("inquiry");
    } catch (error: any) {
      console.error("Support error:", error);
      toast.error("Failed to send support message");
    }
  };

  if (!user) {
    navigate("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Messages</h2>
              <div className="flex gap-2">
                <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Contact Admin Support"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Contact Admin Support</DialogTitle>
                      <DialogDescription>
                        Send a message to the site administrators for help or inquiries.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={supportCategory}
                          onChange={(e) => setSupportCategory(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="inquiry">General Inquiry</option>
                          <option value="complaint">Complaint</option>
                          <option value="technical">Technical Issue</option>
                          <option value="billing">Billing</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          value={supportSubject}
                          onChange={(e) => setSupportSubject(e.target.value)}
                          placeholder="Brief subject of your message"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          placeholder="Describe your issue or inquiry in detail..."
                          rows={5}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowSupportDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleContactSupport}>
                        Send to Admin
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/courses")}
                  title="Start new conversation from a course"
                >
                  <MessageSquarePlus className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              {conversationsLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">
                    Visit a course to start a conversation with the instructor
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                      selectedConversationId === conversation.id ? "bg-accent" : ""
                    } ${!conversation.is_read ? "bg-accent/50" : ""}`}
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={conversation.other_user.avatar_url || ""} />
                        <AvatarFallback>
                          {conversation.other_user.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold truncate">
                            {conversation.other_user.full_name}
                          </p>
                          {!conversation.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conversation.last_message}
                        </p>
                        {conversation.last_message_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(conversation.last_message_at), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Chat Interface */}
          <Card className="md:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversationId(null)}
                    className="md:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={selectedConversation.other_user.avatar_url || ""} />
                    <AvatarFallback>
                      {selectedConversation.other_user.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedConversation.other_user.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.subject}
                    </p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender_id === user.id ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.avatar_url || ""} />
                          <AvatarFallback>
                            {message.sender.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 max-w-[70%] ${
                            message.sender_id === user.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === user.id
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                  <Input
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquarePlus className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;

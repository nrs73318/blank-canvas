import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MessageSquare, Clock, CheckCircle2, XCircle, User, GraduationCap } from "lucide-react";

export const ComplaintsPanel = () => {
  const queryClient = useQueryClient();
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [response, setResponse] = useState("");

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["complaints"],
    queryFn: async () => {
      const { data: complaintsData, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      if (!complaintsData || complaintsData.length === 0) return [];

      // Get user profiles
      const userIds = [...new Set(complaintsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      // Get user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      // Combine data
      return complaintsData.map(complaint => ({
        ...complaint,
        profiles: profiles?.find(p => p.id === complaint.user_id),
        user_role: roles?.find(r => r.user_id === complaint.user_id)?.role || "student"
      }));
    },
  });

  const updateComplaint = useMutation({
    mutationFn: async ({ id, status, adminResponse }: any) => {
      const { error } = await supabase
        .from("complaints")
        .update({
          status,
          admin_response: adminResponse,
          responded_at: new Date().toISOString(),
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Complaint updated successfully");
      setSelectedComplaint(null);
      setResponse("");
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Clock className="h-4 w-4" />;
      case "in_progress": return <MessageSquare className="h-4 w-4" />;
      case "resolved": return <CheckCircle2 className="h-4 w-4" />;
      case "closed": return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "in_progress": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "resolved": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "closed": return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default: return "";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "complaint": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "inquiry": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "technical": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "feedback": return "bg-green-500/10 text-green-600 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getRoleIcon = (role: string) => {
    return role === "instructor" ? <GraduationCap className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    return role === "instructor" 
      ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
      : "bg-blue-500/10 text-blue-600 border-blue-500/20";
  };

  const filterByRole = (role?: string) => {
    if (!role) return complaints;
    return complaints.filter(c => c.user_role === role);
  };

  const filterByCategory = (category?: string) => {
    if (!category) return complaints;
    return complaints.filter(c => c.category === category);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading complaints...</div>;
  }

  const ComplaintsList = ({ complaintsToShow }: { complaintsToShow: any[] }) => {
    if (complaintsToShow.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No complaints found in this category.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {complaintsToShow.map((complaint) => (
          <Card key={complaint.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{complaint.subject}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>{complaint.profiles?.full_name || "Unknown User"}</span>
                    <span>•</span>
                    <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getRoleColor(complaint.user_role)}>
                      <span className="flex items-center gap-1">
                        {getRoleIcon(complaint.user_role)}
                        {complaint.user_role === "instructor" ? "Instructor" : "Student"}
                      </span>
                    </Badge>
                    {complaint.category && (
                      <Badge variant="outline" className={getCategoryColor(complaint.category)}>
                        {complaint.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(complaint.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(complaint.status)}
                    {complaint.status}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{complaint.message}</p>
              
              {complaint.admin_response && (
                <div className="bg-muted p-4 rounded-lg mb-4">
                  <p className="text-sm font-semibold mb-2">Admin Response:</p>
                  <p className="text-sm">{complaint.admin_response}</p>
                </div>
              )}

              {selectedComplaint?.id === complaint.id ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write your response here..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        updateComplaint.mutate({
                          id: complaint.id,
                          status: "resolved",
                          adminResponse: response,
                        });
                      }}
                      disabled={!response.trim() || updateComplaint.isPending}
                    >
                      Send Response
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedComplaint(null);
                        setResponse("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                complaint.status !== "resolved" && (
                  <Button
                    onClick={() => setSelectedComplaint(complaint)}
                    variant="outline"
                  >
                    Respond to Complaint
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complaints & Messages Management</CardTitle>
        <CardDescription>View and respond to student and instructor complaints organized by category</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({complaints.length})</TabsTrigger>
            <TabsTrigger value="students">Students ({filterByRole("student").length})</TabsTrigger>
            <TabsTrigger value="instructors">Instructors ({filterByRole("instructor").length})</TabsTrigger>
            <TabsTrigger value="complaints">Complaints ({filterByCategory("complaint").length})</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries ({filterByCategory("inquiry").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ComplaintsList complaintsToShow={complaints} />
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <ComplaintsList complaintsToShow={filterByRole("student")} />
          </TabsContent>

          <TabsContent value="instructors" className="mt-4">
            <ComplaintsList complaintsToShow={filterByRole("instructor")} />
          </TabsContent>

          <TabsContent value="complaints" className="mt-4">
            <ComplaintsList complaintsToShow={filterByCategory("complaint")} />
          </TabsContent>

          <TabsContent value="inquiries" className="mt-4">
            <ComplaintsList complaintsToShow={filterByCategory("inquiry")} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

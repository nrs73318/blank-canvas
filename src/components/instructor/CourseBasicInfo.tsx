import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface CourseBasicInfoProps {
  course: any;
  onUpdate: (course: any) => void;
}

const CourseBasicInfo = ({ course, onUpdate }: CourseBasicInfoProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: course.title || "",
    description: course.description || "",
    price: course.price?.toString() || "",
    level: course.level || "beginner",
    duration_hours: course.duration_hours?.toString() || "",
  });
  const [objectives, setObjectives] = useState<string[]>(
    course.objectives || [""]
  );

  const handleAddObjective = () => {
    setObjectives([...objectives, ""]);
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("courses")
        .update({
          ...formData,
          price: parseFloat(formData.price) || 0,
          duration_hours: parseInt(formData.duration_hours) || 0,
          objectives: objectives.filter((obj) => obj.trim() !== ""),
        })
        .eq("id", course.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate(data);
      toast.success("Course updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Course Title *</Label>
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
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            required
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price (USD) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration_hours}
              onChange={(e) =>
                setFormData({ ...formData, duration_hours: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="level">Level *</Label>
          <Select
            value={formData.level}
            onValueChange={(value) =>
              setFormData({ ...formData, level: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Label>What will students learn?</Label>
        {objectives.map((objective, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={objective}
              onChange={(e) => handleObjectiveChange(index, e.target.value)}
              placeholder="Enter a learning objective"
            />
            {objectives.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveObjective(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={handleAddObjective}>
          <Plus className="h-4 w-4 mr-2" />
          Add Objective
        </Button>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};

export default CourseBasicInfo;

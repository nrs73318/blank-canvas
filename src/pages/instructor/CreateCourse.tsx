import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Upload, Plus, X, Image as ImageIcon, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CourseCreationSteps } from "@/components/instructor/CourseCreationSteps";
import { useCategories } from "@/hooks/useCategories";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Validation schema
const courseSchema = z.object({
  title: z.string()
    .trim()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must be less than 100 characters"),
  subtitle: z.string()
    .trim()
    .min(10, "Subtitle must be at least 10 characters")
    .max(200, "Subtitle must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  description: z.string()
    .trim()
    .min(100, "Description must be at least 100 characters")
    .max(5000, "Description must be less than 5000 characters"),
  price: z.string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Price must be a positive number"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  duration_hours: z.string()
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, "Duration must be a positive number"),
  category_id: z.string().min(1, "Please select a category"),
  objectives: z.array(z.string().trim().min(1, "Objective cannot be empty")).min(1, "Add at least one learning objective"),
  requirements: z.array(z.string().trim().min(1)).optional(),
  target_audience: z.string().trim().max(500).optional().or(z.literal("")),
});

type CourseFormData = z.infer<typeof courseSchema>;

const steps = [
  { id: 1, name: "Basic Info", description: "Title & description" },
  { id: 2, name: "Media", description: "Images & video" },
  { id: 3, name: "Curriculum", description: "What students learn" },
  { id: 4, name: "Pricing", description: "Set your price" },
  { id: 5, name: "Settings", description: "Final details" },
];

const CreateCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [requirements, setRequirements] = useState<string[]>([""]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      level: "beginner",
      objectives: [""],
      requirements: [""],
    },
  });

  const watchedTitle = watch("title");
  const watchedDescription = watch("description");
  const watchedSubtitle = watch("subtitle");

  // Handle thumbnail preview
  useEffect(() => {
    if (thumbnailFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(thumbnailFile);
    } else {
      setThumbnailPreview(null);
    }
  }, [thumbnailFile]);

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof CourseFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["title", "subtitle", "description"];
        break;
      case 3:
        fieldsToValidate = ["objectives"];
        break;
      case 4:
        fieldsToValidate = ["price"];
        break;
      case 5:
        fieldsToValidate = ["level", "duration_hours", "category_id"];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddObjective = () => {
    const newObjectives = [...objectives, ""];
    setObjectives(newObjectives);
    setValue("objectives", newObjectives);
  };

  const handleRemoveObjective = (index: number) => {
    const newObjectives = objectives.filter((_, i) => i !== index);
    setObjectives(newObjectives);
    setValue("objectives", newObjectives);
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
    setValue("objectives", newObjectives);
  };

  const handleAddRequirement = () => {
    const newRequirements = [...requirements, ""];
    setRequirements(newRequirements);
    setValue("requirements", newRequirements);
  };

  const handleRemoveRequirement = (index: number) => {
    const newRequirements = requirements.filter((_, i) => i !== index);
    setRequirements(newRequirements);
    setValue("requirements", newRequirements);
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = value;
    setRequirements(newRequirements);
    setValue("requirements", newRequirements);
  };

  const onSubmit = async (data: CourseFormData) => {
    if (!user) return;

    setLoading(true);
    try {
      let thumbnail_url = null;

      // Upload thumbnail if provided
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("course-thumbnails")
          .upload(fileName, thumbnailFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("course-thumbnails")
          .getPublicUrl(uploadData.path);

        thumbnail_url = urlData.publicUrl;
      }

      // Create course
      const { data: course, error } = await supabase
        .from("courses")
        .insert({
          title: data.title,
          description: data.description,
          price: parseFloat(data.price),
          duration_hours: parseInt(data.duration_hours),
          level: data.level,
          category_id: data.category_id,
          instructor_id: user.id,
          thumbnail_url,
          objectives: data.objectives.filter((obj) => obj.trim() !== ""),
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Course created successfully! Now add your lessons.");
      navigate(`/instructor/courses/${course.id}/edit`);
    } catch (error: any) {
      console.error("Course creation error:", error);
      toast.error(error.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-muted/50">
        <div className="container py-8 max-w-5xl">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Create Your Course</h1>
            <p className="text-muted-foreground">
              Fill in the details below to create an engaging course for your students
            </p>
          </div>

          <CourseCreationSteps currentStep={currentStep} steps={steps} />

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Start with the fundamentals. Choose a clear, engaging title that describes what students will learn.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Course Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      {...register("title")}
                      placeholder="e.g., Complete Web Development Bootcamp 2024"
                      maxLength={100}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{errors.title?.message || "A clear, attention-grabbing title"}</span>
                      <span>{watchedTitle?.length || 0}/100</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Course Subtitle</Label>
                    <Input
                      id="subtitle"
                      {...register("subtitle")}
                      placeholder="e.g., Learn HTML, CSS, JavaScript, React, Node.js and more!"
                      maxLength={200}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{errors.subtitle?.message || "A brief, compelling subtitle"}</span>
                      <span>{watchedSubtitle?.length || 0}/200</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Course Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Describe your course in detail. What will students learn? Why is it valuable? What makes it unique?"
                      rows={8}
                      maxLength={5000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{errors.description?.message || "Min. 100 characters"}</span>
                      <span>{watchedDescription?.length || 0}/5000</span>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Pro Tip:</strong> Include key benefits, target audience, and what makes your course unique. Use bullet points for readability.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Media */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Media</CardTitle>
                  <CardDescription>
                    Upload a professional thumbnail to attract students. Recommended size: 1280x720px
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Course Thumbnail</Label>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                          <input
                            type="file"
                            id="thumbnail"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                          />
                          <label htmlFor="thumbnail" className="cursor-pointer">
                            {thumbnailPreview ? (
                              <div className="space-y-2">
                                <img
                                  src={thumbnailPreview}
                                  alt="Thumbnail preview"
                                  className="w-full h-48 object-cover rounded"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setThumbnailFile(null);
                                  }}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Click to upload thumbnail</p>
                                  <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                                </div>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Best Practices:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                              <li>Use high-quality, relevant images</li>
                              <li>Include text overlay for clarity</li>
                              <li>Maintain consistent branding</li>
                              <li>Ensure good contrast and readability</li>
                            </ul>
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Curriculum */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Curriculum Planning</CardTitle>
                  <CardDescription>
                    Define what students will learn and any prerequisites
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>
                        What will students learn? <span className="text-destructive">*</span>
                      </Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddObjective}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Objective
                      </Button>
                    </div>
                    {errors.objectives && (
                      <p className="text-sm text-destructive">{errors.objectives.message}</p>
                    )}
                    <div className="space-y-3">
                      {objectives.map((objective, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={objective}
                            onChange={(e) => handleObjectiveChange(index, e.target.value)}
                            placeholder="e.g., Build responsive websites using HTML, CSS, and JavaScript"
                          />
                          {objectives.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveObjective(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Requirements or Prerequisites</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddRequirement}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Requirement
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {requirements.map((requirement, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={requirement}
                            onChange={(e) => handleRequirementChange(index, e.target.value)}
                            placeholder="e.g., Basic computer skills required"
                          />
                          {requirements.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveRequirement(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_audience">Target Audience</Label>
                    <Textarea
                      id="target_audience"
                      {...register("target_audience")}
                      placeholder="Who is this course for? e.g., Beginners wanting to learn web development, career changers, etc."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">Describe your ideal student</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Pricing */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                  <CardDescription>
                    Set a competitive price for your course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Price (USD) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        {...register("price")}
                        className="pl-7"
                        placeholder="49.99"
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-destructive">{errors.price.message}</p>
                    )}
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Pricing Tips:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>Research similar courses to stay competitive</li>
                        <li>Consider your course length and depth</li>
                        <li>Start lower to attract initial students and reviews</li>
                        <li>You can always adjust pricing later</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Recommended Pricing Tiers</h4>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Beginner</p>
                        <p className="text-muted-foreground">$19.99 - $49.99</p>
                      </div>
                      <div>
                        <p className="font-medium">Intermediate</p>
                        <p className="text-muted-foreground">$49.99 - $99.99</p>
                      </div>
                      <div>
                        <p className="font-medium">Advanced</p>
                        <p className="text-muted-foreground">$99.99 - $199.99</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Settings */}
            {currentStep === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Settings</CardTitle>
                  <CardDescription>
                    Final details about your course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="level">
                        Course Level <span className="text-destructive">*</span>
                      </Label>
                      <Select onValueChange={(value) => setValue("level", value as any)} defaultValue="beginner">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner - No prior experience needed</SelectItem>
                          <SelectItem value="intermediate">Intermediate - Some experience required</SelectItem>
                          <SelectItem value="advanced">Advanced - Expert level</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.level && (
                        <p className="text-sm text-destructive">{errors.level.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">
                        Course Duration (hours) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        {...register("duration_hours")}
                        placeholder="10"
                      />
                      {errors.duration_hours && (
                        <p className="text-sm text-destructive">{errors.duration_hours.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Estimated total content hours</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(value) => setValue("category_id", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category_id && (
                      <p className="text-sm text-destructive">{errors.category_id.message}</p>
                    )}
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      After creating your course, you'll be able to add lessons, quizzes, and additional content in the course editor.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button type="button" onClick={handleNextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating Course..." : "Create Course"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CreateCourse;

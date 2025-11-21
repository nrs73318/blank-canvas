import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  name: string;
  description: string;
}

interface CourseCreationStepsProps {
  currentStep: number;
  steps: Step[];
}

export const CourseCreationSteps = ({ currentStep, steps }: CourseCreationStepsProps) => {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn(
              stepIdx !== steps.length - 1 ? "flex-1" : "",
              "relative flex items-center"
            )}
          >
            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    currentStep > step.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "border-primary bg-background text-primary"
                      : "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 transition-colors",
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

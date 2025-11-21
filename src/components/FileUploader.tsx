import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, File } from "lucide-react";

interface FileUploaderProps {
  bucket: string;
  path: string;
  accept?: string;
  maxSize?: number; // in MB
  onUploadComplete: (url: string) => void;
  label?: string;
}

const FileUploader = ({
  bucket,
  path,
  accept = "*",
  maxSize = 100,
  onUploadComplete,
  label = "Upload File",
}: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setProgress(0);

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${path}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setProgress(100);
      toast.success("File uploaded successfully!");
      onUploadComplete(urlData.publicUrl);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" type="button" asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {label}
            </span>
          </Button>
        </label>
      </div>

      {selectedFile && (
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {!uploading && (
            <Button onClick={handleUpload} className="w-full" size="sm">
              Upload File
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;

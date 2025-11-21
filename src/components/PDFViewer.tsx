import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

interface PDFViewerProps {
  src: string | null;
  title?: string;
}

const PDFViewer = ({ src, title }: PDFViewerProps) => {
  if (!src) {
    return (
      <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No PDF available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h3 className="font-semibold">{title || "Course Material"}</h3>
            <p className="text-sm text-muted-foreground">PDF Document</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(src, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement("a");
              link.href = src;
              link.download = title || "document.pdf";
              link.click();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden" style={{ height: "600px" }}>
        <iframe
          src={src}
          className="w-full h-full"
          title={title || "PDF Viewer"}
        />
      </div>
    </div>
  );
};

export default PDFViewer;

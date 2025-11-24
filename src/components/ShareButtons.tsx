import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Linkedin, Link, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export const ShareButtons = ({ url, title }: ShareButtonsProps) => {
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold">Share:</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
            "_blank"
          )
        }
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          window.open(
            `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
            "_blank"
          )
        }
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
            "_blank"
          )
        }
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          window.open(
            `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
            "_blank"
          )
        }
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleCopyLink}>
        <Link className="h-4 w-4" />
      </Button>
    </div>
  );
};

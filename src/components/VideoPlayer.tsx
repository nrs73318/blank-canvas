import { useRef, useEffect } from "react";

interface VideoPlayerProps {
  src: string | null;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
}

const VideoPlayer = ({ src, onProgress, onEnded }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (onProgress && video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        onProgress(progress);
      }
    };

    const handleEnded = () => {
      if (onEnded) {
        onEnded();
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [onProgress, onEnded]);

  if (!src) {
    return (
      <div className="aspect-video bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">No video available</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full"
        controlsList="nodownload"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;

import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Star, Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  students: number;
  rating: number;
  price: string;
  image: string;
  category: string;
  level: string;
}

const CourseCard = ({
  id,
  title,
  instructor,
  duration,
  students,
  rating,
  price,
  image,
  category,
  level,
}: CourseCardProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const inWishlist = isInWishlist(id);

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-medium">
      <div className="relative overflow-hidden aspect-video bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="secondary">{category}</Badge>
          <Badge variant="outline">{level}</Badge>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(id);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-5 w-5 transition-all ${
              inWishlist ? "fill-destructive text-destructive" : "text-muted-foreground"
            }`}
          />
        </button>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground">by {instructor}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{students.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-medium text-foreground">{rating}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="text-2xl font-bold text-primary">{price}</div>
        <Link to={`/courses/${id}`}>
          <Button variant="hero">View Course</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;

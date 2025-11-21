

const Footer = () => {
  return (
    <footer className="bg-secondary/20 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} LearnHub. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;

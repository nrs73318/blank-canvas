-- Add parent_id column to categories table for subcategories support
ALTER TABLE public.categories ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Insert 8 main categories with real icons
INSERT INTO public.categories (name, slug, description, icon) VALUES
('Web Development', 'web-development', 'Learn modern web development technologies including HTML, CSS, JavaScript, React, and more', '💻'),
('Mobile Development', 'mobile-development', 'Master iOS, Android, React Native, and Flutter development', '📱'),
('Data Science', 'data-science', 'Explore data analysis, machine learning, AI, and statistics', '📊'),
('Business', 'business', 'Develop business skills including marketing, entrepreneurship, and management', '💼'),
('Design', 'design', 'Learn graphic design, UX/UI, and creative tools', '🎨'),
('Programming Languages', 'programming-languages', 'Master programming languages from Python to Java and C++', '⚙️'),
('Cloud Computing', 'cloud-computing', 'Learn AWS, Azure, Google Cloud, and DevOps practices', '☁️'),
('Personal Development', 'personal-development', 'Improve productivity, leadership, and soft skills', '🌟');

-- Insert subcategories for Web Development
INSERT INTO public.categories (name, slug, description, icon, parent_id) 
SELECT 'Frontend Development', 'frontend-development', 'HTML, CSS, JavaScript, React, Vue, Angular', '🎨', id FROM public.categories WHERE slug = 'web-development';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Backend Development', 'backend-development', 'Node.js, Python, PHP, Ruby on Rails', '⚙️', id FROM public.categories WHERE slug = 'web-development';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Full Stack Development', 'full-stack-development', 'Complete web application development', '🔧', id FROM public.categories WHERE slug = 'web-development';

-- Insert subcategories for Mobile Development
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'iOS Development', 'ios-development', 'Swift, SwiftUI, UIKit', '🍎', id FROM public.categories WHERE slug = 'mobile-development';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Android Development', 'android-development', 'Kotlin, Java, Jetpack Compose', '🤖', id FROM public.categories WHERE slug = 'mobile-development';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Cross-Platform Development', 'cross-platform-development', 'React Native, Flutter', '📲', id FROM public.categories WHERE slug = 'mobile-development';

-- Insert subcategories for Data Science
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Machine Learning', 'machine-learning', 'ML algorithms, neural networks, deep learning', '🤖', id FROM public.categories WHERE slug = 'data-science';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Data Analysis', 'data-analysis', 'Python, Pandas, NumPy, statistics', '📈', id FROM public.categories WHERE slug = 'data-science';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Data Visualization', 'data-visualization', 'Tableau, Power BI, D3.js', '📊', id FROM public.categories WHERE slug = 'data-science';

-- Insert subcategories for Business
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Digital Marketing', 'digital-marketing', 'SEO, social media, content marketing', '📣', id FROM public.categories WHERE slug = 'business';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Entrepreneurship', 'entrepreneurship', 'Startup, business planning, funding', '🚀', id FROM public.categories WHERE slug = 'business';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Project Management', 'project-management', 'Agile, Scrum, leadership', '📋', id FROM public.categories WHERE slug = 'business';

-- Insert subcategories for Design
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'UX/UI Design', 'ux-ui-design', 'User experience, interface design, prototyping', '✨', id FROM public.categories WHERE slug = 'design';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Graphic Design', 'graphic-design', 'Adobe Creative Suite, branding, typography', '🖼️', id FROM public.categories WHERE slug = 'design';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Motion Graphics', 'motion-graphics', 'After Effects, animation, video editing', '🎬', id FROM public.categories WHERE slug = 'design';

-- Insert subcategories for Programming Languages
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Python', 'python', 'Python programming fundamentals and advanced topics', '🐍', id FROM public.categories WHERE slug = 'programming-languages';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'JavaScript', 'javascript', 'Modern JavaScript and ES6+', '⚡', id FROM public.categories WHERE slug = 'programming-languages';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Java', 'java', 'Java programming and frameworks', '☕', id FROM public.categories WHERE slug = 'programming-languages';

-- Insert subcategories for Cloud Computing
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'AWS', 'aws', 'Amazon Web Services, EC2, S3, Lambda', '🌩️', id FROM public.categories WHERE slug = 'cloud-computing';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'DevOps', 'devops', 'CI/CD, Docker, Kubernetes', '🔄', id FROM public.categories WHERE slug = 'cloud-computing';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Azure', 'azure', 'Microsoft Azure cloud platform', '☁️', id FROM public.categories WHERE slug = 'cloud-computing';

-- Insert subcategories for Personal Development
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Productivity', 'productivity', 'Time management, organization, efficiency', '⚡', id FROM public.categories WHERE slug = 'personal-development';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Leadership', 'leadership', 'Team management, communication, influence', '👥', id FROM public.categories WHERE slug = 'personal-development';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Career Development', 'career-development', 'Job search, interviews, networking', '🎯', id FROM public.categories WHERE slug = 'personal-development';
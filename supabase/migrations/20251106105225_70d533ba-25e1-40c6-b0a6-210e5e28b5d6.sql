-- First, delete all existing categories (this will cascade to subcategories)
DELETE FROM public.categories;

-- Insert the 10 main categories
INSERT INTO public.categories (name, slug, description, icon) VALUES
('Computer Science & IT', 'computer-science-it', 'Master programming, AI, cybersecurity, and cutting-edge technology', '💻'),
('Business & Management', 'business-management', 'Develop essential business skills from entrepreneurship to finance', '💼'),
('Design & Creativity', 'design-creativity', 'Unleash your creative potential with design and visual arts', '🎨'),
('Engineering & Technology', 'engineering-technology', 'Learn core engineering disciplines and technical skills', '⚙️'),
('Languages', 'languages', 'Master new languages and expand your global communication', '🌍'),
('Science & Mathematics', 'science-mathematics', 'Explore scientific principles and mathematical concepts', '🔬'),
('Soft Skills', 'soft-skills', 'Enhance your professional and personal effectiveness', '🤝'),
('Education & Teaching', 'education-teaching', 'Develop teaching expertise and educational strategies', '📚'),
('Personal Development', 'personal-development', 'Invest in yourself and unlock your potential', '🌟'),
('Lifestyle & Hobbies', 'lifestyle-hobbies', 'Explore interests and enrich your daily life', '🎯');

-- Insert subcategories for Computer Science & IT
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Programming Languages', 'programming-languages', 'Python, Java, JavaScript, C++, and more', '⌨️', id FROM public.categories WHERE slug = 'computer-science-it';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Web Development', 'web-development', 'Frontend, backend, and full-stack development', '🌐', id FROM public.categories WHERE slug = 'computer-science-it';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Artificial Intelligence', 'artificial-intelligence', 'Machine learning, neural networks, deep learning', '🤖', id FROM public.categories WHERE slug = 'computer-science-it';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Cybersecurity', 'cybersecurity', 'Network security, ethical hacking, data protection', '🔐', id FROM public.categories WHERE slug = 'computer-science-it';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Data Science', 'data-science', 'Data analysis, visualization, and big data', '📊', id FROM public.categories WHERE slug = 'computer-science-it';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Databases', 'databases', 'SQL, NoSQL, database design and management', '🗄️', id FROM public.categories WHERE slug = 'computer-science-it';

-- Insert subcategories for Business & Management
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Entrepreneurship', 'entrepreneurship', 'Startup creation, business planning, innovation', '🚀', id FROM public.categories WHERE slug = 'business-management';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Marketing', 'marketing', 'Digital marketing, branding, social media', '📣', id FROM public.categories WHERE slug = 'business-management';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Finance', 'finance', 'Financial management, accounting, investment', '💰', id FROM public.categories WHERE slug = 'business-management';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Project Management', 'project-management', 'Agile, Scrum, project planning and execution', '📋', id FROM public.categories WHERE slug = 'business-management';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Leadership', 'leadership', 'Team management, decision making, influence', '👔', id FROM public.categories WHERE slug = 'business-management';

-- Insert subcategories for Design & Creativity
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Graphic Design', 'graphic-design', 'Adobe Creative Suite, branding, visual design', '🖼️', id FROM public.categories WHERE slug = 'design-creativity';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'UI/UX Design', 'ui-ux-design', 'User interface, user experience, prototyping', '✨', id FROM public.categories WHERE slug = 'design-creativity';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Video Editing', 'video-editing', 'Video production, editing, motion graphics', '🎬', id FROM public.categories WHERE slug = 'design-creativity';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT '3D Modeling', '3d-modeling', 'Blender, Maya, 3D animation and rendering', '🎮', id FROM public.categories WHERE slug = 'design-creativity';

-- Insert subcategories for Engineering & Technology
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Electrical Engineering', 'electrical-engineering', 'Circuits, electronics, power systems', '⚡', id FROM public.categories WHERE slug = 'engineering-technology';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Mechanical Engineering', 'mechanical-engineering', 'Mechanics, thermodynamics, design', '🔧', id FROM public.categories WHERE slug = 'engineering-technology';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Civil Engineering', 'civil-engineering', 'Construction, infrastructure, structural design', '🏗️', id FROM public.categories WHERE slug = 'engineering-technology';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Robotics', 'robotics', 'Automation, robot design, control systems', '🤖', id FROM public.categories WHERE slug = 'engineering-technology';

-- Insert subcategories for Languages
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'English', 'english', 'English language learning and mastery', '🇬🇧', id FROM public.categories WHERE slug = 'languages';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Arabic', 'arabic', 'Arabic language learning and culture', '🇸🇦', id FROM public.categories WHERE slug = 'languages';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'French', 'french', 'French language learning and culture', '🇫🇷', id FROM public.categories WHERE slug = 'languages';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Chinese', 'chinese', 'Mandarin Chinese language learning', '🇨🇳', id FROM public.categories WHERE slug = 'languages';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Spanish', 'spanish', 'Spanish language learning and culture', '🇪🇸', id FROM public.categories WHERE slug = 'languages';

-- Insert subcategories for Science & Mathematics
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Physics', 'physics', 'Classical and modern physics principles', '⚛️', id FROM public.categories WHERE slug = 'science-mathematics';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Chemistry', 'chemistry', 'Organic, inorganic, and physical chemistry', '🧪', id FROM public.categories WHERE slug = 'science-mathematics';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Biology', 'biology', 'Life sciences, anatomy, genetics', '🧬', id FROM public.categories WHERE slug = 'science-mathematics';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Statistics', 'statistics', 'Statistical analysis and probability', '📈', id FROM public.categories WHERE slug = 'science-mathematics';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Calculus', 'calculus', 'Differential and integral calculus', '∫', id FROM public.categories WHERE slug = 'science-mathematics';

-- Insert subcategories for Soft Skills
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Communication', 'communication', 'Effective communication and presentation', '💬', id FROM public.categories WHERE slug = 'soft-skills';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Critical Thinking', 'critical-thinking', 'Analytical skills and logical reasoning', '🧠', id FROM public.categories WHERE slug = 'soft-skills';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Problem Solving', 'problem-solving', 'Creative solutions and decision making', '💡', id FROM public.categories WHERE slug = 'soft-skills';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Time Management', 'time-management', 'Productivity and organization skills', '⏰', id FROM public.categories WHERE slug = 'soft-skills';

-- Insert subcategories for Education & Teaching
INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Teaching Methods', 'teaching-methods', 'Pedagogy and instructional strategies', '👨‍🏫', id FROM public.categories WHERE slug = 'education-teaching';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Educational Technology', 'educational-technology', 'EdTech tools and digital learning', '💻', id FROM public.categories WHERE slug = 'education-teaching';

INSERT INTO public.categories (name, slug, description, icon, parent_id)
SELECT 'Online Learning Strategies', 'online-learning-strategies', 'Remote teaching and virtual classrooms', '🌐', id FROM public.categories WHERE slug = 'education-teaching';

-- Note: Personal Development is a main category with no subcategories specified
-- Note: Lifestyle & Hobbies is a main category with no subcategories specified
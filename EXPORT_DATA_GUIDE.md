# دليل تصدير واستيراد البيانات من Lovable Cloud إلى Supabase

## خطوات تصدير البيانات

### 1. تصدير الجداول

افتح لوحة تحكم Lovable Cloud واذهب إلى Database → Tables:

```sql
-- تصدير جدول الفئات
COPY (SELECT * FROM categories) TO '/tmp/categories.csv' WITH CSV HEADER;

-- تصدير جدول المستخدمين
COPY (SELECT * FROM profiles) TO '/tmp/profiles.csv' WITH CSV HEADER;

-- تصدير جدول الأدوار
COPY (SELECT * FROM user_roles) TO '/tmp/user_roles.csv' WITH CSV HEADER;

-- تصدير جدول الكورسات
COPY (SELECT * FROM courses) TO '/tmp/courses.csv' WITH CSV HEADER;

-- تصدير جدول الدروس
COPY (SELECT * FROM lessons) TO '/tmp/lessons.csv' WITH CSV HEADER;

-- تصدير جدول التسجيلات
COPY (SELECT * FROM enrollments) TO '/tmp/enrollments.csv' WITH CSV HEADER;

-- تصدير جدول المراجعات
COPY (SELECT * FROM reviews) TO '/tmp/reviews.csv' WITH CSV HEADER;

-- تصدير جدول الكويزات
COPY (SELECT * FROM quizzes) TO '/tmp/quizzes.csv' WITH CSV HEADER;

-- تصدير جدول أسئلة الكويزات
COPY (SELECT * FROM quiz_questions) TO '/tmp/quiz_questions.csv' WITH CSV HEADER;

-- تصدير جدول التقدم
COPY (SELECT * FROM lesson_progress) TO '/tmp/lesson_progress.csv' WITH CSV HEADER;

-- تصدير جدول المحادثات
COPY (SELECT * FROM conversations) TO '/tmp/conversations.csv' WITH CSV HEADER;

-- تصدير جدول المشاركين في المحادثات
COPY (SELECT * FROM conversation_participants) TO '/tmp/conversation_participants.csv' WITH CSV HEADER;

-- تصدير جدول الرسائل
COPY (SELECT * FROM messages) TO '/tmp/messages.csv' WITH CSV HEADER;

-- تصدير جدول الشكاوى
COPY (SELECT * FROM complaints) TO '/tmp/complaints.csv' WITH CSV PARAMETER;

-- تصدير قائمة الرغبات
COPY (SELECT * FROM wishlists) TO '/tmp/wishlists.csv' WITH CSV HEADER;

-- تصدير الإشعارات
COPY (SELECT * FROM notifications) TO '/tmp/notifications.csv' WITH CSV HEADER;
```

### 2. تصدير الـ Migrations

انسخ جميع الملفات من مجلد `supabase/migrations/` - هذه الملفات تحتوي على كل التغييرات في قاعدة البيانات.

### 3. تصدير Storage Buckets

في لوحة Lovable Cloud:
1. اذهب إلى Storage
2. لكل bucket (course-thumbnails, lesson-videos, lesson-pdfs, avatars):
   - حمل جميع الملفات
   - احتفظ بنفس بنية المجلدات

## خطوات الاستيراد في مشروع Supabase جديد

### الطريقة 1: استخدام SQL Editor في Supabase

```sql
-- 1. إنشاء الجداول (نفذ migrations بالترتيب)
-- 2. استيراد البيانات

-- مثال: استيراد الفئات
INSERT INTO categories (id, name, description, created_at)
VALUES
  ('uuid-here', 'Programming', 'Programming courses', '2024-01-01'),
  -- أضف بقية البيانات
;

-- كرر لكل جدول
```

### الطريقة 2: استخدام أدوات سطر الأوامر

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref your-project-ref

# رفع migrations
supabase db push

# استيراد البيانات من CSV
psql "postgresql://[connection-string]" -c "\COPY categories FROM 'categories.csv' CSV HEADER"
```

### الطريقة 3: باستخدام pgAdmin أو TablePlus

1. اتصل بقاعدة البيانات الجديدة
2. استورد ملفات SQL من migrations
3. استورد ملفات CSV لكل جدول

## إعادة إنشاء Storage Buckets

```sql
-- إنشاء buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('course-thumbnails', 'course-thumbnails', true),
  ('lesson-videos', 'lesson-videos', false),
  ('lesson-pdfs', 'lesson-pdfs', false),
  ('avatars', 'avatars', true);

-- إضافة RLS policies (انظر ملفات migration)
```

ثم ارفع الملفات يدوياً عبر لوحة Supabase Storage.

## نصائح مهمة

1. **احتفظ بنسخة احتياطية**: دائماً احتفظ بنسخة من البيانات قبل أي عملية
2. **اختبر على بيئة تجريبية**: جرب الاستيراد على مشروع تجريبي أولاً
3. **انتبه للـ UUIDs**: تأكد من أن العلاقات بين الجداول صحيحة
4. **ترتيب الاستيراد**: استورد الجداول بالترتيب الصحيح:
   - profiles, user_roles
   - categories
   - courses
   - lessons
   - enrollments
   - reviews
   - quizzes, quiz_questions
   - conversations, messages
   - wishlists, notifications

## طريقة أسرع: استخدام pg_dump

```bash
# من المشروع الحالي
pg_dump "postgresql://[current-connection]" > backup.sql

# إلى المشروع الجديد
psql "postgresql://[new-connection]" < backup.sql
```

## الحصول على Connection String

في Lovable Cloud:
1. اذهب إلى Settings → Database
2. انسخ Connection String (يبدأ بـ postgresql://)

في Supabase:
1. Project Settings → Database
2. انسخ Connection string

---

**ملاحظة**: تذكر أن Auth users (المستخدمين) لن يتم نقلهم - ستحتاج لإعادة إنشائهم أو نقلهم يدوياً.

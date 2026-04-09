-- 迁移到自定义用户名密码认证系统
-- 执行前请备份数据！

-- 1. 修改 profiles 表结构
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. 添加新字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;

-- 3. 删除旧数据（如果有的话，因为没有用户名和密码）
DELETE FROM profiles WHERE username IS NULL OR password_hash IS NULL;

-- 4. 添加约束
ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN password_hash SET NOT NULL;

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 6. 删除旧的触发器和函数（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 完成！现在可以使用用户名密码注册登录了

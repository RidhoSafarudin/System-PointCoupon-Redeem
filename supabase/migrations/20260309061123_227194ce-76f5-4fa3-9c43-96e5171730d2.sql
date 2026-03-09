
-- Create app_role enum first
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  points_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  points_value INTEGER NOT NULL,
  expiration_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used')),
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view coupons" ON public.coupons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update active coupons to redeem" ON public.coupons FOR UPDATE TO authenticated USING (status = 'active') WITH CHECK (redeemed_by = auth.uid());
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Rewards table
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  points_required INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view rewards" ON public.rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert rewards" ON public.rewards FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update rewards" ON public.rewards FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete rewards" ON public.rewards FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Reward redemptions table
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id),
  points_spent INTEGER NOT NULL,
  reward_name TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reward redemptions" ON public.reward_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reward redemptions" ON public.reward_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all reward redemptions" ON public.reward_redemptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Coupon redemptions history
CREATE TABLE public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  coupon_code TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own coupon redemptions" ON public.coupon_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coupon redemptions" ON public.coupon_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all coupon redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic coupon redemption function
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_coupon_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  SELECT * INTO v_coupon FROM public.coupons WHERE code = p_coupon_code AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or already used coupon code');
  END IF;
  IF v_coupon.expiration_date < now() THEN
    RETURN json_build_object('success', false, 'error', 'Coupon has expired');
  END IF;
  UPDATE public.coupons SET status = 'used', redeemed_by = v_user_id, redeemed_at = now() WHERE id = v_coupon.id;
  UPDATE public.profiles SET points_balance = points_balance + v_coupon.points_value WHERE id = v_user_id;
  INSERT INTO public.coupon_redemptions (user_id, coupon_id, coupon_code, points_earned) VALUES (v_user_id, v_coupon.id, v_coupon.code, v_coupon.points_value);
  RETURN json_build_object('success', true, 'points_earned', v_coupon.points_value);
END;
$$;

-- Atomic reward redemption function
CREATE OR REPLACE FUNCTION public.redeem_reward(p_reward_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward RECORD;
  v_user RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  SELECT * INTO v_reward FROM public.rewards WHERE id = p_reward_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reward not found');
  END IF;
  IF v_reward.stock <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Reward is out of stock');
  END IF;
  SELECT * INTO v_user FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF v_user.points_balance < v_reward.points_required THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient points');
  END IF;
  UPDATE public.profiles SET points_balance = points_balance - v_reward.points_required WHERE id = v_user_id;
  UPDATE public.rewards SET stock = stock - 1 WHERE id = p_reward_id;
  INSERT INTO public.reward_redemptions (user_id, reward_id, points_spent, reward_name) VALUES (v_user_id, p_reward_id, v_reward.points_required, v_reward.name);
  RETURN json_build_object('success', true, 'points_spent', v_reward.points_required);
END;
$$;

-- Storage bucket for reward images
INSERT INTO storage.buckets (id, name, public) VALUES ('reward-images', 'reward-images', true);
CREATE POLICY "Anyone can view reward images" ON storage.objects FOR SELECT USING (bucket_id = 'reward-images');
CREATE POLICY "Authenticated can upload reward images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reward-images');
CREATE POLICY "Authenticated can update reward images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'reward-images');
CREATE POLICY "Authenticated can delete reward images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'reward-images');

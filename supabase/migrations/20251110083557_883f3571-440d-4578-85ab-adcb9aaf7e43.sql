-- Create wishlist table
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Create policies for wishlist
CREATE POLICY "Users can view their own wishlist" 
ON public.wishlist 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wishlist" 
ON public.wishlist 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wishlist" 
ON public.wishlist 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add more product details columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT ARRAY['Black', 'White', 'Blue'],
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT ARRAY['High Quality', 'Durable', 'Stylish'],
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
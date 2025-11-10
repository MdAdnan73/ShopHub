import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, ArrowLeft, Heart, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { Badge } from '@/components/ui/badge';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: isInWishlist } = useQuery({
    queryKey: ['wishlist-status', id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-status'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist!');
    },
  });

  const checkDelivery = () => {
    if (pincode.length === 6) {
      const deliveryDays = Math.floor(Math.random() * 5) + 3;
      const date = new Date();
      date.setDate(date.getDate() + deliveryDays);
      setDeliveryDate(date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      }));
    } else {
      toast.error('Please enter a valid 6-digit pincode');
    }
  };

  const addToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .upsert(
          { user_id: user.id, product_id: id, quantity: 1 },
          { onConflict: 'user_id,product_id', ignoreDuplicates: false }
        );

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      queryClient.invalidateQueries({ queryKey: ['cart-items'] });
      toast.success('Added to cart!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-lg mb-8" />
            <div className="h-8 bg-muted rounded w-1/2 mb-4" />
            <div className="h-4 bg-muted rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col space-y-6">
            <div>
              <p className="text-muted-foreground mb-2">{product.category}</p>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.reviews_count || 0} reviews)
                </span>
              </div>
              <p className="text-3xl font-bold text-primary mb-4">
                ${product.price.toFixed(2)}
              </p>
            </div>
            
            <p className="text-muted-foreground leading-relaxed">
              {product.description || 'High-quality product crafted with precision and care. Perfect for your needs with excellent durability and performance.'}
            </p>

            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Key Features:</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {product.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <Label className="mb-2">Select Size</Label>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => (
                    <Badge
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div>
                <Label className="mb-2">Select Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((color) => (
                    <Badge
                      key={color}
                      variant={selectedColor === color ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border rounded-lg p-4">
              <Label className="mb-2">Check Delivery</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Enter Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                />
                <Button variant="outline" onClick={checkDelivery}>
                  Check
                </Button>
              </div>
              {deliveryDate && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Delivery by {deliveryDate}
                </p>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              Stock: <span className="font-semibold">{product.stock} available</span>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={addToCart}
                size="lg"
                className="flex-1"
                disabled={product.stock === 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (!user) {
                    toast.error('Please sign in');
                    navigate('/auth');
                    return;
                  }
                  toggleWishlist.mutate();
                }}
              >
                <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

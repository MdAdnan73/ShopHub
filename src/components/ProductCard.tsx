import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
}

export const ProductCard = ({ id, name, price, imageUrl, category }: ProductCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to add items to cart');
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

  return (
    <Link to={`/product/${id}`}>
      <Card className="overflow-hidden hover:shadow-[var(--shadow-hover)] transition-[var(--transition-smooth)] group">
        <CardContent className="p-0">
          <div className="aspect-square overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover group-hover:scale-105 transition-[var(--transition-smooth)]"
            />
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-1">{category}</p>
            <h3 className="font-semibold text-lg mb-2">{name}</h3>
            <p className="text-2xl font-bold text-primary">${price.toFixed(2)}</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={addToCart}
            className="w-full"
            variant="default"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

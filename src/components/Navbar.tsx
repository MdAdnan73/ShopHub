import { Link } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const Navbar = () => {
  const { user, signOut } = useAuth();

  const { data: cartItems } = useQuery({
    queryKey: ['cart-count', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const cartCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            ShopHub
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground"
                      >
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="default">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

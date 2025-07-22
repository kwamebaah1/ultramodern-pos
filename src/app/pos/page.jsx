'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiPrinter, FiCreditCard, FiUser, FiDollarSign } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { AdvancedImage } from '@cloudinary/react';
import { getCloudinaryImage } from '@/lib/cloudinary';
import CustomerSelect from '@/components/customers/CustomerSelect';
import CustomerFormModal from '@/components/customers/CustomerFormModal.';
import toast from 'react-hot-toast';

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const router = useRouter();

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {const {
      data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('User not found:', userError);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !profile?.store_id) {
        console.error('Failed to fetch store_id:', profileError);
        return;
      }

      const storeId = profile.store_id;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!error) {
        setProducts(data);
        setFilteredProducts(data);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Calculate cart totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  // Cart functions
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleCreateCustomer = (searchTerm) => {
    setCustomerSearchTerm(searchTerm);
    setShowCustomerModal(true);
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomer(newCustomer);
    setShowCustomerModal(false);
  };

  // Checkout function with loyalty points update
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Calculate loyalty points (1 point per $10 spent)
    const pointsEarned = Math.floor(total / 10);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) throw userError;

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('store_id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !profile?.store_id) throw profileError;

      const storeId = profile.store_id;
      // Update customer loyalty points if applicable
      if (customer?.id) {
        await supabase
          .from('customers')
          .update({ loyalty_points: customer.loyalty_points + pointsEarned })
          .eq('id', customer.id);
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customer?.id || null,
          subtotal: subtotal,
          tax_amount: tax,
          total: total,
          payment_method: paymentMethod,
          status: 'completed',
          loyalty_points_earned: pointsEarned,
          store_id: storeId,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product stock quantities
      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock_quantity: item.stock_quantity - item.quantity })
          .eq('id', item.id);
      }

      setCart([]);
      toast.success('Order placed successfully!');
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('There was an error processing your order. Please try again.');
    }
  };

  return (
    <div className="flex h-full">
      {showCustomerModal && (
        <CustomerFormModal
          initialSearch={customerSearchTerm}
          onSuccess={handleCustomerCreated}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {/* Product Selection Panel */}
      <div className="w-2/3 p-4 flex flex-col">
        <div className="mb-4">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<FiSearch className="text-gray-400" />}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 overflow-y-auto">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={() => addToCart(product)}
            />
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Current Order</h2>
          <div className="mt-3">
            <CustomerSelect
              selectedCustomer={customer}
              onSelect={setCustomer}
              onCreateNew={handleCreateCustomer}
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="flex items-center gap-2"
              >
                <FiDollarSign /> Cash
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="flex items-center gap-2"
              >
                <FiCreditCard /> Card
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Your cart is empty
            </div>
          ) : (
            <ul className="space-y-2">
              {cart.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onRemove={() => removeFromCart(item.id)}
                  onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (10%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {customer?.loyalty_points !== undefined && (
              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                <span>Loyalty Points:</span>
                <span>{customer.loyalty_points} (+{Math.floor(total / 10)})</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
            >
              Clear
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onAdd }) {
    const productImage = product.image_public_id 
      ? getCloudinaryImage(product.image_public_id, [
          'c_fill', 'w_300', 'h_300', 'q_auto'
        ])
      : null;
  
    return (
      <div 
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-64"
        onClick={onAdd}
      >
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-1 max-h-[160px]">
          {productImage ? (
            <AdvancedImage 
              cldImg={productImage}
              className="object-cover w-full h-full"
              alt={product.name}
            />
          ) : (
            <div className="text-gray-400">No Image</div>
          )}
        </div>
        <div className="p-3 flex flex-col">
          <h3 className="font-medium truncate">{product.name}</h3>
          <p className="text-gray-500 text-sm truncate mb-2">{product.description}</p>
          <div className="flex justify-between items-center mt-auto">
            <span className="font-bold">${product.price.toFixed(2)}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              product.stock_quantity > 5 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {product.stock_quantity} in stock
            </span>
          </div>
        </div>
      </div>
    );
}

// Cart Item Component
function CartItem({ item, onRemove, onQuantityChange }) {
  return (
    <li className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-700">
      <div className="flex-1">
        <h4 className="font-medium">{item.name}</h4>
        <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => onQuantityChange(item.quantity - 1)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiMinus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center">{item.quantity}</span>
        <button 
          onClick={() => onQuantityChange(item.quantity + 1)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiPlus className="h-4 w-4" />
        </button>
      </div>
      <div className="ml-4 font-medium">
        ${(item.price * item.quantity).toFixed(2)}
      </div>
      <button 
        onClick={onRemove}
        className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
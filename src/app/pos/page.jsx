'use client';

import { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiCreditCard, FiDollarSign, FiShoppingCart, FiX } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { AdvancedImage } from '@cloudinary/react';
import { getCloudinaryImage } from '@/lib/cloudinary';
import CustomerSelect from '@/components/customers/CustomerSelect';
import CustomerFormModal from '@/components/customers/CustomerFormModal.';
import { CURRENCIES } from '@/components/currencies/Currency';
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
  const [currency, setCurrency] = useState({ symbol: 'GH₵' });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [taxRate, setTaxRate] = useState(10);
  const [storeId, setStoreId] = useState(null);
  const router = useRouter();

  // Fetch store settings including tax rate and currency
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const {
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
        setStoreId(storeId);

        // Fetch store settings including tax rate
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('currency, tax_rate')
          .eq('id', storeId)
          .single();

        if (!storeError && storeData) {
          // Set tax rate (default to 0 if not set)
          const storeTaxRate = storeData.tax_rate || 0;
          setTaxRate(storeTaxRate);
          
          // Set currency
          const currentCurrency = CURRENCIES.find(c => c.code === (storeData?.currency || 'GHS'));
          setCurrency(currentCurrency || CURRENCIES.find(c => c.code === 'GHS'));
          
          // Fetch products after we have store settings
          fetchProducts(storeId);
        }
      } catch (error) {
        console.error('Error fetching store settings:', error);
        // Fallback values
        setTaxRate(10);
        setCurrency(CURRENCIES.find(c => c.code === 'GHS'));
      }
    };

    fetchStoreSettings();
  }, []);

  // Fetch products
  const fetchProducts = async (storeId) => {
    try {
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
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

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

  // Calculate cart totals with dynamic tax
  const calculateTax = (amount) => {
    if (!taxRate || taxRate <= 0) return 0;
    return (amount * taxRate) / 100;
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = calculateTax(subtotal);
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
    
    // On mobile, show cart after adding an item
    if (window.innerWidth < 768) {
      setIsCartOpen(true);
    }
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
      setIsCartOpen(false);
      toast.success('Order placed successfully!');
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('There was an error processing your order. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return `${currency.symbol}${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Cart badge for mobile
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col md:flex-row h-full relative">
      {showCustomerModal && (
        <CustomerFormModal
          initialSearch={customerSearchTerm}
          onSuccess={handleCustomerCreated}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {/* Mobile Cart Toggle Button */}
      <div className="md:hidden fixed bottom-4 right-4 z-30">
        <Button
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="rounded-full p-4 h-14 w-14 shadow-lg relative bg-blue-600 hover:bg-blue-700"
        >
          <FiShoppingCart className="h-6 w-6 text-white" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">
              {cartItemCount}
            </span>
          )}
        </Button>
      </div>

      {/* Product Selection Panel */}
      <div className={`w-full md:w-2/3 p-4 flex flex-col ${isCartOpen ? 'hidden md:flex' : 'flex'}`}>
        {/* Tax Rate Indicator */}
        <div className="mb-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800">
            {taxRate > 0 ? (
              <span>Current Tax Rate: {taxRate}%</span>
            ) : (
              <span>Tax: Disabled</span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<FiSearch className="text-gray-400" />}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 flex-1 overflow-y-auto">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              currencySymbol={currency.symbol}
              onAdd={() => addToCart(product)}
            />
          ))}
        </div>
      </div>

      {/* Cart Panel */}
      <div className={`w-full md:w-1/3 border-l border-gray-200 dark:border-gray-700 flex flex-col fixed md:relative inset-0 md:inset-auto bg-white dark:bg-gray-900 z-20 md:z-auto transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        {/* Mobile close button */}
        <div className="md:hidden flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Current Order</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 md:mt-0">
          <div className="hidden md:block">
            <h2 className="text-xl font-bold">Current Order</h2>
          </div>
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
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <FiDollarSign /> Cash
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="flex items-center gap-2 text-xs sm:text-sm"
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
                  currencySymbol={currency.symbol}
                  onRemove={() => removeFromCart(item.id)}
                  onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {/* Dynamic Tax Display */}
            <div className="flex justify-between">
              <span>Tax {taxRate > 0 ? `(${taxRate}%)` : ''}:</span>
              <span>
                {formatCurrency(tax)}
                {taxRate === 0 && ' (Disabled)'}
              </span>
            </div>
            
            {customer?.loyalty_points !== undefined && (
              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                <span>Loyalty Points:</span>
                <span>{customer.loyalty_points} (+{Math.floor(total / 10)})</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>

            {/* Tax Configuration Note */}
            {taxRate > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <p>Tax rate configured in Store Settings: {taxRate}%</p>
                <p className="mt-1">
                  <a 
                    href="/settings" 
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Change tax settings
                  </a>
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setCart([])}
              disabled={cart.length === 0}
              className="text-xs sm:text-sm"
            >
              Clear
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
            >
              Checkout
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile cart */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsCartOpen(false)}
        />
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({ product, currencySymbol, onAdd }) {
    const productImage = product.image_public_id 
      ? getCloudinaryImage(product.image_public_id, [
          'c_fill', 'w_300', 'h_300', 'q_auto'
        ])
      : null;
  
    return (
      <div 
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-48 sm:h-56 md:h-64"
        onClick={onAdd}
      >
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-1 max-h-[120px] sm:max-h-[140px] md:max-h-[160px]">
          {productImage ? (
            <AdvancedImage 
              cldImg={productImage}
              className="object-cover w-full h-full"
              alt={product.name}
            />
          ) : (
            <div className="text-gray-400 text-xs sm:text-sm">No Image</div>
          )}
        </div>
        <div className="p-2 sm:p-3 flex flex-col">
          <h3 className="font-medium truncate text-sm sm:text-base">{product.name}</h3>
          <p className="text-gray-500 text-xs sm:text-sm truncate mb-1 sm:mb-2">{product.description}</p>
          <div className="flex justify-between items-center mt-auto">
            <span className="font-bold text-sm sm:text-base">{currencySymbol}{product.price.toFixed(2)}</span>
            <span className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${
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
function CartItem({ item, currencySymbol, onRemove, onQuantityChange }) {
  return (
    <li className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-700">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate text-sm sm:text-base">{item.name}</h4>
        <p className="text-sm text-gray-500">{currencySymbol}{item.price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center space-x-2 ml-2">
        <button 
          onClick={() => onQuantityChange(item.quantity - 1)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiMinus className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
        <span className="w-6 text-center text-sm sm:text-base">{item.quantity}</span>
        <button 
          onClick={() => onQuantityChange(item.quantity + 1)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiPlus className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      </div>
      <div className="ml-2 font-medium text-sm sm:text-base whitespace-nowrap">
        {currencySymbol}{(item.price * item.quantity).toFixed(2)}
      </div>
      <button 
        onClick={onRemove}
        className="ml-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
      >
        <FiTrash2 className="h-3 w-3 sm:h-4 sm:w-4" />
      </button>
    </li>
  );
}
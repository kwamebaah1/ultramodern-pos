'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiDownload, FiUpload } from 'react-icons/fi';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { ProductForm } from '@/components/products/ProductForm';
import toast from 'react-hot-toast';
import { exportToCSV } from '@/lib/utils';
import { CURRENCIES } from '@/components/currencies/Currency';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currency, setCurrency] = useState({ symbol: 'GH₵' });
  const [storeId, setStoreId] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('store_id')
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userProfile?.store_id) {
      console.error('Store ID not found');
      return;
    }

    const storeId = userProfile.store_id;
    setStoreId(storeId);

    const { data: storeData } = await supabase
      .from('stores')
      .select('currency')
      .eq('id', storeId)
      .single();
            
    const currentCurrency = CURRENCIES.find(c => c.code === (storeData?.currency || 'GHS'));
    setCurrency(currentCurrency || CURRENCIES.find(c => c.code === 'GHS'));

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', userProfile.store_id)
      .order('name', { ascending: true });

    if (!error) {
      setProducts(data);
      setFilteredProducts(data);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    const uniqueCategories = [...new Set(data.map(item => item.category))];
    setCategories(uniqueCategories);
  };

  // Filter products
  useEffect(() => {
    let filtered = products;
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  // CRUD Operations
  const handleCreate = async (productData) => {
    const { error } = await supabase.from('products').insert({
      ...productData,
      store_id: storeId,
    });
    if (error) {
      toast.error('Error');
    } else {
      toast.success('Success, Product created successfully' );
      fetchProducts();
      setIsFormOpen(false);
    }
  };

  const handleUpdate = async (id, productData) => {
    const { error } = await supabase.from('products').update({ ...productData, store_id: storeId }).eq('id', id);
    if (error) {
      toast.error('Error');
    } else {
      toast.success('Success, Product updated successfully');
      fetchProducts();
      setIsFormOpen(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Error');
    } else {
      toast.success('Success, Product deleted successfully');
      fetchProducts();
    }
  };

  const handleImport = async (file) => {
    // Implement CSV import logic
  };

  const columns = [
    {
      accessorKey: 'image_url',
      header: '',
      cell: ({ row }) => (
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden">
          <img 
            src={row.original.image_url || '/shopping cart.jpg'} 
            alt={row.original.name}
            className="object-cover w-full h-full"
          />
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm sm:text-base">{row.original.name}</div>
          <div className="text-xs sm:text-sm text-gray-500">{row.original.sku}</div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="">{row.original.category}</span>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <span className="font-medium">
          {currency.symbol}{row.original.price.toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: 'stock_quantity',
      header: 'Stock',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.original.stock_quantity > row.original.min_stock_level
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {row.original.stock_quantity}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex space-x-1 sm:space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              setCurrentProduct(row.original);
              setIsFormOpen(true);
            }}
          >
            <FiEdit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleDelete(row.original.id)}
          >
            <FiTrash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Products Management</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => exportToCSV(filteredProducts, 'products')} size="sm" className="text-xs sm:text-sm">
            <FiDownload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <FiUpload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button onClick={() => {
            setCurrentProduct(null);
            setIsFormOpen(true);
          }} size="sm" className="text-xs sm:text-sm">
            <FiPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<FiSearch className="text-gray-400" />}
          className="w-full"
        />
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-500 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-background border rounded-md px-3 py-2 text-sm focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredProducts}
          emptyMessage="No products found"
        />
      </div>

      <ProductForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        product={currentProduct}
        onSubmit={currentProduct ? handleUpdate : handleCreate}
        storeId={storeId}
        categories={categories}
      />
    </div>
  );
}
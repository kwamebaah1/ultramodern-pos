'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { ImageUpload } from '@/components/ImageUpload';
import { useToast } from '@/components/ui/Toast';
import { FiInfo } from 'react-icons/fi';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  cost: z.number().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  stock_quantity: z.number().min(0, 'Stock cannot be negative'),
  min_stock_level: z.number().min(0, 'Minimum stock level cannot be negative'),
  image_url: z.string().optional(),
  image_public_id: z.string().optional(),
  is_active: z.boolean().default(true),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
});

export function ProductForm({ open, onOpenChange, product, onSubmit }) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [entryMode, setEntryMode] = useState('single'); // 'single' or 'bulk'
  const [bulkFields, setBulkFields] = useState({
    numBoxes: 1,
    unitsPerBox: 1,
    costPerBox: 0,
    marginPercent: 30,
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      name: '',
      description: '',
      price: 0,
      cost: 0,
      stock_quantity: 0,
      min_stock_level: 5,
      is_active: true,
      batch_number: '',
      expiry_date: '',
    },
  });

  const generateSku = (name) => {
    if (!name) return '';
    const prefix = name.trim().substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
  };

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        price: product.price,
        cost: product.cost || 0,
        sku: product.sku || '',
        barcode: product.barcode || '',
        category: product.category || '',
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level || 5,
        image_url: product.image_url || '',
        image_public_id: product.image_public_id || '',
        is_active: product.is_active !== false,
        batch_number: product.batch_number || '',
        expiry_date: product.expiry_date || '',
      });
      setEntryMode('single');
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        cost: 0,
        stock_quantity: 0,
        min_stock_level: 5,
        is_active: true,
        batch_number: '',
        expiry_date: '',
      });
      setEntryMode('single');
    }
    setBulkFields({
      numBoxes: 1,
      unitsPerBox: 1,
      costPerBox: 0,
      marginPercent: 30,
    });
  }, [product, reset]);

  const productName = watch('name');
  const currentSku = watch('sku');

  useEffect(() => {
    if (productName && !currentSku) {
      setValue('sku', generateSku(productName));
    }
  }, [productName, currentSku, setValue]);

  const handleImageUpload = (publicId) => {
    setValue('image_public_id', publicId);
    setValue('image_url', `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`);
  };

  // Calculate bulk fields when any bulk value changes
  const calculateFromBulk = () => {
    const { numBoxes, unitsPerBox, costPerBox, marginPercent } = bulkFields;
    const totalStock = numBoxes * unitsPerBox;
    const costPerUnit = costPerBox / unitsPerBox;
    const sellingPrice = costPerUnit * (1 + marginPercent / 100);

    setValue('stock_quantity', totalStock);
    setValue('cost', Math.round(costPerUnit * 100) / 100);
    setValue('price', Math.round(sellingPrice * 100) / 100);
  };

  useEffect(() => {
    if (entryMode === 'bulk') {
      calculateFromBulk();
    }
  }, [bulkFields, entryMode]);

  const handleBulkFieldChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setBulkFields(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const onFormSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (product) {
        await onSubmit(product.id, data);
      } else {
        await onSubmit(data);
      }
      reset();
    } catch (error) {
      showToast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar-desktop">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Entry Mode Toggle */}
        {!product && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4 mb-4">
            <div className="flex items-start space-x-3">
              <FiInfo className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">How are you adding this product?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEntryMode('single')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      entryMode === 'single'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Individual Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('bulk')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      entryMode === 'bulk'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Box/Bulk Purchase
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="text-sm md:text-base">Product Name*</Label>
              <Input
                id="name"
                {...register('name')}
                error={errors.name?.message}
                className="text-sm md:text-base"
              />
            </div>

            {/* Bulk Mode Section */}
            {entryMode === 'bulk' && (
              <div className="md:col-span-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 md:p-4 space-y-3">
                <h3 className="font-medium text-amber-900 dark:text-amber-100">Bulk Purchase Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="numBoxes" className="text-sm">Number of Boxes</Label>
                    <Input
                      id="numBoxes"
                      type="number"
                      min="1"
                      step="1"
                      value={bulkFields.numBoxes}
                      onChange={(e) => handleBulkFieldChange('numBoxes', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitsPerBox" className="text-sm">Units Per Box</Label>
                    <Input
                      id="unitsPerBox"
                      type="number"
                      min="1"
                      step="1"
                      value={bulkFields.unitsPerBox}
                      onChange={(e) => handleBulkFieldChange('unitsPerBox', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPerBox" className="text-sm">Cost Per Box</Label>
                    <Input
                      id="costPerBox"
                      type="number"
                      min="0"
                      step="0.01"
                      value={bulkFields.costPerBox}
                      onChange={(e) => handleBulkFieldChange('costPerBox', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marginPercent" className="text-sm">Profit Margin %</Label>
                    <Input
                      id="marginPercent"
                      type="number"
                      min="0"
                      step="0.1"
                      value={bulkFields.marginPercent}
                      onChange={(e) => handleBulkFieldChange('marginPercent', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Bulk Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded p-2 md:p-3 space-y-2 mt-3">
                  <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Calculated Values:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Stock:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{bulkFields.numBoxes * bulkFields.unitsPerBox} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cost/Unit:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{(bulkFields.costPerBox / bulkFields.unitsPerBox).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Selling Price/Unit:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{(bulkFields.costPerBox / bulkFields.unitsPerBox * (1 + bulkFields.marginPercent / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Profit:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{((bulkFields.costPerBox / bulkFields.unitsPerBox * (1 + bulkFields.marginPercent / 100)) * bulkFields.numBoxes * bulkFields.unitsPerBox - bulkFields.costPerBox * bulkFields.numBoxes).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Batch and Expiry Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200 dark:border-amber-800">
                  <div className="space-y-2">
                    <Label htmlFor="batch_number" className="text-sm">Batch Number</Label>
                    <Input
                      id="batch_number"
                      {...register('batch_number')}
                      placeholder="e.g., BATCH-001"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date" className="text-sm">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      {...register('expiry_date')}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Single Mode Section */}
            {entryMode === 'single' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm md:text-base">Price*</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { valueAsNumber: true })}
                    error={errors.price?.message}
                    className="text-sm md:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-sm md:text-base">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('cost', { valueAsNumber: true })}
                    error={errors.cost?.message}
                    className="text-sm md:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_quantity" className="text-sm md:text-base">Stock Quantity*</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    {...register('stock_quantity', { valueAsNumber: true })}
                    error={errors.stock_quantity?.message}
                    className="text-sm md:text-base"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="min_stock_level" className="text-sm md:text-base">Minimum Stock Level</Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                {...register('min_stock_level', { valueAsNumber: true })}
                error={errors.min_stock_level?.message}
                className="text-sm md:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm md:text-base">SKU (Product Code)</Label>
              <Input
                id="sku"
                {...register('sku')}
                error={errors.sku?.message}
                className="text-sm md:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode" className="text-sm md:text-base">Barcode</Label>
              <Input
                id="barcode"
                {...register('barcode')}
                error={errors.barcode?.message}
                className="text-sm md:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm md:text-base">Category</Label>
              <Input
                id="category"
                {...register('category')}
                error={errors.category?.message}
                className="text-sm md:text-base"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-sm md:text-base">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                error={errors.description?.message}
                rows={3}
                className="text-sm md:text-base min-h-[80px]"
              />
            </div>

            <div className="flex items-center space-x-2 md:col-span-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="is_active" className="text-sm md:text-base">Active Product</Label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="w-full sm:w-auto text-sm md:text-base"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={isLoading}
              className="w-full sm:w-auto text-sm md:text-base"
            >
              {product ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
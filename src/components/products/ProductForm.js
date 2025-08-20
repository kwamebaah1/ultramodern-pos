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
});

export function ProductForm({ open, onOpenChange, product, onSubmit }) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
    },
  });

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
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        cost: 0,
        stock_quantity: 0,
        min_stock_level: 5,
        is_active: true,
      });
    }
  }, [product, reset]);

  const handleImageUpload = (publicId) => {
    setValue('image_public_id', publicId);
    setValue('image_url', `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>
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

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm md:text-base">Product Image</Label>
              <div className="border rounded-lg p-3 md:p-4">
                <ImageUpload 
                  onUpload={handleImageUpload}
                  currentImage={watch('image_url')}
                />
              </div>
              {errors.image_public_id?.message && (
                <p className="text-sm text-red-500">{errors.image_public_id.message}</p>
              )}
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
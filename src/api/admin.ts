import apiClient from './client';
import { ENV } from '@/config/env';
import type { Product, Order, OrderStatus } from '@/types';
import { storage } from './storage';

export const adminApi = {
  getAllProducts: async (): Promise<Product[]> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return storage.getProducts();
    }
    const response = await apiClient.get('/admin/products');
    return response.data;
  },

  createProduct: async (productData: Omit<Product, 'id'>): Promise<Product> => {
      if (ENV.ENABLE_MOCK_API) {
          await new Promise(resolve => setTimeout(resolve, 800));
          const products = storage.getProducts();
          const newProduct: Product = {
              ...productData,
              id: `prd-${Date.now()}`
          };
          storage.setProducts([newProduct, ...products]);
          return newProduct;
      }
      const response = await apiClient.post('/admin/products', productData);
      return response.data;
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    if (ENV.ENABLE_MOCK_API) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const products = storage.getProducts();
        const index = products.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Product not found');
        
        products[index] = { ...products[index], ...productData };
        storage.setProducts(products);
        return products[index];
    }
    const response = await apiClient.put(`/admin/products/${id}`, productData);
    return response.data;
  },
  
  deleteProduct: async (id: string): Promise<void> => {
      if (ENV.ENABLE_MOCK_API) {
          await new Promise(resolve => setTimeout(resolve, 800));
          let products = storage.getProducts();
          products = products.filter(p => p.id !== id);
          storage.setProducts(products);
          return;
      }
      await apiClient.delete(`/admin/products/${id}`);
  },

  getAllOrders: async (): Promise<Order[]> => {
    if (ENV.ENABLE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return storage.getOrders();
    }
    const response = await apiClient.get('/admin/orders');
    return response.data;
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    if (ENV.ENABLE_MOCK_API) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const orders = storage.getOrders();
        const index = orders.findIndex(o => o.id === id);
        if (index === -1) throw new Error('Order not found');
        
        orders[index].status = status;
        storage.setOrders(orders);
        return orders[index];
    }
    const response = await apiClient.patch(`/admin/orders/${id}/status`, { status });
    return response.data;
  }
};

import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import NotFound from '../NotFound';
import StorePage from './StorePage';

const CheckoutPage = lazy(() => import('./CheckoutPage'));
const OrderPage = lazy(() => import('./OrderPage'));
const FindOrder = lazy(() => import('./FindOrder'));

// The bookstore's pages, relative to wherever the store is mounted (shop.naol.me or /store).
const ShopApp = () => (
  <Suspense fallback={null}>
    <Routes>
      <Route index element={<StorePage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="order/:id" element={<OrderPage />} />
      <Route path="orders" element={<FindOrder />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default ShopApp;

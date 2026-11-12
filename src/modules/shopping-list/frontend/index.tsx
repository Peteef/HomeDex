import { Route, Routes } from 'react-router';
import { ListPage } from './pages/list/ListPage.tsx';

const ShoppingList = () => (
  <Routes>
    <Route index element={<ListPage />} />
  </Routes>
);

export default ShoppingList;

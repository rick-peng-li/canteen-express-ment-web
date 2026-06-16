import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import HomePage from './pages/HomePage';
import OrderCreatePage from './pages/OrderCreatePage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OperationsPage from './pages/OperationsPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/orders/new" element={<OrderCreatePage />} />
          <Route path="/orders/tracking" element={<OrderTrackingPage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

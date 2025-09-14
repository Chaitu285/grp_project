import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Business from "./pages/Business";
import Customer from "./pages/Customer";
import PolicyManagement from "./pages/PolicyManagement";
import ShowUsers from "./pages/ShowUsers";
import TransHistory from "./pages/TransHistory";
import TierManagement from "./pages/TierManagement";
import PointsExpiry from "./pages/PointsExpiry";
import Analytics from "./pages/Analytics";
import AdminLogin from "./pages/AdminLogin";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerTransactions from "./pages/CustomerTransactions";
import CustomerPoints from "./pages/CustomerPoints";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerSpinWheel from "./pages/CustomerSpinWheel"; // Added import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ Dashboard accessible from both "/" and "/dashboard" */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* ✅ Login Routes */}
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/login/customer" element={<CustomerLogin />} />

        {/* ✅ Business/Admin Routes */}
        <Route path="/business" element={<Business />} />
        <Route path="/business/policy" element={<PolicyManagement />} />
        <Route path="/business/users" element={<ShowUsers />} />
        <Route path="/business/users/:customerId" element={<TransHistory />} />
        <Route path="/business/tiers" element={<TierManagement />} />
        <Route path="/business/analytics" element={<Analytics />} />
        <Route path="/business/points-expiry" element={<PointsExpiry />} />

        {/* ✅ Customer Routes */}
        <Route path="/customer" element={<Customer />} />
        <Route path="/customer/transactions" element={<CustomerTransactions />} />
        <Route path="/customer/points" element={<CustomerPoints />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/spin-wheel" element={<CustomerSpinWheel />} /> {/* Added route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

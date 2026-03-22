import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Providers from './pages/Providers';
import ProviderDetail from './pages/ProviderDetail';
import Models from './pages/Models';
import Agents from './pages/Agents';
import Channels from './pages/Channels';
import Automations from './pages/Automations';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/providers/:type" element={<ProviderDetail />} />
          <Route path="/models" element={<Models />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

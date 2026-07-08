import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Compare from './pages/Compare.jsx';
import Experiments from './pages/Experiments.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/experiments" element={<Experiments />} />
      </Routes>
    </BrowserRouter>
  );
}

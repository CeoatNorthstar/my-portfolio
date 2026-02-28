import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

const SuccessPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/'), 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center section-container">
      <GlassCard className="max-w-md mx-auto text-center">
        <CheckCircle size={48} className="text-green-400 mx-auto mb-6" />
        <h1 className="font-display text-2xl text-white font-semibold mb-3">
          Thank You!
        </h1>
        <p className="text-text-2 text-sm mb-4">
          Your support means everything. Redirecting you home shortly.
        </p>
        <p className="font-mono text-[10px] text-text-3">
          Redirecting in 5 seconds...
        </p>
      </GlassCard>
    </div>
  );
};

export default SuccessPage;

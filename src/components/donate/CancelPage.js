import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const CancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center section-container">
      <GlassCard className="max-w-md mx-auto text-center">
        <XCircle size={48} className="text-text-3 mx-auto mb-6" />
        <h1 className="font-display text-2xl text-white font-semibold mb-3">
          Payment Cancelled
        </h1>
        <p className="text-text-2 text-sm mb-6">
          No worries. You can always come back later.
        </p>
        <GlassButton onClick={() => navigate('/')}>
          Back to Home
        </GlassButton>
      </GlassCard>
    </div>
  );
};

export default CancelPage;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lookupOrder, shopPath } from '../../lib/shop';
import { ShopHeader, btn, field } from './parts';

const FindOrder = () => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    document.title = 'Track an order — Naol Demisse';
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setProblem('');
    try {
      const r = await lookupOrder(id, email);
      navigate(`${shopPath(`/order/${r.id}`)}?t=${r.token}`);
    } catch (err) {
      setProblem(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <ShopHeader />
      <main className="max-w-md mx-auto px-5 pt-16 pb-20">
        <h1 className="font-serif text-[38px] leading-none tracking-[-0.03em] text-ink">Track an order</h1>
        <p className="mt-4 text-[14.5px] text-ink-2">Your order number is on the receipt, and starts with ND-.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="label">Order number</span>
            <input className={`${field} mt-1.5 font-mono uppercase`} value={id} onChange={(e) => setId(e.target.value)} placeholder="ND-XXXXXX" required />
          </label>
          <label className="block">
            <span className="label">Email</span>
            <input className={`${field} mt-1.5`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          <button type="submit" disabled={busy} className={`${btn.primary} w-full`}>
            {busy ? 'Looking…' : 'Find my order'}
          </button>
          {problem && <p className="text-[13.5px] text-warn-fg">{problem}</p>}
        </form>
      </main>
    </>
  );
};

export default FindOrder;

import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';

interface ContextualLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function ContextualLoginModal({
  isOpen,
  onClose,
  message = 'Log in to continue',
}: ContextualLoginModalProps) {
  const navigate = useNavigate();

  function handleLogin() {
    onClose();
    navigate('/login', { state: { from: window.location.pathname } });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleLogin}>
            Login
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue ring-1 ring-brand-blue/40">
          <LogIn size={22} />
        </span>
        <p className="text-sm text-gray-300">{message}</p>
      </div>
    </Modal>
  );
}

import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '@/design-system/components';

interface SolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  currentName: string | null;
}

export function SolutionModal({ isOpen, onClose, onConfirm, currentName }: SolutionModalProps) {
  const [name, setName] = useState(currentName || '');

  // Update name when modal opens or currentName changes
  useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
    }
  }, [isOpen, currentName]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save as Solution"
      description="Give your solution a name to easily identify it later."
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(name)}
            disabled={!name.trim()}
          >
            Save Solution
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Solution Name
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Optimal HashMap Approach"
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
}

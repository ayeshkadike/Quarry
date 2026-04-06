import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { X, Loader2, FolderPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (collectionId: string) => void;
}

export function CreateCollectionModal({ isOpen, onClose, onSuccess }: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const collectionId = await invoke<string>('create_collection', {
        name: name.trim(),
      });
      
      // Success - notify parent and close
      onSuccess(collectionId);
      handleClose();
    } catch (err) {
      console.error('Failed to create collection:', err);
      setError(`Failed to create collection: ${err}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    setIsCreating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md"
        >
          <Card>
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-stroke">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                    <FolderPlus size={20} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-fg-strong">Create Collection</h2>
                    <p className="text-xs text-fg-muted mt-0.5">
                      Add a new collection to organize your documents
                    </p>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon-sm" 
                  onClick={handleClose}
                  disabled={isCreating}
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                {/* Name Input */}
                <div className="space-y-2">
                  <label htmlFor="collection-name" className="text-sm font-medium text-fg-strong">
                    Collection Name
                  </label>
                  <Input
                    id="collection-name"
                    type="text"
                    placeholder="e.g., Research Papers, Tech Docs, Project Notes"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    disabled={isCreating}
                    autoFocus
                    className="w-full"
                  />
                  <p className="text-xs text-fg-muted">
                    Choose a descriptive name for your collection
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 p-6 border-t border-stroke">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={handleClose}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!name.trim() || isCreating}
                  className="gap-2"
                >
                  {isCreating && <Loader2 size={16} className="animate-spin" />}
                  Create Collection
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

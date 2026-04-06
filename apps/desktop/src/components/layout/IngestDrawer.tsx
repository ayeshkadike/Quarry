import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { FileUp, X, Loader2, CheckCircle2, AlertCircle, FolderOpen, File } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

interface IngestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  collectionName: string;
}

interface IngestJobInfo {
  job_id: string;
  status: string;
}

interface IngestJobStatus {
  id: string;
  collection_id: string;
  total_files: number;
  processed_files: number;
  status: string;
  error?: string;
}

export function IngestDrawer({ isOpen, onClose, collectionId, collectionName }: IngestDrawerProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [ingesting, setIngesting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<IngestJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll for job status
  useEffect(() => {
    if (!jobId || jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const status = await invoke<IngestJobStatus>('get_ingest_status', { 
          jobId: jobId 
        });
        setJobStatus(status);

        if (status.status === 'completed') {
          setIngesting(false);
          // Show success for 2 seconds, then close and let parent refresh
          setTimeout(() => {
            handleClose();
          }, 2500);
        } else if (status.status === 'failed') {
          setIngesting(false);
          setError(status.error || 'Ingestion failed');
        }
      } catch (err) {
        console.error('Failed to get ingest status:', err);
        setError(`Failed to check status: ${err}`);
        setIngesting(false);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [jobId, jobStatus?.status]);

  const handleSelectFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        directory: false,
        filters: [{
          name: 'Documents',
          extensions: ['txt', 'md', 'pdf', 'doc', 'docx', 'html', 'json', 'csv']
        }]
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        setFiles(prev => [...prev, ...paths]);
        setError(null);
      }
    } catch (err) {
      console.error('File selection failed:', err);
      setError(`Failed to select files: ${err}`);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true,
      });

      if (selected && typeof selected === 'string') {
        setFiles(prev => [...prev, selected]);
        setError(null);
      }
    } catch (err) {
      console.error('Folder selection failed:', err);
      setError(`Failed to select folder: ${err}`);
    }
  };

  const handleIngest = async () => {
    if (files.length === 0) return;

    setIngesting(true);
    setError(null);
    setJobStatus(null);

    try {
      const result = await invoke<IngestJobInfo>('ingest_paths', {
        collectionId: collectionId,
        paths: files,
      });
      
      setJobId(result.job_id);
      setJobStatus({
        id: result.job_id,
        collection_id: collectionId,
        total_files: files.length,
        processed_files: 0,
        status: result.status,
      });
    } catch (err) {
      console.error('Ingest failed:', err);
      setError(`Ingestion failed: ${err}`);
      setIngesting(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setIngesting(false);
    setJobId(null);
    setJobStatus(null);
    setError(null);
    onClose();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileName = (path: string) => {
    return path.split(/[\\/]/).pop() || path;
  };

  const isFolder = (path: string) => {
    // Simple heuristic: if no extension, likely a folder
    const name = getFileName(path);
    return !name.includes('.');
  };

  if (!isOpen) return null;

  const progress = jobStatus 
    ? Math.round((jobStatus.processed_files / jobStatus.total_files) * 100)
    : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl"
        >
          <Card className="flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-stroke shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-fg-strong">Ingest Documents</h2>
                <p className="text-sm text-fg-muted mt-1">
                  Add documents to <span className="font-medium text-accent">{collectionName}</span>
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon-sm" 
                onClick={handleClose}
                disabled={ingesting}
              >
                <X size={18} />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Error State */}
              {error && (
                <div className="mb-4 p-4 rounded-lg bg-error/10 border border-error/20 flex items-start gap-3">
                  <AlertCircle size={20} className="text-error shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-error">Error</p>
                    <p className="text-sm text-fg-muted mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Ingestion Progress */}
              {jobStatus && ingesting && (
                <div className="mb-6 p-4 rounded-lg bg-elev-2 border border-stroke">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Loader2 size={18} className="text-accent animate-spin" />
                      <span className="text-sm font-medium text-fg-strong">
                        Processing documents...
                      </span>
                    </div>
                    <span className="text-sm text-fg-muted">
                      {jobStatus.processed_files} / {jobStatus.total_files}
                    </span>
                  </div>
                  <div className="h-2 bg-elev-3 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Success State */}
              {jobStatus?.status === 'completed' && (
                <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/20 flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-success shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-success">Ingestion Complete!</p>
                    <p className="text-sm text-fg-muted mt-1">
                      Successfully ingested {jobStatus.total_files} {jobStatus.total_files === 1 ? 'file' : 'files'}
                    </p>
                  </div>
                </div>
              )}

              {/* File Selection Area */}
              {files.length === 0 && !ingesting && !jobStatus ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4">
                    <FileUp size={28} className="text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-fg-strong mb-2">
                    Select Files or Folders
                  </h3>
                  <p className="text-sm text-fg-muted mb-6">
                    Choose documents to add to your collection
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button onClick={handleSelectFiles} className="gap-2">
                      <File size={16} />
                      Select Files
                    </Button>
                    <Button onClick={handleSelectFolder} variant="secondary" className="gap-2">
                      <FolderOpen size={16} />
                      Select Folder
                    </Button>
                  </div>
                </div>
              ) : files.length > 0 && !ingesting && !jobStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-fg-strong">
                      Selected {files.length} {files.length === 1 ? 'item' : 'items'}
                    </p>
                    <Badge variant="ghost">{files.length}</Badge>
                  </div>
                  {files.map((file, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 p-3 bg-elev-1 rounded-lg border border-stroke hover:border-stroke-hover transition-colors group"
                    >
                      {isFolder(file) ? (
                        <FolderOpen size={18} className="text-accent shrink-0" />
                      ) : (
                        <File size={18} className="text-fg-muted shrink-0" />
                      )}
                      <span className="flex-1 text-sm text-fg-default truncate" title={file}>
                        {getFileName(file)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFile(idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            {!jobStatus?.status && (
              <div className="flex items-center justify-between p-6 border-t border-stroke shrink-0">
                <Button 
                  variant="secondary" 
                  onClick={files.length > 0 ? handleSelectFiles : handleSelectFolder}
                  disabled={ingesting}
                  className="gap-2"
                >
                  <FileUp size={16} />
                  Add More
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={handleClose}
                    disabled={ingesting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleIngest} 
                    disabled={files.length === 0 || ingesting}
                    className="gap-2"
                  >
                    {ingesting && <Loader2 size={16} className="animate-spin" />}
                    Ingest {files.length > 0 && `(${files.length})`}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

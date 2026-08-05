import { useEffect, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { parseReceiptText } from '../lib/parseReceipt.js';
import styles from './ReceiptScanner.module.css';

function ReceiptScanner({ onScanned, autoOpen }) {
  const [status, setStatus] = useState('idle'); // idle | reading | error
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  useEffect(() => {
    if (autoOpen) uploadInputRef.current?.click();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(file) {
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setStatus('reading');
    setProgress(0);

    try {
      // Albanian receipts mix Latin numerals/prices with Albanian store
      // names and words ("Totali", "Kesh") — recognizing both scripts
      // together reads more reliably than English alone.
      const worker = await createWorker(['eng', 'sqi'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const { amount, merchant } = parseReceiptText(data.text);
      setStatus('idle');
      onScanned({ amount, merchant, file, rawText: data.text });
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className={styles.dropzone} data-active={status === 'reading'}>
      {/* Camera capture — forces the device camera to open directly. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.hiddenInput}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {/* Plain file picker — no `capture`, so it opens the gallery/file browser
          instead of jumping straight to the camera. */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview && <img src={preview} alt="Receipt preview" className={styles.preview} />}

      {status === 'reading' ? (
        <div className={styles.status}>
          <span className="eyebrow">Reading receipt… {progress}%</span>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <button
            type="button"
            className={`btn btn-secondary ${styles.scanButton}`}
            onClick={() => cameraInputRef.current?.click()}
          >
            📷 Take photo
          </button>
          <button
            type="button"
            className={`btn btn-secondary ${styles.scanButton}`}
            onClick={() => uploadInputRef.current?.click()}
          >
            🖼️ {preview ? 'Choose another' : 'Upload receipt'}
          </button>
        </div>
      )}

      {status === 'error' && (
        <p className={styles.error}>Couldn't read that receipt — enter the details manually.</p>
      )}
    </div>
  );
}

export default ReceiptScanner;

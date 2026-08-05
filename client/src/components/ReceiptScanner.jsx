import { useEffect, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { parseReceiptText } from '../lib/parseReceipt.js';
import styles from './ReceiptScanner.module.css';

function ReceiptScanner({ onScanned, autoOpen }) {
  const [status, setStatus] = useState('idle'); // idle | reading | error
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoOpen) inputRef.current?.click();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(file) {
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setStatus('reading');
    setProgress(0);

    try {
      const worker = await createWorker('eng', 1, {
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
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
        <button
          type="button"
          className={`btn btn-secondary ${styles.scanButton}`}
          onClick={() => inputRef.current?.click()}
        >
          📷 {preview ? 'Rescan receipt' : 'Scan a receipt'}
        </button>
      )}

      {status === 'error' && (
        <p className={styles.error}>Couldn't read that receipt — enter the details manually.</p>
      )}
    </div>
  );
}

export default ReceiptScanner;

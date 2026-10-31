import { isNative } from './platform';

/**
 * Cross-platform CSV download & share utility.
 * Supports Android WebView, Capacitor, iOS, and desktop browsers.
 */
export async function downloadOrShareCSV(csvContent: string, filename: string): Promise<boolean> {
  const trimmed = csvContent.trim();
  if (!trimmed || trimmed.split('\n').length <= 1) {
    return false; // Empty or only headers
  }

  // 1. Try Web Share API with File (Supported in modern mobile WebViews and browsers)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    if (typeof File !== 'undefined') {
      try {
        const file = new File([csvContent], filename, { type: 'text/csv;charset=utf-8;' });
        await navigator.share({
          files: [file],
          title: filename,
          text: 'Centra transactions export',
        });
        return true;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return true; // User dismissed share sheet
        }
        // If file sharing throws (NotSupportedError / TypeError in WebView), proceed to fallbacks
      }
    }

    // Fallback share with text content on native platforms
    if (isNative()) {
      try {
        await navigator.share({
          title: filename,
          text: csvContent,
        });
        return true;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return true;
        }
      }
    }
  }

  // 2. On native Android/Capacitor, trigger application/octet-stream data URI
  // so Android WebView's DownloadListener / system handles it cleanly
  if (isNative() && typeof document !== 'undefined') {
    try {
      const octetUri = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(csvContent);
      const link = document.createElement('a');
      link.href = octetUri;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 200);
      return true;
    } catch {
      // Proceed to standard blob download
    }
  }

  // 3. Try standard Blob ObjectURL download
  if (typeof document !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 200);
      return true;
    } catch {
      // Proceed to data URI fallback
    }

    // 4. Data URI fallback
    try {
      const encodedUri = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 200);
      return true;
    } catch (fallbackErr) {
      console.error('CSV export failed:', fallbackErr);
      return false;
    }
  }

  return false;
}


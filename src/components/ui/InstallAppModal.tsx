import React from 'react';
import { Download, Monitor, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { isSafariBrowser, isMacPlatform, isIosPlatform } from '../../utils/pwaInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const isSafariMac = isSafariBrowser() && isMacPlatform();
  const isSafariIos = isSafariBrowser() && isIosPlatform();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install Centra App">
      <div className="space-y-4 text-xs text-gray-600 dark:text-gray-300">
        <p className="leading-relaxed text-gray-500 dark:text-gray-400">
          Install Centra for an instant, borderless standalone desktop and mobile experience with full offline data access.
        </p>

        {isSafariMac ? (
          /* Safari macOS 1-step instruction */
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Monitor className="w-4 h-4 text-[#56791E] dark:text-[#C6FF3D]" />
              <span>Safari on macOS (1-Step Install)</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#C6FF3D] text-black font-bold text-[11px] shrink-0">
                  1
                </span>
                <div className="leading-relaxed text-gray-800 dark:text-gray-200">
                  In Safari&apos;s top menu bar, click:
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/5 dark:bg-white/10 font-mono font-semibold text-xs text-gray-900 dark:text-white">
                    <span>File</span>
                    <span>→</span>
                    <span className="text-[#56791E] dark:text-[#C6FF3D]">Add to Dock...</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Centra will instantly appear in your Mac Dock and launch in its own standalone, distraction-free window.
            </p>
          </div>
        ) : isSafariIos ? (
          /* Safari iOS 1-step instruction */
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Share2 className="w-4 h-4 text-[#56791E] dark:text-[#C6FF3D]" />
              <span>Safari on iOS (iPhone &amp; iPad)</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#C6FF3D] text-black font-bold text-[11px] shrink-0">
                  1
                </span>
                <div className="leading-relaxed text-gray-800 dark:text-gray-200">
                  Tap the <strong className="text-gray-900 dark:text-white">Share</strong> icon (square with upward arrow) at the bottom of Safari, then tap <strong className="text-[#56791E] dark:text-[#C6FF3D]">Add to Home Screen</strong>.
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Centra will be added to your home screen with pure-black OLED styling.
            </p>
          </div>
        ) : (
          /* Chrome / Edge / Brave / Chromium Desktop & Android */
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Download className="w-4 h-4 text-[#56791E] dark:text-[#C6FF3D]" />
              <span>Install Directly from Browser</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#C6FF3D] text-black font-bold text-[11px] shrink-0">
                  1
                </span>
                <div className="leading-relaxed text-gray-800 dark:text-gray-200">
                  Click the <strong className="text-[#56791E] dark:text-[#C6FF3D]">Install</strong> icon in your browser URL address bar (top right) or open menu (<span className="font-bold">⋮</span>) &gt; <strong className="text-gray-900 dark:text-white">Install Centra</strong>.
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Runs identically to native desktop apps with dock/taskbar pinning and offline persistence.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Zero downloads or zip files</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-[#C6FF3D] shrink-0" />
            <span>Standalone full-screen window</span>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </Modal>
  );
};

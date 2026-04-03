'use client';

import { useState, useCallback, useEffect } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { getGuestRemaining, getGuestUsageCount, incrementGuestUsage } from '@/lib/usage';

type State = 'idle' | 'loading' | 'done' | 'error';

interface User {
  email: string;
  name: string;
  avatar_url: string;
}

const GUEST_LIMIT = 3;

// Limit-reached modal
function LimitModal({
  onClose,
  limit,
}: {
  onClose: () => void;
  limit: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl text-center">
        <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚡</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">今日免费额度已用完</h3>
        <p className="text-gray-500 mb-6">
          您今天已使用 {limit} 次免费额度。登录后每天可免费使用 10 次！
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/api/auth/login"
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            登录 / 注册 — 获得 10 次/天
          </a>
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [state, setState] = useState<State>('idle');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [guestRemaining, setGuestRemaining] = useState(GUEST_LIMIT);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    // Update guest remaining count on mount
    setGuestRemaining(getGuestRemaining(GUEST_LIMIT));

    // Load Google SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);

    // @ts-ignore
    window.handleCredentialResponse = async (response: any) => {
      try {
        const res = await fetch('https://google-auth-worker.eluwomoyoqi99.workers.dev/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: response.credential })
        });
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch (err) {
        console.error('Login failed:', err);
      }
    };
  }, []);

  const processFile = async (file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      setErrorMsg('Please upload a JPG, PNG, or WEBP image.');
      setState('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size must be under 10MB.');
      setState('error');
      return;
    }

    // Pre-check guest limit before calling API
    if (!user) {
      const used = getGuestUsageCount();
      if (used >= GUEST_LIMIT) {
        setShowLimitModal(true);
        return;
      }
    }

    // Show original preview
    const originalObjectUrl = URL.createObjectURL(file);
    setOriginalUrl(originalObjectUrl);
    setResultUrl(null);
    setState('loading');

    try {
      const form = new FormData();
      form.append('image', file);

      const headers: Record<string, string> = {};
      if (user?.email) {
        headers['x-user-email'] = user.email;
      }

      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        headers,
        body: form,
      });

      if (res.status === 429) {
        // Daily limit reached
        setShowLimitModal(true);
        setState('idle');
        setOriginalUrl(null);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Processing failed');
      }

      // Update guest local counter
      if (!user) {
        incrementGuestUsage();
        setGuestRemaining(getGuestRemaining(GUEST_LIMIT));
      }

      const remaining = res.headers.get('X-Usage-Remaining');
      if (remaining !== null && !user) {
        setGuestRemaining(parseInt(remaining, 10));
      }

      const blob = await res.blob();
      const resultObjectUrl = URL.createObjectURL(blob);
      setResultUrl(resultObjectUrl);
      setState('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setState('error');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [user]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'removed-bg.png';
    a.click();
  };

  const handleReset = () => {
    setOriginalUrl(null);
    setResultUrl(null);
    setState('idle');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Limit Modal */}
      {showLimitModal && (
        <LimitModal
          limit={GUEST_LIMIT}
          onClose={() => setShowLimitModal(false)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <nav className="hidden md:flex items-center gap-6 ml-auto mr-6">
            <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">定价</a>
            <a href="/faq" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">RemoveBG</h1>
              <p className="text-xs text-gray-500">Free Image Background Remover</p>
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/profile'}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                <div className="text-sm text-left">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">View Profile</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setUser(null);
                  localStorage.removeItem('user');
                }}
                className="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div
              id="g_id_onload"
              data-client_id="2499385941-d0lqohapi97ug5pdel4hq996e4d2a34k.apps.googleusercontent.com"
              data-callback="handleCredentialResponse"
            >
              <div className="g_id_signin" data-type="standard" data-size="medium"></div>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {/* Upgrade Banner */}
        {user && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">🎉 升级 Pro 享受无限次数</h3>
                <p className="text-indigo-100">4K 高清 + 无水印 + 批量处理，首月仅需 $4.99</p>
              </div>
              <a
                href="/pricing"
                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                立即升级
              </a>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            Remove Image Background
          </h2>
          <p className="text-lg text-gray-500">
            Free, instant, no signup required. Upload your image and download the result.
          </p>
          {/* Guest usage indicator */}
          {!user && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm text-gray-600 shadow-sm">
              <span className={guestRemaining === 0 ? 'text-red-500' : guestRemaining <= 1 ? 'text-yellow-500' : 'text-green-500'}>●</span>
              今日剩余免费次数：<strong>{guestRemaining}/{GUEST_LIMIT}</strong>
              {guestRemaining === 0 && (
                <a href="/api/auth/login" className="ml-1 text-indigo-600 font-medium hover:underline">
                  登录获得 10 次 →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Upload Area */}
        {state === 'idle' && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
            }`}
          >
            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-700">
                    Drop your image here
                  </p>
                  <p className="text-gray-400 mt-1">or <span className="text-indigo-600 underline">click to upload</span></p>
                </div>
                <p className="text-sm text-gray-400">JPG, PNG, WEBP · Max 10MB</p>
              </div>
            </label>
          </div>
        )}

        {/* Loading */}
        {state === 'loading' && (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium text-gray-700">Removing background...</p>
              <p className="text-sm text-gray-400">This usually takes 2–5 seconds</p>
            </div>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700">{errorMsg}</p>
              <button
                onClick={handleReset}
                className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {state === 'done' && originalUrl && resultUrl && (
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage src={originalUrl} alt="Original" style={{ objectFit: 'contain' }} />
                }
                itemTwo={
                  <div className="checkerboard w-full h-full">
                    <ReactCompareSliderImage src={resultUrl} alt="Background removed" style={{ objectFit: 'contain' }} />
                  </div>
                }
                style={{ height: '480px' }}
              />
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Remove Another
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-4 text-center text-sm text-gray-400">
        <p>🔒 Your images are processed in memory and <strong>never stored</strong> on our servers.</p>
        <p className="mt-1">© 2024 RemoveBG · Powered by Remove.bg API</p>
      </footer>
    </div>
  );
}

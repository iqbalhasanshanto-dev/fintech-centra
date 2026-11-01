import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Camera,
  ChevronDown,
  User,
  MapPin,
  Coins,
  Check,
  Search,
  AlertCircle,
} from 'lucide-react';
import logoOnDark from '../../assets/brand/logo-on-dark.svg';
import logoOnLight from '../../assets/brand/logo-on-light.svg';
import { CornerGlow } from '../ui/CornerGlow';
import { DatePicker } from '../ui/DatePicker';
import { ImageCropModal } from '../ui/ImageCropModal';
import { useAuth } from '../../context/AuthContext';
import {
  SUPPORTED_CURRENCIES,
  COUNTRY_LIST,
  suggestCurrencyForCountry,
  getCurrencyInfo,
} from '../../utils/currencies';
import { RATES_LAST_UPDATED } from '../../utils/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { sanitizeText } from '../../utils/sanitize';
import { validateName, validateAddress } from '../../utils/validators';
import {
  validateImageFile,
  processImage,
  MAX_AVATAR_DIMENSION,
  MAX_AVATAR_BYTES,
} from '../../utils/imageValidation';
import { getUserInitials } from '../../utils/initials';

export interface ProfileDraftData {
  name?: string;
  fullName?: string;
  dob?: string;
  country?: string;
  address?: string;
  avatarUrl?: string;
  currency?: string;
}

interface ProfileInfoScreenProps {
  initialName?: string;
  initialData?: ProfileDraftData;
  onDraftChange?: (data: Partial<ProfileDraftData>) => void;
  onBack: () => void;
  onContinue: (profileData: {
    name: string;
    dob: string;
    country: string;
    address: string;
    avatarUrl?: string;
    currency: string;
  }) => void;
}

export const ProfileInfoScreen: React.FC<ProfileInfoScreenProps> = ({
  initialName = '',
  initialData,
  onDraftChange,
  onBack,
  onContinue,
}) => {
  const { user, saveOnboardingProfile } = useAuth();

  const [fullName, setFullName] = useState(
    initialData?.fullName || initialData?.name || initialName || user.name || ''
  );
  const [dob, setDob] = useState(initialData?.dob || '');
  const [country, setCountry] = useState(initialData?.country || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    initialData?.avatarUrl || user.avatarUrl
  );
  const [avatarError, setAvatarError] = useState(false);
  const [currency, setCurrency] = useState<string>(initialData?.currency || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (val.trim()) {
      const res = validateName(val);
      setFullNameError(res.ok ? null : res.error || null);
    } else {
      setFullNameError(null);
    }
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    if (val.trim()) {
      const res = validateAddress(val, false);
      setAddressError(res.ok ? null : res.error || null);
    } else {
      setAddressError(null);
    }
  };

  // Sync Google / Apple OAuth prefilled name & avatar
  useEffect(() => {
    if (!fullName && user.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Pre-fill OAuth profile name when user object loads asynchronously
      setFullName(user.name);
    }
    if (!avatarUrl && user.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
      setAvatarError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only sync when user prop updates to avoid overwriting active user edits
  }, [user.name, user.avatarUrl]);

  // Persist live profile changes to onboarding draft
  const onDraftChangeRef = useRef(onDraftChange);
  useEffect(() => {
    onDraftChangeRef.current = onDraftChange;
  }, [onDraftChange]);

  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    onDraftChangeRef.current?.({
      name: fullName,
      fullName,
      dob,
      country,
      address,
      avatarUrl,
      currency,
    });
  }, [fullName, dob, country, address, avatarUrl, currency]);

  // Dropdown UI states
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  // Handle avatar file upload with magic byte validation and crop modal
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setErrorMessage('');

    const validation = await validateImageFile(file);
    if (!validation.ok) {
      setErrorMessage(validation.error || 'Please upload a valid JPEG, PNG, or WebP image.');
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setIsCropOpen(true);
      setAvatarUploading(false);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image. Please try again.');
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setAvatarUrl(croppedDataUrl);
    setAvatarError(false);

    if (isSupabaseConfigured() && user.id) {
      try {
        const res = await fetch(croppedDataUrl);
        const blob = await res.blob();
        const processed = await processImage(blob, {
          maxDimension: MAX_AVATAR_DIMENSION,
          maxSizeBytes: MAX_AVATAR_BYTES,
          format: 'image/jpeg',
        });
        const filePath = `avatars/${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, processed.blob, { upsert: true, contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
          setAvatarUrl(data.publicUrl);
        }
      } catch {
        // Fallback to dataUrl
      }
    }
  };

  const handleSelectCountry = (countryName: string) => {
    setCountry(countryName);
    setIsCountryOpen(false);

    // Auto-suggest matching currency
    const suggested = suggestCurrencyForCountry(countryName);
    setCurrency(suggested);
  };

  const handleSelectCurrency = (currencyCode: string) => {
    setCurrency(currencyCode);
    setIsCurrencyOpen(false);
  };

  const filteredCountries = COUNTRY_LIST.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    c =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const nameResult = validateName(fullName);
    if (!nameResult.ok) {
      setFullNameError(nameResult.error || 'Please enter a valid full name.');
      setErrorMessage(nameResult.error || 'Please enter a valid full name.');
      return;
    }

    if (!country) {
      setErrorMessage('Please select your country or region.');
      return;
    }

    if (!currency) {
      setErrorMessage('Please select a base currency.');
      return;
    }

    if (address.trim()) {
      const addressResult = validateAddress(address, false);
      if (!addressResult.ok) {
        setAddressError(addressResult.error || 'Please enter a valid address.');
        setErrorMessage(addressResult.error || 'Please enter a valid address.');
        return;
      }
    }

    const finalCurrency = currency;
    const cleanName = nameResult.value;
    const cleanDob = sanitizeText(dob, 20);
    const cleanAddress = address.trim() ? sanitizeText(address, 200) : '';

    await saveOnboardingProfile({
      name: cleanName,
      dob: cleanDob,
      country,
      address: cleanAddress,
      avatarUrl,
      currency: finalCurrency,
    });

    onContinue({
      name: cleanName,
      dob: cleanDob,
      country,
      address: cleanAddress,
      avatarUrl,
      currency: finalCurrency,
    });
  };

  const selectedCurrencyInfo = getCurrencyInfo(currency);

  return (
    <div
      className="min-h-screen w-full bg-[#F7F8FA] dark:bg-[#000000] text-[#18212F] dark:text-white flex flex-col justify-between relative overflow-hidden transition-colors bg-grid-pattern selection:bg-[#C6FF3D] selection:text-black"
      style={{
        paddingTop: 'calc(1rem + env(safe-area-inset-top, var(--safe-area-inset-top, 0px)))',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, var(--safe-area-inset-bottom, 0px)))',
      }}
    >
      <CornerGlow />

      <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto z-10 animate-fade-in">
        {/* Top Canvas Header: Separate Top Row (Back on left, Logo on right) + Giant Hero Display below */}
        <div className="px-6 pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-xs"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center">
              <img
                src={logoOnLight}
                alt="Centra"
                className="w-10 h-10 object-contain drop-shadow-sm select-none dark:hidden rounded-xl"
                draggable={false}
              />
              <img
                src={logoOnDark}
                alt="Centra"
                className="w-10 h-10 object-contain drop-shadow-sm select-none hidden dark:block rounded-xl"
                draggable={false}
              />
            </div>
          </div>

          <h1 className="text-[58px] sm:text-[68px] font-normal font-sans tracking-tight leading-[1.03] text-[#18212F] dark:text-white my-4">
            Tell us<br />
            <span className="text-[#56791E] dark:text-[#C6FF3D]">about</span><br />
            Yourself
          </h1>
        </div>

        {/* Elevated Bottom Sheet Card (05-onboarding-profile.png) */}
        <div className="w-full bg-white dark:bg-[#1D1D1D] rounded-t-[32px] md:rounded-[32px] border-t md:border border-black/5 dark:border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col transition-all">
          {/* Drag Handle */}
          <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto mb-4" />

          {/* Centered Avatar Picker with Neon Lime Camera Badge */}
          <div className="flex flex-col items-center justify-center mb-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full bg-gray-200 dark:bg-[#2A2A2A] border-2 border-black/10 dark:border-white/10 hover:border-[#C6FF3D] transition-all cursor-pointer flex items-center justify-center overflow-visible group shrink-0"
              title="Tap to upload profile picture"
            >
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (fullName.trim() || user.name) ? (
                <div className="w-full h-full rounded-full bg-[#C6FF3D] text-[#0A0E1A] font-bold text-xl flex items-center justify-center select-none">
                  {getUserInitials(fullName.trim() || user.name || 'User')}
                </div>
              ) : (
                <User className="w-9 h-9 text-gray-400 dark:text-gray-500" />
              )}
              {/* Neon Lime Camera Badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#C6FF3D] text-black flex items-center justify-center shadow-md border-2 border-white dark:border-[#1D1D1D]">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mt-2 cursor-pointer"
            >
              {avatarUploading ? 'Uploading...' : avatarUrl ? 'Change Photo (Optional)' : 'Add Photo (Optional)'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Fields: Full Name, Date of Birth, Country, Currency, Address */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div>
              <input
                type="text"
                value={fullName}
                onChange={e => handleFullNameChange(e.target.value)}
                placeholder="Full Name"
                required
                className={`w-full px-5 py-3.5 rounded-2xl bg-[#E8ECEF] dark:bg-[#2A2A2A] border ${
                  fullNameError
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-transparent focus:border-[#C6FF3D] focus:ring-[#C6FF3D]'
                } text-[#18212F] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all text-sm font-medium`}
              />
              {fullNameError && (
                <p className="mt-1 px-1 text-xs text-rose-500 font-medium">{fullNameError}</p>
              )}
            </div>

            {/* Date of Birth with Custom DatePicker */}
            <div>
              <DatePicker
                value={dob}
                onChange={setDob}
                placeholder="Date of Birth"
                maxDate={new Date().toISOString().split('T')[0]}
                buttonClassName="w-full px-5 py-3.5 rounded-2xl bg-[#E8ECEF] dark:bg-[#2A2A2A] border border-transparent text-left flex items-center justify-between transition-all cursor-pointer focus:outline-none focus:border-[#C6FF3D] focus:ring-2 focus:ring-[#C6FF3D] text-sm font-medium"
              />
            </div>

            {/* Country Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsCountryOpen(!isCountryOpen);
                  setIsCurrencyOpen(false);
                }}
                className="w-full px-5 py-3.5 rounded-2xl bg-[#E8ECEF] dark:bg-[#2A2A2A] border border-transparent text-left flex items-center justify-between transition-all cursor-pointer focus:outline-none focus:border-[#C6FF3D] focus:ring-2 focus:ring-[#C6FF3D] text-sm font-medium"
              >
                <span className={country ? 'text-[#18212F] dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                  {country ? (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {country}
                    </span>
                  ) : (
                    'Country'
                  )}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>

              {isCountryOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-[#262626] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-30 max-h-60 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-gray-100 dark:border-white/5">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={e => setCountrySearch(e.target.value)}
                        placeholder="Search country..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-[#1D1D1D] rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
                    {filteredCountries.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCountry(c.name)}
                        className="w-full px-3 py-2.5 text-left text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                        {country === c.name && <Check className="w-4 h-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Base Currency Selector */}
            <div className="relative">
              <button
                type="button"
                aria-label="Base Currency"
                onClick={() => {
                  setIsCurrencyOpen(!isCurrencyOpen);
                  setIsCountryOpen(false);
                }}
                className="w-full px-5 py-3.5 rounded-2xl bg-[#E8ECEF] dark:bg-[#2A2A2A] border border-transparent text-left flex items-center justify-between transition-all cursor-pointer focus:outline-none focus:border-[#C6FF3D] focus:ring-2 focus:ring-[#C6FF3D] text-sm font-medium"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Coins className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className={`truncate ${currency ? 'text-[#18212F] dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {currency ? (
                      <span>
                        {selectedCurrencyInfo.flag} {selectedCurrencyInfo.code} ({selectedCurrencyInfo.symbol}) -{' '}
                        {selectedCurrencyInfo.name}
                      </span>
                    ) : (
                      'Currency'
                    )}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
              </button>

              {isCurrencyOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-[#262626] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-30 max-h-60 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-gray-100 dark:border-white/5">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={currencySearch}
                        onChange={e => setCurrencySearch(e.target.value)}
                        placeholder="Search currency code or name..."
                        className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-[#1D1D1D] rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
                    {filteredCurrencies.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectCurrency(c.code)}
                        className="w-full px-3 py-2.5 text-left text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span className="font-bold">{c.code}</span>
                          <span className="text-gray-400">({c.symbol})</span>
                          <span>{c.name}</span>
                        </span>
                        {currency === c.code && <Check className="w-4 h-4 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-100 dark:border-white/5 text-[10px] text-gray-400 text-center">
                    Exchange rates updated: {RATES_LAST_UPDATED}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Address input */}
            <div>
              <input
                type="text"
                value={address}
                onChange={e => handleAddressChange(e.target.value)}
                placeholder="Address (Optional)"
                className={`w-full px-5 py-3.5 rounded-2xl bg-[#E8ECEF] dark:bg-[#2A2A2A] border ${
                  addressError
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-transparent focus:border-[#C6FF3D] focus:ring-[#C6FF3D]'
                } text-[#18212F] dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all text-sm font-medium`}
              />
              {addressError && (
                <p className="mt-1 px-1 text-xs text-rose-500 font-medium">{addressError}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!fullName.trim() || !country || !currency || !!fullNameError || !!addressError}
                className="w-full py-4 px-6 rounded-full bg-[#18212F] dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue →</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ImageCropModal
        isOpen={isCropOpen}
        imageSrc={cropImageSrc}
        onClose={() => setIsCropOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Camera,
  Calendar,
  ChevronDown,
  User,
  MapPin,
  Coins,
  Check,
  Search,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ISO_CURRENCIES,
  COUNTRY_LIST,
  suggestCurrencyForCountry,
  getCurrencyInfo,
} from '../../utils/currencies';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

interface ProfileInfoScreenProps {
  initialName?: string;
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
  onBack,
  onContinue,
}) => {
  const { user, saveOnboardingProfile } = useAuth();

  // All fields start EMPTY with grey hint-text only — no prefilled sample values!
  const [fullName, setFullName] = useState(initialName || user.name || '');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user.avatarUrl);
  const [currency, setCurrency] = useState<string>(''); // Unset until chosen or auto-suggested on country select
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Sync Google / Apple OAuth prefilled name & avatar
  useEffect(() => {
    if (!fullName && user.name) {
      setFullName(user.name);
    }
    if (!avatarUrl && user.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user.name, user.avatarUrl]);

  // Dropdown UI states
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle avatar file upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Avatar image must be smaller than 5MB.');
      return;
    }

    setAvatarUploading(true);
    setErrorMessage('');

    try {
      if (isSupabaseConfigured() && user.id) {
        const fileExt = file.name.split('.').pop();
        const filePath = `avatars/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
          setAvatarUrl(data.publicUrl);
          setAvatarUploading(false);
          return;
        }
      }

      // Fallback: Read as local data URL
      const reader = new FileReader();
      reader.onload = event => {
        setAvatarUrl(event.target?.result as string);
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setErrorMessage('Failed to upload image. Please try again.');
      setAvatarUploading(false);
    }
  };

  // When Country is selected, auto-suggest currency
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

  const filteredCurrencies = ISO_CURRENCIES.filter(
    c =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!country) {
      setErrorMessage('Please select your country or region.');
      return;
    }

    // Default currency to USD if somehow untouched
    const finalCurrency = currency || 'USD';

    // Save profile data into AuthContext / CentraDB
    await saveOnboardingProfile({
      name: fullName.trim(),
      dob: dob.trim(),
      country,
      address: address.trim(),
      avatarUrl,
      currency: finalCurrency,
    });

    onContinue({
      name: fullName.trim(),
      dob: dob.trim(),
      country,
      address: address.trim(),
      avatarUrl,
      currency: finalCurrency,
    });
  };

  const selectedCurrencyInfo = getCurrencyInfo(currency);

  return (
    <div className="w-full flex flex-col justify-between min-h-full py-4 px-4 sm:px-8">
      {/* Top Header & Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
            Step 3/5
          </span>
          <div className="w-7" />
        </div>

        {/* Progress Line: 60% */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-500 w-[60%]" />
        </div>

        {/* Headings matching reference image 5 */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
            Tell us about you
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400">
            We use this info to create your account and keep it secure.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar upload section */}
          <div className="flex items-center gap-4 py-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 rounded-full bg-gray-100 dark:bg-[#131722] border-2 border-dashed border-gray-300 dark:border-[#232c44] hover:border-black dark:hover:border-white transition-all cursor-pointer flex items-center justify-center overflow-hidden group shrink-0"
              title="Tap to upload profile picture"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold text-gray-900 dark:text-white hover:underline block text-left cursor-pointer"
              >
                {avatarUploading ? 'Uploading...' : avatarUrl ? 'Change photo' : 'Add photo'}
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                JPG, PNG or WEBP (Optional)
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Full Name field */}
          <div>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Full Name"
              required
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base"
            />
          </div>

          {/* Date of Birth field */}
          <div className="relative">
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              placeholder="Date of Birth"
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base"
            />
          </div>

          {/* Country/Region searchable dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsCountryOpen(!isCountryOpen);
                setIsCurrencyOpen(false);
              }}
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-left flex items-center justify-between transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <span className={country ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                {country ? (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {country}
                  </span>
                ) : (
                  'Country/Region'
                )}
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {isCountryOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-[#171e2e] border border-gray-200 dark:border-[#28344e] rounded-2xl shadow-2xl z-30 max-h-60 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-gray-100 dark:border-white/5">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      placeholder="Search country..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-[#121724] rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
                  {filteredCountries.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectCountry(c.name)}
                      className="w-full px-3 py-2.5 text-left text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between"
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

          {/* Primary Currency selection (auto-suggested by country, fully editable/searchable) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsCurrencyOpen(!isCurrencyOpen);
                setIsCountryOpen(false);
              }}
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-left flex items-center justify-between transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-gray-400" />
                <span className={currency ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                  {currency ? (
                    <span>
                      {selectedCurrencyInfo.flag} {selectedCurrencyInfo.code} ({selectedCurrencyInfo.symbol}) -{' '}
                      {selectedCurrencyInfo.name}
                    </span>
                  ) : (
                    'Base Currency (Auto-suggested with Country)'
                  )}
                </span>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {isCurrencyOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-[#171e2e] border border-gray-200 dark:border-[#28344e] rounded-2xl shadow-2xl z-30 max-h-60 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-gray-100 dark:border-white/5">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={currencySearch}
                      onChange={e => setCurrencySearch(e.target.value)}
                      placeholder="Search currency code or name..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-[#121724] rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
                  {filteredCurrencies.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectCurrency(c.code)}
                      className="w-full px-3 py-2.5 text-left text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between"
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
              </div>
            )}
          </div>

          {/* Address field */}
          <div>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Address"
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-[#131722] border border-gray-200 dark:border-[#232c44] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base"
            />
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

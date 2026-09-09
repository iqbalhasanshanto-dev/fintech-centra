import React, { useState, useRef } from 'react';
import { ArrowLeft, Calendar, ChevronDown, Camera, User, Check } from 'lucide-react';
import { CurrencyCode } from '../../../types';

interface ProfileInfoStepProps {
  initialName?: string;
  onBack: () => void;
  onContinue: (profileData: {
    name: string;
    dob: string;
    country: string;
    currency: CurrencyCode;
    address: string;
    avatarUrl: string;
  }) => void;
}

interface CountryOption {
  code: string;
  name: string;
  flag: string;
  currency: CurrencyCode;
  symbol: string;
}

const COUNTRIES: CountryOption[] = [
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT', symbol: '৳' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£' },
  { code: 'EU', name: 'Germany (Eurozone)', flag: '🇪🇺', currency: 'EUR', symbol: '€' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', symbol: '¥' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: '$' },
];

export const ProfileInfoStep: React.FC<ProfileInfoStepProps> = ({
  initialName = '',
  onBack,
  onContinue,
}) => {
  const [fullName, setFullName] = useState(initialName || 'Alex Morgan');
  const [dob, setDob] = useState('2000-01-01');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setAvatarUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = COUNTRIES.find((c) => c.code === e.target.value) || COUNTRIES[0];
    setSelectedCountry(country);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = fullName.trim() || initialName.trim() || 'Centra User';

    onContinue({
      name: finalName,
      dob,
      country: selectedCountry.name,
      currency: selectedCountry.currency,
      address: address.trim(),
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    });
  };

  return (
    <div className="flex flex-col justify-between min-h-full w-full py-4 px-4 sm:px-6">
      {/* Top Section */}
      <div>
        {/* Progress Bar & Back button */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
            Step 3/5
          </span>
          <div className="w-7" />
        </div>

        {/* Progress Line: 60% */}
        <div className="w-full h-1 bg-gray-200 dark:bg-[#1e2638] rounded-full mb-6 overflow-hidden">
          <div className="h-full bg-black dark:bg-white rounded-full transition-all duration-300 w-[60%]" />
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
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Profile Avatar Upload (Tap to pick from device library) */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer"
            title="Tap to choose profile photo"
          >
            <div className="w-22 h-22 rounded-full border-2 border-dashed border-gray-300 dark:border-[#2e3b56] bg-gray-100 dark:bg-[#131722] flex items-center justify-center overflow-hidden transition-all group-hover:border-black dark:group-hover:border-white group-hover:scale-105 shadow-inner">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                  <User className="w-9 h-9" />
                </div>
              )}
            </div>

            {/* Camera badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md">
              <Camera className="w-3.5 h-3.5" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-2">
            {avatarUrl ? 'Photo selected • Tap to change' : 'Add photo (Optional)'}
          </span>
        </div>

        {/* Form Inputs matching reference image 5 */}
        <form id="profile-info-form" onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1e2638] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all shadow-xs"
            />
          </div>

          {/* Date of Birth with Calendar Icon */}
          <div className="relative">
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1e2638] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all shadow-xs appearance-none pr-12 cursor-pointer"
            />
            <Calendar className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Country / Region with Auto Currency Update */}
          <div className="relative">
            <select
              value={selectedCountry.code}
              onChange={handleCountryChange}
              className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1e2638] text-gray-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all shadow-xs appearance-none pr-12 cursor-pointer"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-white dark:bg-[#131722] text-gray-900 dark:text-white py-2">
                  {c.flag} {c.name} ({c.currency} {c.symbol})
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Currency match helper badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#131722]/80 border border-gray-200/60 dark:border-[#1e2638] text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Currency auto-set:
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {selectedCountry.currency} ({selectedCountry.symbol})
            </span>
          </div>

          {/* Address */}
          <div>
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-[#1e2638] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all shadow-xs"
            />
          </div>

          {/* Bottom Button inside Form for guaranteed trigger */}
          <div className="pt-6">
            <button
              type="submit"
              onClick={handleSubmit}
              className="w-full py-4 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg cursor-pointer text-center"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

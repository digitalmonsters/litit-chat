'use client';

/**
 * Profile Setup Component
 * 
 * Collects: name, bio, location, interests, avatar upload
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firebase';
import { uploadAvatar, compressImage } from '@/lib/storage';
import Button from '@/components/ui/Button';
import { flameSlideUp, flameFadeIn } from '@/lib/flame-transitions';
import { cn } from '@/lib/utils';

const INTEREST_OPTIONS = [
  'Technology',
  'Design',
  'Business',
  'Music',
  'Sports',
  'Travel',
  'Food',
  'Art',
  'Gaming',
  'Photography',
  'Fitness',
  'Reading',
  'Movies',
  'Fashion',
  'Cooking',
];

export interface ProfileSetupProps {
  className?: string;
}

export default function ProfileSetup({ className }: ProfileSetupProps) {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
    address?: string;
  } | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Load user data if available
  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setAvatarPreview(user.photoURL || null);
    }
  }, [user]);

  // Get user location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get city/country from reverse geocoding
        let city, country, address;
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          city = data.city || data.locality;
          country = data.countryName;
          address = data.formatted || `${city}, ${country}`;
        } catch (err) {
          console.warn('Reverse geocoding failed:', err);
        }

        setLocation({
          latitude,
          longitude,
          city,
          country,
          address,
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(error.message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handle avatar selection
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setAvatar(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Toggle interest
  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to complete profile setup');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const db = getFirestoreInstance();
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);

      // Upload avatar if selected
      let avatarURL = user.photoURL || null;
      if (avatar) {
        const compressedAvatar = await compressImage(avatar, 800, 0.8);
        avatarURL = await uploadAvatar(user.uid, compressedAvatar);
      }

      // Update user document
      await updateDoc(userRef, {
        displayName: name.trim(),
        bio: bio.trim() || undefined,
        location: location || undefined,
        interests: interests.length > 0 ? interests : undefined,
        photoURL: avatarURL || undefined,
        verified: true,
        updatedAt: serverTimestamp(),
      });

      // Refresh user data
      await refreshUser();

      // Sync user to GHL in background
      try {
        await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.uid }),
        });
      } catch (syncError) {
        // eslint-disable-next-line no-console
        console.warn('Failed to sync user to GHL:', syncError);
        // Don't block user flow if sync fails
      }

      // Redirect to discover page
      router.push('/discover');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Profile setup error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={flameSlideUp}
      className={cn('w-full max-w-2xl mx-auto', className)}
    >
      <div className="bg-[#1E1E1E] rounded-2xl p-8 border border-[#FF5E3A]/20 shadow-2xl">
        <motion.div
          variants={flameFadeIn}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] bg-clip-text text-transparent mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-400">Tell us a bit about yourself</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FF5E3A] bg-gray-800 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-12 h-12 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#FF5E3A] rounded-full flex items-center justify-center hover:bg-[#FF6E4A] transition-colors"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">Upload a profile picture</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5E3A] transition-colors"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={200}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5E3A] transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/200</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            {location ? (
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-white text-sm">{location.address || `${location.city || 'Unknown'}, ${location.country || 'Unknown'}`}</p>
                <button
                  type="button"
                  onClick={() => setLocation(null)}
                  className="text-xs text-[#FF5E3A] hover:text-[#FF6E4A] mt-1"
                >
                  Change location
                </button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={getLocation}
                disabled={locationLoading}
                className="w-full bg-gray-800 text-white hover:bg-gray-700"
              >
                {locationLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 inline mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Get My Location
                  </>
                )}
              </Button>
            )}
            {locationError && (
              <p className="text-xs text-red-400 mt-1">{locationError}</p>
            )}
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Interests (select any that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    interests.includes(interest)
                      ? 'bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-gradient-to-r from-[#FF5E3A] to-[#FF9E57] text-white hover:from-[#FF6E4A] hover:to-[#FFAE67] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              'Complete Profile'
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}


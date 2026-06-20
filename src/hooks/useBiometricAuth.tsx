/**
 * useBiometricAuth.ts
 * ─────────────────────────────────────────────────────────────────────
 * Reusable biometric authentication hook built on expo-local-authentication.
 *
 * Install first:
 *   npx expo install expo-local-authentication
 *
 * Used in TWO places:
 *  1. LoginScreen.tsx  → handleBio() authenticates and signs the user in
 *  2. ProfileScreen.tsx → "Biometric Auth" toggle enables/disables the
 *     feature and stores the preference securely
 *
 * Storage:
 *  - Stores a boolean flag 'biometricEnabled' via your existing
 *    `storage` (expo-secure-store) module — same one you use for tokens.
 * ─────────────────────────────────────────────────────────────────────
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { storage } from '../lib/storage';

const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

interface UseBiometricAuthReturn {
  isAvailable:      boolean;        // hardware supports it
  isEnrolled:       boolean;        // user has Face ID / fingerprint set up on device
  biometricType:    BiometricType;  // which kind, for UI copy
  isEnabled:        boolean;        // user has turned ON the in-app toggle
  loading:          boolean;        // initial capability check in progress
  authenticating:   boolean;        // a prompt is currently showing
  checkCapability:  () => Promise<void>;
  authenticate:     (reason?: string) => Promise<boolean>;
  enableBiometric:  () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isAvailable,    setIsAvailable]    = useState(false);
  const [isEnrolled,     setIsEnrolled]     = useState(false);
  const [biometricType,  setBiometricType]  = useState<BiometricType>('none');
  const [isEnabled,      setIsEnabled]      = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  // ── Check device capability + stored preference on mount ──────────
  const checkCapability = useCallback(async () => {
    setLoading(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled     = await LocalAuthentication.isEnrolledAsync();
      const types        = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsAvailable(hasHardware);
      setIsEnrolled(enrolled);

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('iris');
      } else {
        setBiometricType('none');
      }

      // Read stored preference
      const stored = await storage.getString(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(stored === 'true');
    } catch (e) {
      console.error('Biometric capability check failed:', e);
      setIsAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkCapability();
  }, [checkCapability]);

  // ── Trigger the native Face ID / fingerprint prompt ────────────────
  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    if (!isAvailable || !isEnrolled) {
      Alert.alert(
        'Biometrics unavailable',
        isAvailable
          ? 'No biometrics are set up on this device. Add Face ID or a fingerprint in your device settings first.'
          : 'This device does not support biometric authentication.',
      );
      return false;
    }

    setAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason ?? 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // allow PIN/passcode fallback
        fallbackLabel: 'Use passcode',
      });

      if (!result.success) {
        // User cancelled or failed — not necessarily an error to surface
        if (result.error === 'lockout') {
          Alert.alert(
            'Too many attempts',
            'Biometric authentication is locked. Try again later or use your password.',
          );
        }
        return false;
      }

      return true;
    } catch (e) {
      console.error('Biometric authentication error:', e);
      return false;
    } finally {
      setAuthenticating(false);
    }
  }, [isAvailable, isEnrolled]);

  // ── Enable biometric login (called from Profile toggle) ───────────
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    const success = await authenticate('Confirm to enable biometric sign-in');
    if (success) {
      await storage.set(BIOMETRIC_ENABLED_KEY, 'true');
      setIsEnabled(true);
      return true;
    }
    return false;
  }, [authenticate]);

  // ── Disable biometric login ────────────────────────────────────────
  const disableBiometric = useCallback(async () => {
    await storage.delete(BIOMETRIC_ENABLED_KEY);
    setIsEnabled(false);
  }, []);

  return {
    isAvailable,
    isEnrolled,
    biometricType,
    isEnabled,
    loading,
    authenticating,
    checkCapability,
    authenticate,
    enableBiometric,
    disableBiometric,
  };
}

// ─── Helper: human-readable label for UI copy ──────────────────────────────

export function biometricLabel(type: BiometricType): string {
  if (type === 'face')        return Platform.OS === 'ios' ? 'Face ID' : 'Face unlock';
  if (type === 'fingerprint') return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
  if (type === 'iris')        return 'Iris scan';
  return 'Biometrics';
}
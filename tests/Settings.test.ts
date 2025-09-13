/**
 * Tests for Quality Settings auto-detection logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Settings, type QualityLevel } from '../src/components/quality/Settings';

// Mock navigator and matchMedia
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  deviceMemory: 8
};

const mockMatchMedia = vi.fn();

const mockLocation = {
  search: ''
};

describe('Settings - Quality Auto-Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup global mocks
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    });
    
    Object.defineProperty(global, 'matchMedia', {
      value: mockMatchMedia,
      writable: true
    });
    
    Object.defineProperty(global, 'location', {
      value: mockLocation,
      writable: true
    });
    
    Object.defineProperty(global, 'window', {
      value: {
        devicePixelRatio: 2
      },
      writable: true
    });
    
    // Setup DOM mock
    Object.defineProperty(global, 'document', {
      value: {
        getElementById: vi.fn().mockReturnValue(null)
      },
      writable: true
    });
    
    // Default matchMedia mock
    mockMatchMedia.mockReturnValue({
      matches: false
    });
  });

  it('should detect ultra quality for high-end desktop', () => {
    // High-end desktop: 8GB+ RAM, 2x DPR, not mobile
    mockNavigator.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';
    mockNavigator.deviceMemory = 8;
    window.devicePixelRatio = 2;
    
    const settings = new Settings();
    const quality = settings.getCurrentQuality();
    
    expect(quality).toBe('ultra');
  });

  it('should detect med quality for mobile devices', () => {
    // Mobile device
    mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15';
    mockNavigator.deviceMemory = 4;
    window.devicePixelRatio = 3;
    
    const settings = new Settings();
    const quality = settings.getCurrentQuality();
    
    expect(quality).toBe('med');
  });

  it('should detect med quality for low memory devices', () => {
    // Low memory device
    mockNavigator.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';
    mockNavigator.deviceMemory = 2;
    window.devicePixelRatio = 1;
    
    const settings = new Settings();
    const quality = settings.getCurrentQuality();
    
    expect(quality).toBe('med');
  });

  it('should detect high quality for mid-range desktop', () => {
    // Mid-range desktop: 6GB RAM, standard DPR
    mockNavigator.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36';
    mockNavigator.deviceMemory = 6;
    window.devicePixelRatio = 1;
    
    const settings = new Settings();
    const quality = settings.getCurrentQuality();
    
    expect(quality).toBe('high');
  });

  it('should respect URL quality parameter', () => {
    mockLocation.search = '?q=low';
    
    const settings = new Settings();
    const quality = settings.getCurrentQuality();
    
    expect(quality).toBe('low');
  });

  it('should respect reduced motion preference', () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    
    const settings = new Settings();
    const qualitySettings = settings.getQualitySettings();
    
    // Should reduce particle counts when reduced motion is preferred
    expect(qualitySettings.starCount).toBeLessThan(32000);
  });

  it('should provide correct quality settings for each level', () => {
    const settings = new Settings();
    settings.setQuality('ultra');
    
    const ultraSettings = settings.getQualitySettings();
    
    expect(ultraSettings.quality).toBe('ultra');
    expect(ultraSettings.starCount).toBe(50000);
    expect(ultraSettings.backgroundStars).toBe(24000);
    expect(ultraSettings.haloParticles).toBe(520);
  });

  it('should handle missing deviceMemory gracefully', () => {
    // Remove deviceMemory property
    delete (mockNavigator as any).deviceMemory;
    
    const settings = new Settings();
    const deviceInfo = settings.getDeviceInfo();
    
    expect(deviceInfo.deviceMemory).toBe(4); // Should default to 4GB
  });
});
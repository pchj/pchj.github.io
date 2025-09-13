/**
 * Tests for CertificationsToggle component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CertificationsToggle } from '../src/components/certifications/CertificationsToggle';

// Mock DOM elements
const mockCertGroup = {
  hasAttribute: vi.fn(),
  getAttribute: vi.fn(),
  setAttribute: vi.fn(),
  querySelector: vi.fn()
};

const mockButton = {
  setAttribute: vi.fn(),
  addEventListener: vi.fn(),
  dataset: {}
};

describe('CertificationsToggle', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup DOM mock
    Object.defineProperty(global, 'document', {
      value: {
        querySelector: vi.fn().mockReturnValue(mockCertGroup),
        console: {
          warn: vi.fn()
        }
      },
      writable: true
    });

    mockCertGroup.querySelector.mockReturnValue(mockButton);
    mockCertGroup.hasAttribute.mockReturnValue(false);
    mockCertGroup.getAttribute.mockReturnValue('false');
  });

  it('should initialize with correct default state', () => {
    new CertificationsToggle();
    
    expect(mockCertGroup.setAttribute).toHaveBeenCalledWith('data-collapsed', 'false');
    expect(mockButton.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
  });

  it('should handle missing elements gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock missing elements
    document.querySelector = vi.fn().mockReturnValue(null);
    
    expect(() => new CertificationsToggle()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('CertificationsToggle: Required elements not found');
    
    consoleSpy.mockRestore();
  });

  it('should bind click event handler', () => {
    // Reset the dataset to allow binding
    mockButton.dataset = {};
    
    new CertificationsToggle();
    
    expect(mockButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('should prevent double binding', () => {
    mockButton.dataset.bound = '1';
    
    new CertificationsToggle();
    
    // Should not call addEventListener when already bound
    expect(mockButton.addEventListener).not.toHaveBeenCalled();
  });
});
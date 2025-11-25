import { describe, it, expect } from 'vitest';
import { extractSubdomain } from '@/utils/helpers';

describe('Helper Functions', () => {
  describe('extractSubdomain', () => {
    it('should extract subdomain from host', () => {
      const subdomain = extractSubdomain('ufabc.academy.com');
      expect(subdomain).toBe('ufabc');
    });

    it('should extract subdomain from localhost', () => {
      const subdomain = extractSubdomain('ufabc.localhost');
      expect(subdomain).toBe('ufabc');
    });

    it('should extract subdomain from host with port', () => {
      const subdomain = extractSubdomain('ufabc.academy.com:3333');
      expect(subdomain).toBe('ufabc');
    });

    it('should return null for invalid host', () => {
      const subdomain = extractSubdomain('academy.com');
      expect(subdomain).toBeNull();
    });

    it('should return null for empty host', () => {
      const subdomain = extractSubdomain('');
      expect(subdomain).toBeNull();
    });
  });
});

/**
 * Unit tests for Type Definitions
 */

import { MockDataFactory, TestAssertions } from '../../helpers/test-utils';
import { RepositoryError } from '../../../src/types';

describe('Type Definitions', () => {
  describe('Enums', () => {
    describe('RepositoryError', () => {
      it('should have all required error codes', () => {
        expect(RepositoryError.INVALID_URL).toBe('INVALID_URL');
        expect(RepositoryError.CLONE_FAILED).toBe('CLONE_FAILED');
        expect(RepositoryError.UPDATE_FAILED).toBe('UPDATE_FAILED');
        expect(RepositoryError.NOT_FOUND).toBe('NOT_FOUND');
        expect(RepositoryError.LOCK_FAILED).toBe('LOCK_FAILED');
        expect(RepositoryError.METADATA_ERROR).toBe('METADATA_ERROR');
        expect(RepositoryError.STORAGE_ERROR).toBe('STORAGE_ERROR');
      });
    });
  });

  describe('MockDataFactory', () => {
    describe('createMockRepositoryMetadata', () => {
      it('should create valid RepositoryMetadata', () => {
        const metadata = MockDataFactory.createMockRepositoryMetadata();
        
        TestAssertions.assertValidRepositoryMetadata(metadata);
        expect(metadata.url).toBe('https://github.com/test/repo');
        expect(metadata.branch).toBe('main');
        expect(metadata.clone_method).toBe('https');
        expect(typeof metadata.commit_hash).toBe('string');
      });

      it('should accept overrides', () => {
        const metadata = MockDataFactory.createMockRepositoryMetadata({
          url: 'https://github.com/custom/repo',
          branch: 'develop',
          clone_method: 'ssh'
        });

        expect(metadata.url).toBe('https://github.com/custom/repo');
        expect(metadata.branch).toBe('develop');
        expect(metadata.clone_method).toBe('ssh');
      });
    });

    describe('createMockRepositoryInfo', () => {
      it('should create valid RepositoryInfo', () => {
        const info = MockDataFactory.createMockRepositoryInfo();
        
        TestAssertions.assertValidRepositoryInfo(info);
        expect(info.url).toBe('https://github.com/test/repo');
        expect(info.branch).toBe('main');
        expect(info.exists).toBe(true);
        expect(typeof info.localPath).toBe('string');
      });
    });
  });

  describe('TestAssertions', () => {
    describe('assertValidRepositoryMetadata', () => {
      it('should pass for valid metadata', () => {
        const validMetadata = MockDataFactory.createMockRepositoryMetadata();
        
        expect(() => {
          TestAssertions.assertValidRepositoryMetadata(validMetadata);
        }).not.toThrow();
      });

      it('should fail for invalid metadata', () => {
        const invalidMetadata = { url: 'test' };
        
        expect(() => {
          TestAssertions.assertValidRepositoryMetadata(invalidMetadata);
        }).toThrow();
      });
    });

    describe('assertValidRepositoryInfo', () => {
      it('should pass for valid info', () => {
        const validInfo = MockDataFactory.createMockRepositoryInfo();
        
        expect(() => {
          TestAssertions.assertValidRepositoryInfo(validInfo);
        }).not.toThrow();
      });

      it('should fail for invalid info', () => {
        const invalidInfo = { url: 'test' };
        
        expect(() => {
          TestAssertions.assertValidRepositoryInfo(invalidInfo);
        }).toThrow();
      });
    });
  });
}); 
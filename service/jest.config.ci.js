module.exports = {
  // Inherit base configuration
  ...require('./jest.config.js'),
  
  // CI specific configuration
  ci: true,
  
  // Disable watch mode
  watchAll: false,
  
  // Always collect coverage
  collectCoverage: true,
  
  // CI environment coverage thresholds (can be stricter)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Limit parallel processes (CI environment resource constraints)
  maxWorkers: 2,
  
  // Stricter failure conditions
  bail: 1, // Stop on first failure
  
  // Verbose output
  verbose: true,
  
  // Don't use cache (ensure clean test environment)
  cache: false,
  
  // Reporter configuration (suitable for CI)
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  
  // Coverage report formats (suitable for CI)
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'cobertura'
  ]
}; 
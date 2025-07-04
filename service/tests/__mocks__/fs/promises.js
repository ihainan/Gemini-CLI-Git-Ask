const toDirent = function(name) {
  return {
    name: name,
    isDirectory: function() { return true; },
    isFile: function() { return false; },
    isBlockDevice: function() { return false; },
    isCharacterDevice: function() { return false; },
    isSymbolicLink: function() { return false; },
    isFIFO: function() { return false; },
    isSocket: function() { return false; }
  };
};

// 简单的内存文件系统
const files = {};

const mkdir = jest.fn().mockResolvedValue(undefined);

const writeFile = jest.fn().mockImplementation(function(filepath, data) {
  return new Promise(function(resolve) {
    files[filepath] = data;
    resolve();
  });
});

const readFile = jest.fn().mockImplementation(function(filepath) {
  return new Promise(function(resolve) {
    if (files[filepath]) {
      resolve(files[filepath]);
    } else {
      // 默认返回一个有效的 JSON 元数据
      resolve(JSON.stringify({
        url: 'https://github.com/test/repo.git',
        branch: 'main',
        last_accessed: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        commit_hash: 'abc123',
        clone_method: 'https'
      }));
    }
  });
});

const access = jest.fn().mockResolvedValue(undefined);
const rm = jest.fn().mockResolvedValue(undefined);
const stat = jest.fn().mockResolvedValue({ 
  size: 1024,
  isDirectory: function() { return false; },
  isFile: function() { return true; }
});

const readdir = jest.fn().mockResolvedValue([
  toDirent('repo1'),
  toDirent('repo2'), 
  toDirent('repo3')
]);

const constants = {
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1
};

// 提供清理函数供测试使用
const __clearMockFiles = function() {
  Object.keys(files).forEach(function(key) {
    delete files[key];
  });
};

module.exports = {
  mkdir: mkdir,
  writeFile: writeFile,
  readFile: readFile,
  access: access,
  rm: rm,
  stat: stat,
  readdir: readdir,
  constants: constants,
  __clearMockFiles: __clearMockFiles,
  default: {
    mkdir: mkdir,
    writeFile: writeFile,
    readFile: readFile,
    access: access,
    rm: rm,
    stat: stat,
    readdir: readdir,
    constants: constants,
    __clearMockFiles: __clearMockFiles
  }
}; 
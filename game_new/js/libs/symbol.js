// Symbol polyfill for WeChat Mini Game
if (typeof Symbol === 'undefined') {
  let symbolCounter = 0;
  
  global.Symbol = function Symbol(description) {
    return `__symbol_${symbolCounter++}_${description || ''}`;
  };
  
  global.Symbol.iterator = Symbol('Symbol.iterator');
  global.Symbol.for = function(key) {
    return `__symbol_for_${key}`;
  };
  global.Symbol.keyFor = function(symbol) {
    if (typeof symbol === 'string' && symbol.startsWith('__symbol_for_')) {
      return symbol.substring(14);
    }
    return undefined;
  };
}

// 确保全局可用
if (typeof window !== 'undefined' && typeof window.Symbol === 'undefined') {
  window.Symbol = global.Symbol;
}

module.exports = global.Symbol;

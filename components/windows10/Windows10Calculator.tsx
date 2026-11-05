import React, { useState, useEffect, useCallback } from 'react';
import { soundManager } from '../../services/soundEffects';

export const Windows10Calculator: React.FC = () => {
  const [display, setDisplay] = useState<string>('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [history, setHistory] = useState<string>('');
  const [memory, setMemory] = useState<number>(0);

  const handleDigit = useCallback((digit: string) => {
    soundManager.playClickSound();
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  }, [display, waitingForOperand]);

  const handleDecimal = useCallback(() => {
    soundManager.playClickSound();
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waitingForOperand]);

  const handleClear = useCallback(() => {
    soundManager.playClickSound();
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHistory('');
  }, []);

  const handleClearEntry = useCallback(() => {
    soundManager.playClickSound();
    setDisplay('0');
  }, []);

  const handleBackspace = useCallback(() => {
    soundManager.playClickSound();
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  }, [display]);

  const handleToggleSign = useCallback(() => {
    soundManager.playClickSound();
    const current = parseFloat(display);
    if (!isNaN(current)) {
      setDisplay(String(-current));
    }
  }, [display]);

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×':
      case '*': return a * b;
      case '÷':
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleOperator = useCallback((nextOperator: string) => {
    soundManager.playClickSound();
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setHistory(`${inputValue} ${nextOperator}`);
    } else if (operator) {
      const result = calculate(prevValue, inputValue, operator);
      setDisplay(String(result));
      setPrevValue(result);
      setHistory(`${result} ${nextOperator}`);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  }, [display, operator, prevValue]);

  const handleEqual = useCallback(() => {
    soundManager.playAccessGrantedSound();
    const inputValue = parseFloat(display);

    if (operator && prevValue !== null) {
      const result = calculate(prevValue, inputValue, operator);
      setDisplay(String(result));
      setHistory(`${prevValue} ${operator} ${inputValue} =`);
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  }, [display, operator, prevValue]);

  // Special math operations: 1/x, x^2, sqrt, %
  const handleSpecialOp = (type: 'reciprocal' | 'square' | 'sqrt' | 'percent') => {
    soundManager.playClickSound();
    const val = parseFloat(display);
    if (isNaN(val)) return;

    let res = 0;
    if (type === 'reciprocal') res = val !== 0 ? 1 / val : 0;
    if (type === 'square') res = val * val;
    if (type === 'sqrt') res = val >= 0 ? Math.sqrt(val) : 0;
    if (type === 'percent') res = val / 100;

    setDisplay(String(res));
    setWaitingForOperand(true);
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === '.') handleDecimal();
      else if (e.key === '+' || e.key === '-') handleOperator(e.key);
      else if (e.key === '*') handleOperator('×');
      else if (e.key === '/') { e.preventDefault(); handleOperator('÷'); }
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleEqual(); }
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Escape') handleClear();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDecimal, handleOperator, handleEqual, handleBackspace, handleClear]);

  return (
    <div className="flex flex-col h-full bg-[#202020] text-white font-sans select-none p-2 sm:p-4">
      {/* Top Standard Header */}
      <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-wide">Standard</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">Raj Expo Tools</div>
      </div>

      {/* Screen / History Display */}
      <div className="flex flex-col items-end justify-end h-24 px-3 mb-2 bg-[#1b1b1b] rounded border border-[#333333] shadow-inner">
        <div className="text-xs text-slate-400 font-mono tracking-wider h-5 overflow-hidden">
          {history}
        </div>
        <div className="text-3xl sm:text-4xl font-light text-white font-mono tracking-tight truncate max-w-full">
          {display}
        </div>
      </div>

      {/* Memory Row */}
      <div className="grid grid-cols-5 gap-1 mb-2 text-[11px] font-semibold text-slate-400 text-center">
        <button onClick={() => { soundManager.playClickSound(); setMemory(0); }} className="hover:text-white hover:bg-white/5 py-1 rounded cursor-pointer">MC</button>
        <button onClick={() => { soundManager.playClickSound(); setDisplay(String(memory)); setWaitingForOperand(true); }} className="hover:text-white hover:bg-white/5 py-1 rounded cursor-pointer">MR</button>
        <button onClick={() => { soundManager.playClickSound(); setMemory(m => m + parseFloat(display)); }} className="hover:text-white hover:bg-white/5 py-1 rounded cursor-pointer">M+</button>
        <button onClick={() => { soundManager.playClickSound(); setMemory(m => m - parseFloat(display)); }} className="hover:text-white hover:bg-white/5 py-1 rounded cursor-pointer">M-</button>
        <button onClick={() => { soundManager.playClickSound(); setMemory(parseFloat(display)); }} className="hover:text-white hover:bg-white/5 py-1 rounded cursor-pointer">MS</button>
      </div>

      {/* Calculator Buttons Grid (Authentic Windows 10 Palette) */}
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {/* Row 1 */}
        <button onClick={() => handleSpecialOp('percent')} className="calc-btn-func">%</button>
        <button onClick={handleClearEntry} className="calc-btn-func">CE</button>
        <button onClick={handleClear} className="calc-btn-func">C</button>
        <button onClick={handleBackspace} className="calc-btn-func">⌫</button>

        {/* Row 2 */}
        <button onClick={() => handleSpecialOp('reciprocal')} className="calc-btn-func">1/x</button>
        <button onClick={() => handleSpecialOp('square')} className="calc-btn-func">x²</button>
        <button onClick={() => handleSpecialOp('sqrt')} className="calc-btn-func">√x</button>
        <button onClick={() => handleOperator('÷')} className="calc-btn-op">÷</button>

        {/* Row 3 */}
        <button onClick={() => handleDigit('7')} className="calc-btn-num">7</button>
        <button onClick={() => handleDigit('8')} className="calc-btn-num">8</button>
        <button onClick={() => handleDigit('9')} className="calc-btn-num">9</button>
        <button onClick={() => handleOperator('×')} className="calc-btn-op">×</button>

        {/* Row 4 */}
        <button onClick={() => handleDigit('4')} className="calc-btn-num">4</button>
        <button onClick={() => handleDigit('5')} className="calc-btn-num">5</button>
        <button onClick={() => handleDigit('6')} className="calc-btn-num">6</button>
        <button onClick={() => handleOperator('-')} className="calc-btn-op">-</button>

        {/* Row 5 */}
        <button onClick={() => handleDigit('1')} className="calc-btn-num">1</button>
        <button onClick={() => handleDigit('2')} className="calc-btn-num">2</button>
        <button onClick={() => handleDigit('3')} className="calc-btn-num">3</button>
        <button onClick={() => handleOperator('+')} className="calc-btn-op">+</button>

        {/* Row 6 */}
        <button onClick={handleToggleSign} className="calc-btn-num">+/-</button>
        <button onClick={() => handleDigit('0')} className="calc-btn-num">0</button>
        <button onClick={handleDecimal} className="calc-btn-num">.</button>
        <button onClick={handleEqual} className="calc-btn-eq">=</button>
      </div>

      <style>{`
        .calc-btn-num {
          background-color: #3b3b3b;
          color: #ffffff;
          font-weight: 600;
          font-size: 15px;
          border-radius: 4px;
          transition: background-color 0.1s;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calc-btn-num:hover {
          background-color: #323232;
        }
        .calc-btn-num:active {
          background-color: #282828;
        }
        .calc-btn-func {
          background-color: #323232;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 500;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calc-btn-func:hover {
          background-color: #3b3b3b;
        }
        .calc-btn-op {
          background-color: #323232;
          color: #38bdf8;
          font-size: 16px;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calc-btn-op:hover {
          background-color: #3b3b3b;
        }
        .calc-btn-eq {
          background-color: #0078d7;
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .calc-btn-eq:hover {
          background-color: #1a86db;
        }
      `}</style>
    </div>
  );
};

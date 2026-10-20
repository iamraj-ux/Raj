import React from 'react';

interface CostCalculatorProps {
  singleSidedCost: number;
  doubleSidedCost: number;
  onCostChange: (type: 'single' | 'double', value: number) => void;
  pagesPerSide: number;
  onPagesPerSideChange: (value: number) => void;
  separateOrientations: boolean;
  onOrientationSeparatorToggle: (enabled: boolean) => void;
  unitLabel: string;
  showOrientationToggle: boolean;
}

export const CostCalculator: React.FC<CostCalculatorProps> = ({ 
  singleSidedCost, 
  doubleSidedCost, 
  onCostChange, 
  pagesPerSide,
  onPagesPerSideChange,
  separateOrientations, 
  onOrientationSeparatorToggle,
  unitLabel,
  showOrientationToggle
}) => {
  return (
    <section className="jarvis-corner-box">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-1 h-8 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Economic Calibration</h2>
      </div>
      <div className="bg-slate-900/40 backdrop-blur-3xl p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-scanline pointer-events-none" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          <div>
            <label htmlFor="single-sided-cost" className="block text-xs font-black text-cyan-500/60 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="w-1 h-1 bg-cyan-500 rounded-full animate-jarvis-blink"></span>
              1-Sided Protocol / {unitLabel}
            </label>
            <div className="relative group/input">
              <input
                type="number"
                id="single-sided-cost"
                value={singleSidedCost}
                onChange={(e) => onCostChange('single', e.target.valueAsNumber)}
                min="0"
                step="0.01"
                className="w-full bg-slate-950/40 border border-white/5 text-white font-bold rounded-xl py-4 pl-5 pr-20 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all group-hover/input:bg-slate-950/60"
              />
              <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                <span className="text-cyan-500 font-bold text-xs tracking-widest animate-jarvis-blink">LKR</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="double-sided-cost" className="block text-xs font-black text-cyan-500/60 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="w-1 h-1 bg-cyan-500 rounded-full animate-jarvis-blink"></span>
              2-Sided Protocol / Sheet
            </label>
            <div className="relative group/input">
              <input
                type="number"
                id="double-sided-cost"
                value={doubleSidedCost}
                onChange={(e) => onCostChange('double', e.target.valueAsNumber)}
                min="0"
                step="0.01"
                className="w-full bg-slate-950/40 border border-white/5 text-white font-bold rounded-xl py-4 pl-5 pr-20 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all group-hover/input:bg-slate-950/60"
              />
              <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                <span className="text-cyan-500 font-bold text-xs tracking-widest animate-jarvis-blink">LKR</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="pages-per-side" className="block text-xs font-black text-cyan-500/60 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="w-1 h-1 bg-cyan-500 rounded-full animate-jarvis-blink"></span>
              N-UP Neural Division
            </label>
            <div className="flex gap-2">
              <select
                value={[1, 2, 4, 8].includes(pagesPerSide) ? pagesPerSide : 'other'}
                onChange={(e) => {
                  if (e.target.value !== 'other') onPagesPerSideChange(Number(e.target.value));
                }}
                className="bg-slate-950/40 border border-white/5 text-white font-bold rounded-xl py-4 pl-5 pr-10 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all hover:bg-slate-950/60 appearance-none cursor-pointer"
              >
                <option value={1}>1 UP</option>
                <option value={2}>2 UP</option>
                <option value={4}>4 UP</option>
                <option value={8}>8 UP</option>
                <option value="other">MANUAL</option>
              </select>
              <input
                type="number"
                id="pages-per-side"
                value={pagesPerSide}
                onChange={(e) => onPagesPerSideChange(e.target.valueAsNumber)}
                min="1"
                className="flex-1 min-w-0 bg-slate-950/40 border border-white/5 text-white font-bold rounded-xl py-4 px-5 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all hover:bg-slate-950/60"
                placeholder="VAL..."
              />
            </div>
          </div>
        </div>

        {showOrientationToggle && (
          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Orientation Stream Isolation</h3>
                <p className="text-sm text-slate-400 font-medium">Natasha: Portrait/Landscape pulse separation enabled.</p>
              </div>
              <button
                type="button"
                onClick={() => onOrientationSeparatorToggle(!separateOrientations)}
                className={`${
                  separateOrientations ? 'bg-cyan-600' : 'bg-slate-700'
                } relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg`}
                role="switch"
                aria-checked={separateOrientations}
              >
                <span
                  aria-hidden="true"
                  className={`${
                    separateOrientations ? 'translate-x-7' : 'translate-x-0'
                  } pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xl ring-0 transition duration-300 ease-in-out`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
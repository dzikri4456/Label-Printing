import React, { useState, useEffect } from 'react';
import { Settings, Plus, Minus, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { useToast } from '../ui/ToastContext';

export const CIPLAdminSettings: React.FC = () => {
    const { addToast } = useToast();
    const [currentCIPL, setCurrentCIPL] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Load current CIPL on mount
    useEffect(() => {
        const stored = localStorage.getItem('cipl_counter');
        const current = stored ? parseInt(stored, 10) : 1;
        setCurrentCIPL(current);
        setInputValue(current.toString());
    }, []);

    const handleSetCIPL = () => {
        setError('');

        // Validate input is a number
        const newValue = parseInt(inputValue, 10);
        if (isNaN(newValue)) {
            setError('Please enter a valid number');
            addToast('Invalid input: Please enter a valid number', 'error');
            return;
        }

        // Validate minimum value
        if (newValue < 1) {
            setError('CIPL number must be at least 1');
            addToast('Invalid input: CIPL number must be at least 1', 'error');
            return;
        }

        // Validate maximum value (reasonable limit)
        if (newValue > 999999) {
            setError('CIPL number too large (max: 999999)');
            addToast('Invalid input: CIPL number too large', 'error');
            return;
        }

        // Success
        localStorage.setItem('cipl_counter', newValue.toString());
        setCurrentCIPL(newValue);
        setInputValue(newValue.toString());
        addToast(`CIPL counter set to ${newValue.toString().padStart(5, '0')}`, 'success');
    };

    const handleIncrement = () => {
        const newValue = currentCIPL + 1;
        localStorage.setItem('cipl_counter', newValue.toString());
        setCurrentCIPL(newValue);
        setInputValue(newValue.toString());
    };

    const handleDecrement = () => {
        const newValue = Math.max(1, currentCIPL - 1);
        localStorage.setItem('cipl_counter', newValue.toString());
        setCurrentCIPL(newValue);
        setInputValue(newValue.toString());
    };

    const handleReset = () => {
        const confirmed = window.confirm('Reset CIPL counter to 1? This cannot be undone.');
        if (confirmed) {
            localStorage.setItem('cipl_counter', '1');
            setCurrentCIPL(1);
            setInputValue('1');
        }
    };

    return (
        <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-6 max-w-md">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-3 bg-indigo-100 rounded-lg">
                    <Settings className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">CIPL Counter Settings</h2>
                    <p className="text-xs text-slate-500">Manage CIPL auto-increment counter</p>
                </div>
            </div>

            {/* Current Counter Display */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 mb-6 border border-indigo-200">
                <div className="text-xs font-semibold text-indigo-600 uppercase mb-1">Current CIPL Number</div>
                <div className="text-4xl font-bold text-indigo-900">{currentCIPL.toString().padStart(5, '0')}</div>
                <div className="text-xs text-indigo-600 mt-1">Next print will use: {(currentCIPL + 1).toString().padStart(5, '0')}</div>
            </div>

            {/* Quick Controls */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Quick Adjust</label>
                <div className="flex gap-2">
                    <button
                        onClick={handleDecrement}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                    >
                        <Minus className="w-4 h-4" />
                        Decrement
                    </button>
                    <button
                        onClick={handleIncrement}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Increment
                    </button>
                </div>
            </div>

            {/* Set Starting Number */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Set Starting Number</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={inputValue}
                        onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                        min="1"
                        max="999999"
                        className={`flex-1 px-4 py-3 border-2 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10'} rounded-lg text-lg font-bold text-slate-800 focus:ring-4 outline-none`}
                        placeholder="Enter number..."
                        onKeyPress={(e) => { if (e.key === 'Enter') handleSetCIPL(); }}
                    />
                    <button
                        onClick={handleSetCIPL}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Set
                    </button>
                </div>
                {error && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}
                <p className="text-xs text-slate-500 mt-2">Enter the starting number for CIPL counter (1-999999)</p>
            </div>

            {/* Reset Button */}
            <div className="pt-4 border-t border-slate-200">
                <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold border-2 border-red-200 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset Counter to 1
                </button>
                <p className="text-xs text-red-500 mt-2 text-center">⚠️ This will reset the counter to 1. Use with caution!</p>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCcw, Sparkles } from 'lucide-react';

export default function BanglaStemmerApp() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  const handleStem = () => {
    // Simulate response (replace with real NLP API later)
    setResult({
      stem: 'খেল',
      type: 'Verb',
    });
  };

  const handleClear = () => {
    setText('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-xl space-y-6"
      >
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-indigo-600">Bangla Stemmer & Detector</h1>
          <p className="text-gray-600">Type a Bangla word to get its stem and grammatical category.</p>
        </div>

        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="উদাহরণ: খেলছে, লেখা, বলছি..."
          className="w-full border border-indigo-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />

        <div className="flex justify-between gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStem}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl shadow"
          >
            <Search size={20} />
            Analyze
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl"
          >
            <RefreshCcw size={18} />
            Clear
          </motion.button>
        </div>

        {result && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 space-y-2"
          >
            <div className="flex items-center gap-2 text-indigo-700 text-lg font-semibold">
              <Sparkles size={20} />
              Result
            </div>
            <p><span className="font-bold">Stem:</span> {result.stem}</p>
            <p><span className="font-bold">Type:</span> {result.type}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { medicationService } from '../lib/database';
import type { Medication } from '../types/database';

interface MedicationSearchProps {
  onSelect: (medication: Medication) => void;
  selectedMedication?: Medication | null;
  placeholder?: string;
}

export default function MedicationSearch({ 
  onSelect, 
  selectedMedication, 
  placeholder = "薬剤名で検索..." 
}: MedicationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchMedications = async () => {
      if (query.length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const medications = await medicationService.search(query);
        setResults(medications);
        setShowResults(true);
      } catch (error) {
        console.error('薬剤検索エラー:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchMedications, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (medication: Medication) => {
    onSelect(medication);
    setQuery(medication.drug_name);
    setShowResults(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (selectedMedication && e.target.value !== selectedMedication.drug_name) {
      // Clear selection if input doesn't match selected medication
      // onSelect(null); // We don't have a clear method, so we'll leave as is
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={selectedMedication ? selectedMedication.drug_name : query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((medication) => (
            <div
              key={medication.id}
              onClick={() => handleSelect(medication)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{medication.drug_name}</div>
              {medication.generic_name && (
                <div className="text-sm text-gray-600">一般名: {medication.generic_name}</div>
              )}
              <div className="text-sm text-gray-500">
                {medication.manufacturer} | {medication.strength}
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-3 text-gray-500 text-center">
            「{query}」に一致する薬剤が見つかりませんでした
          </div>
        </div>
      )}
    </div>
  );
}

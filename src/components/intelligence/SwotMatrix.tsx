import React from 'react';

export default function SwotMatrix({ data }: { data: any }) {
  const parseJson = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const strengths = parseJson(data.strengths);
  const weaknesses = parseJson(data.weaknesses);
  const opportunities = parseJson(data.opportunities);
  const threats = parseJson(data.threats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <h3 className="font-bold text-green-700 dark:text-green-500 mb-4 text-lg">Strengths</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-green-900 dark:text-green-300">
          {strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
          {strengths.length === 0 && <li>No strengths identified.</li>}
        </ul>
      </div>
      
      <div className="border rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
        <h3 className="font-bold text-red-700 dark:text-red-500 mb-4 text-lg">Weaknesses</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-red-900 dark:text-red-300">
          {weaknesses.map((s: string, i: number) => <li key={i}>{s}</li>)}
          {weaknesses.length === 0 && <li>No weaknesses identified.</li>}
        </ul>
      </div>
      
      <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <h3 className="font-bold text-blue-700 dark:text-blue-500 mb-4 text-lg">Opportunities</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-blue-900 dark:text-blue-300">
          {opportunities.map((s: string, i: number) => <li key={i}>{s}</li>)}
          {opportunities.length === 0 && <li>No opportunities identified.</li>}
        </ul>
      </div>
      
      <div className="border rounded-lg p-4 bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
        <h3 className="font-bold text-orange-700 dark:text-orange-500 mb-4 text-lg">Threats</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-orange-900 dark:text-orange-300">
          {threats.map((s: string, i: number) => <li key={i}>{s}</li>)}
          {threats.length === 0 && <li>No threats identified.</li>}
        </ul>
      </div>
    </div>
  );
}

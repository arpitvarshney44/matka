import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const GameRates = () => {
  const { API_URL } = useAuth();
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/gamerates`);
      setRates(res.data);
    } catch (e) {
      setRates(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="bg-green-700 text-white px-4 py-3 rounded-t-lg flex items-center">
        <button onClick={() => window.history.back()} className="mr-3 text-2xl">&#8592;</button>
        <span className="font-bold text-lg">GameRates</span>
      </div>
      <div className="bg-white rounded-b-lg shadow-md p-6">
        {loading ? <div>Loading...</div> : rates ? (
          <ul className="space-y-3">
            <li className="bg-green-700 text-white rounded px-4 py-3 flex justify-between items-center font-bold">SINGLE DIGIT <span>&#8377; {rates.singleDigit.min} - &#8377; {rates.singleDigit.max}</span></li>
            <li className="bg-green-700 text-white rounded px-4 py-3 flex justify-between items-center font-bold">DOUBLE DIGIT <span>&#8377; {rates.jodiDigit.min} - &#8377; {rates.jodiDigit.max}</span></li>
            <li className="bg-green-700 text-white rounded px-4 py-3 flex justify-between items-center font-bold">SINGLE PANA <span>&#8377; {rates.singlePana.min} - &#8377; {rates.singlePana.max}</span></li>
            <li className="bg-green-700 text-white rounded px-4 py-3 flex justify-between items-center font-bold">DOUBLE PANA <span>&#8377; {rates.doublePana.min} - &#8377; {rates.doublePana.max}</span></li>
            <li className="bg-green-700 text-white rounded px-4 py-3 flex justify-between items-center font-bold">TRIPLE PANA <span>&#8377; {rates.triplePana.min} - &#8377; {rates.triplePana.max}</span></li>
            <li className="bg-green-700 text-white rounded px-4 py-3 flex justify-between items-center font-bold">HALF SANGAM <span>&#8377; {rates.halfSangam.min} - &#8377; {rates.halfSangam.max}</span></li>
            <li className="bg-green-700 text-white rounded px-4 py-3 flex justify-between items-center font-bold">FULL SANGAM <span>&#8377; {rates.fullSangam.min} - &#8377; {rates.fullSangam.max}</span></li>
          </ul>
        ) : <div>No game rates set.</div>}
        <div className="flex justify-end mt-6">
          <button onClick={fetchRates} className="bg-green-700 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl hover:bg-green-800">&#8635;</button>
        </div>
      </div>
    </div>
  );
};

export default GameRates;

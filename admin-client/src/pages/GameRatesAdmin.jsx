import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const initialState = {
  singleDigit: { min: '', max: '' },
  jodiDigit: { min: '', max: '' },
  singlePana: { min: '', max: '' },
  doublePana: { min: '', max: '' },
  triplePana: { min: '', max: '' },
  halfSangam: { min: '', max: '' },
  fullSangam: { min: '', max: '' },
};

const GameRatesAdmin = () => {
  const { API_URL } = useAuth();
  const [rates, setRates] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/gamerates/admin`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setRates(res.data);
    } catch (e) {
      setRates(initialState);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, key, field) => {
    setRates(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: e.target.value }
    }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API_URL}/gamerates/admin`, rates, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Game rates updated!');
      setEditing(false);
      fetchRates();
    } catch (e) {
      toast.error('Failed to update game rates');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-blue-700 text-white px-4 py-3 rounded-t-lg flex items-center">
        <button onClick={() => window.history.back()} className="mr-3 text-2xl">&#8592;</button>
        <span className="font-bold text-lg">GameRates</span>
      </div>
      <div className="bg-white rounded-b-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Add Games Rate</h2>
        {loading ? <div>Loading...</div> : (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(rates).map(([key, val]) => (
              <React.Fragment key={key}>
                <div>
                  <label className="block mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Value 1</label>
                  <input type="number" value={val.min} onChange={e => handleChange(e, key, 'min')} className="w-full border px-3 py-2 rounded" disabled={!editing} />
                </div>
                <div>
                  <label className="block mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Value 2</label>
                  <input type="number" value={val.max} onChange={e => handleChange(e, key, 'max')} className="w-full border px-3 py-2 rounded" disabled={!editing} />
                </div>
              </React.Fragment>
            ))}
          </form>
        )}
        <div className="flex justify-center mt-6 space-x-4">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Edit</button>
          ) : (
            <>
              <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Save</button>
              <button onClick={() => { setEditing(false); fetchRates(); }} className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500">Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameRatesAdmin;

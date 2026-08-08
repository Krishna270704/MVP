import React, { useState, useCallback } from 'react';
import { getVisitorHistory } from '../../api/endpoints';
import { Visitor, VisitorStatus } from '../../types';
import VisitorTable from '../../components/VisitorTable';

export default function VisitorHistory() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [filters, setFilters] = useState({
    name: '',
    mobile: '',
    status_filter: '',
    date: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params: any = {};
      if (filters.name) params.name = filters.name;
      if (filters.mobile) params.mobile = filters.mobile;
      if (filters.status_filter) params.status_filter = filters.status_filter;
      if (filters.date) params.date = filters.date;

      const res = await getVisitorHistory(params);
      setVisitors(res.data);
    } catch (err) {
      console.error('Failed to search visitors:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const clearFilters = () => {
    setFilters({ name: '', mobile: '', status_filter: '', date: '' });
    setVisitors([]);
    setSearched(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Visitor History</h1>
        <p className="text-sm text-slate-500 mt-1">Search and filter past visitor records</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Visitor Name
            </label>
            <input
              name="name"
              value={filters.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="Search by name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Mobile Number
            </label>
            <input
              name="mobile"
              value={filters.mobile}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              placeholder="Search by mobile"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Status
            </label>
            <select
              name="status_filter"
              value={filters.status_filter}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="waiting">Waiting</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Date
            </label>
            <input
              name="date"
              type="date"
              value={filters.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            🔍 Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-xl transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && <VisitorTable visitors={visitors} loading={loading} />}
    </div>
  );
}

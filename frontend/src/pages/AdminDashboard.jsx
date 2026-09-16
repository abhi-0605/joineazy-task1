import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import api from '../api/axios';

export default function AdminDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', onedriveLink: '' });
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [assignmentsRes, analyticsRes] = await Promise.all([
        api.get('/assignments/admin'),
        api.get('/submissions/analytics'),
      ]);
      setAssignments(assignmentsRes.data.assignments);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateForm(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreateAssignment(e) {
    e.preventDefault();
    try {
      await api.post('/assignments', {
        title: form.title,
        description: form.description,
        dueDate: new Date(form.dueDate).toISOString(),
        onedriveLink: form.onedriveLink,
        targetType: 'all',
      });
      setForm({ title: '', description: '', dueDate: '', onedriveLink: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assignment');
    }
  }

  async function viewSubmissions(assignmentId) {
    setSelectedAssignment(assignmentId);
    try {
      const { data } = await api.get(`/submissions/${assignmentId}`);
      setSubmissions(data.submissions);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load submissions');
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {error && <p className="text-red-500">{error}</p>}

        
        {analytics && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Overall completion</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {analytics.overall.confirmed}/{analytics.overall.total}
                </p>
              </div>
            </div>
            {analytics.perGroup.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Group performance</p>
                <div className="space-y-2">
                  {analytics.perGroup.map((g) => (
                    <div key={g.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{g.name}</span>
                      <span className="text-gray-900 font-medium">{g.confirmed}/{g.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Post a new assignment</h2>
          <form onSubmit={handleCreateAssignment} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <input
              required
              placeholder="Title"
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => updateForm('dueDate', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                placeholder="OneDrive link"
                value={form.onedriveLink}
                onChange={(e) => updateForm('onedriveLink', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700">
              Post assignment
            </button>
          </form>
        </section>

     
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your assignments</h2>
          {assignments.length === 0 && <p className="text-gray-500">No assignments posted yet.</p>}

          <div className="space-y-4">
            {assignments.map((a) => {
              const confirmed = Number(a.progress?.confirmed || 0);
              const total = Number(a.progress?.total || 0);
              const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
              return (
                <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{a.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Due {new Date(a.due_date).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => viewSubmissions(a.id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View submissions
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${confirmed === total && total > 0 ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">{confirmed}/{total} done</span>
                  </div>

                  {selectedAssignment === a.id && (
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-400">
                            <th className="font-normal pb-2">Student</th>
                            <th className="font-normal pb-2">Group</th>
                            <th className="font-normal pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((s) => (
                            <tr key={s.id} className="border-t border-gray-50">
                              <td className="py-1.5">{s.student_name}</td>
                              <td className="py-1.5 text-gray-500">{s.group_name || '—'}</td>
                              <td className="py-1.5">
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    s.status === 'confirmed'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {s.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
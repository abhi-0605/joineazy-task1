import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import api from '../api/axios';

export default function StudentDashboard() {
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [memberEmail, setMemberEmail] = useState({});
  const [confirmStep, setConfirmStep] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [groupsRes, assignmentsRes] = await Promise.all([
        api.get('/groups/mine'),
        api.get('/assignments/student'),
      ]);
      setGroups(groupsRes.data.groups);
      setAssignments(assignmentsRes.data.assignments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      await api.post('/groups', { name: newGroupName });
      setNewGroupName('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group');
    }
  }

  async function handleAddMember(groupId, e) {
    e.preventDefault();
    const email = memberEmail[groupId];
    if (!email) return;
    try {
      await api.post(`/groups/${groupId}/add-member`, { email });
      setMemberEmail((m) => ({ ...m, [groupId]: '' }));
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  }

  async function handleRemoveMember(groupId, userId) {
    try {
      await api.delete(`/groups/${groupId}/remove-member/${userId}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  }

  async function handleConfirmSubmission(assignmentId) {
    try {
      await api.post(`/submissions/${assignmentId}/confirm`);
      setConfirmStep((s) => ({ ...s, [assignmentId]: false }));
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm submission');
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        {error && <p className="text-red-500">{error}</p>}

        
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your groups</h2>

          <form onSubmit={handleCreateGroup} className="flex gap-2 mb-6">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700">
              Create
            </button>
          </form>

          {groups.length === 0 && <p className="text-gray-500">You haven't joined a group yet.</p>}

          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="font-medium text-gray-900">{g.name}</h3>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  {g.members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between">
                      <span>{m.name} ({m.email})</span>
                      <button
                        onClick={() => handleRemoveMember(g.id, m.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <form onSubmit={(e) => handleAddMember(g.id, e)} className="flex gap-2 mt-3">
                  <input
                    value={memberEmail[g.id] || ''}
                    onChange={(e) => setMemberEmail((m) => ({ ...m, [g.id]: e.target.value }))}
                    placeholder="Add member by email"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
                    Add
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>

        
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignments</h2>

          {assignments.length === 0 && <p className="text-gray-500">No assignments posted yet.</p>}

          <div className="space-y-4">
            {assignments.map((a) => (
              <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{a.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{a.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Due {new Date(a.due_date).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      a.submission_status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {a.submission_status === 'confirmed' ? 'Submitted' : 'Pending'}
                  </span>
                </div>

                {a.onedrive_link && (
                    <a
                    href={a.onedrive_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Open OneDrive submission link -&gt;
                  </a>
                )}

                {a.submission_status !== 'confirmed' && (
                  <div className="mt-3">
                    {!confirmStep[a.id] ? (
                      <button
                        onClick={() => setConfirmStep((s) => ({ ...s, [a.id]: true }))}
                        className="text-sm rounded-lg bg-gray-900 text-white px-3 py-1.5 hover:bg-gray-700"
                      >
                        Yes, I have submitted
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Are you sure? This confirms your submission.</span>
                        <button
                          onClick={() => handleConfirmSubmission(a.id)}
                          className="text-sm rounded-lg bg-green-600 text-white px-3 py-1.5 hover:bg-green-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmStep((s) => ({ ...s, [a.id]: false }))}
                          className="text-sm text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
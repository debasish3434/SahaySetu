import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LuCheck, LuX, LuUserCheck } from 'react-icons/lu';
import { getPendingVolunteersApi, verifyVolunteerApi } from '../api/volunteerApi.js';
import PageLoader from '../components/common/PageLoader.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';

const VolunteerVerification = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data } = await getPendingVolunteersApi();
      setVolunteers(data.volunteers || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch pending volunteers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerify = async (userId, decision) => {
    setActionId(userId);
    try {
      await verifyVolunteerApi(userId, decision);
      toast.success(`Volunteer application ${decision}`);
      setVolunteers((prev) => prev.filter((v) => v._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process volunteer verification');
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return <PageLoader label="Loading pending volunteer applications…" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Volunteer Verification Queue</h1>
        <p className="mt-1 text-sm text-ink-500">
          Review pending volunteer applications and authorize emergency response personnel.
        </p>
      </div>

      {volunteers.length === 0 ? (
        <EmptyState
          icon={LuUserCheck}
          title="No Pending Applications"
          description="There are currently no volunteer applications awaiting coordinator verification."
        />
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-700">
              <thead className="bg-ink-100/60 text-xs font-semibold uppercase tracking-wider text-ink-500 border-b border-ink-100">
                <tr>
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Skills</th>
                  <th className="px-6 py-4">Availability</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {volunteers.map((vol) => (
                  <tr key={vol._id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink-900">{vol.name}</div>
                      <div className="text-xs text-ink-500">{vol.email}</div>
                      {vol.phone && <div className="text-xs text-ink-500">{vol.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {vol.volunteerProfile?.skills?.length > 0 ? (
                          vol.volunteerProfile.skills.map((skill, idx) => (
                            <Badge key={idx} tone="brand">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-ink-400">None listed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize font-medium text-ink-800">
                      {vol.volunteerProfile?.availability || 'Anytime'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="primary"
                          className="!w-auto !py-1.5 !px-3 text-xs"
                          loading={actionId === vol._id}
                          onClick={() => handleVerify(vol._id, 'verified')}
                        >
                          <LuCheck size={14} /> Verify
                        </Button>
                        <Button
                          variant="danger"
                          className="!w-auto !py-1.5 !px-3 text-xs"
                          loading={actionId === vol._id}
                          onClick={() => handleVerify(vol._id, 'rejected')}
                        >
                          <LuX size={14} /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VolunteerVerification;

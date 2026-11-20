import { Link } from 'react-router-dom';
import { LuMapPin, LuClock, LuUser } from 'react-icons/lu';
import { motion } from 'framer-motion';
import { StatusBadge, SeverityBadge } from '../common/StatusBadge.jsx';
import { CATEGORY_LABELS } from '../../utils/constants.js';
import { timeAgo } from '../../utils/formatters.js';

const IncidentCard = ({ incident, linkTo }) => {
  const { title, category, status, severity, address, reportedBy, createdAt } = incident;
  
  return (
    <motion.div whileHover={{ y: -2 }}>
      <Link to={linkTo} className="card block hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
            {CATEGORY_LABELS[category] || category}
          </div>
          <div className="flex gap-2">
            <StatusBadge status={status} />
            <SeverityBadge severity={severity} />
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-ink-900 mb-4 line-clamp-2">
          {title}
        </h3>
        
        <div className="mt-auto space-y-2 text-sm text-ink-600">
          <div className="flex items-start gap-2">
            <LuMapPin className="shrink-0 mt-0.5 text-ink-400" size={16} />
            <span className="line-clamp-2">{address}</span>
          </div>
          <div className="flex items-center gap-2">
            <LuClock className="shrink-0 text-ink-400" size={16} />
            <span>{timeAgo(createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <LuUser className="shrink-0 text-ink-400" size={16} />
            <span>{reportedBy?.name || 'Unknown Reporter'}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default IncidentCard;

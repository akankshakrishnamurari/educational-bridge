import React from 'react';
import { AiOutlineInbox } from 'react-icons/ai';

// Reusable "nothing here" state — replaces bare text rows / blank divs used
// for empty lists (no questions found, no channels found, etc.)

const EmptyState = ({ title = 'Nothing here yet', description, icon, action }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="text-gray-300 mb-3">
                {icon || <AiOutlineInbox size={48} />}
            </div>
            <div className="text-base font-semibold text-gray-700">{title}</div>
            {description && <div className="text-sm text-gray-500 mt-1 max-w-sm">{description}</div>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
};

export default EmptyState;

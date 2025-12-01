import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CourseNode = ({ data, isConnectable }) => {
  const { label, status, isAvailable } = data;

  // Determine class based on status
  let statusClass = 'node-pending';
  if (status === 'cursada') statusClass = 'node-cursada';
  if (status === 'final') statusClass = 'node-final';

  // Add available class if pending and available
  if (status === 'pending' && isAvailable) {
    statusClass += ' node-available';
  }

  // Add common class if it's a common subject
  if (data.isCommon) {
    statusClass += ' node-common';
  }

  return (
    <div className={`course-node ${statusClass}`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      <div>
        <strong>{label}</strong>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
    </div>
  );
};

export default memo(CourseNode);

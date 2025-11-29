import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CourseNode = ({ data, isConnectable }) => {
  const { label, status } = data;

  // Determine class based on status
  let statusClass = 'node-pending';
  if (status === 'cursada') statusClass = 'node-cursada';
  if (status === 'final') statusClass = 'node-final';

  return (
    <div className={`react-flow__node ${statusClass}`}>
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

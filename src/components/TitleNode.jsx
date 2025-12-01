import React from 'react';

const TitleNode = () => {
    return (
        <div className="nodrag" style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#f8fafc',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            width: '100%',
            // Center it visually
            transform: 'translate(-50%, -50%)'
        }}>
            Correlativas
        </div>
    );
};

export default TitleNode;

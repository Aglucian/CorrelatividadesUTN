import React, { memo } from 'react';

const GlossaryNode = () => {
    return (
        <div className="nodrag glossary-container glass-panel" style={{
            position: 'static',
            width: '200px',
            cursor: 'default',
            pointerEvents: 'all'
        }}>
            <div className="glossary-item">
                <div className="glossary-dot dot-cursada"></div>
                <span>Cursada</span>
            </div>
            <div className="glossary-item">
                <div className="glossary-dot dot-final"></div>
                <span>Aprobada</span>
            </div>
            <div className="glossary-item">
                <div className="glossary-dot dot-available"></div>
                <span>Habilitada</span>
            </div>
            <div className="glossary-item">
                <div className="glossary-dot dot-common"></div>
                <span>En Comun</span>
            </div>
            <div className="glossary-item">
                <div className="glossary-dot dot-pending"></div>
                <span>No habilitada</span>
            </div>
        </div>
    );
};

export default memo(GlossaryNode);

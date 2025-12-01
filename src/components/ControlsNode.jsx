import React, { memo } from 'react';
import { Loader, Download, Save, Plus, X } from 'lucide-react';

const ControlsNode = ({ data }) => {
    const {
        studentId,
        setStudentId,
        loadProgress,
        saveProgress,
        loading,
        saving,
        saveMessage,
        classmates,
        classmateInput,
        setClassmateInput,
        addClassmate,
        removeClassmate
    } = data;

    return (
        <div className="nodrag" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '10px',
            cursor: 'default',
            pointerEvents: 'all'
        }}>
            <div className="glass-panel" style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                padding: '10px'
            }}>
                <input
                    type="text"
                    placeholder="Legajo / ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #475569',
                        background: '#1e293b',
                        color: 'white'
                    }}
                />
                <button
                    onClick={loadProgress}
                    disabled={loading || saving}
                    className="upload-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    {loading ? <Loader className="animate-spin" size={16} /> : <Download size={16} />}
                    {loading ? '...' : 'Cargar'}
                </button>
                <button
                    onClick={saveProgress}
                    disabled={saving || loading}
                    className="upload-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? '...' : 'Guardar'}
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '10px', width: '100%' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <input
                        type="text"
                        placeholder="Legajo Compañero"
                        value={classmateInput}
                        onChange={(e) => setClassmateInput(e.target.value)}
                        style={{
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #475569',
                            background: '#1e293b',
                            color: 'white',
                            flex: 1,
                            width: '0px'
                        }}
                    />
                    <button
                        onClick={addClassmate}
                        disabled={loading}
                        className="upload-btn"
                        style={{ padding: '8px' }}
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div className="classmates-container">
                    {classmates.map(c => (
                        <div key={c.id} className="classmate-chip">
                            <span>{c.id}</span>
                            <X
                                size={14}
                                className="remove-classmate"
                                onClick={() => removeClassmate(c.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {saveMessage && (
                <div className="glass-panel" style={{
                    padding: '8px 12px',
                    color: saveMessage.type === 'success' ? '#4ade80' : '#f87171',
                    fontSize: '14px'
                }}>
                    {saveMessage.text}
                </div>
            )}
        </div>
    );
};

export default memo(ControlsNode);

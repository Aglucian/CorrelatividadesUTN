import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, FileText, Loader, Bug } from 'lucide-react';

// Configure worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const FileUpload = ({ onDataLoaded }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [debugText, setDebugText] = useState('');
    const [showDebug, setShowDebug] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }

        setLoading(true);
        setError(null);
        setDebugText('');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';
            const allItems = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                // We want to preserve some layout info if possible, but textContent is flat.
                // We'll join with a special separator to help debugging/parsing
                const pageText = textContent.items.map(item => item.str).join(' | ');
                fullText += `--- Page ${i} ---\n${pageText}\n`;

                // Store items with transform for better layout analysis if needed
                allItems.push(...textContent.items.map(item => ({
                    str: item.str,
                    x: item.transform[4],
                    y: item.transform[5]
                })));
            }

            setDebugText(fullText);

            const parsedCourses = parseCourses(fullText);
            if (parsedCourses.length === 0) {
                setError('No courses found. Try checking the "Debug Info" to see what was extracted.');
                // Fallback to demo data if parsing fails completely, so user sees something
                onDataLoaded(getDemoCourses());
            } else {
                onDataLoaded(parsedCourses);
            }
        } catch (err) {
            console.error(err);
            setError(`Error parsing PDF: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getDemoCourses = () => [
        { id: '1', name: 'Analisis Matematico I', status: 'pending', prerequisites: [], level: 1 },
        { id: '2', name: 'Algebra y Geometria Analitica', status: 'pending', prerequisites: [], level: 1 },
        { id: '3', name: 'Fisica I', status: 'pending', prerequisites: ['1', '2'], level: 1 },
        { id: '4', name: 'Algoritmos y Estructuras de Datos', status: 'pending', prerequisites: [], level: 1 },
        { id: '5', name: 'Arquitectura de Computadores', status: 'pending', prerequisites: [], level: 1 },
        { id: '6', name: 'Sistemas y Organizaciones', status: 'pending', prerequisites: [], level: 1 },
        { id: '7', name: 'Fisica II', status: 'pending', prerequisites: ['3'], level: 1 },
        { id: '8', name: 'Analisis Matematico II', status: 'pending', prerequisites: ['1', '2'], level: 1 },
        { id: '9', name: 'Sintaxis y Semantica de los Lenguajes', status: 'pending', prerequisites: ['4', '5'], level: 2 },
    ];

    const parseCourses = (text) => {
        // Split by the separator we added to get a stream of tokens
        const tokens = text.split('|').map(t => t.trim()).filter(t => t.length > 0);

        const courses = [];
        let currentCourseTokens = [];
        let nextExpectedId = 1;
        let currentLevel = 0;

        // Helper to process a chunk of tokens into a course object
        const processCourseChunk = (chunk) => {
            if (chunk.length < 2) return; // Need at least ID and Name

            const id = chunk[0];
            const rest = chunk.slice(1);

            let prereqs = [];
            let nameEndIndex = rest.length;
            let foundPrereqs = false;

            const isStrictPrereq = (t) => {
                if (t === '-') return true;
                return /\d/.test(t) && /^[\d\s,-]+$/.test(t);
            };

            for (let i = rest.length - 1; i >= 0; i--) {
                const token = rest[i];

                if (isStrictPrereq(token)) {
                    foundPrereqs = true;
                    const nums = token.split(/[- ,]+/).filter(s => /^\d+$/.test(s));
                    prereqs.push(...nums);
                    nameEndIndex = i;
                } else {
                    if (foundPrereqs) {
                        break;
                    }
                }
            }

            const name = rest.slice(0, nameEndIndex).join(' ');
            const uniquePrereqs = [...new Set(prereqs)].filter(p => p !== id);

            courses.push({
                id,
                name,
                status: 'pending',
                prerequisites: uniquePrereqs,
                level: currentLevel
            });
        };

        // Iterate through tokens
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // Detect Level Headers
            // Roman numerals: I, II, III, IV, V
            // We check exact match
            const romans = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5 };
            if (romans[token]) {
                currentLevel = romans[token];
                // If we were building a course, finish it
                if (currentCourseTokens.length > 0) {
                    processCourseChunk(currentCourseTokens);
                    currentCourseTokens = [];
                }
                continue; // Skip this token
            }

            // Check if this token is the start of a new course (the expected ID)
            if (token === String(nextExpectedId)) {
                if (currentCourseTokens.length > 0) {
                    processCourseChunk(currentCourseTokens);
                }
                currentCourseTokens = [token];
                nextExpectedId++;
            } else {
                if (currentCourseTokens.length > 0) {
                    currentCourseTokens.push(token);
                }
            }
        }

        if (currentCourseTokens.length > 0) {
            processCourseChunk(currentCourseTokens);
        }

        return courses;
    };

    return (
        <div className="glass-panel upload-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>Upload Correlativas</h3>
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                    title="Toggle Debug Info"
                >
                    <Bug size={14} />
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '10px' }}>
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                    }}
                />
                <button className="upload-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {loading ? <Loader className="animate-spin" size={18} /> : <Upload size={18} />}
                    {loading ? 'Parsing...' : 'Select PDF'}
                </button>
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{error}</div>}

            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>
                <FileText size={10} style={{ display: 'inline', marginRight: '4px' }} />
                Supports Plan 2023 PDF
            </div>

            {showDebug && debugText && (
                <textarea
                    value={debugText}
                    readOnly
                    style={{
                        width: '100%',
                        height: '200px',
                        marginTop: '10px',
                        background: '#0f172a',
                        color: '#cbd5e1',
                        fontSize: '10px',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        padding: '4px'
                    }}
                />
            )}
        </div>
    );
};

export default FileUpload;

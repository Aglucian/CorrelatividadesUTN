import React, { useState, useCallback, useEffect } from 'react';
import CourseGraph from './components/CourseGraph';
import sistemasData from '../correlativas/sistemas.json';
import mecanicaData from '../correlativas/mecanica.json';
import { supabase } from './supabaseClient';
import { Save, Loader, Download } from 'lucide-react';
import './index.css';

function App() {
  const [courses, setCourses] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Function to calculate availability based on current courses state
  const calculateAvailability = useCallback((currentCourses) => {
    return currentCourses.map(course => {
      // If already passed (final), it's not "available" to take, but we keep it as is or handle differently.
      // Usually "available" means "can start taking it".

      let isAvailable = true;

      // Check cursadas_necesarias (need to be 'cursada' or 'final')
      if (course.cursadas_necesarias) {
        for (const reqId of course.cursadas_necesarias) {
          const reqCourse = currentCourses.find(c => c.id === reqId);
          if (!reqCourse || (reqCourse.status !== 'cursada' && reqCourse.status !== 'final')) {
            isAvailable = false;
            break;
          }
        }
      }

      // Check aprobadas_necesarias (need to be 'final')
      if (isAvailable && course.aprobadas_necesarias) {
        for (const reqId of course.aprobadas_necesarias) {
          const reqCourse = currentCourses.find(c => c.id === reqId);
          if (!reqCourse || reqCourse.status !== 'final') {
            isAvailable = false;
            break;
          }
        }
      }

      return { ...course, isAvailable };
    });
  }, []);

  const handleCourseClick = useCallback((courseId) => {
    setCourses((prevCourses) => {
      const updatedCourses = prevCourses.map((course) => {
        if (course.id === courseId) {
          let newStatus = 'pending';
          if (course.status === 'pending') newStatus = 'cursada';
          else if (course.status === 'cursada') newStatus = 'final';
          else if (course.status === 'final') newStatus = 'pending';

          return { ...course, status: newStatus };
        }
        return course;
      });

      return calculateAvailability(updatedCourses);
    });
  }, [calculateAvailability]);

  const loadCareer = (data) => {
    const romanToNumber = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5 };

    const initialCourses = data.map(item => ({
      id: String(item.id),
      name: item.asignatura,
      level: romanToNumber[item.nivel] || 0,
      cursadas_necesarias: item.cursadas_necesarias.map(String),
      aprobadas_necesarias: item.aprobadas_necesarias.map(String),
      // Prerequisites for the graph edges are a union of both
      prerequisites: [...new Set([...item.cursadas_necesarias, ...item.aprobadas_necesarias])].map(String),
      status: 'pending',
      isAvailable: false // Will be calculated immediately
    }));

    setCourses(calculateAvailability(initialCourses));
  };

  const loadProgress = async () => {
    if (!studentId.trim()) {
      setSaveMessage({ type: 'error', text: 'Ingresa un ID o Legajo' });
      return;
    }

    setLoading(true);
    setSaveMessage(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized. Check .env.local');
      }

      const { data, error } = await supabase
        .from('estudiantes')
        .select('materias')
        .eq('id', studentId)
        .single();

      if (error) throw error;

      if (data && data.materias) {
        setCourses((prevCourses) => {
          const updatedCourses = prevCourses.map(course => {
            const savedCourse = data.materias.find(m => m.id === course.id);
            if (savedCourse) {
              return { ...course, status: savedCourse.status };
            }
            return course;
          });
          return calculateAvailability(updatedCourses);
        });
        setSaveMessage({ type: 'success', text: 'Cargado correctamente!' });
      } else {
        setSaveMessage({ type: 'error', text: 'No se encontraron datos.' });
      }
    } catch (error) {
      console.error('Error loading:', error);
      setSaveMessage({ type: 'error', text: 'Error al cargar. Revisa la consola.' });
    } finally {
      setLoading(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const saveProgress = async () => {
    if (!studentId.trim()) {
      setSaveMessage({ type: 'error', text: 'Ingresa un ID o Legajo' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      // Prepare data to save: only ID and status to save space/bandwidth
      const progressData = courses.map(c => ({ id: c.id, status: c.status }));

      if (!supabase) {
        throw new Error('Supabase client not initialized. Check .env.local');
      }

      const { error } = await supabase
        .from('estudiantes')
        .upsert({ id: studentId, materias: progressData });

      if (error) throw error;

      setSaveMessage({ type: 'success', text: 'Guardado correctamente!' });
    } catch (error) {
      console.error('Error saving:', error);
      setSaveMessage({ type: 'error', text: 'Error al guardar. Revisa la consola.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {courses.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 100,
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          padding: '10px'
        }} className="glass-panel">
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
          {saveMessage && (
            <span style={{
              color: saveMessage.type === 'success' ? '#4ade80' : '#f87171',
              fontSize: '14px',
              marginLeft: '5px'
            }}>
              {saveMessage.text}
            </span>
          )}
        </div>
      )}

      {courses.length === 0 ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: '#94a3b8',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h1>Web Correlatividades</h1>
          <p>Selecciona una carrera para visualizar el plan.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="upload-btn"
              onClick={() => loadCareer(sistemasData)}
              style={{ padding: '10px 20px', cursor: 'pointer' }}
            >
              Ingeniería en Sistemas
            </button>
            <button
              className="upload-btn"
              onClick={() => loadCareer(mecanicaData)}
              style={{ padding: '10px 20px', cursor: 'pointer' }}
            >
              Ingeniería Mecánica
            </button>
          </div>
        </div>
      ) : (
        <CourseGraph courses={courses} onCourseClick={handleCourseClick} />
      )}
    </div>
  );
}

export default App;

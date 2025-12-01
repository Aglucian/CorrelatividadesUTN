import React, { useState, useCallback, useEffect } from 'react';
import CourseGraph from './components/CourseGraph';
import sistemasData from '../correlativas/sistemas.json';
import mecanicaData from '../correlativas/mecanica.json';
import { supabase } from './supabaseClient';
import { Save, Loader, Download, Plus, X } from 'lucide-react';
import './index.css';

function App() {
  const [courses, setCourses] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [classmates, setClassmates] = useState([]); // Array of { id, courses }
  const [classmateInput, setClassmateInput] = useState('');
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

  // Calculate common availability across main user and classmates
  const calculateCommonAvailability = useCallback((currentCourses, currentClassmates) => {
    return currentCourses.map(course => {
      // Start with the course as is (including its own isAvailable status)
      let isCommon = false;

      // Only check for common availability if the course is available for the main user
      // AND there are classmates loaded
      // User requirement: "materias que todos los legajos presentes y el tablero actual tendrian individualmente como Habilitada"
      // This means status MUST be 'pending' AND isAvailable MUST be true for everyone.

      if (course.status === 'pending' && course.isAvailable && currentClassmates.length > 0) {
        isCommon = true;
        for (const classmate of currentClassmates) {
          const classmateCourse = classmate.courses.find(c => c.id === course.id);
          // Check if classmate has it as 'Habilitada' (pending + available)
          if (!classmateCourse || classmateCourse.status !== 'pending' || !classmateCourse.isAvailable) {
            isCommon = false;
            break;
          }
        }
      }

      return { ...course, isCommon };
    });
  }, []);

  // Update courses when classmates change
  useEffect(() => {
    setCourses(prevCourses => calculateCommonAvailability(prevCourses, classmates));
  }, [classmates, calculateCommonAvailability]);

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

      const withAvailability = calculateAvailability(updatedCourses);
      return calculateCommonAvailability(withAvailability, classmates);
    });
  }, [calculateAvailability, calculateCommonAvailability, classmates]);

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
      isAvailable: false, // Will be calculated immediately
      isCommon: false
    }));

    const withAvailability = calculateAvailability(initialCourses);
    setCourses(calculateCommonAvailability(withAvailability, classmates));
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
          const withAvailability = calculateAvailability(updatedCourses);
          return calculateCommonAvailability(withAvailability, classmates);
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

  const addClassmate = async () => {
    if (!classmateInput.trim()) return;
    if (classmates.some(c => c.id === classmateInput)) {
      setSaveMessage({ type: 'error', text: 'Ya agregado.' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('materias')
        .eq('id', classmateInput)
        .single();

      if (error) throw error;

      if (data && data.materias) {
        // Create a temporary course list for the classmate to calculate THEIR availability
        // We need the base structure of courses (without status) to map the classmate's status
        // Since 'courses' state might have modified statuses, we should ideally use the base structure.
        // However, assuming the structure (IDs, dependencies) doesn't change, we can use 'courses' as a template.

        const classmateCourses = courses.map(c => {
          const savedCourse = data.materias.find(m => m.id === c.id);
          return {
            ...c,
            status: savedCourse ? savedCourse.status : 'pending',
            isAvailable: false // Reset for calculation
          };
        });

        const calculatedClassmateCourses = calculateAvailability(classmateCourses);

        setClassmates(prev => [...prev, { id: classmateInput, courses: calculatedClassmateCourses }]);
        setClassmateInput('');
        setSaveMessage({ type: 'success', text: 'Compañero agregado!' });
      } else {
        setSaveMessage({ type: 'error', text: 'No encontrado.' });
      }
    } catch (error) {
      console.error('Error adding classmate:', error);
      setSaveMessage({ type: 'error', text: 'Error al buscar.' });
    } finally {
      setLoading(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };


  const removeClassmate = (id) => {
    setClassmates(prev => prev.filter(c => c.id !== id));
  };

  const controlsData = React.useMemo(() => ({
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
  }), [
    studentId,
    loading,
    saving,
    saveMessage,
    classmates,
    classmateInput,
    calculateAvailability, // dependencies of functions
    calculateCommonAvailability
  ]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>




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
        <CourseGraph
          courses={courses}
          onCourseClick={handleCourseClick}
          controlsData={controlsData}
        />
      )}
    </div>
  );
}

export default App;

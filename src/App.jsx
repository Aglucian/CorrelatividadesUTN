import React, { useState, useCallback, useEffect } from 'react';
import CourseGraph from './components/CourseGraph';
import sistemasData from '../correlativas/sistemas.json';
import mecanicaData from '../correlativas/mecanica.json';
import './index.css';

function App() {
  const [courses, setCourses] = useState([]);

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
        <CourseGraph courses={courses} onCourseClick={handleCourseClick} />
      )}
    </div>
  );
}

export default App;

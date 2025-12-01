import React, { useState, useCallback } from 'react';
import CourseGraph from './components/CourseGraph';
import sistemasData from '../correlativas/sistemas.json';
import './index.css';

function App() {
  const [courses, setCourses] = useState([]);

  const handleCourseClick = useCallback((courseId) => {
    setCourses((prevCourses) => {
      return prevCourses.map((course) => {
        if (course.id === courseId) {
          let newStatus = 'pending';
          if (course.status === 'pending') newStatus = 'cursada';
          else if (course.status === 'cursada') newStatus = 'final';
          else if (course.status === 'final') newStatus = 'pending';

          return { ...course, status: newStatus };
        }
        return course;
      });
    });
  }, []);

  const loadCareer = (data) => {
    const romanToNumber = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5 };

    const parsedCourses = data.map(item => ({
      id: String(item.id),
      name: item.asignatura,
      level: romanToNumber[item.nivel] || 0,
      prerequisites: item.cursadas_necesarias.map(String),
      status: 'pending'
    }));

    setCourses(parsedCourses);
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
          </div>
        </div>
      ) : (
        <CourseGraph courses={courses} onCourseClick={handleCourseClick} />
      )}
    </div>
  );
}

export default App;

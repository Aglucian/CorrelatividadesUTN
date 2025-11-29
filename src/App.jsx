import React, { useState, useCallback } from 'react';
import CourseGraph from './components/CourseGraph';
import FileUpload from './components/FileUpload';
import './index.css';

function App() {
  const [courses, setCourses] = useState([]);

  const handleDataLoaded = useCallback((parsedCourses) => {
    setCourses(parsedCourses);
  }, []);

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

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <FileUpload onDataLoaded={handleDataLoaded} />

      {courses.length === 0 ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          color: '#94a3b8',
          flexDirection: 'column'
        }}>
          <h1>Web Correlatividades</h1>
          <p>Upload a PDF to visualize the plan.</p>
        </div>
      ) : (
        <CourseGraph courses={courses} onCourseClick={handleCourseClick} />
      )}
    </div>
  );
}

export default App;

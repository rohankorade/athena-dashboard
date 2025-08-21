// src/components/PerformanceList.jsx

import React from 'react';

function PerformanceList({ data }) {
  return (
    <table className="performance-table">
      <tbody>
        {data.map((test) => (
          <tr key={test._id}>
            <td>{test.testNumber}</td>
            <td>{test.subject}</td>
            <td className="score-cell">{test.marksScored.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PerformanceList;
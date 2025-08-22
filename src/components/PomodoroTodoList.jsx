import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PomodoroTodoList() {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Fetch tasks from backend on component mount
  useEffect(() => {
    axios.get('/api/tasks')
      .then(res => {
        setTasks(res.data);
      })
      .catch(err => console.error("Error fetching tasks:", err));
  }, []);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    axios.post('/api/tasks', { text: newTaskText })
      .then(res => {
        setTasks([res.data, ...tasks]); // Add new task to the top of the list
        setNewTaskText(''); // Clear input
      })
      .catch(err => console.error("Error adding task:", err));
  };

  const handleToggleTask = (task) => {
    const updatedTask = { ...task, completed: !task.completed };

    axios.put(`/api/tasks/${task._id}`, updatedTask)
      .then(res => {
        setTasks(tasks.map(t => (t._id === task._id ? res.data : t)));
      })
      .catch(err => console.error("Error updating task:", err));
  };

  const handleDeleteTask = (taskId) => {
    axios.delete(`/api/tasks/${taskId}`)
      .then(() => {
        setTasks(tasks.filter(t => t._id !== taskId));
      })
      .catch(err => console.error("Error deleting task:", err));
  };

  return (
    <div className="todo-list-container">
      <h3>To-Do List</h3>
      <form onSubmit={handleAddTask} className="todo-add-form">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="What are you working on?"
        />
        <button type="submit" className="button button-primary">Add Task</button>
      </form>
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => handleToggleTask(task)}
            />
            <span>{task.text}</span>
            <button onClick={() => handleDeleteTask(task._id)} className="button-delete">
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PomodoroTodoList;

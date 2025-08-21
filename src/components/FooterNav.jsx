// src/components/FooterNav.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';

const navLinks = [
  { label: 'CSP', path: '/csp' },
  { label: 'Editorials', path: '/editorials' },
  { label: 'General Studies', path: '/general-studies' },
  { label: 'Sociology', path: '/sociology' },
  { label: 'Answer Writing', path: '/answer-writing' },
  { label: 'Utilities', path: '/utilities' }
];

function FooterNav() {
  return (
    <>
      {navLinks.map(link => (
        <NavLink 
          key={link.label} 
          to={link.path}
          className="nav-button"
        >
          {link.label}
        </NavLink>
      ))}
    </>
  );
}

export default FooterNav;
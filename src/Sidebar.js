import React from 'react';
import { slide as Menu } from 'react-burger-menu';
import './Sidebar.css';

export default props => {
  return (
    <Menu lright
        isOpen = {false}
        width={ '20%' } 
    >
      <a className="menu-item" href="/papers/instances/me">
        My Solved Papers
      </a>
      <a className="menu-item" href="/questions">
        My Solved Questions 
      </a>
      <a className="menu-item" href="/papers">
        My created Papers
      </a>
      <a className="menu-item" href="/questions">
        My Created Questions
      </a>
    </Menu>
  );
};
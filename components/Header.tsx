
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { User, UserRole } from '../types';
import { Select } from './ui';

interface HeaderProps {
    title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { state, dispatch } = useAppContext();
  const { currentUser, users } = state;

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUser = users.find(u => u.id === parseInt(e.target.value));
    if (selectedUser) {
      dispatch({ type: 'SET_USER', payload: selectedUser });
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
      <div className="flex items-center space-x-4">
        <div className="text-right">
            <span className="text-gray-800 dark:text-white font-semibold">{currentUser.name}</span>
            <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.role}</p>
        </div>
        <div className="w-48">
             <Select id="user-switcher" value={currentUser.id} onChange={handleUserChange} className="!py-1">
                {users.map(user => (
                    <option key={user.id} value={user.id}>
                       Mudar para: {user.name}
                    </option>
                ))}
            </Select>
        </div>
      </div>
    </header>
  );
};

export default Header;

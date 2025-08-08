// src/components/health/HealthDashboardModal.jsx

import React from 'react';
import { Modal } from '../ui/Modal.jsx';
import { HealthDashboard } from '../pages/HealthDashboard.jsx';

/**
 * Health dashboard in a modal wrapper
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {function} props.onClose - Close handler
 */
export const HealthDashboardModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="max-w-6xl">
      <HealthDashboard />
    </Modal>
  );
};
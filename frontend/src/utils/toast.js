import toast from 'react-hot-toast';

export const showToast = {
  success: (message) => {
    toast.success(message, {
      duration: 3000,
      style: {
        background: '#22c55e',
        color: '#fff',
      },
    });
  },
  
  error: (message) => {
    toast.error(message, {
      duration: 4000,
      style: {
        background: '#ef4444',
        color: '#fff',
      },
    });
  },
  
  info: (message) => {
    toast(message, {
      duration: 3000,
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
    });
  },
  
  warning: (message) => {
    toast(message, {
      duration: 3000,
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
    });
  },
  
  loading: (message) => {
    return toast.loading(message);
  },
  
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  }
};

export default showToast;

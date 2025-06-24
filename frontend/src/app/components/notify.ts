import { toast, ToastOptions } from 'react-hot-toast';

export const notify = {
  success: (message: string, options?: ToastOptions) => toast.success(message, options),
  error: (message: string, options?: ToastOptions) => toast.error(message, options),
  info: (message: string, options?: ToastOptions) => toast(message, options),
}; 
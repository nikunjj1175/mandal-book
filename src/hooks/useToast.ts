import { toast } from 'sonner';

export const useToast = () => {
  const success = (message: string, options?: any) => {
    toast.success(message, {
      duration: 4000,
      ...options,
    });
  };

  const error = (message: string, options?: any) => {
    toast.error(message, {
      duration: 5000,
      ...options,
    });
  };

  const warning = (message: string, options?: any) => {
    toast.warning(message, {
      duration: 4000,
      ...options,
    });
  };

  const info = (message: string, options?: any) => {
    toast.info(message, {
      duration: 4000,
      ...options,
    });
  };

  const loading = (message: string, options?: any) => {
    return toast.loading(message, {
      duration: Infinity,
      ...options,
    });
  };

  const dismiss = (toastId: string | number) => {
    toast.dismiss(toastId);
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
  };
};






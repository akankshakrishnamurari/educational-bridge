import { toast } from 'react-toastify';

// Single toast helper so every page uses the same notification style instead of
// native alert()/window.confirm() or ad hoc toast.* calls with inconsistent options.
export const notify = {
    success: (message) => toast.success(message),
    error: (message) => toast.error(message),
    info: (message) => toast.info(message),
    warning: (message) => toast.warning(message),
};

export default notify;

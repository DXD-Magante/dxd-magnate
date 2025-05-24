export const formatDate = (date) => {
    if (!date) return "N/A";
    if (typeof date === 'string') date = new Date(date);
    return format(date, 'dd MMM yyyy');
  };
  
  export const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };
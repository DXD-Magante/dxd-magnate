export const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  export const formatDate = (dateString, format = 'MMM d, yyyy') => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const options = { 
      year: format.includes('yyyy') ? 'numeric' : undefined,
      month: format.includes('MMM') ? 'short' : undefined,
      day: format.includes('d') ? 'numeric' : undefined
    };
    
    return date.toLocaleDateString('en-US', options);
  };
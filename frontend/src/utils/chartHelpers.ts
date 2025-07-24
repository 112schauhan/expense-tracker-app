export const generateColorPalette = (count: number): string[] => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#AED6F1', '#D5DBDB',
    '#FFA07A', '#20B2AA', '#87CEEB', '#DDA0DD', '#F0E68C'
  ];
  
  if (count <= colors.length) {
    return colors.slice(0, count);
  }
  
  // Generate additional colors if needed
  const additionalColors = [];
  for (let i = colors.length; i < count; i++) {
    const hue = (i * 137.5) % 360; // Golden angle approximation
    additionalColors.push(`hsl(${hue}, 70%, 60%)`);
  }
  
  return [...colors, ...additionalColors];
};

export const formatChartValue = (value: number, type: 'currency' | 'number' = 'currency'): string => {
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }
  
  return value.toLocaleString();
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const getChartTooltipStyle = () => ({
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '12px',
  padding: '8px 12px'
});

export const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    'FOOD': '#FF6B6B',
    'TRANSPORT': '#4ECDC4',
    'ACCOMMODATION': '#45B7D1',
    'OFFICE_SUPPLIES': '#96CEB4',
    'SOFTWARE': '#FFEAA7',
    'TRAINING': '#DDA0DD',
    'MARKETING': '#98D8C8',
    'TRAVEL': '#F7DC6F',
    'ENTERTAINMENT': '#AED6F1',
    'UTILITIES': '#D5DBDB',
    'OTHER': '#FFA07A'
  };
  
  return categoryColors[category] || '#999999';
};

export const formatMonthLabel = (month: string): string => {
  const date = new Date(month + '-01');
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const calculateTrend = (current: number, previous: number): { 
  percentage: number; 
  direction: 'up' | 'down' | 'neutral';
  isGood: boolean;
} => {
  if (previous === 0) {
    return { percentage: 0, direction: 'neutral', isGood: true };
  }
  
  const percentage = ((current - previous) / previous) * 100;
  const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
  const isGood = percentage <= 0; // For expenses, decrease is good
  
  return { percentage: Math.abs(percentage), direction, isGood };
};

export const aggregateDataByPeriod = (
  data: Array<{ date: string; amount: number }>,
  period: 'day' | 'week' | 'month' | 'year'
): Array<{ period: string; amount: number; count: number }> => {
  const grouped = data.reduce((acc, item) => {
    const date = new Date(item.date);
    let key: string;
    
    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!acc[key]) {
      acc[key] = { period: key, amount: 0, count: 0 };
    }
    
    acc[key].amount += item.amount;
    acc[key].count += 1;
    
    return acc;
  }, {} as Record<string, { period: string; amount: number; count: number }>);
  
  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
};

// export const generateColorPalette = (count: number): string[] => {
//   const colors = [
//     '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
//     '#DDA0DD', '#98D8C8', '#F7DC6F', '#AED6F1', '#D5DBDB'
//   ];
  
//   if (count <= colors.length) {
//     return colors.slice(0, count);
//   }
  
//   // Generate additional colors if needed
//   const additionalColors = [];
//   for (let i = colors.length; i < count; i++) {
//     const hue = (i * 137.5) % 360; // Golden angle approximation
//     additionalColors.push(`hsl(${hue}, 70%, 60%)`);
//   }
  
//   return [...colors, ...additionalColors];
// };

// export const formatChartValue = (value: number, type: 'currency' | 'number' = 'currency'): string => {
//   if (type === 'currency') {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     }).format(value);
//   }
  
//   return value.toLocaleString();
// };
export const generateColorPalette = (count: number): string[] => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#AED6F1', '#D5DBDB'
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
      currency: 'USD'
    }).format(value);
  }
  
  return value.toLocaleString();
};
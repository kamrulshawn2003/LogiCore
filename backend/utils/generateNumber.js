const generateNumber = (prefix, type = '') => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `${prefix}-${year}${month}${day}-${random}${type}`;
};

module.exports = {
  generateOrderNumber: () => generateNumber('ORD'),
  generatePONumber: () => generateNumber('PO'),
  generateShipmentNumber: () => generateNumber('SHP'),
  generateTrackingNumber: () => generateNumber('TRK'),
  generateSKU: (category, supplier) => {
    const cat = category.substring(0, 3).toUpperCase();
    const sup = supplier.substring(0, 3).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${cat}-${sup}-${rand}`;
  }
};
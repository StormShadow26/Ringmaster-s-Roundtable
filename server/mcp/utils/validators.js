// utils/validators.js

// --- Helper function to clean and validate attraction names ---
export function cleanAttractionName(name) {
  if (!name || typeof name !== 'string') return null;
  
  // Remove common suffixes that don't add value
  const cleaned = name
    .replace(/\s+(Restaurant|Cafe|Bar|Shop|Store|Hotel|Mall)$/i, '')
    .replace(/\s+(Branch|Location|Outlet)$/i, '')
    .trim();
  
  // Filter out generic/low-quality names
  const invalidNames = [
    'untitled', 'unnamed', 'unknown', 'n/a', 'tbd',
    'parking', 'atm', 'toilet', 'restroom', 'wc'
  ];
  
  if (invalidNames.some(invalid => cleaned.toLowerCase().includes(invalid))) {
    return null;
  }
  
  // Must be at least 3 characters and not all numbers
  if (cleaned.length < 3 || /^\d+$/.test(cleaned)) {
    return null;
  }
  
  return cleaned;
}

// --- Helper function to merge and deduplicate attractions ---
export function mergeAttractions(apiAttractions, staticAttractions) {
  const merged = {};
  
  // Add API attractions first (higher priority)
  apiAttractions.forEach(attraction => {
    const name = cleanAttractionName(attraction.name);
    if (name) {
      merged[name.toLowerCase()] = { ...attraction, name, source: attraction.source || 'api' };
    }
  });
  
  // Add static attractions if not already present
  staticAttractions.forEach(attraction => {
    const name = cleanAttractionName(attraction.name);
    if (name && !merged[name.toLowerCase()]) {
      merged[name.toLowerCase()] = { ...attraction, name, source: 'static' };
    }
  });
  
  return Object.values(merged);
}
export function convertToBaseUnit(product, selectedUnit, quantity) {
  if (!product || !product.unitOfMeasure) return quantity;
  const baseUnit = product.unitOfMeasure.trim();
  const conversions = product.uomConversions || [];
  const factor = getEffectiveFactor(conversions, baseUnit, selectedUnit);
  return quantity * factor;
}

function getEffectiveFactor(conversions, baseUnit, selectedUnit) {
  if (selectedUnit.toLowerCase().trim() === baseUnit.toLowerCase().trim()) return 1;
  let totalFactor = 1;
  let currentUnit = selectedUnit;
  let visited = new Set();

  while (currentUnit && currentUnit.toLowerCase().trim() !== baseUnit.toLowerCase().trim()) {
    if (visited.has(currentUnit.toLowerCase().trim())) {
      throw new Error(`Circular conversion detected for unit: ${selectedUnit}`);
    }
    visited.add(currentUnit.toLowerCase().trim());
    const conversion = conversions.find(
      (conv) => conv.unit.toLowerCase().trim() === currentUnit.toLowerCase().trim()
    );
    if (!conversion) {
      throw new Error(`Conversion not found for unit: ${currentUnit}`);
    }
    totalFactor *= conversion.factor;
    currentUnit = conversion.convertFrom || baseUnit; 
  }
  return totalFactor;
}

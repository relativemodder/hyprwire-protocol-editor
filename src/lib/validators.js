// @ts-nocheck
/**
 * Protocol validation utilities
 */

/**
 * Validate enum structure
 * @param {Object} enumDef - Enum definition
 * @param {number} idx - Enum index in protocol
 * @returns {string[]} Array of error messages
 */
export function validateEnum(enumDef, idx) {
  const errors = [];
  
  if (!enumDef.name) {
    errors.push(`Enum at index ${idx} missing name`);
  }
  
  const seenIndices = new Set();
  enumDef.values.forEach((val, valIdx) => {
    if (seenIndices.has(val.idx)) {
      errors.push(`Duplicate enum value index ${val.idx} in ${enumDef.name}`);
    }
    seenIndices.add(val.idx);
    
    if (!val.name) {
      errors.push(`Enum value at index ${valIdx} in ${enumDef.name} missing name`);
    }
  });
  
  return errors;
}

/**
 * Validate protocol object structure
 * @param {Object} obj - Protocol object
 * @param {number} idx - Object index in protocol
 * @returns {string[]} Array of error messages
 */
export function validateObject(obj, idx) {
  const errors = [];
  
  if (!obj.name) {
    errors.push(`Object at index ${idx} missing name`);
  }
  
  if (!obj.version || obj.version < 1) {
    errors.push(`Object ${obj.name} has invalid version`);
  }
  
  obj.methods?.forEach((method, methodIdx) => {
    if (!method.name) {
      errors.push(`Method at index ${methodIdx} in ${obj.name} missing name`);
    }
    
    if (!['c2s', 's2c'].includes(method.direction)) {
      errors.push(`Method ${method.name} has invalid direction: ${method.direction}`);
    }
  });
  
  return errors;
}

/**
 * Validate entire protocol structure
 * @param {Object} protocol - Protocol object to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateProtocol(protocol) {
  const errors = [];
  
  if (!protocol.name) {
    errors.push('Protocol must have a name');
  }
  
  if (!protocol.version || protocol.version < 1) {
    errors.push('Protocol must have a valid version');
  }
  
  protocol.elements?.forEach((element, idx) => {
    if (element.type === 'enum') {
      errors.push(...validateEnum(element, idx));
    } else if (element.type === 'object') {
      errors.push(...validateObject(element, idx));
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

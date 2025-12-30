// @ts-nocheck
/**
 * Helper functions for form input handling
 */

/**
 * Create a text input handler that updates a property on an object
 * @param {Object} obj - The object to update
 * @param {string} prop - The property name
 * @param {Function} callback - Callback after update
 * @param {boolean} allowEmpty - Whether to allow empty values (default: true)
 */
export function createTextInputHandler(obj, prop, callback, allowEmpty = true) {
  return (e) => {
    const value = e.target.value;
    obj[prop] = allowEmpty && !value ? undefined : value;
    callback();
  };
}

/**
 * Create a number input handler
 * @param {Object} obj - The object to update
 * @param {string} prop - The property name
 * @param {Function} callback - Callback after update
 * @param {number} defaultValue - Default value if parsing fails
 */
export function createNumberInputHandler(obj, prop, callback, defaultValue = 0) {
  return (e) => {
    obj[prop] = parseInt(e.target.value) || defaultValue;
    callback();
  };
}

/**
 * Create a checkbox input handler
 * @param {Object} obj - The object to update
 * @param {string} prop - The property name
 * @param {Function} callback - Callback after update
 */
export function createCheckboxHandler(obj, prop, callback) {
  return (e) => {
    obj[prop] = e.target.checked || undefined;
    callback();
  };
}

/**
 * Create a select/dropdown handler
 * @param {Object} obj - The object to update
 * @param {string} prop - The property name
 * @param {Function} callback - Callback after update
 */
export function createSelectHandler(obj, prop, callback) {
  return (e) => {
    obj[prop] = e.target.value;
    callback();
  };
}

/**
 * Ensure description object exists
 * @param {Object} obj - The object that should have a description
 */
export function ensureDescription(obj) {
  if (!obj.description) {
    obj.description = {};
  }
}

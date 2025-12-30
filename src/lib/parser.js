// @ts-nocheck
import { escapeXml, unescapeXml, getDirectTextContent, serializeMultilineElement } from './xml-utils';
import { validateProtocol } from './validators';


/**
 * @fileoverview HyprWire Protocol Serialization/Deserialization Module
 * @description Module for parsing, serializing, and representing HyprWire protocol definitions
 */

/**
 * @typedef {Object} ProtocolEnumValue
 * @property {number} idx - Index value
 * @property {string} name - Enum value name
 * @property {string} [description] - Optional description
 */

/**
 * @typedef {Object} ProtocolEnum
 * @property {string} name - Enum name
 * @property {ProtocolEnumValue[]} values - Enum values
 */

/**
 * @typedef {Object} ProtocolDescription
 * @property {string} [summary] - Short summary
 * @property {string} [text] - Full description text
 */

/**
 * @typedef {Object} ProtocolArgument
 * @property {string} name - Argument name
 * @property {string} type - Argument type (uint, varchar, fd, array, enum, etc.)
 * @property {string} [interface] - Interface name for enum types
 * @property {string} [summary] - Argument summary
 */

/**
 * @typedef {Object} ProtocolMethod
 * @property {string} name - Method name
 * @property {string} direction - 'c2s' (client-to-server) or 's2c' (server-to-client)
 * @property {ProtocolDescription} [description] - Method description
 * @property {ProtocolArgument[]} args - Method arguments
 * @property {string} [returns] - Return interface name for c2s methods
 * @property {boolean} [destructor] - Whether this is a destructor method
 */

/**
 * @typedef {Object} ProtocolObject
 * @property {string} name - Object name
 * @property {number} version - Protocol version
 * @property {ProtocolDescription} [description] - Object description
 * @property {ProtocolMethod[]} methods - Object methods
 */

/**
 * @typedef {Object} Protocol
 * @property {string} name - Protocol name
 * @property {number} version - Protocol version
 * @property {string} [copyright] - Copyright information
 * @property {string} [description] - Protocol description
 * @property {ProtocolEnum[]} enums - Protocol enumerations
 * @property {ProtocolObject[]} objects - Protocol objects
 * @property {Array<{type: string, [key: string]: any}>} elements - Combined enums and objects in order of appearance
 */

/**
 * HyprWire Protocol Parser and Serializer
 */
class HyprWireProtocol {
  /**
   * Parse XML protocol definition
   * @param {string} xmlString
   * @returns {Protocol}
   */
  static parse(xmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    
    const protocolEl = doc.querySelector('protocol');
    if (!protocolEl) {
      throw new Error('Invalid protocol: missing <protocol> element');
    }

    const protocol = {
      name: protocolEl.getAttribute('name') || '',
      version: parseInt(protocolEl.getAttribute('version') || '1'),
      copyright: getDirectTextContent(protocolEl, 'copyright'),
      description: getDirectTextContent(protocolEl, 'description'),
      elements: this._parseElements(protocolEl)
    };

    
    return protocol;
  }

  
  static _parseElements(protocolEl) {
    const elements = [];
    const children = protocolEl.children;
    
    for (const child of children) {
      if (child.tagName === 'enum') {
        elements.push({
          type: 'enum',
          ...this._parseSingleEnum(child)
        });
      } else if (child.tagName === 'object') {
        elements.push({
          type: 'object',
          ...this._parseSingleObject(child)
        });
      }
    }
    return elements;
  }

    /**
     * Parse a single enum element
     * @private
     * @param {Element} enumEl - The enum XML element
     * @returns {ProtocolEnum} Parsed enum object
     */
    static _parseSingleEnum(enumEl) {
        /** @type {ProtocolEnumValue[]} */
        const values = [];
        enumEl.querySelectorAll(':scope > value').forEach((v) => {
            values.push({
                idx: parseInt(v.getAttribute('idx') || '0'),
                name: v.getAttribute('name') || '',
                description: v.getAttribute('description') ?? undefined,
            });
        });
        return { name: enumEl.getAttribute('name') || '', values };
    }

/**
 * Parse a single object element
 * @private
 * @param {Element} objEl - The object XML element
 * @returns {ProtocolObject} Parsed object
 */
static _parseSingleObject(objEl) {
    /** @type {ProtocolObject} */
    const obj = {
        name: objEl.getAttribute('name') || '',
        version: parseInt(objEl.getAttribute('version') || '1'),
        description: this._parseDescription(objEl),
        methods: []
    };
    
    objEl.querySelectorAll(':scope > c2s, :scope > s2c').forEach((mEl) => {
        obj.methods.push(this._parseMethod(mEl, mEl.tagName.toLowerCase()));
    });
    return obj;
}

  /**
   * Serialize protocol to XML string
   * @param {Protocol} protocol
   * @returns {string}
   */
  static serialize(protocol /** @type {Protocol} */) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<protocol name="${protocol.name}" version="${protocol.version}">\n`;
    
    if (protocol.copyright) {
      xml += serializeMultilineElement('copyright', protocol.copyright, 2);
      xml += '\n';
    }
    
    if (protocol.description) {
      xml += serializeMultilineElement('description', protocol.description, 2);
      xml += '\n';
    }
    
    protocol.elements.forEach(el => {
      if (el.type === 'enum') xml += this._serializeEnum(el, 2);
      else if (el.type === 'object') xml += this._serializeObject(el, 2);
    });
    
    return xml.trimEnd() + '\n</protocol>';
  }

  /**
   * Parse description element
   * @private
   */
  
  static _parseDescription(parent, tagName = 'description') {
    const el = parent.querySelector(`:scope > ${tagName}`);
    if (!el) return undefined;
    
    const summary = el.getAttribute('summary');
    let text = el.textContent;
    
    // Clean up the text
    if (text) {
      // Remove first and last newline
      text = text.replace(/^\n/, '').replace(/\n$/, '');
      
      if (text.trim()) {
        // Split into lines and remove common leading whitespace
        const lines = text.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        
        if (nonEmptyLines.length > 0) {
          // Find minimum indentation
          const minIndent = Math.min(
            ...nonEmptyLines.map(line => {
              const match = line.match(/^(\s*)/);
              return match ? match[1].length : 0;
            })
          );
          
          // Remove common indentation from all lines
          const cleanedLines = lines.map(line => {
            if (line.trim().length === 0) return '';
            return line.slice(minIndent);
          });
          
          text = cleanedLines.join('\n').trim();
        }
      } else {
        text = undefined;
      }
    }
    
    // If there's both summary and text content, preserve both
    if (summary && text) {
      return { summary, text };
    }
    // If only summary exists
    if (summary) {
      return { summary };
    }
    // If only text exists
    if (text) {
      return { text };
    }
    
    return undefined;
  }

  /**
   * Parse enumerations
   * @private
   */
  static _parseEnums(protocolEl) {
    const enums = [];
    const enumEls = protocolEl.querySelectorAll(':scope > enum');
    
    enumEls.forEach(enumEl => {
      const enumDef = {
        name: enumEl.getAttribute('name') || '',
        values: []
      };
      
      const valueEls = enumEl.querySelectorAll('value');
      
      valueEls.forEach(valueEl => {
        enumDef.values.push({
          idx: parseInt(valueEl.getAttribute('idx') || '0'),
          name: valueEl.getAttribute('name') || '',
          description: valueEl.getAttribute('description')
        });
      });
      
      enums.push(enumDef);
    });
    
    
    return enums;
  }

  /**
   * Parse protocol objects
   * @private
   */
  static _parseObjects(protocolEl) {
    const objects = [];
    const objectEls = protocolEl.querySelectorAll(':scope > object');
    
    objectEls.forEach(objEl => {
      const obj = {
        name: objEl.getAttribute('name') || '',
        version: parseInt(objEl.getAttribute('version') || '1'),
        description: this._parseDescription(objEl),
        methods: []
      };
      
      // Parse methods in the order they appear in the document
      const methodEls = objEl.querySelectorAll(':scope > c2s, :scope > s2c');
      
      methodEls.forEach(methodEl => {
        const direction = methodEl.tagName.toLowerCase();
        
        obj.methods.push(this._parseMethod(methodEl, direction));
      });
      
      objects.push(obj);
    });
    
    
    return objects;
  }

  /**
   * Parse a method (c2s or s2c)
   * @private
   */
  static _parseMethod(methodEl, direction) {
    const method = {
      name: methodEl.getAttribute('name') || '',
      direction: direction,
      description: this._parseDescription(methodEl),
      args: [],
      destructor: methodEl.getAttribute('destructor') === 'true'
    };
    
    // Parse arguments
    const argEls = methodEl.querySelectorAll(':scope > arg');
    
    argEls.forEach(argEl => {
      const arg = {
        name: argEl.getAttribute('name') || '',
        type: argEl.getAttribute('type') || '',
        summary: argEl.getAttribute('summary')
      };
      
      if (argEl.hasAttribute('interface')) {
        
        arg.interface = argEl.getAttribute('interface');
      }
      
      
      method.args.push(arg);
    });
    
    // Parse returns for c2s methods
    const returnsEl = methodEl.querySelector(':scope > returns');
    if (returnsEl) {
      
      method.returns = returnsEl.getAttribute('iface') || '';
    }
    
    return method;
  }

  /**
   * Serialize enum to XML
   * @private
   */
  static _serializeEnum(enumDef, indent) {
    const spaces = ' '.repeat(indent);
    let xml = `${spaces}<enum name="${enumDef.name}">\n`;
    
    
    enumDef.values.forEach(value => {
      xml += `${spaces}  <value idx="${value.idx}" name="${value.name}"`;
      if (value.description) {
        xml += ` description="${escapeXml(value.description)}"`;
      }
      xml += '/>\n';
    });
    
    xml += `${spaces}</enum>\n\n`;
    return xml;
  }

  /**
   * Serialize object to XML
   * @private
   */
  static _serializeObject(obj, indent) {
    const spaces = ' '.repeat(indent);
    let xml = `${spaces}<object name="${obj.name}" version="${obj.version}">\n`;
    if (obj.description) xml += this._serializeDescription(obj.description, indent + 2);
    
    let methodsXml = '';
    
    obj.methods.forEach(m => { methodsXml += this._serializeMethod(m, indent + 2); });
    xml += methodsXml.trimEnd() + '\n';
    
    xml += `${spaces}</object>\n\n`;
    return xml;
  }

  /**
   * Serialize description
   * @private
   */
  
  static _serializeDescription(desc, indent) {
    if (!desc) return '';
    const spaces = ' '.repeat(indent);
    const summaryAttr = desc.summary ? ` summary="${escapeXml(desc.summary)}"` : '';
    
    if (!desc.text || !desc.text.trim()) {
      return `${spaces}<description${summaryAttr}>\n${spaces}</description>\n`;
    }

    const lines = desc.text.split('\n');
    const formattedText = lines
      
      .map(line => line.trim() ? spaces + '  ' + line.trim() : '')
      .join('\n')
      .trim();

    return `${spaces}<description${summaryAttr}>\n${spaces}  ${formattedText}\n${spaces}</description>\n`;
  }

  /**
   * Serialize method to XML
   * @private
   */
  static _serializeMethod(method, indent) {
    const spaces = ' '.repeat(indent);
    const attrs = method.destructor ? ` destructor="true"` : '';
    let xml = `${spaces}<${method.direction} name="${method.name}"${attrs}>\n`;
    
    if (method.description) {
      xml += this._serializeDescription(method.description, indent + 2);
    }
    
    
    method.args.forEach(arg => {
      xml += `${spaces}  <arg name="${arg.name}" type="${arg.type}"`;
      if (arg.interface) xml += ` interface="${arg.interface}"`;
      if (arg.summary) xml += ` summary="${escapeXml(arg.summary)}"`;
      xml += '/>\n';
    });
    
    if (method.returns) {
      xml += `${spaces}  <returns iface="${method.returns}"/>\n`;
    }
    
    xml += `${spaces}</${method.direction}>\n\n`;
    return xml;
  }

  /**
   * Convert protocol to JSON
   * @param {Protocol} protocol - Protocol object
   * @returns {string} JSON string
   */
  static toJSON(protocol) {
    return JSON.stringify(protocol, null, 2);
  }

  /**
   * Parse protocol from JSON
   * @param {string} json - JSON string
   * @returns {Protocol} Protocol object
   */
  static fromJSON(json) {
    return JSON.parse(json);
  }

  /**
   * Generate human-readable documentation
   * @param {Protocol} protocol - Protocol object
   * @returns {string} Markdown documentation
   */
  static toMarkdown(protocol) {
    let md = `# ${protocol.name} (v${protocol.version})\n\n`;
    
    if (protocol.description) {
      md += `${protocol.description}\n\n`;
    }
    
    // Enumerations
    if (protocol.enums.length > 0) {
      md += '## Enumerations\n\n';
      protocol.enums.forEach(enumDef => {
        md += `### ${enumDef.name}\n\n`;
        md += '| Value | Name | Description |\n';
        md += '|-------|------|-------------|\n';
        enumDef.values.forEach(val => {
          md += `| ${val.idx} | \`${val.name}\` | ${val.description || ''} |\n`;
        });
        md += '\n';
      });
    }
    
    // Objects
    if (protocol.objects.length > 0) {
      md += '## Objects\n\n';
      protocol.objects.forEach(obj => {
        md += `### ${obj.name} (v${obj.version})\n\n`;
        if (obj.description) {
          const desc = obj.description.text || obj.description.summary || '';
          md += `${desc}\n\n`;
        }
        
        // Group methods by direction
        const c2sMethods = obj.methods.filter(m => m.direction === 'c2s');
        const s2cMethods = obj.methods.filter(m => m.direction === 's2c');
        
        if (c2sMethods.length > 0) {
          md += '#### Client → Server Methods\n\n';
          c2sMethods.forEach(method => {
            md += this._methodToMarkdown(method);
          });
        }
        
        if (s2cMethods.length > 0) {
          md += '#### Server → Client Events\n\n';
          s2cMethods.forEach(method => {
            md += this._methodToMarkdown(method);
          });
        }
      });
    }
    
    return md;
  }

  /**
   * Convert method to markdown
   * @private
   */
  static _methodToMarkdown(method) {
    let md = `**${method.name}**${method.destructor ? ' _(destructor)_' : ''}\n\n`;
    
    if (method.description) {
      const desc = method.description.text || method.description.summary || '';
      md += `${desc}\n\n`;
    }
    
    if (method.args.length > 0) {
      md += 'Arguments:\n';
      
      method.args.forEach(arg => {
        md += `- \`${arg.name}\` (${arg.type})`;
        if (arg.interface) {
          md += ` → ${arg.interface}`;
        }
        if (arg.summary) {
          md += `: ${arg.summary}`;
        }
        md += '\n';
      });
      md += '\n';
    }
    
    if (method.returns) {
      md += `Returns: \`${method.returns}\`\n\n`;
    }
    
    return md;
  }

  /**
   * Find enum by name
   * @param {Protocol} protocol - Protocol object
   * @param {string} enumName - Enum name to find
   * @returns {ProtocolEnum|undefined} Found enum or undefined
   */
  static findEnum(protocol, enumName) {
    return protocol.enums.find(e => e.name === enumName);
  }

  /**
   * Find object by name
   * @param {Protocol} protocol - Protocol object
   * @param {string} objectName - Object name to find
   * @returns {ProtocolObject|undefined} Found object or undefined
   */
  static findObject(protocol, objectName) {
    
    return protocol.elements.find(o => o.name === objectName);
  }

  /**
   * Find method by name in an object
   * @param {ProtocolObject} object - Protocol object
   * @param {string} methodName - Method name to find
   * @returns {ProtocolMethod|undefined} Found method or undefined
   */
  static findMethod(object, methodName) {
    return object.methods.find(m => m.name === methodName);
  }

  /**
   * Get all methods of a specific direction
   * @param {ProtocolObject} object - Protocol object
   * @param {string} direction - 'c2s' or 's2c'
   * @returns {ProtocolMethod[]} Array of methods
   */
  static getMethodsByDirection(object, direction) {
    return object.methods.filter(m => m.direction === direction);
  }

  /**
   * Validate protocol structure
   * @param {Protocol} protocol - Protocol object to validate
   * @returns {{valid: boolean, errors: string[]}} Validation result
   */
  static validate(protocol) {
    const errors = [];
    
    if (!protocol.name) {
      errors.push('Protocol must have a name');
    }
    
    if (!protocol.version || protocol.version < 1) {
      errors.push('Protocol must have a valid version');
    }
    
    // Validate enums
    protocol.enums.forEach((enumDef, idx) => {
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
    });
    
    // Validate objects
    protocol.objects.forEach((obj, idx) => {
      if (!obj.name) {
        errors.push(`Object at index ${idx} missing name`);
      }
      
      obj.methods.forEach((method, methodIdx) => {
        if (!method.name) {
          errors.push(`Method at index ${methodIdx} in ${obj.name} missing name`);
        }
        
        if (!['c2s', 's2c'].includes(method.direction)) {
          errors.push(`Invalid direction ${method.direction} for method ${method.name}`);
        }
      });
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Compare two protocols for equality
   * @param {Protocol} protocol1 - First protocol
   * @param {Protocol} protocol2 - Second protocol
   * @returns {{equal: boolean, differences: string[]}} Comparison result
   */
  static compare(protocol1, protocol2) {
    const differences = [];
    
    if (protocol1.name !== protocol2.name) {
      differences.push(`Protocol name differs: "${protocol1.name}" vs "${protocol2.name}"`);
    }
    
    if (protocol1.version !== protocol2.version) {
      differences.push(`Protocol version differs: ${protocol1.version} vs ${protocol2.version}`);
    }
    
    if (protocol1.enums.length !== protocol2.enums.length) {
      differences.push(`Enum count differs: ${protocol1.enums.length} vs ${protocol2.enums.length}`);
    }
    
    if (protocol1.objects.length !== protocol2.objects.length) {
      differences.push(`Object count differs: ${protocol1.objects.length} vs ${protocol2.objects.length}`);
    }
    
    return {
      equal: differences.length === 0,
      differences
    };
  }
}

export default HyprWireProtocol;
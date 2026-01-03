export class TemplateResolver {
  private context: Map<string, any> = new Map();

  constructor(globalConfig?: Record<string, any>) {
    if (globalConfig) {
      this.context.set('config', globalConfig);
    }
  }

  // Add step output to context for future reference
  addStepOutput(stepName: string, output: any): void {
    this.context.set(stepName, output);
  }

  // Resolve template variables in a value
  resolve(value: any): any {
    if (typeof value === 'string') {
      return this.resolveString(value);
    } else if (Array.isArray(value)) {
      return value.map(item => this.resolve(item));
    } else if (value !== null && typeof value === 'object') {
      const resolved: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        resolved[key] = this.resolve(val);
      }
      return resolved;
    }
    return value;
  }

  // Resolve template strings like {{stepName.property}} or {{config.value}}
  private resolveString(str: string): any {
    // Match {{variable.path}} patterns
    const templatePattern = /\{\{([^}]+)\}\}/g;

    // Check if entire string is a template (return actual value, not string)
    const fullMatch = str.match(/^\{\{([^}]+)\}\}$/);
    if (fullMatch) {
      const path = fullMatch[1].trim();
      return this.getValueByPath(path);
    }

    // Replace inline templates (keep as string)
    return str.replace(templatePattern, (match, path) => {
      const value = this.getValueByPath(path.trim());
      return String(value ?? '');
    });
  }

  // Navigate nested object paths like "step1.token" or "config.documentGroupId"
  private getValueByPath(path: string): any {
    const parts = path.split('.');
    const rootKey = parts[0];

    let value = this.context.get(rootKey);

    if (value === undefined) {
      throw new Error(`Template variable not found: ${rootKey}`);
    }

    // Navigate nested properties
    for (let i = 1; i < parts.length; i++) {
      if (value === null || value === undefined) {
        throw new Error(`Cannot access property ${parts[i]} of ${parts.slice(0, i).join('.')}`);
      }
      value = value[parts[i]];
    }

    return value;
  }

  // Get current context (for debugging)
  getContext(): Record<string, any> {
    const context: Record<string, any> = {};
    this.context.forEach((value, key) => {
      context[key] = value;
    });
    return context;
  }
}

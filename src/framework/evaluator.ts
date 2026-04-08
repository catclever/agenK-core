export function evaluateCondition(condition: string | undefined, bindings: any): boolean {
  if (!condition) return true;
  
  let path = condition;
  let isNegated = false;
  if (path.startsWith('!')) {
    isNegated = true;
    path = path.slice(1);
  }
  if (path.startsWith('$')) {
    path = path.slice(1); // Converts "$state.foo" to "state.foo"
  }
  
  const result = resolvePath(path, bindings);
  return isNegated ? !result : !!result;
}

export function resolvePath(path: string, obj: any): any {
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

export function bindProps(props: any, bindings: any): any {
  if (!props) return {};
  const resolved: any = {};
  
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'string') {
      if (v.startsWith('$state.')) {
        resolved[k] = resolvePath(v.slice(7), bindings.state);
      } else if (v.startsWith('$action.')) {
        // e.g. "$action.setIsSettingsOpen(false)"
        const match = v.match(/^\$action\.([a-zA-Z0-9_.]+)(?:\((.*)\))?$/);
        if (match) {
          const actionPath = match[1];
          const rawArg = match[2];
          
          const actionFn = resolvePath(actionPath, bindings.state?.actions || bindings.actions);
          
          resolved[k] = (e: any) => {
             if (typeof actionFn === 'function') {
               if (rawArg !== undefined) {
                 // Try to parse argument (e.g. false, true, numbers)
                 let parsedArg = rawArg;
                 if (rawArg === 'true') parsedArg = true as any;
                 else if (rawArg === 'false') parsedArg = false as any;
                 else if (!isNaN(Number(rawArg))) parsedArg = Number(rawArg) as any;
                 actionFn(parsedArg);
               } else {
                 if (e && e.target && e.target.value !== undefined) {
                    actionFn(e.target.value);
                 } else {
                    actionFn(e);
                 }
               }
             }
          };
        } else {
          resolved[k] = v; // Fallback
        }
      } else if (v.startsWith('$static.')) { 
        resolved[k] = v.slice(8);
      } else {
        resolved[k] = v;
      }
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      resolved[k] = bindProps(v, bindings);
    } else if (Array.isArray(v)) {
      resolved[k] = v.map(item => typeof item === 'object' ? bindProps(item, bindings) : (typeof item === 'string' && item.startsWith('$state.') ? resolvePath(item.slice(7), bindings.state) : item));
    } else {
      resolved[k] = v;
    }
  }
  return resolved;
}

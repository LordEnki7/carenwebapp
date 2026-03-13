/**
 * C.A.R.E.N. Module Registry
 * Manages module registration, loading, and communication
 */

export interface ModuleDefinition {
  id: string;
  name: string;
  version: string;
  type: 'core' | 'feature' | 'infrastructure';
  dependencies: string[];
  exports: {
    components?: string[];
    hooks?: string[];
    services?: string[];
  };
  routes?: RouteConfig[];
  permissions?: string[];
}

export interface RouteConfig {
  path: string;
  component: string;
  permissions?: string[];
}

export class ModuleRegistry {
  private modules = new Map<string, ModuleDefinition>();
  private loadedModules = new Set<string>();
  
  register(module: ModuleDefinition): void {
    console.log(`Registering module: ${module.id}`);
    this.modules.set(module.id, module);
  }
  
  unregister(moduleId: string): void {
    console.log(`Unregistering module: ${moduleId}`);
    this.modules.delete(moduleId);
    this.loadedModules.delete(moduleId);
  }
  
  getModule(moduleId: string): ModuleDefinition | undefined {
    return this.modules.get(moduleId);
  }
  
  getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }
  
  getDependencies(moduleId: string): ModuleDefinition[] {
    const module = this.getModule(moduleId);
    if (!module) return [];
    
    return module.dependencies
      .map(depId => this.getModule(depId))
      .filter((dep): dep is ModuleDefinition => dep !== undefined);
  }
  
  isLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId);
  }
  
  markAsLoaded(moduleId: string): void {
    this.loadedModules.add(moduleId);
  }
  
  getModulesByType(type: ModuleDefinition['type']): ModuleDefinition[] {
    return this.getAllModules().filter(module => module.type === type);
  }
}

export const moduleRegistry = new ModuleRegistry();

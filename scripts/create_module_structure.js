#!/usr/bin/env node

/**
 * C.A.R.E.N. Module Structure Creator
 * Creates the directory structure for a new module
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODULES_DIR = path.join(__dirname, '..', 'modules');

// Module templates
const MODULE_TEMPLATES = {
  core: {
    dirs: [
      'frontend/components',
      'frontend/hooks',
      'frontend/services',
      'backend/controllers',
      'backend/services',
      'backend/routes',
      'shared/types',
      'shared/schemas',
      'tests/unit',
      'tests/integration'
    ],
    files: {
      'package.json': (name) => JSON.stringify({
        "name": `@caren/${name}`,
        "version": "1.0.0",
        "description": `C.A.R.E.N. ${name} module`,
        "main": "index.ts",
        "scripts": {
          "build": "tsc",
          "test": "jest",
          "dev": "tsc --watch"
        },
        "dependencies": {
          "@caren/core": "^1.0.0"
        }
      }, null, 2),
      'module.config.json': (name) => JSON.stringify({
        "id": `@caren/${name}`,
        "name": `${name.charAt(0).toUpperCase() + name.slice(1)} Module`,
        "version": "1.0.0",
        "type": "core",
        "dependencies": ["@caren/core"],
        "exports": {
          "components": [],
          "hooks": [],
          "services": []
        },
        "routes": [],
        "permissions": []
      }, null, 2),
      'index.ts': (name) => `// ${name.charAt(0).toUpperCase() + name.slice(1)} Module Entry Point
export * from './frontend';
export * from './backend';
export * from './shared';
`,
      'frontend/index.ts': () => `// Frontend exports
export * from './components';
export * from './hooks';
export * from './services';
`,
      'backend/index.ts': () => `// Backend exports
export * from './controllers';
export * from './services';
export * from './routes';
`,
      'shared/index.ts': () => `// Shared exports
export * from './types';
export * from './schemas';
`,
      'README.md': (name) => `# C.A.R.E.N. ${name.charAt(0).toUpperCase() + name.slice(1)} Module

## Overview
This module handles ${name}-related functionality for the C.A.R.E.N. platform.

## Structure
\`\`\`
${name}/
├── frontend/          # React components, hooks, and services
├── backend/           # Express controllers, services, and routes
├── shared/            # Shared types and schemas
├── tests/             # Unit and integration tests
├── package.json       # Module dependencies
├── module.config.json # Module configuration
└── README.md          # This file
\`\`\`

## Installation
\`\`\`bash
npm install @caren/${name}
\`\`\`

## Usage
\`\`\`typescript
import { /* exports */ } from '@caren/${name}';
\`\`\`

## API Reference
[Coming soon]

## Contributing
[Contributing guidelines]
`
    }
  },
  feature: {
    dirs: [
      'frontend/components',
      'frontend/hooks',
      'shared/types',
      'tests/unit'
    ],
    files: {
      'package.json': (name) => JSON.stringify({
        "name": `@caren/${name}`,
        "version": "1.0.0",
        "description": `C.A.R.E.N. ${name} feature module`,
        "main": "index.ts",
        "scripts": {
          "build": "tsc",
          "test": "jest"
        },
        "dependencies": {
          "@caren/core": "^1.0.0"
        }
      }, null, 2),
      'module.config.json': (name) => JSON.stringify({
        "id": `@caren/${name}`,
        "name": `${name.charAt(0).toUpperCase() + name.slice(1)} Feature`,
        "version": "1.0.0",
        "type": "feature",
        "dependencies": ["@caren/core"],
        "exports": {
          "components": [],
          "hooks": []
        }
      }, null, 2),
      'index.ts': (name) => `// ${name.charAt(0).toUpperCase() + name.slice(1)} Feature Module
export * from './frontend';
export * from './shared';
`,
      'README.md': (name) => `# C.A.R.E.N. ${name.charAt(0).toUpperCase() + name.slice(1)} Feature

Feature module for ${name} functionality.
`
    }
  }
};

function createModule(name, type = 'core') {
  console.log(`Creating ${type} module: ${name}`);
  
  const modulePath = path.join(MODULES_DIR, name);
  const template = MODULE_TEMPLATES[type];
  
  if (!template) {
    console.error(`Unknown module type: ${type}`);
    process.exit(1);
  }
  
  // Create module directory
  if (!fs.existsSync(MODULES_DIR)) {
    fs.mkdirSync(MODULES_DIR, { recursive: true });
  }
  
  if (fs.existsSync(modulePath)) {
    console.error(`Module ${name} already exists`);
    process.exit(1);
  }
  
  fs.mkdirSync(modulePath, { recursive: true });
  
  // Create directory structure
  template.dirs.forEach(dir => {
    const dirPath = path.join(modulePath, dir);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  });
  
  // Create files
  Object.entries(template.files).forEach(([filePath, contentGenerator]) => {
    const fullPath = path.join(modulePath, filePath);
    const content = typeof contentGenerator === 'function' 
      ? contentGenerator(name) 
      : contentGenerator;
    
    fs.writeFileSync(fullPath, content);
    console.log(`Created file: ${filePath}`);
  });
  
  console.log(`✅ Module ${name} created successfully at ${modulePath}`);
}

function listModules() {
  if (!fs.existsSync(MODULES_DIR)) {
    console.log('No modules directory found');
    return;
  }
  
  const modules = fs.readdirSync(MODULES_DIR)
    .filter(name => fs.statSync(path.join(MODULES_DIR, name)).isDirectory());
  
  if (modules.length === 0) {
    console.log('No modules found');
    return;
  }
  
  console.log('Existing modules:');
  modules.forEach(module => {
    const configPath = path.join(MODULES_DIR, module, 'module.config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`  ${module} (${config.type}) - ${config.name} v${config.version}`);
    } else {
      console.log(`  ${module} (no config)`);
    }
  });
}

function createCoreInfrastructure() {
  console.log('Creating core infrastructure...');
  
  // Create core module registry
  const coreDir = path.join(__dirname, '..', 'src', 'core');
  if (!fs.existsSync(coreDir)) {
    fs.mkdirSync(coreDir, { recursive: true });
  }
  
  // Module Registry
  const registryContent = `/**
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
    console.log(\`Registering module: \${module.id}\`);
    this.modules.set(module.id, module);
  }
  
  unregister(moduleId: string): void {
    console.log(\`Unregistering module: \${moduleId}\`);
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
`;
  
  fs.writeFileSync(path.join(coreDir, 'ModuleRegistry.ts'), registryContent);
  console.log('Created ModuleRegistry.ts');
  
  // Event Bus
  const eventBusContent = `/**
 * C.A.R.E.N. Event Bus
 * Handles inter-module communication
 */

export interface ModuleEvent {
  type: string;
  payload: any;
  module: string;
  timestamp: number;
}

export type EventHandler = (event: ModuleEvent) => void;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  
  emit(event: Omit<ModuleEvent, 'timestamp'>): void {
    const fullEvent: ModuleEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    const eventHandlers = this.handlers.get(event.type);
    if (eventHandlers) {
      eventHandlers.forEach(handler => {
        try {
          handler(fullEvent);
        } catch (error) {
          console.error(\`Error in event handler for \${event.type}:\`, error);
        }
      });
    }
  }
  
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }
  
  unsubscribe(eventType: string, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventType);
    if (eventHandlers) {
      eventHandlers.delete(handler);
      if (eventHandlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }
  
  clear(): void {
    this.handlers.clear();
  }
  
  getSubscriberCount(eventType: string): number {
    return this.handlers.get(eventType)?.size || 0;
  }
}

export const eventBus = new EventBus();
`;
  
  fs.writeFileSync(path.join(coreDir, 'EventBus.ts'), eventBusContent);
  console.log('Created EventBus.ts');
  
  console.log('✅ Core infrastructure created');
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create':
    const moduleName = args[1];
    const moduleType = args[2] || 'core';
    
    if (!moduleName) {
      console.error('Usage: npm run create-module <name> [type]');
      process.exit(1);
    }
    
    createModule(moduleName, moduleType);
    break;
    
  case 'list':
    listModules();
    break;
    
  case 'init':
    createCoreInfrastructure();
    break;
    
  default:
    console.log('C.A.R.E.N. Module Manager');
    console.log('');
    console.log('Commands:');
    console.log('  create <name> [type]  - Create a new module');
    console.log('  list                  - List existing modules');
    console.log('  init                  - Create core infrastructure');
    console.log('');
    console.log('Examples:');
    console.log('  node create_module_structure.js create auth core');
    console.log('  node create_module_structure.js create bluetooth feature');
    console.log('  node create_module_structure.js list');
    console.log('  node create_module_structure.js init');
}
import { WorkflowContext } from './workflow.types';

export interface INode {
  id: string;
  name: string;
  type: string;
  category: NodeCategory;
  description: string;
  execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext>;
}

export type NodeCategory =
  | 'trigger'
  | 'data'
  | 'document'
  | 'processing'
  | 'ai'
  | 'decision'
  | 'action'
  | 'monitoring'
  | 'audit'
  | 'utility'
  | 'integration';

export interface NodeDefinition {
  type: string;
  name: string;
  category: NodeCategory;
  description: string;
  configSchema: NodeConfigSchema;
}

export interface NodeConfigSchema {
  fields: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  required: boolean;
  options?: string[];
  defaultValue?: unknown;
}

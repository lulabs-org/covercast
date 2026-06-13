// Re-export from domain/ for backward compatibility
// New code should import from '@/lib/domain/scene' directly
export * from './domain/scene'

// Re-export template-related functions from templates/
// New code should import from '@/lib/templates' directly
export {
  DEFAULT_TEMPLATE_ID,
  BUILT_IN_TEMPLATES,
  createDefaultScene,
  createSceneFromTemplate,
  createEmptyScene,
} from './templates'

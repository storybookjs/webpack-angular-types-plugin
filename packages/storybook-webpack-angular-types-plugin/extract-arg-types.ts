// Secondary entry point to avoid webpack issues because of
// the dependencies of the main entry point
export * from './src/lib/extract-args-types/extract-arg-types';
export { STORYBOOK_ANGULAR_ARG_TYPES } from './src/lib/constants';

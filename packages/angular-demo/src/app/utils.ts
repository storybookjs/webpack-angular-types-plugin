/**
 * Name of the library
 *
 * @include-docs LibraryInfo
 */
export const LIB_NAME = 'webpack-angular-types-plugin';

/**
 * Current version of the library
 *
 * @include-docs LibraryInfo
 */
export const VERSION = '0.1.0';

/**
 * Current environment
 *
 * @include-docs Env, LibraryInfo, EnvironmentInfo
 */
export const ENVIRONMENT = 'production';

/**
 * Returns the name of the library
 *
 * @include-docs LibraryInfo
 */
export function getLibraryName(): string {
	return LIB_NAME;
}

/**
 * Returns the current environment
 *
 * @include-docs LibraryInfo, EnvironmentInfo
 */
export function getEnvironment(): string {
	return ENVIRONMENT;
}

/**
 * Returns the current version
 *
 * @include-docs LibraryInfo
 */
export function getVersion(): string {
	return VERSION;
}

/**
 * Decides whether a value is of type number
 *
 * @param val value of unknown type
 *
 * @include-docs
 */
export function isNumber(val: unknown): val is number {
	return typeof val === 'number';
}

/**
 * Decides whether a value is of type string
 *
 * @param val value of unknown type
 *
 * @include-docs
 */
export function isString(val: unknown): val is string {
	return typeof val === 'string';
}

/**
 * Whether something is standalone
 *
 * @include-docs
 */
export const IS_STANDALONE = true;

/**
 * Shouldn't generate docs!
 */
export function withoutAnnotation() {
	return true;
}

/**
 * Shouldn't generate docs!
 */
export const WITHOUT_ANNOTATION = 'x';

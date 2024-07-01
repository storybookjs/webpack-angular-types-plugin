import { MethodDeclaration, PropertyDeclaration, TypeFormatFlags } from 'ts-morph';
import { Entity } from '../../types';

export const BUILT_IN_ANGULAR_METHODS: { methodName: string; interfaceName: string }[] = [
	{ methodName: 'ngOnInit', interfaceName: 'OnInit' },
	{ methodName: 'ngOnChanges', interfaceName: 'OnChanges' },
	{ methodName: 'ngAfterContentInit', interfaceName: 'AfterContentInit' },
	{ methodName: 'ngAfterViewInit', interfaceName: 'AfterViewInit' },
	{ methodName: 'ngOnDestroy', interfaceName: 'OnDestroy' },
	{ methodName: 'ngDoCheck', interfaceName: 'DoCheck' },
	{ methodName: 'ngAfterContentChecked', interfaceName: 'AfterContentChecked' },
	{ methodName: 'ngAfterViewChecked', interfaceName: 'AfterViewChecked' },
	{ methodName: 'writeValue', interfaceName: 'ControlValueAccessor' },
	{ methodName: 'registerOnChange', interfaceName: 'ControlValueAccessor' },
	{ methodName: 'registerOnTouched', interfaceName: 'ControlValueAccessor' },
	{ methodName: 'setDisabledState', interfaceName: 'ControlValueAccessor' },
	{ methodName: 'validate', interfaceName: 'Validator' },
	{ methodName: 'registerOnValidatorChange', interfaceName: 'Validator' },
];

/**
 * Checks whether a getter/setter input is already present in the given map
 */
export function getterOrSetterInputExists(entities: Map<string, Entity>, name: string): boolean {
	const entity = entities.get(name);
	return !!entity && entity.kind === 'input';
}

/**
 * Merges an array of entities. Convention: Entities are provided
 * in decreasing priority, i.e. fields from entities at the end of the input
 * array are overridden by entities on a lower index on the input array.
 */
export function mergeEntities(entities: Map<string, Entity>[]): Map<string, Entity> {
	if (entities.length === 1) {
		return entities[0];
	}
	const result = new Map<string, Entity>();

	for (let i = entities.length - 1; i > -1; i--) {
		const entitiesToMerge = entities[i];
		for (const entityToMerge of entitiesToMerge.values()) {
			if (getterOrSetterInputExists(result, entityToMerge.name)) {
				continue;
			}

			result.set(entityToMerge.name, entityToMerge);
		}
	}
	return result;
}

function isDeclarationOfType(declaration: PropertyDeclaration, typeName: string) {
	const type = declaration.getType();
	const symbol = declaration.getType().getSymbol();
	if (symbol) {
		return symbol.getName() === typeName;
	}
	return type.getText() === typeName;
}

export function isInputSignal(declaration: PropertyDeclaration): boolean {
	return isDeclarationOfType(declaration, 'InputSignal');
}

export function isOutputRef(declaration: PropertyDeclaration): boolean {
	return (
		isDeclarationOfType(declaration, 'OutputEmitterRef') ||
		isDeclarationOfType(declaration, 'OutputRef')
	);
}

export function isModelSignal(declaration: PropertyDeclaration) {
	return isDeclarationOfType(declaration, 'ModelSignal');
}

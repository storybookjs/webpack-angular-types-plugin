import { ClassDeclaration, Node, PropertyDeclaration } from 'ts-morph';
import { isDeclarationOfType } from './utils';

const BUILT_IN_ANGULAR_METHODS: { methodName: string; interfaceName: string }[] = [
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

export function isBuiltinAngularMethod(declaration: ClassDeclaration, methodName: string): boolean {
	const candidate = BUILT_IN_ANGULAR_METHODS.find(
		(builtInMethod) => builtInMethod.methodName === methodName,
	);
	if (!candidate) {
		return false;
	}
	const isImplemented = declaration
		.getImplements()
		.find((implement) => implement.getText() === candidate.interfaceName);
	return !!isImplemented;
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

export function isRequiredInputOrModelSignal(declaration: PropertyDeclaration): boolean {
	const isInput = isInputSignal(declaration) || isModelSignal(declaration);
	if (!isInput) {
		return false;
	}
	const initializer = declaration.getInitializer();
	if (!initializer || !Node.isCallExpression(initializer)) {
		return false;
	}

	const expression = initializer.getExpression();
	if (!Node.isPropertyAccessExpression(expression)) {
		return false;
	}

	const name = expression.getName();
	const expressionName = expression.getExpression().getText();

	return name === 'required' && ['input', 'model'].includes(expressionName);
}

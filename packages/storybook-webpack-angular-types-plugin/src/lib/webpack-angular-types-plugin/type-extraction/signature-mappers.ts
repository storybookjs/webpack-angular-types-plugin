import {
	Entity,
	EntityKind,
	SignatureToEntityMappingParams,
	TsMorphSymbol,
	TypeDetail,
} from '../../types';
import { MethodSignature, PropertySignature } from 'ts-morph';
import {
	getJsDocsDefaultValue,
	getJsDocsDescription,
	getJsDocsParams,
	getJsDocsReturnDescription,
	isTypeRequired,
} from './ast-utils';
import { generateTypeDetailCollection } from './type-details';
import { printType, stringifyTypeDetailCollection } from './type-printing';

function getSignatureKind(declaration: PropertySignature | MethodSignature): EntityKind {
	if (declaration instanceof MethodSignature) {
		return 'method';
	} else {
		return 'property';
	}
}

export function mapPropertySignature({ signature }: SignatureToEntityMappingParams): Entity {
	return {
		kind: getSignatureKind(signature),
		name: signature.getName(),
		defaultValue: getJsDocsDefaultValue(signature),
		description: getJsDocsDescription(signature) || '',
		type: printType(signature.getType(), false, 0, new WeakMap()),
		typeDetails: stringifyTypeDetailCollection(
			generateTypeDetailCollection(
				signature.getType(),
				new Map<TsMorphSymbol, TypeDetail>(),
				0,
				new WeakMap(),
			),
		),
		required: isTypeRequired(signature.getType()),
	};
}

export function mapSignatureToEntity(params: SignatureToEntityMappingParams): Entity {
	if (params.signature instanceof MethodSignature) {
		return mapMethodSignature(params);
	}
	return mapPropertySignature(params);
}

export function mapMethodSignature({ signature }: SignatureToEntityMappingParams): Entity {
	const methodSignature = signature as MethodSignature;
	return {
		kind: getSignatureKind(methodSignature),
		alias: undefined,
		name: methodSignature.getName(),
		defaultValue: getJsDocsDefaultValue(signature),
		description: getJsDocsDescription(methodSignature) || '',
		jsDocParams: getJsDocsParams(methodSignature),
		jsDocReturn: getJsDocsReturnDescription(methodSignature),
		type: printType(methodSignature.getType(), false, 0, new WeakMap()),
		typeDetails: undefined,
		required: false,
	};
}

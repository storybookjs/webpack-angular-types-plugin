import { PricedItem } from '@scope/entrypoint'; // eslint-disable-line @nx/enforce-module-boundaries

export interface UndocumentedSecret {
	secret: string;
}

/**
 * @include-docs
 */
export interface Product extends Item {
	price: Price;
}

export interface Item {
	/**
	 * Technical id
	 */
	id: number;

	/**
	 * Unique identifier
	 */
	itemNumber: number;

	name: string;

	/**
	 * Whether the product is currently in stock
	 *
	 * @default false
	 */
	isInStock?: boolean;
	description?: string;
	size?: Size3;
	meta?: object;

	/**
	 * @exclude-docs
	 */
	hiddenProperty: unknown;
}

export interface Size3 extends Size2 {
	height: Length;
}

export interface Size2 extends Size {
	width: Length;
}

export interface Size {
	length: Length;
}

export interface Length {
	size: number;
	unit: LengthUnit;
}

export type LengthUnit = 'mm' | 'cm' | 'm';

/**
 * @include-docs Cost,Charge
 */
export interface Price {
	amount: number;
	/**
	 * Currently only € or $ ar supported!
	 */
	unit: '€' | '$';
}

export function getProductNumber(product: Product) {
	return `${product.id}X${product.itemNumber}`;
}

/**
 * @include-docs
 */
export interface RaceCar extends Car, Vehicle, PricedItem {
	/**
	 * Maximum speed in km/h.
	 */
	maxSpeed: number;
}

export interface Car {
	/**
	 * Model name
	 *
	 * This is a property from an extended interface.
	 */
	model: string;

	/**
	 * Brand name
	 *
	 * This is a property from an extended interface.
	 */
	brand: string;
}

export interface Vehicle {
	/**
	 * Number of wheels
	 *
	 * This is a property from another extended interface.
	 */
	numberOfWheels: number;
}

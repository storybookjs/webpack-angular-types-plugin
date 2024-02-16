import { Component, Input } from '@angular/core';
import { getProductNumber, Product, UndocumentedSecret } from './interface';

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

	isInStock?: boolean;
	description?: string;
	size?: Size3;
	meta?: object;
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

export interface Price {
	amount: number;
	/**
	 * Currently only € or $ ar supported!
	 */
	unit: '€' | '$';
}

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	@Input() testInput = '';
	@Input() testInput2 = '123123';
	@Input() testInput3 = '123123';

	title = 'angular-app';

	product: Product = {
		id: 100123,
		itemNumber: 100123,
		name: 'Tooth brush',
		price: {
			amount: 5.99,
			unit: '€',
		},
	};
	undocumentedSecret?: UndocumentedSecret;

	productNumber = getProductNumber(this.product);
}

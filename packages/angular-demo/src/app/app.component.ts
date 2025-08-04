import { Component, Input } from '@angular/core';
import { getLibraryAuthor } from './other-utils';
import { getProductNumber, Product, UndocumentedSecret } from './types';
import { ENVIRONMENT, IS_STANDALONE, isNumber, isString, LIB_NAME, VERSION } from './utils';

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
		hiddenProperty: '',
	};

	/**
	 * @exclude-docs
	 */
	undocumentedSecret?: UndocumentedSecret;

	// We need a non-type import from './types.ts' so that the file gets analyzed
	productNumber = getProductNumber(this.product);

	private LIB_NAME = LIB_NAME;
	private VERSION = VERSION;
	private ENVIRONMENT = ENVIRONMENT;
	private LIB_AUTHOR = getLibraryAuthor();

	private IS_NUMBER = isNumber;
	private IS_STRING = isString;

	private IS_STANDALONE = IS_STANDALONE;
}

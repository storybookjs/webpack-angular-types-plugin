import { Component, Input } from '@angular/core';
import { getProductNumber, Product, UndocumentedSecret } from './interface';

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

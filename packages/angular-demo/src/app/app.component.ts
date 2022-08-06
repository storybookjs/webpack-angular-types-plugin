import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	@Input() testInput: string = '';
	@Input() testInput2: string = '123123';
	@Input() testInput3: string = '123123';
	title = 'angular-app';
}

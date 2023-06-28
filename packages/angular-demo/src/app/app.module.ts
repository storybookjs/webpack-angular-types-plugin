import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ChildComponent } from './child.component';
import { ExamplePipe } from './example.pipe';

@NgModule({
	declarations: [AppComponent, ChildComponent, ExamplePipe],
	imports: [BrowserModule],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}

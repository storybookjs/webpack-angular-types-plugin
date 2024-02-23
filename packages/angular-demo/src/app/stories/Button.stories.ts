// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { Meta, StoryFn } from '@storybook/angular';
import ButtonComponent from './button.component';
import Button from './button.component';

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
	title: 'Example/Button',
	component: ButtonComponent,
	// More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
	argTypes: {
		backgroundColor: { control: 'color' },
	},
} as Meta;

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args
const Template: StoryFn<Button> = (args: Button) => ({
	props: args,
});

export const Primary = {
	render: Template,

	args: {
		primary: true,
		label: 'Button',
	},
};

export const Secondary = {
	render: Template,

	args: {
		label: 'Button',
	},
};

export const Large = {
	render: Template,

	args: {
		size: 'large',
		label: 'Button',
	},
};

export const Small = {
	render: Template,

	args: {
		size: 'small',
		label: 'Button',
	},
};

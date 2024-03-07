import { Meta, StoryObj } from '@storybook/angular';
import ButtonComponent from './button.component';

export default {
	title: 'Example/Button',
	component: ButtonComponent,
	argTypes: {
		backgroundColor: { control: 'color' },
	},
} as Meta;

type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {
	args: {
		primary: true,
		label: 'Button',
	},
};

export const Secondary: Story = {
	args: {
		label: 'Button',
	},
};

export const Large: Story = {
	args: {
		size: 'large',
		label: 'Button',
	},
};

export const Small: Story = {
	args: {
		size: 'small',
		label: 'Button',
	},
};

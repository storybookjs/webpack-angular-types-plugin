// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { Meta, Story } from "@storybook/angular/types-6-0";
import { ChildComponent } from "../child.component";
import ButtonComponent from "./button.component";
import Button from "./button.component";
import { AppComponent } from "../app.component";

// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
export default {
    title: "Example/Button",
    component: ButtonComponent,
    // More on argTypes: https://storybook.js.org/docs/angular/api/argtypes
    argTypes: {
        backgroundColor: { control: "color" },
    },
} as Meta;

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args
const Template: Story<Button> = (args: Button) => ({
    props: args,
});

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/angular/writing-stories/args
Primary.args = {
    primary: true,
    label: "Button",
};

export const Secondary = Template.bind({});
Secondary.args = {
    label: "Button",
};

export const Large = Template.bind({});
Large.args = {
    size: "large",
    label: "Button",
};

export const Small = Template.bind({});
Small.args = {
    size: "small",
    label: "Button",
};

// you need to reference the components for testing, otherwise they will not appear in the modules
// after the sealing of webpack (which kinda makes sense)
export const Test = AppComponent;
export const Test2 = ChildComponent;

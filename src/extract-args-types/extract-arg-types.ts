interface Property {
    name: string;
    defaultValue?: string;
    type: string;
    description: any /* should be string, is currently string[] */;
}

type Inputs = Array<Property>;
type Outputs = Array<Property>;
type PropertiesWithoutDecorator = Array<Property>;

interface ExtractedDirective {
    inputs: Inputs;
    outputs: Outputs;
    propertiesWithoutDecorators: PropertiesWithoutDecorator;
}

type ExtractedDirectives = {
    [key: string]: ExtractedDirective;
};

// probably typed somewhere else
type ArgsTableProps = { [key: string]: ArgsTableProp };
type ArgsTableProp = {
    defaultValue: string | undefined;
    description: string;
    name: string;
    type: {
        name: string;
        required: boolean;
    };
    table: {
        category: "properties" | any;
        defaultValue: { summary: string | undefined };
        type: {
            required: boolean;
            summary: string | undefined;
        };
    };
};

const getAngularDirectiveProperties = (
    name: string
): ExtractedDirective | undefined =>
    // eslint-disable-next-line no-undef
    (window as any).STORYBOOK_ANGULAR_ARG_TYPES[name];

const mapPropToArgsTableProp = (
    prop: Property,
    category: "inputs" | "outputs" | "properties"
): ArgsTableProp => ({
    name: prop.name,
    description: prop.description.join(" "),
    defaultValue: prop.defaultValue,
    type: { name: prop.type, required: true }, // todo get required
    table: {
        defaultValue: {
            summary: prop.defaultValue,
        },
        type: {
            summary: prop.type,
            required: true, // todo get required
        },
        category,
    },
});

// eslint-disable-next-line
const mapPropsToArgsTableProps = (directive: ExtractedDirective): any => {
    // const argsTableProps: ArgsTableProps = {};
    const argsTableProps = [];

    // eslint-disable-next-line ,no-restricted-syntax,no-restricted-syntax
    for (const [key, input] of Object.entries(directive.inputs)) {
        argsTableProps.push(mapPropToArgsTableProp(input, "inputs"));
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, output] of Object.entries(directive.outputs)) {
        argsTableProps.push(mapPropToArgsTableProp(output, "outputs"));
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, propWithoutDecorator] of Object.entries(
        directive.propertiesWithoutDecorators
    )) {
        argsTableProps.push(
            mapPropToArgsTableProp(propWithoutDecorator, "properties")
        );
    }

    return Object.fromEntries(
        new Map(
            argsTableProps.map((type) => {
                const { name, ...rest } = type;
                return [name, rest];
            })
        )
    );
};

export const extractArgTypes = (directive: any): ArgsTableProps | undefined => {
    const props = getAngularDirectiveProperties(directive.name);
    if (!props) {
        return;
    }
    // eslint-disable-next-line consistent-return
    return mapPropsToArgsTableProps(props);
};

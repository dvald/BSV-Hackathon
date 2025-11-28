export default {
    meta: {
        type: "suggestion",
        docs: {
            description: "Force use of `function` in methods inside `methods` of Vue components.",
        },
        fixable: "code",
        schema: [],
        messages: {
            requireFunction: "Use `function` instead of shortcut in `methods`.",
        },
    },
    create(context) {
        return {
            Property(node) {
                const parent = node.parent;

                if (!parent || parent.type !== "ObjectExpression") return;

                const isInMethods =
                    parent.parent && parent.parent.type === "Property" && parent.parent.key && parent.parent.key.name === "methods";

                if (!isInMethods) return;

                if (node.method === true) {
                    context.report({
                        node,
                        messageId: "requireFunction",
                        fix(fixer) {
                            const sourceCode = context.getSourceCode();
                            const key = sourceCode.getText(node.key);
                            const value = sourceCode.getText(node.value.body);

                            const params = node.value.params.map((param) => sourceCode.getText(param)).join(", ");

                            const asyncPrefix = node.value.async ? "async " : "";

                            const fixedCode = `${key}: ${asyncPrefix}function(${params}) ${value}`;
                            return fixer.replaceText(node, fixedCode);
                        },
                    });
                }
            },
        };
    },
};

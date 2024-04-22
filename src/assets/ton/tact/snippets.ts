export const tactSnippets = [
  {
    label: 'spdx',
    code: '// SPDX-License-Identifier: MIT',
    description: 'SPDX License',
  },
  {
    label: 'con',
    code: 'contract ${1:Name} {\n\t$0\n}',
    description: 'A template for contract.',
  },
  {
    label: 'imp',
    code: "import '${1:contract}';",
    description: 'A template for import contract.',
  },
  {
    label: 'impdep',
    code: 'import "@stdlib/deploy";',
    description: 'A template for import deploy.',
  },
  {
    label: 'impown',
    code: 'import "@stdlib/ownable";',
    description: 'A template for import ownable.',
  },
  {
    label: 'impstop',
    code: 'import "@stdlib/stoppable";',
    description: 'A template for import stoppable.',
  },
  {
    label: 'map',
    code: 'map<${1:type1}, ${2:type2}>;',
    description: 'mapping declaration',
  },
  {
    label: 'init',
    code: 'init () {\n\t$0\n}',
    description: 'init with 0 param declaration',
  },
  {
    label: 'init1',
    code: 'init (${1:name}: ${2:type}) {\n\t$0\n}',
    description: 'init with 1 param declaration',
  },
  {
    label: 'init2',
    code: 'init (${1:name}: ${2:type}, ${3:name}: ${4:type}) {\n\t$0\n}',
    description: 'init with 2 param declaration',
  },
  {
    label: 'fun',
    code: 'fun ${1:name}(${2:name}: ${3:type}) {\n\t$0\n}',
    description: 'function declaration',
  },
  {
    label: 'funr',
    code: 'fun ${1:name}(${2:name}: ${3:type}): ${4:type} {\n\t$0\n}',
    description: 'function return declaration',
  },
  {
    label: 'if',
    code: 'if (${1:condition}) {\n\t$0\n}',
    description: 'if statement',
  },
  {
    label: 'ife',
    code: 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}',
    description: 'if else statement',
  },
  {
    label: 'while',
    code: 'while (${1:condition}) {\n\t$0\n}',
    description: 'while statement',
  },
  {
    label: 'until',
    code: 'do {\n\t$0\n} until (${1:condition});',
    description: 'until statement',
  },
  {
    label: 'repeat',
    code: 'repeat(${1:index}) {\n\t$0\n}',
    description: 'repeat statement',
  },
  {
    label: 'rec',
    code: 'receive(${1:name}) {\n\t$0\n}',
    description: 'receive declaration',
  },
  {
    label: 'ctx',
    code: 'let ctx: Context = context();',
    description: 'context declaration',
  },
  {
    label: 'doc',
    code: '//\n/// @notice What does it do?;\n///\n/// @param name - description;\n/// @return Struct - description;',
    description: 'documentation for function',
  },
  {
    label: 'req',
    code: 'require(${1:Bool}, ${2:String});',
    description: 'require expression',
  },
];

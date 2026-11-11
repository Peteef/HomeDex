type Tree = Record<string, unknown>;

export type Translate = (key: string, values?: object) => string;

const PLURAL_KEY = /_(?:zero|one|two|few|many|other)$/;
const PLACEHOLDER = /\{\{[^}]+\}\}/;

const isTree = (node: unknown): node is Tree => typeof node === 'object' && node !== null;

const hasPlural = (tree: Tree, key: string): boolean =>
  Object.keys(tree).some((other) => other.startsWith(`${key}_`) && PLURAL_KEY.test(other));

const keyOf = (path: string, key: string): string => (path === '' ? key : `${path}.${key}`);

export const sectionOf = (source: unknown, prefix: string): Tree =>
  prefix.split('.').reduce<Tree>(
    (tree, key) => {
      const node = tree[key];
      return isTree(node) ? node : {};
    },
    isTree(source) ? source : {},
  );

const entryOf = (translate: Translate, tree: Tree, path: string, key: string): unknown => {
  const fullKey = keyOf(path, key);
  const node = tree[key];

  if (isTree(node)) {
    return textOf(translate, node, fullKey);
  }

  if (typeof node === 'string' && !PLACEHOLDER.test(node)) {
    return translate(fullKey);
  }

  if (typeof node === 'string' || hasPlural(tree, key)) {
    return (values: object) => translate(fullKey, values);
  }

  return undefined;
};

// Decides string or function from the English message, like types.ts does, so the shape is the same
// in every language; i18next then resolves the entry in the current language.
export const textOf = (translate: Translate, tree: Tree, path: string): Tree =>
  new Proxy(tree, {
    get: (target, key) =>
      typeof key === 'string' ? entryOf(translate, target, path, key) : undefined,
  });

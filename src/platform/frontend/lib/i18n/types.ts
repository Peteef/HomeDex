import type { TypeOptions } from 'i18next';

// Reads the English messages at the type level: a message without {{values}} becomes a string, one
// with values a function taking exactly those values, and _one/_other keys one plural function.
// internal/textOf.ts applies the same rule at run time; the two must agree.

type Resources = TypeOptions['resources'];

export type Namespace = Extract<keyof Resources, string>;

type PluralSuffix = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

type PluralBase<Key> = Key extends `${infer Base}_${PluralSuffix}` ? Base : never;

// "{{count, number}}" names the value "count".
type VariableName<Placeholder> = Placeholder extends `${infer Name},${string}` ? Name : Placeholder;

type Variables<Message> = Message extends `${string}{{${infer Placeholder}}}${infer Rest}`
  ? VariableName<Placeholder> | Variables<Rest>
  : never;

export type Values<Message> = Record<Variables<Message>, string | number>;

type Leaf<Message> = [Variables<Message>] extends [never]
  ? string
  : (values: Values<Message>) => string;

type Entries<Tree> = {
  [
    Key in keyof Tree as Key extends `${string}_${PluralSuffix}` ? never : Key
  ]: Tree[Key] extends string ? Leaf<Tree[Key]> : Text<Tree[Key]>;
};

type Plurals<Tree> = {
  [Key in keyof Tree as PluralBase<Key>]: (values: Values<Tree[Key]> & { count: number }) => string;
};

export type Text<Tree> = Entries<Tree> & Plurals<Tree>;

export type Section<Tree, Prefix extends string = ''> = {
  [Key in keyof Tree & string]: Tree[Key] extends string
    ? never
    : `${Prefix}${Key}` | Section<Tree[Key], `${Prefix}${Key}.`>;
}[keyof Tree & string];

export type At<Tree, Path> = Path extends `${infer Head}.${infer Rest}`
  ? Head extends keyof Tree
    ? At<Tree[Head], Rest>
    : never
  : Path extends keyof Tree
    ? Tree[Path]
    : never;

export type Messages<NS extends Namespace> = Resources[NS];

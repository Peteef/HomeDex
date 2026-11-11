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

type Intersection<Union> = (Union extends unknown ? (value: Union) => void : never) extends (
  value: infer All,
) => void
  ? All
  : never;

// A translated message keeps every {{value}} of the English one, with or without a format
// ("{{count, number}}"). Extra values are caught by the locale test, which types can't do simply.
// Boxed in a tuple, so the intersection joins one box per value and keeps "{{x}}" | "{{x, format}}"
// a union inside each.
type Containing<Name> = Name extends string
  ? [`${string}{{${Name}}}${string}` | `${string}{{${Name},${string}}}${string}`]
  : never;

type Translated<Message> = [Variables<Message>] extends [never]
  ? string
  : Intersection<Containing<Variables<Message>>> extends [infer All]
    ? All
    : never;

// Plural keys are optional here: which forms a language needs (Polish: one, few, many, other) comes
// from Intl.PluralRules, and the locale test checks them.
export type Translation<Source> = {
  [
    Key in keyof Source as Key extends `${string}_${PluralSuffix}` ? never : Key
  ]: Source[Key] extends string ? Translated<Source[Key]> : Translation<Source[Key]>;
} & {
  [
    Key in keyof Source as Key extends `${infer Base}_${PluralSuffix}`
      ? `${Base}_${PluralSuffix}`
      : never
  ]?: Translated<Source[Key]>;
};

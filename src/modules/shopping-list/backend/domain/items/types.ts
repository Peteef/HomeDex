export interface Item {
  id: number;
  text: string;
  amount: string | null;
  addedBy: string;
  checked: boolean;
}

export interface NewItem {
  text: string;
  amount?: string;
}

export type ItemErrorCode = 'invalid' | 'not_found';

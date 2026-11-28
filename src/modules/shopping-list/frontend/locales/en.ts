export default {
  manifest: {
    name: 'Shopping list',
    description: 'What we need from the shop',
  },
  list: {
    title: 'Shopping list',
    toBuy: 'To buy',
    inCart: 'In the cart',
    clear: 'Clear',
    empty: 'Nothing to buy. Add the first item above.',
    loadFailed: "Can't load the list.",
    addItemForm: {
      item: 'Item',
      itemPlaceholder: 'e.g. milk',
      amount: 'Amount (optional)',
      amountPlaceholder: 'e.g. 2 l',
      add: 'Add',
      failed: "Can't add the item. Try again.",
    },
    itemRow: {
      addedBy: 'Added by {{username}}',
      delete: 'Delete {{item}}',
    },
  },
} as const;

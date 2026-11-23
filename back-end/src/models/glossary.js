// glossary terms for the Learn section
const glossaryTerms = [
  {
    id: 'stock',
    term: 'Stock',
    definition: 'A share of ownership in a company. When you buy stock, you own a small piece of that business.',
  },
  {
    id: 'etf',
    term: 'ETF',
    definition: 'An exchange-traded fund. It holds many stocks or other investments in one package you can buy and sell.',
  },
  {
    id: 'dividend',
    term: 'Dividend',
    definition: 'Money a company pays to shareholders from its profits. Not every company pays dividends.',
  },
  {
    id: 'portfolio',
    term: 'Portfolio',
    definition: 'The collection of investments you own, such as stocks, ETFs, and cash.',
  },
  {
    id: 'market-order',
    term: 'Market Order',
    definition: 'An order to buy or sell right away at the best available price.',
  },
  {
    id: 'volatility',
    term: 'Volatility',
    definition: 'How much and how quickly a price moves up and down. Higher volatility means bigger swings.',
  },
  {
    id: 'return',
    term: 'Return',
    definition: 'How much an investment has gained or lost compared with what you paid for it.',
  },
  {
    id: 'share',
    term: 'Share',
    definition: 'One unit of stock in a company. Owning more shares means you own more of the company.',
  },
]

// all terms, or only the ones whose name contains the search text
function getGlossaryTerms(search) {
  const matches = []
  const query = String(search || '').toLowerCase()

  for (let index = 0; index < glossaryTerms.length; index++) {
    const item = glossaryTerms[index]
    if (query && item.term.toLowerCase().indexOf(query) === -1) {
      continue
    }
    matches.push(item)
  }

  return matches
}

export { getGlossaryTerms }

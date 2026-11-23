// lessons for the Learn section
const lessons = [
  {
    id: 'first-steps',
    title: 'First steps',
    description: 'What StockSim is and how virtual cash works.',
    duration: '2 min',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=640&h=360&fit=crop',
    content:
      'StockSim lets you practice investing with fake money. Nothing here uses real money, so you can learn without risk. You start with virtual cash, pick stocks, and build a practice portfolio. As you buy and sell, you will see how your choices change your portfolio value over time.',
  },
  {
    id: 'stock-prices',
    title: 'Understanding stock prices',
    description: 'Learn what a share price means and why it changes.',
    duration: '3 min',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=640&h=360&fit=crop',
    content:
      'A stock price is what one share of a company costs right now. Prices go up when more people want to buy, and down when more people want to sell. Checking the latest price helps you decide when to buy or sell in StockSim.',
  },
  {
    id: 'balanced-portfolio',
    title: 'Building a balanced portfolio',
    description: 'Why spreading your money across investments can help.',
    duration: '4 min',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&h=360&fit=crop',
    content:
      'A portfolio is the collection of investments you own. Putting all your money into one stock is risky because one bad day can hurt a lot. Spreading money across a few companies or ETFs can reduce that risk.',
  },
  {
    id: 'reading-returns',
    title: 'Reading your returns',
    description: 'How to tell if your practice trades are gaining or losing.',
    duration: '3 min',
    imageUrl: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=640&h=360&fit=crop',
    content:
      'A return shows how much your investment has gained or lost compared with what you paid. A positive return means you are ahead. A negative return means the value has dropped. StockSim shows returns so you can learn from each practice trade.',
  },
  {
    id: 'market-orders',
    title: 'Market orders',
    description: 'What happens when you buy or sell at the current price.',
    duration: '3 min',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=640&h=360&fit=crop',
    content:
      'A market order means you want to buy or sell right away at the best available price. In StockSim, this is the simple way to practice a trade. The price can change quickly, so the final amount may be a little different from what you first saw.',
  },
  {
    id: 'dividends',
    title: 'What is a dividend?',
    description: 'How some companies share profits with shareholders.',
    duration: '2 min',
    imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=640&h=360&fit=crop',
    content:
      'A dividend is money a company pays to people who own its shares. Not every company pays dividends. When one does, shareholders receive a small payment based on how many shares they own.',
  },
]

//  fields for the Learn hub list
function getLessonSummaries() {
  const summaries = []

  for (let index = 0; index < lessons.length; index++) {
    const lesson = lessons[index]
    summaries.push({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      duration: lesson.duration,
    })
  }

  return summaries
}

// full lesson for the lesson page, including lesson before and after
function getLessonById(id) {
  for (let index = 0; index < lessons.length; index++) {
    if (lessons[index].id !== id) {
      continue
    }

    const previousLesson = index > 0 ? lessons[index - 1] : null
    const nextLesson = index < lessons.length - 1 ? lessons[index + 1] : null

    return {
      id: lessons[index].id,
      title: lessons[index].title,
      description: lessons[index].description,
      duration: lessons[index].duration,
      imageUrl: lessons[index].imageUrl,
      content: lessons[index].content,
      lessonNumber: index + 1,
      lessonCount: lessons.length,
      previousLessonId: previousLesson ? previousLesson.id : null,
      nextLessonId: nextLesson ? nextLesson.id : null,
    }
  }

  return null
}

export { getLessonSummaries, getLessonById }

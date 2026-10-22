// Fetch and load your dataset
export async function loadMarugotoData() {
  const response = await fetch('/content/marugoto_a1_vocabulary.json');
  const data = await response.json();
  
  console.log(`Loaded ${data.topics.length} topics from ${data.title}`);
  return data;
}

// Example function to get a random card for flashcards or quiz
// function getRandomFlashcard(data) {
//   const allWords = data.topics.flatMap(topic => 
//     topic.subtopics.flatMap(sub => sub.words)
//   );
  
//   const randomIndex = Math.floor(Math.random() * allWords.length);
//   return allWords[randomIndex];
// }

// // Example usage
// loadMarugotoData().then(data => {
//   const card = getRandomFlashcard(data);
//   console.log("Study Card:", card.japanese, "(", card.romaji, ") ->", card.english);
// });
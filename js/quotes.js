const quotes = [
{
    quote: "If you are going through hell, keep going.",
    author: "Theodore Roosevelt",
}, 
{
    quote: "Believe you can and you’re halfway there.",
    author: "Winston Churchill",
}, 
{
    quote: "It always seems impossible until it’s done.",
    author: "Nelson Mandela",
}, 
{
    quote: "Start where you are. Use what you have. Do what you can.",
    author: "Arthur Ashe",
}, 
{
    quote: "You don’t have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
}, 
{
    quote: "Dream big and dare to fail.",
    author: "Arthur Ashe",
}, 
{
    quote: "Life is like a box of chocolates. You never know what you’re gonna get.",
    author: "Forrest Gump",
}, 
{
    quote: "The two most powerful warriors are patience and time.",
    author: "Leo Tolstoy",
}, 
{
    quote: "The only place where success comes before work is in the dictionary.",
    author: "Vidal Sassoon",
}, 
{
    quote: "Opportunities don’t happen. You create them.",
    author: "Chris Grosser",
}, 
];

const quote = document.querySelector("#quote span:first-child");
const author = document.querySelector("#quote span:last-child");

const todaysQuote = quotes[Math.floor(Math.random() * quotes.length)];

quote.innerText = todaysQuote.quote;
author.innerText = todaysQuote.author;

const images = ["0.webp","1.jpeg","2.avif"];

const chosenImage = images[Math.floor(Math.random() * images.length)];

const bgImage = document.createElement("img");

bgImage.src = `img/${chosenImage}`; 

document.body.appendChild(bgImage);
